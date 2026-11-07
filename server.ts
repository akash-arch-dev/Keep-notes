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

const MONGO_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://akashselfcode_db_user:iFc2gw6VABhq729c@cluster0.a0wqvhi.mongodb.net/';
const DB_NAME = 'keepscribe_db';

let mongoClient: MongoClient | null = null;

async function getMongoDb() {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGO_URI, {
      connectTimeoutMS: 8000,
      serverSelectionTimeoutMS: 8000,
    });
    await mongoClient.connect();
  }
  return mongoClient.db(DB_NAME);
}

// MongoDB Status endpoint
app.get('/api/mongodb/status', async (_req, res) => {
  try {
    const db = await getMongoDb();
    const notesColl = db.collection('notes');
    const vocabColl = db.collection('vocabulary');
    const syncColl = db.collection('sync_meta');

    const [notesCount, vocabCount, lastSyncMeta] = await Promise.all([
      notesColl.countDocuments(),
      vocabColl.countDocuments(),
      syncColl.findOne({ key: 'last_sync' }),
    ]);

    res.json({
      connected: true,
      database: DB_NAME,
      notesCount,
      vocabCount,
      lastSync: lastSyncMeta ? lastSyncMeta.timestamp : null,
    });
  } catch (err: any) {
    console.error('MongoDB status check failed:', err.message);
    res.json({
      connected: false,
      error: err.message,
    });
  }
});

// MongoDB Sync endpoint (Push client notes & vocabulary to MongoDB, merge with remote)
app.post('/api/mongodb/sync', async (req, res) => {
  try {
    const { notes, vocabulary, clientTimestamp } = req.body;
    const db = await getMongoDb();
    const notesColl = db.collection('notes');
    const vocabColl = db.collection('vocabulary');
    const syncColl = db.collection('sync_meta');

    // 1. Sync Notes: Upsert incoming notes
    if (Array.isArray(notes) && notes.length > 0) {
      const noteOps = notes.map((note) => ({
        updateOne: {
          filter: { id: note.id },
          update: { $set: { ...note, syncedAt: Date.now() } },
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
          update: { $set: { ...vocab, syncedAt: Date.now() } },
          upsert: true,
        },
      }));
      await vocabColl.bulkWrite(vocabOps);
    }

    // Update sync metadata
    const now = Date.now();
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

    res.json({
      success: true,
      timestamp: now,
      notes: cleanedNotes,
      vocabulary: cleanedVocab,
      notesCount: cleanedNotes.length,
      vocabCount: cleanedVocab.length,
    });
  } catch (err: any) {
    console.error('MongoDB sync failed:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to sync with MongoDB Atlas',
    });
  }
});

// MongoDB Pull endpoint (Fetch all from cloud without pushing)
app.get('/api/mongodb/pull', async (_req, res) => {
  try {
    const db = await getMongoDb();
    const notesColl = db.collection('notes');
    const vocabColl = db.collection('vocabulary');

    const remoteNotes = await notesColl.find({}).toArray();
    const remoteVocab = await vocabColl.find({}).toArray();

    const cleanedNotes = remoteNotes.map(({ _id, ...rest }) => rest);
    const cleanedVocab = remoteVocab.map(({ _id, ...rest }) => rest);

    res.json({
      success: true,
      notes: cleanedNotes,
      vocabulary: cleanedVocab,
      notesCount: cleanedNotes.length,
      vocabCount: cleanedVocab.length,
    });
  } catch (err: any) {
    console.error('MongoDB pull failed:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to pull from MongoDB Atlas',
    });
  }
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
