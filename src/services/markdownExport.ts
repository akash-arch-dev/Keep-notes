import JSZip from 'jszip';
import { Note, NotePage, MediaItem, VocabularyItem } from '../types';

/**
 * Checks whether the modern File System Access API (showDirectoryPicker) is supported.
 */
export function isDirectoryPickerSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Sanitizes a title string into a clean, filesystem-safe folder or filename.
 */
export function sanitizeFilename(name: string, fallback = 'untitled'): string {
  const clean = name
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '-') // Replace invalid OS characters
    .replace(/\s+/g, '_')           // Spaces to underscores
    .replace(/_+/g, '_')           // Collapse duplicate underscores
    .replace(/^-+|-+$/g, '');      // Trim dashes
  return clean || fallback;
}

/**
 * Formats a timestamp into a human-readable string.
 */
function formatDate(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(timestamp);
  }
}

/**
 * Extracts and decodes media into binary or text for inclusion in the assets/ folder.
 */
export async function processMediaForAssetFolder(
  media: MediaItem,
  pageIndex: number,
  mediaIndex: number
): Promise<{
  filename: string;
  data: Uint8Array | string | Blob | ArrayBuffer;
  isString: boolean;
}> {
  const pageNum = pageIndex + 1;
  const itemNum = mediaIndex + 1;

  let ext = 'bin';
  let isString = false;
  let fileData: Uint8Array | string | Blob | ArrayBuffer;

  const url = media.url || '';

  // 1. Data URLs (Base64 or UTF-8 SVG)
  if (url.startsWith('data:')) {
    const commaIndex = url.indexOf(',');
    const metaPart = url.slice(0, commaIndex).toLowerCase();
    const rawData = url.slice(commaIndex + 1);

    // Determine extension
    if (metaPart.includes('svg')) {
      ext = 'svg';
    } else if (metaPart.includes('png')) {
      ext = 'png';
    } else if (metaPart.includes('jpeg') || metaPart.includes('jpg')) {
      ext = 'jpg';
    } else if (metaPart.includes('webp')) {
      ext = 'webp';
    } else if (metaPart.includes('gif')) {
      ext = 'gif';
    } else if (metaPart.includes('webm')) {
      ext = 'webm';
    } else if (metaPart.includes('mp4')) {
      ext = 'mp4';
    } else if (metaPart.includes('mpeg') || metaPart.includes('mp3')) {
      ext = 'mp3';
    } else if (metaPart.includes('wav')) {
      ext = 'wav';
    } else {
      if (media.type === 'drawing') ext = 'svg';
      else if (media.type === 'image') ext = 'png';
      else if (media.type === 'audio') ext = 'webm';
      else if (media.type === 'video') ext = 'mp4';
    }

    if (ext === 'svg' && (metaPart.includes('utf8') || rawData.startsWith('<svg') || rawData.includes('%3Csvg'))) {
      // Decode SVG as text
      try {
        fileData = decodeURIComponent(rawData);
      } catch {
        fileData = rawData;
      }
      isString = true;
    } else if (metaPart.includes('base64')) {
      // Decode Base64 to Uint8Array binary
      try {
        const binStr = atob(rawData);
        const len = binStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binStr.charCodeAt(i);
        }
        fileData = bytes;
      } catch {
        fileData = rawData;
        isString = true;
      }
    } else {
      fileData = rawData;
      isString = true;
    }
  } else {
    // 2. Remote or Blob URL
    if (media.type === 'drawing') ext = 'svg';
    else if (media.type === 'image') ext = 'png';
    else if (media.type === 'audio') ext = 'webm';
    else if (media.type === 'video') ext = 'mp4';

    try {
      const res = await fetch(url);
      const blob = await res.blob();
      if (blob.type) {
        if (blob.type.includes('svg')) ext = 'svg';
        else if (blob.type.includes('png')) ext = 'png';
        else if (blob.type.includes('jpeg') || blob.type.includes('jpg')) ext = 'jpg';
        else if (blob.type.includes('webm')) ext = 'webm';
        else if (blob.type.includes('mp4')) ext = 'mp4';
        else if (blob.type.includes('mp3')) ext = 'mp3';
      }
      fileData = await blob.arrayBuffer();
    } catch {
      fileData = `Asset source URL: ${url}`;
      isString = true;
      ext = 'txt';
    }
  }

  // Generate clean, readable asset filename
  const rawBaseName = media.name ? sanitizeFilename(media.name, 'asset') : `${media.type}_${itemNum}`;
  const baseName = rawBaseName.replace(/\.[a-z0-9]+$/i, '');
  const filename = `p${pageNum}_${itemNum}_${baseName}.${ext}`;

  return {
    filename,
    data: fileData,
    isString,
  };
}

