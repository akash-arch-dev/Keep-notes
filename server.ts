import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// High limit for rich backups
app.use(express.json({ limit: '60mb' }));

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'keepscribe_db';

// In-memory fallback database per AI Studio web migration guidelines
const memoryNotes = new Map<string, any>();
const memoryVocab = new Map<string, any>();
let memoryLastSync: number | null = null;

let mongoClient: MongoClient | null = null;
let mongoFailed = false;

async function getMongoDb() {
  if (!MONGO_URI || mongoFailed) {
    return null;
  }
  if (!mongoClient) {
    try {
      mongoClient = new MongoClient(MONGO_URI, {
        connectTimeoutMS: 2000,
        serverSelectionTimeoutMS: 2000,
      });
      await mongoClient.connect();
    } catch (err: any) {
      console.warn('[AI Studio] MongoDB unavailable or direct TCP blocked, using in-memory mock store:', err.message);
      mongoFailed = true;
      mongoClient = null;
      return null;
    }
  }
  return mongoClient.db(DB_NAME);
}

// MongoDB Status endpoint
app.get('/api/mongodb/status', async (_req, res) => {
  try {
    const db = await getMongoDb();
    if (db) {
      const notesColl = db.collection('notes');
      const vocabColl = db.collection('vocabulary');
      const syncColl = db.collection('sync_meta');

      const [notesCount, vocabCount, lastSyncMeta] = await Promise.all([
        notesColl.countDocuments(),
        vocabColl.countDocuments(),
        syncColl.findOne({ key: 'last_sync' }),
      ]);

      return res.json({
        connected: true,
        database: DB_NAME,
        notesCount,
        vocabCount,
        lastSync: lastSyncMeta ? lastSyncMeta.timestamp : null,
      });
    }
  } catch (err: any) {
    console.warn('MongoDB status check fallback:', err.message);
  }

  // In-memory store fallback response
  res.json({
    connected: false,
    database: `${DB_NAME} (in-memory mock)`,
    notesCount: memoryNotes.size,
    vocabCount: memoryVocab.size,
    lastSync: memoryLastSync,
    note: 'Running in in-memory mock mode',
  });
});

// MongoDB Sync endpoint (Push client notes & vocabulary to server, merge)
app.post('/api/mongodb/sync', async (req, res) => {
  const { notes, vocabulary, clientTimestamp } = req.body;
  const now = Date.now();

  try {
    const db = await getMongoDb();
    if (db) {
      const notesColl = db.collection('notes');
      const vocabColl = db.collection('vocabulary');
      const syncColl = db.collection('sync_meta');

      // 1. Sync Notes: Upsert incoming notes
      if (Array.isArray(notes) && notes.length > 0) {
        const noteOps = notes.map((note) => ({
          updateOne: {
            filter: { id: note.id },
            update: { $set: { ...note, syncedAt: now } },
            upsert: true,
          },
        }));
        await notesColl.bulkWrite(noteOps);
      }

      // 2. Sync Vocabulary: Upsert incoming vocabulary items
      if (Array.isArray(vocabulary) && vocabulary.length > 0) {
        const vocabOps = vocabulary.map((vocab) => ({
          updateOne: {
            filter: { id: vocab.id },
            update: { $set: { ...vocab, syncedAt: now } },
            upsert: true,
          },
        }));
        await vocabColl.bulkWrite(vocabOps);
      }

      // Update sync metadata
      await syncColl.updateOne(
        { key: 'last_sync' },
        { $set: { key: 'last_sync', timestamp: now, clientTimestamp } },
        { upsert: true }
      );

      // Retrieve full merged records from MongoDB to sync back to client
      const remoteNotes = await notesColl.find({}).toArray();
      const remoteVocab = await vocabColl.find({}).toArray();

      // Clean MongoDB _id before returning
      const cleanedNotes = remoteNotes.map(({ _id, ...rest }) => rest);
      const cleanedVocab = remoteVocab.map(({ _id, ...rest }) => rest);

      return res.json({
        success: true,
        timestamp: now,
        notes: cleanedNotes,
        vocabulary: cleanedVocab,
        notesCount: cleanedNotes.length,
        vocabCount: cleanedVocab.length,
      });
    }
  } catch (err: any) {
    console.warn('MongoDB sync falling back to in-memory store:', err.message);
  }

  // In-memory fallback sync
  if (Array.isArray(notes)) {
    notes.forEach((note) => {
      memoryNotes.set(note.id, { ...note, syncedAt: now });
    });
  }
  if (Array.isArray(vocabulary)) {
    vocabulary.forEach((item) => {
      memoryVocab.set(item.id, { ...item, syncedAt: now });
    });
  }
  memoryLastSync = now;

  const allNotes = Array.from(memoryNotes.values());
  const allVocab = Array.from(memoryVocab.values());

  return res.json({
    success: true,
    timestamp: now,
    notes: allNotes,
    vocabulary: allVocab,
    notesCount: allNotes.length,
    vocabCount: allVocab.length,
    isLocalFallback: true,
  });
});

// MongoDB Pull endpoint (Fetch all from cloud without pushing)
app.get('/api/mongodb/pull', async (_req, res) => {
  try {
    const db = await getMongoDb();
    if (db) {
      const notesColl = db.collection('notes');
      const vocabColl = db.collection('vocabulary');

      const remoteNotes = await notesColl.find({}).toArray();
      const remoteVocab = await vocabColl.find({}).toArray();

      const cleanedNotes = remoteNotes.map(({ _id, ...rest }) => rest);
      const cleanedVocab = remoteVocab.map(({ _id, ...rest }) => rest);

      return res.json({
        success: true,
        notes: cleanedNotes,
        vocabulary: cleanedVocab,
        notesCount: cleanedNotes.length,
        vocabCount: cleanedVocab.length,
      });
    }
  } catch (err: any) {
    console.warn('MongoDB pull falling back to in-memory store:', err.message);
  }

  return res.json({
    success: true,
    notes: Array.from(memoryNotes.values()),
    vocabulary: Array.from(memoryVocab.values()),
    notesCount: memoryNotes.size,
    vocabCount: memoryVocab.size,
    isLocalFallback: true,
  });
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, 'vite.config.ts'),
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KeepScribe Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
