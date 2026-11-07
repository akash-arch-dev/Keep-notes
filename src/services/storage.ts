import { Note, VocabularyItem } from '../types';
import { INITIAL_NOTES, INITIAL_VOCABULARY } from './initialData';

const DB_NAME = 'KeepScribe_DB';
const DB_VERSION = 1;
const STORE_NOTES = 'notes';
const STORE_VOCAB = 'vocabulary';
const STORE_META = 'meta';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NOTES)) {
        db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_VOCAB)) {
        db.createObjectStore(STORE_VOCAB, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadNotes(): Promise<Note[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NOTES, 'readonly');
      const store = tx.objectStore(STORE_NOTES);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as Note[];
        if (!results || results.length === 0) {
          // Initialize with creative writing starter notes
          saveNotes(INITIAL_NOTES).then(() => resolve(INITIAL_NOTES));
        } else {
          resolve(results);
        }
      };
      req.onerror = () => {
        resolve(fallbackLoadNotes());
      };
    });
  } catch {
    return fallbackLoadNotes();
  }
}

export async function saveNotes(notes: Note[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NOTES, 'readwrite');
      const store = tx.objectStore(STORE_NOTES);
      store.clear();
      for (const note of notes) {
        store.put(note);
      }
      tx.oncomplete = () => {
        // Also keep a lightweight fallback in localStorage for safety
        try {
          const minimalNotes = notes.map((n) => ({
            ...n,
            pages: n.pages.map((p) => ({
              ...p,
              media: p.media.filter((m) => m.url.length < 50000), // skip huge blobs in LS
            })),
          }));
          localStorage.setItem('keepscribe_notes_backup', JSON.stringify(minimalNotes));
        } catch {
          // ignore localstorage overflow
        }
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Falling back to localStorage for saveNotes', err);
    try {
      localStorage.setItem('keepscribe_notes', JSON.stringify(notes));
    } catch {
      // quota exceeded
    }
  }
}

export async function loadVocabulary(): Promise<VocabularyItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_VOCAB, 'readonly');
      const store = tx.objectStore(STORE_VOCAB);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as VocabularyItem[];
        if (!results || results.length === 0) {
          saveVocabulary(INITIAL_VOCABULARY).then(() => resolve(INITIAL_VOCABULARY));
        } else {
          resolve(results);
        }
      };
      req.onerror = () => {
        resolve(fallbackLoadVocabulary());
      };
    });
  } catch {
    return fallbackLoadVocabulary();
  }
}

export async function saveVocabulary(items: VocabularyItem[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_VOCAB, 'readwrite');
      const store = tx.objectStore(STORE_VOCAB);
      store.clear();
      for (const item of items) {
        store.put(item);
      }
      tx.oncomplete = () => {
        try {
          localStorage.setItem('keepscribe_vocab_backup', JSON.stringify(items));
        } catch {}
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    try {
      localStorage.setItem('keepscribe_vocab', JSON.stringify(items));
    } catch {}
  }
}

function fallbackLoadNotes(): Note[] {
  try {
    const raw = localStorage.getItem('keepscribe_notes') || localStorage.getItem('keepscribe_notes_backup');
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_NOTES;
}

function fallbackLoadVocabulary(): VocabularyItem[] {
  try {
    const raw = localStorage.getItem('keepscribe_vocab') || localStorage.getItem('keepscribe_vocab_backup');
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_VOCABULARY;
}

// Full JSON Backup Export & Import (Cross-platform Android / Arch Linux sync)
export async function exportAllData() {
  const notes = await loadNotes();
  const vocab = await loadVocabulary();
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appName: 'KeepScribe',
    notes,
    vocabulary: vocab,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `keepscribe-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importData(jsonData: string, mode: 'merge' | 'replace'): Promise<{ notesCount: number; vocabCount: number }> {
  const parsed = JSON.parse(jsonData);
  if (!parsed.notes && !parsed.vocabulary) {
    throw new Error('Invalid KeepScribe backup file.');
  }

  const incomingNotes: Note[] = parsed.notes || [];
  const incomingVocab: VocabularyItem[] = parsed.vocabulary || [];

  if (mode === 'replace') {
    await saveNotes(incomingNotes);
    await saveVocabulary(incomingVocab);
    return { notesCount: incomingNotes.length, vocabCount: incomingVocab.length };
  } else {
    // Merge mode
    const currentNotes = await loadNotes();
    const currentVocab = await loadVocabulary();

    const noteMap = new Map<string, Note>();
    currentNotes.forEach((n) => noteMap.set(n.id, n));
    incomingNotes.forEach((n) => noteMap.set(n.id, n));

    const vocabMap = new Map<string, VocabularyItem>();
    currentVocab.forEach((v) => vocabMap.set(v.id, v));
    incomingVocab.forEach((v) => vocabMap.set(v.id, v));

    const mergedNotes = Array.from(noteMap.values());
    const mergedVocab = Array.from(vocabMap.values());

    await saveNotes(mergedNotes);
    await saveVocabulary(mergedVocab);

    return { notesCount: mergedNotes.length, vocabCount: mergedVocab.length };
  }
}