/**
 * Builds the complete index.md content for a note, with YAML frontmatter,
 * full story content for all pages, and relative references to files in assets/.
 */
export function buildNoteMarkdownContent(
  note: Note,
  mediaFilenameMap: Map<string, string>
): string {
  const title = note.title || 'Untitled Story Note';
  const createdDate = new Date(note.createdAt).toISOString();
  const updatedDate = new Date(note.updatedAt).toISOString();
  const tagsList = note.tags && note.tags.length > 0 ? note.tags : [];
  const pages = note.pages && note.pages.length > 0 ? note.pages : [];

  // 1. YAML Frontmatter for Obsidian, Hugo, Jekyll, VS Code, Typora
  let md = '---\n';
  md += `title: "${title.replace(/"/g, '\\"')}"\n`;
  md += `id: "${note.id}"\n`;
  md += `color: "${note.color || 'default'}"\n`;
  md += `pinned: ${Boolean(note.isPinned)}\n`;
  md += `archived: ${Boolean(note.isArchived)}\n`;
  md += `trashed: ${Boolean(note.isTrashed)}\n`;
  md += `totalPages: ${pages.length}\n`;
  if (tagsList.length > 0) {
    md += 'tags:\n';
    tagsList.forEach((t) => {
      const cleanTag = t.startsWith('#') ? t.slice(1) : t;
      md += `  - "${cleanTag}"\n`;
    });
  } else {
    md += 'tags: []\n';
  }
  md += `createdAt: "${createdDate}"\n`;
  md += `updatedAt: "${updatedDate}"\n`;
  md += '---\n\n';

  // 2. Note Title & Metadata Block
  md += `# ${title}\n\n`;
  md += `> **KeepScribe Creative Note Project**  \n`;
  if (tagsList.length > 0) {
    md += `> **Tags**: ${tagsList.map((t) => `\`${t}\``).join(', ')}  \n`;
  }
  md += `> **Color Theme**: \`${note.color}\` | **Pages**: ${pages.length} | **Pinned**: ${note.isPinned ? 'Yes' : 'No'}  \n`;
  md += `> **Created**: ${formatDate(note.createdAt)} | **Last Updated**: ${formatDate(note.updatedAt)}\n\n`;

  // Quick Table of Contents if multiple pages
  if (pages.length > 1) {
    md += `### 📑 Pages in this Note\n\n`;
    pages.forEach((p, idx) => {
      const pageNum = idx + 1;
      const pageTitle = p.title || `Page ${pageNum}`;
      const pageClean = sanitizeFilename(pageTitle, `page_${pageNum}`);
      const pageNumStr = pageNum < 10 ? `0${pageNum}` : `${pageNum}`;
      md += `- [Page ${pageNum}: ${pageTitle}](#page-${pageNum}-${pageClean.toLowerCase()}) *([open independent page file](./${pageNumStr}_${pageClean}.md))*\n`;
    });
    md += '\n';
  }

  md += `---\n\n`;

  // 3. Multi-Page Story Content
  if (pages.length === 0) {
    md += `*No pages recorded in this note.*\n`;
  } else {
    pages.forEach((page, pageIdx) => {
      const pageNum = pageIdx + 1;
      const pageTitle = page.title ? page.title : `Page ${pageNum}`;
      const wordCount = page.content.trim() ? page.content.trim().split(/\s+/).length : 0;
      const pageClean = sanitizeFilename(pageTitle, `page_${pageNum}`);
      const pageNumStr = pageNum < 10 ? `0${pageNum}` : `${pageNum}`;

      md += `## Page ${pageNum}: ${pageTitle}\n\n`;
      md += `*Word Count: ~${wordCount} words | Updated: ${formatDate(page.updatedAt || page.createdAt)} | [Open Standalone Page](./${pageNumStr}_${pageClean}.md)*\n\n`;

      if (page.content && page.content.trim()) {
        md += `${page.content.trim()}\n\n`;
      } else {
        md += `*(Empty page text)*\n\n`;
      }

      // Attached Media for this page
      if (page.media && page.media.length > 0) {
        md += `### 📎 Page ${pageNum} Assets & Media\n\n`;
        page.media.forEach((m, mIdx) => {
          const assetFilename = mediaFilenameMap.get(m.id) || `p${pageNum}_${mIdx + 1}_asset`;
          const relativeAssetPath = `assets/${assetFilename}`;
          const displayName = m.name || `${m.type} attachment`;

          if (m.type === 'drawing' || m.type === 'image') {
            md += `![${displayName}](${relativeAssetPath})\n\n`;
            if (m.caption || m.name) {
              md += `*${displayName}${m.caption ? ` — ${m.caption}` : ''}*\n\n`;
            }
          } else if (m.type === 'audio') {
            md += `<audio controls src="${relativeAssetPath}">\n`;
            md += `  <a href="${relativeAssetPath}">🎧 Listen to ${displayName}</a>\n`;
            md += `</audio>\n\n`;
            md += `*Audio recording: ${displayName}${m.duration ? ` (${Math.round(m.duration)}s)` : ''}*\n\n`;
          } else if (m.type === 'video') {
            md += `<video controls width="100%" src="${relativeAssetPath}">\n`;
            md += `  <a href="${relativeAssetPath}">🎬 Watch ${displayName}</a>\n`;
            md += `</video>\n\n`;
            md += `*Video clip: ${displayName}*\n\n`;
          }
        });
      }

      if (pageIdx < pages.length - 1) {
        md += `---\n\n`;
      }
    });
  }

  return md;
}

/**
 * Builds individual, independent .md files for each page in a multi-page note.
 */
export function buildIndividualPageMarkdowns(
  note: Note,
  mediaFilenameMap: Map<string, string>
): Array<{ filename: string; content: string }> {
  const pages = note.pages || [];
  if (pages.length <= 1) return [];

  return pages.map((page, idx) => {
    const pageNum = idx + 1;
    const pageNumStr = pageNum < 10 ? `0${pageNum}` : `${pageNum}`;
    const cleanTitle = sanitizeFilename(page.title || `page_${pageNum}`, `page_${pageNum}`);
    const filename = `${pageNumStr}_${cleanTitle}.md`;

    let md = '---\n';
    md += `title: "${(page.title || `Page ${pageNum}`).replace(/"/g, '\\"')}"\n`;
    md += `noteTitle: "${(note.title || 'Untitled Note').replace(/"/g, '\\"')}"\n`;
    md += `pageNumber: ${pageNum}\n`;
    md += `totalPages: ${pages.length}\n`;
    md += `noteId: "${note.id}"\n`;
    md += `createdAt: "${new Date(page.createdAt || note.createdAt).toISOString()}"\n`;
    md += `updatedAt: "${new Date(page.updatedAt || note.updatedAt).toISOString()}"\n`;
    md += '---\n\n';

    md += `# ${page.title || `Page ${pageNum}`}\n\n`;
    md += `> **Part of Story Note**: [${note.title || 'Untitled Note'}](./index.md) *(Page ${pageNum} of ${pages.length})*\n\n`;
    md += `*Updated: ${formatDate(page.updatedAt || page.createdAt)}*\n\n`;
    md += `---\n\n`;

    if (page.content && page.content.trim()) {
      md += `${page.content.trim()}\n\n`;
    } else {
      md += `*(Empty page text)*\n\n`;
    }

    // Media
    if (page.media && page.media.length > 0) {
      md += `### 📎 Attached Media & Assets\n\n`;
      page.media.forEach((m, mIdx) => {
        const assetFilename = mediaFilenameMap.get(m.id) || `p${pageNum}_${mIdx + 1}_asset`;
        const relativeAssetPath = `assets/${assetFilename}`;
        const displayName = m.name || `${m.type} attachment`;

        if (m.type === 'drawing' || m.type === 'image') {
          md += `![${displayName}](${relativeAssetPath})\n\n`;
          if (m.caption || m.name) {
            md += `*${displayName}${m.caption ? ` — ${m.caption}` : ''}*\n\n`;
          }
        } else if (m.type === 'audio') {
          md += `<audio controls src="${relativeAssetPath}">\n`;
          md += `  <a href="${relativeAssetPath}">🎧 Listen to ${displayName}</a>\n`;
          md += `</audio>\n\n`;
          md += `*Audio recording: ${displayName}${m.duration ? ` (${Math.round(m.duration)}s)` : ''}*\n\n`;
        } else if (m.type === 'video') {
          md += `<video controls width="100%" src="${relativeAssetPath}">\n`;
          md += `  <a href="${relativeAssetPath}">🎬 Watch ${displayName}</a>\n`;
          md += `</video>\n\n`;
          md += `*Video clip: ${displayName}*\n\n`;
        }
      });
    }

    // Navigation links between independent pages
    md += `---\n\n`;
    const prevPage = idx > 0 ? pages[idx - 1] : null;
    const nextPage = idx < pages.length - 1 ? pages[idx + 1] : null;

    const navLinks: string[] = [];
    navLinks.push(`[📖 Full Note](./index.md)`);
    if (prevPage) {
      const prevNumStr = idx < 10 ? `0${idx}` : `${idx}`;
      const prevClean = sanitizeFilename(prevPage.title || `page_${idx}`, `page_${idx}`);
      navLinks.push(`[⬅ Page ${idx}: ${prevPage.title || `Page ${idx}`}](${prevNumStr}_${prevClean}.md)`);
    }
    if (nextPage) {
      const nextNum = pageNum + 1;
      const nextNumStr = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
      const nextClean = sanitizeFilename(nextPage.title || `page_${nextNum}`, `page_${nextNum}`);
      navLinks.push(`[Page ${nextNum}: ${nextPage.title || `Page ${nextNum}`} ➡](${nextNumStr}_${nextClean}.md)`);
    }
    md += `${navLinks.join(' | ')}\n`;

    return { filename, content: md };
  });
}

/**
 * Downloads a Blob as a file in the browser.
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports a single note as a complete, independent project folder packaged as a .zip:
 * - [note-title]/index.md (the complete consolidated note)
 * - [note-title]/01_page.md, 02_page.md (independent page md files)
 * - [note-title]/assets/ (all audio recordings, drawings, photos, and video clips)
 */
export async function exportNoteAsMarkdownProject(note: Note): Promise<void> {
  const zip = new JSZip();
  const folderName = sanitizeFilename(note.title || 'story_note', 'story_note');
  const projectRoot = zip.folder(folderName) || zip;
  const assetsFolder = projectRoot.folder('assets');

  // Map each media ID to its resolved filename in assets/
  const mediaFilenameMap = new Map<string, string>();

  // Process all media across all pages
  const pages = note.pages || [];
  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const page = pages[pIdx];
    const mediaList = page.media || [];
    for (let mIdx = 0; mIdx < mediaList.length; mIdx++) {
      const media = mediaList[mIdx];
      const asset = await processMediaForAssetFolder(media, pIdx, mIdx);
      mediaFilenameMap.set(media.id, asset.filename);

      if (assetsFolder) {
        assetsFolder.file(asset.filename, asset.data);
      }
    }
  }

  // Generate index.md (complete note)
  const indexMarkdown = buildNoteMarkdownContent(note, mediaFilenameMap);
  projectRoot.file('index.md', indexMarkdown);

  // Generate independent page .md files
  const pageFiles = buildIndividualPageMarkdowns(note, mediaFilenameMap);
  for (const pf of pageFiles) {
    projectRoot.file(pf.filename, pf.content);
  }

  // Generate and trigger zip download
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  triggerFileDownload(blob, `${folderName}-project.zip`);
}

/**
 * DIRECT LOCAL FOLDER EXPORT:
 * Uses the Web File System Access API (showDirectoryPicker) to write the actual folder
 * with index.md, independent page .md files, and assets/ directory directly to the user's hard drive!
 */
export async function exportNoteToLocalDirectory(note: Note): Promise<string> {
  if (!isDirectoryPickerSupported()) {
    throw new Error('Native Directory Picker is not supported in this browser. Downloading as Zip folder instead.');
  }

  // 1. Prompt user to choose destination folder
  const parentHandle = await (window as any).showDirectoryPicker({
    mode: 'readwrite',
  });

  const folderName = sanitizeFilename(note.title || 'story_note', 'story_note');

  // 2. Create the note's dedicated folder & assets subfolder
  const noteDirHandle = await parentHandle.getDirectoryHandle(folderName, { create: true });
  const assetsDirHandle = await noteDirHandle.getDirectoryHandle('assets', { create: true });

  // 3. Process all media
  const mediaFilenameMap = new Map<string, string>();
  const pages = note.pages || [];

  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const page = pages[pIdx];
    const mediaList = page.media || [];
    for (let mIdx = 0; mIdx < mediaList.length; mIdx++) {
      const media = mediaList[mIdx];
      const asset = await processMediaForAssetFolder(media, pIdx, mIdx);
      mediaFilenameMap.set(media.id, asset.filename);

      // Write asset file to disk
      const assetFileHandle = await assetsDirHandle.getFileHandle(asset.filename, { create: true });
      const writable = await assetFileHandle.createWritable();
      if (asset.isString) {
        await writable.write(asset.data as string);
      } else {
        await writable.write(asset.data as any);
      }
      await writable.close();
    }
  }

  // 4. Write index.md
  const indexMarkdown = buildNoteMarkdownContent(note, mediaFilenameMap);
  const indexFileHandle = await noteDirHandle.getFileHandle('index.md', { create: true });
  const indexWritable = await indexFileHandle.createWritable();
  await indexWritable.write(indexMarkdown);
  await indexWritable.close();

  // 5. Write individual page .md files
  const pageFiles = buildIndividualPageMarkdowns(note, mediaFilenameMap);
  for (const pf of pageFiles) {
    const pfHandle = await noteDirHandle.getFileHandle(pf.filename, { create: true });
    const pfWritable = await pfHandle.createWritable();
    await pfWritable.write(pf.content);
    await pfWritable.close();
  }

  return `${parentHandle.name}/${folderName}`;
}

/**
 * DIRECT LOCAL WORKSPACE DIRECTORY EXPORT:
 * Exports all notes directly into a local folder chosen by the user.
 */
export async function exportAllNotesToLocalDirectory(
  notes: Note[],
  vocabulary: VocabularyItem[] = []
): Promise<string> {
  if (!isDirectoryPickerSupported()) {
    throw new Error('Native Directory Picker is not supported in this browser. Downloading as Zip folder instead.');
  }

  const parentHandle = await (window as any).showDirectoryPicker({
    mode: 'readwrite',
  });

  const rootDirHandle = await parentHandle.getDirectoryHandle('KeepScribe_Notes', { create: true });

  let readme = '# 📚 KeepScribe Story Projects Workspace\n\n';
  readme += `*Exported on ${new Date().toLocaleString()}*  \n`;
  readme += `*Total Notes: ${notes.length} | Vocabulary Terms: ${vocabulary.length}*\n\n`;
  readme += `## Table of Story Projects\n\n`;
  readme += `| Title | Pages | Tags | Color | Folder |\n`;
  readme += `| :--- | :---: | :--- | :---: | :--- |\n`;

  const usedFolderNames = new Set<string>();

  for (let nIdx = 0; nIdx < notes.length; nIdx++) {
    const note = notes[nIdx];
    let baseFolderName = sanitizeFilename(note.title || `note_${nIdx + 1}`);
    if (usedFolderNames.has(baseFolderName)) {
      baseFolderName = `${baseFolderName}_${note.id}`;
    }
    usedFolderNames.add(baseFolderName);

    const noteDirHandle = await rootDirHandle.getDirectoryHandle(baseFolderName, { create: true });
    const assetsDirHandle = await noteDirHandle.getDirectoryHandle('assets', { create: true });
    const mediaFilenameMap = new Map<string, string>();

    const pages = note.pages || [];
    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      const page = pages[pIdx];
      const mediaList = page.media || [];
      for (let mIdx = 0; mIdx < mediaList.length; mIdx++) {
        const media = mediaList[mIdx];
        const asset = await processMediaForAssetFolder(media, pIdx, mIdx);
        mediaFilenameMap.set(media.id, asset.filename);

        const assetFileHandle = await assetsDirHandle.getFileHandle(asset.filename, { create: true });
        const writable = await assetFileHandle.createWritable();
        if (asset.isString) {
          await writable.write(asset.data as string);
        } else {
          await writable.write(asset.data as any);
        }
        await writable.close();
      }
    }

    // Write index.md
    const noteMarkdown = buildNoteMarkdownContent(note, mediaFilenameMap);
    const indexHandle = await noteDirHandle.getFileHandle('index.md', { create: true });
    const indexWritable = await indexHandle.createWritable();
    await indexWritable.write(noteMarkdown);
    await indexWritable.close();

    // Write independent page .md files
    const pageFiles = buildIndividualPageMarkdowns(note, mediaFilenameMap);
    for (const pf of pageFiles) {
      const pfHandle = await noteDirHandle.getFileHandle(pf.filename, { create: true });
      const pfWritable = await pfHandle.createWritable();
      await pfWritable.write(pf.content);
      await pfWritable.close();
    }

    const tagsString = (note.tags || []).map((t) => `\`${t}\``).join(' ') || '—';
    const noteTitle = (note.title || 'Untitled Note').replace(/\|/g, '-');
    readme += `| **${noteTitle}** | ${pages.length} | ${tagsString} | \`${note.color}\` | [📁 \`${baseFolderName}/\`](./${baseFolderName}/index.md) |\n`;
  }

  // Write README.md
  const readmeHandle = await rootDirHandle.getFileHandle('README.md', { create: true });
  const readmeWritable = await readmeHandle.createWritable();
  await readmeWritable.write(readme);
  await readmeWritable.close();

  // Write vocabulary.md
  if (vocabulary && vocabulary.length > 0) {
    const vocabMarkdown = buildVocabularyMarkdown(vocabulary);
    const vocabHandle = await rootDirHandle.getFileHandle('vocabulary.md', { create: true });
    const vocabWritable = await vocabHandle.createWritable();
    await vocabWritable.write(vocabMarkdown);
    await vocabWritable.close();
  }

  return `${parentHandle.name}/KeepScribe_Notes`;
}

/**
 * Exports a note as a direct standalone index.md file.
 */
export function exportNoteAsStandaloneMarkdown(note: Note): void {
  const mediaFilenameMap = new Map<string, string>();
  (note.pages || []).forEach((p, pIdx) => {
    (p.media || []).forEach((m, mIdx) => {
      const safeName = sanitizeFilename(m.name || `asset_${pIdx + 1}_${mIdx + 1}`);
      mediaFilenameMap.set(m.id, `${safeName}`);
    });
  });

  const markdown = buildNoteMarkdownContent(note, mediaFilenameMap);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const filename = `${sanitizeFilename(note.title || 'story-note')}.md`;
  triggerFileDownload(blob, filename);
}

/**
 * Builds markdown content for vocabulary cards.
 */
export function buildVocabularyMarkdown(vocab: VocabularyItem[]): string {
  let md = '# 📖 KeepScribe Vocabulary & Worldbuilding Codex\n\n';
  md += `*Exported on ${new Date().toLocaleDateString()} | Total Terms: ${vocab.length}*\n\n---\n\n`;

  if (vocab.length === 0) {
    md += '*No vocabulary items recorded.*\n';
    return md;
  }

  vocab.forEach((item) => {
    md += `## ${item.word}\n\n`;
    if (item.pronunciation) {
      md += `🗣️ **Pronunciation**: *${item.pronunciation}*  \n`;
    }
    if (item.etymology) {
      md += `🏛️ **Etymology / Origin**: ${item.etymology}  \n`;
    }
    md += `\n**Definition**:\n> ${item.definition}\n\n`;

    if (item.exampleContext) {
      md += `**Story Context / Example**:\n> *"${item.exampleContext}"*\n\n`;
    }

    if (item.tags && item.tags.length > 0) {
      md += `**Tags**: ${item.tags.map((t) => `\`${t}\``).join(' ')}  \n`;
    }

    if (item.customFields && item.customFields.length > 0) {
      md += `**Attributes**:\n`;
      item.customFields.forEach((cf) => {
        md += `- **${cf.key}**: ${cf.value}\n`;
      });
      md += '\n';
    }

    md += `---\n\n`;
  });

  return md;
}

/**
 * Exports all notes as a complete Markdown Workspace Project (.zip):
 * - README.md with table of contents & links
 * - [note-slug]/index.md, [note-slug]/01_page.md, and [note-slug]/assets/... for each note
 * - vocabulary.md
 */
export async function exportAllNotesAsMarkdownWorkspace(
  notes: Note[],
  vocabulary: VocabularyItem[] = []
): Promise<void> {
  const zip = new JSZip();
  const root = zip.folder('keepscribe-notes-workspace') || zip;

  let readme = '# 📚 KeepScribe Story Projects Workspace\n\n';
  readme += `*Exported on ${new Date().toLocaleString()}*  \n`;
  readme += `*Total Notes: ${notes.length} | Vocabulary Terms: ${vocabulary.length}*\n\n`;
  readme += `## Table of Story Projects\n\n`;
  readme += `| Title | Pages | Tags | Color | Project Folder |\n`;
  readme += `| :--- | :---: | :--- | :---: | :--- |\n`;

  const usedFolderNames = new Set<string>();

  for (let nIdx = 0; nIdx < notes.length; nIdx++) {
    const note = notes[nIdx];
    let baseFolderName = sanitizeFilename(note.title || `note_${nIdx + 1}`);
    if (usedFolderNames.has(baseFolderName)) {
      baseFolderName = `${baseFolderName}_${note.id}`;
    }
    usedFolderNames.add(baseFolderName);

    const noteFolder = root.folder(baseFolderName);
    const assetsFolder = noteFolder ? noteFolder.folder('assets') : null;
    const mediaFilenameMap = new Map<string, string>();

    const pages = note.pages || [];
    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      const page = pages[pIdx];
      const mediaList = page.media || [];
      for (let mIdx = 0; mIdx < mediaList.length; mIdx++) {
        const media = mediaList[mIdx];
        const asset = await processMediaForAssetFolder(media, pIdx, mIdx);
        mediaFilenameMap.set(media.id, asset.filename);
        if (assetsFolder) {
          assetsFolder.file(asset.filename, asset.data);
        }
      }
    }

    // Write index.md
    const noteMarkdown = buildNoteMarkdownContent(note, mediaFilenameMap);
    if (noteFolder) {
      noteFolder.file('index.md', noteMarkdown);

      // Write independent page .md files
      const pageFiles = buildIndividualPageMarkdowns(note, mediaFilenameMap);
      for (const pf of pageFiles) {
        noteFolder.file(pf.filename, pf.content);
      }
    }

    const tagsString = (note.tags || []).map((t) => `\`${t}\``).join(' ') || '—';
    const noteTitle = (note.title || 'Untitled Note').replace(/\|/g, '-');
    readme += `| **${noteTitle}** | ${pages.length} | ${tagsString} | \`${note.color}\` | [📁 \`${baseFolderName}/\`](./${baseFolderName}/index.md) |\n`;
  }

  root.file('README.md', readme);

  if (vocabulary && vocabulary.length > 0) {
    const vocabMarkdown = buildVocabularyMarkdown(vocabulary);
    root.file('vocabulary.md', vocabMarkdown);
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const timestamp = new Date().toISOString().split('T')[0];
  triggerFileDownload(blob, `keepscribe-notes-folder-${timestamp}.zip`);
}
