import React, { useState, useEffect, useMemo } from 'react';
import {
  Cloud,
  Database,
  HardDrive,
  Download,
  Trash2,
  Upload,
  RefreshCw,
  Play,
  Pause,
  Video,
  Volume2,
  Image as ImageIcon,
  Check,
  Copy,
  AlertCircle,
  FileCode,
  Smartphone,
  Laptop,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import {
  fetchSavedMediaFiles,
  uploadMediaToSupabase,
  deleteMediaFromSupabase,
  downloadMediaForOfflineBackup,
  CREATE_MEDIA_TABLE_SQL,
  SUPABASE_PROJECT_URL,
  SUPABASE_MEDIA_BUCKET,
  SupabaseMediaRecord,
} from '../services/supabase';
import { ConfirmModal } from './ConfirmModal';
import { Note, VocabularyItem } from '../types';

interface SupabaseManagerSectionProps {
  notes: Note[];
  vocabulary: VocabularyItem[];
  onSyncMongoDB: () => Promise<void>;
  onPullMongoDB: () => Promise<void>;
  isMongoSyncing: boolean;
  mongoStatus: {
    connected: boolean;
    database?: string;
    notesCount?: number;
    vocabCount?: number;
    lastSync?: number | null;
    error?: string;
  };
  isDark: boolean;
}

export const SupabaseManagerSection: React.FC<SupabaseManagerSectionProps> = ({
  notes,
  vocabulary,
  onSyncMongoDB,
  onPullMongoDB,
  isMongoSyncing,
  mongoStatus,
  isDark,
}) => {
  const [activeTab, setActiveTab] = useState<'media' | 'mongodb' | 'schema'>('media');
  const [mediaFiles, setMediaFiles] = useState<SupabaseMediaRecord[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [uploading, setUploading] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [offlineProgress, setOfflineProgress] = useState<string | null>(null);

  // Confirm delete modal state
  const [deletingMedia, setDeletingMedia] = useState<SupabaseMediaRecord | null>(null);

  // Audio player state
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Load media from Supabase on mount
  const loadMedia = async () => {
    setIsLoadingMedia(true);
    try {
      const records = await fetchSavedMediaFiles();
      setMediaFiles(records);
    } catch (err) {
      console.error('Failed to load media from Supabase:', err);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  // Storage metrics
  const storageMetrics = useMemo(() => {
    const totalBytes = mediaFiles.reduce((acc, f) => acc + (f.file_size || 0), 0);
    const images = mediaFiles.filter((f) => f.file_type === 'image');
    const videos = mediaFiles.filter((f) => f.file_type === 'video');
    const audios = mediaFiles.filter((f) => f.file_type === 'audio');

    const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);
    // Standard Supabase free tier is 1 GB (1024 MB)
    const percentage = Math.min((totalBytes / (1024 * 1024 * 1024)) * 100, 100).toFixed(1);

    return {
      totalBytes,
      totalMb,
      percentage,
      totalCount: mediaFiles.length,
      imageCount: images.length,
      videoCount: videos.length,
      audioCount: audios.length,
    };
  }, [mediaFiles]);

  const filteredMedia = useMemo(() => {
    if (mediaFilter === 'all') return mediaFiles;
    return mediaFiles.filter((m) => m.file_type === mediaFilter);
  }, [mediaFiles, mediaFilter]);

  // Handle local file upload to Supabase
  const handleUploadInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fileType: 'image' | 'video' | 'audio' = 'image';
        if (file.type.startsWith('video/')) fileType = 'video';
        else if (file.type.startsWith('audio/')) fileType = 'audio';

        await uploadMediaToSupabase(file, file.name, fileType);
      }
      await loadMedia();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Delete media item from server
  const confirmDeleteMedia = async () => {
    if (!deletingMedia) return;
    try {
      await deleteMediaFromSupabase(deletingMedia.id, deletingMedia.file_path);
      setMediaFiles((prev) => prev.filter((m) => m.id !== deletingMedia.id));
      setDeletingMedia(null);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Full Offline Backup of all media
  const handleTakeFullOfflineBackup = async () => {
    if (mediaFiles.length === 0) {
      alert('No media files found on Supabase server to download.');
      return;
    }

    setOfflineProgress(`Preparing to backup ${mediaFiles.length} files...`);
    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i];
      if (file.public_url) {
        setOfflineProgress(`Downloading ${i + 1}/${mediaFiles.length}: ${file.file_name}`);
        await downloadMediaForOfflineBackup(file.public_url, file.file_name);
        // Small delay so browser handles downloads smoothly
        await new Promise((r) => setTimeout(r, 600));
      }
    }
    setOfflineProgress('All media files downloaded successfully to your device!');
    setTimeout(() => setOfflineProgress(null), 4000);
  };

  const copySqlCode = () => {
    navigator.clipboard.writeText(CREATE_MEDIA_TABLE_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#18191c] text-gray-100 overflow-hidden">
      {/* Top Header */}
      <div className="px-4 md:px-6 py-4 bg-[#202124] border-b border-gray-700/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
            <Cloud size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-bold text-gray-100">
                Cloud Backup & Media Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Supabase & MongoDB
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Manage Supabase storage, monitor space, take offline backups, and sync text to MongoDB
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-gray-800 p-1 rounded-xl border border-gray-700 text-xs">
          <button
            onClick={() => setActiveTab('media')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'media' ? 'bg-amber-500 text-black shadow-xs' : 'text-gray-400 hover:text-white'
            }`}
          >
            <HardDrive size={14} />
            Supabase Media ({mediaFiles.length})
          </button>
          <button
            onClick={() => setActiveTab('mongodb')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'mongodb' ? 'bg-amber-500 text-black shadow-xs' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Database size={14} />
            MongoDB Text Sync
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'schema' ? 'bg-amber-500 text-black shadow-xs' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileCode size={14} />
            SQL Schema
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {activeTab === 'media' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Storage Meter Card */}
            <div className="p-5 rounded-2xl bg-[#24262b] border border-gray-700 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                    <HardDrive size={16} className="text-amber-400" />
                    Supabase Bucket Storage Quota
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Bucket: <span className="text-amber-400 font-mono">{SUPABASE_MEDIA_BUCKET}</span> • Project: <span className="font-mono text-gray-300">xrlootvjiqetgzwqktly</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Offline Backup All Button */}
                  <button
                    onClick={handleTakeFullOfflineBackup}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-sm cursor-pointer"
                    title="Download all media files to local machine (Linux/Android)"
                  >
                    <Download size={14} />
                    Take Full Offline Backup
                  </button>

                  {/* Refresh */}
                  <button
                    onClick={loadMedia}
                    disabled={isLoadingMedia}
                    className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition cursor-pointer"
                    title="Refresh Supabase files"
                  >
                    <RefreshCw size={15} className={isLoadingMedia ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Progress / Storage Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-gray-300">
                  <span>Used: {storageMetrics.totalMb} MB of 1,024 MB (1 GB Free Tier)</span>
                  <span className="text-amber-400 font-bold">{storageMetrics.percentage}%</span>
                </div>
                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(parseFloat(storageMetrics.percentage), 1)}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-gray-400">
                  <span>📸 {storageMetrics.imageCount} Images</span>
                  <span>🎵 {storageMetrics.audioCount} Audio Voice Memos</span>
                  <span>🎬 {storageMetrics.videoCount} Video Clips</span>
                </div>
              </div>

              {offlineProgress && (
                <div className="mt-4 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin shrink-0" />
                  <span>{offlineProgress}</span>
                </div>
              )}
            </div>

            {/* Media Action & Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-gray-800/80 p-1 rounded-xl border border-gray-700 text-xs">
                {(['all', 'image', 'audio', 'video'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setMediaFilter(type)}
                    className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                      mediaFilter === type
                        ? 'bg-amber-500 text-black font-semibold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {type === 'all' ? 'All Media' : `${type}s`}
                  </button>
                ))}
              </div>

              {/* Upload to Supabase button */}
              <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-xs font-semibold cursor-pointer transition">
                <Upload size={14} className="text-amber-400" />
                <span>{uploading ? 'Uploading to Supabase...' : 'Upload Media to Cloud'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,audio/*,video/*"
                  onChange={handleUploadInput}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Media Gallery / Grid */}
            {isLoadingMedia ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <RefreshCw size={32} className="animate-spin text-amber-400 mb-3" />
                <p className="text-xs">Fetching media items from Supabase storage bucket...</p>
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#24262b] border border-gray-800 text-gray-400">
                <Cloud size={40} className="mx-auto mb-3 text-gray-600" />
                <h4 className="text-sm font-semibold text-gray-200">No media files found on Supabase</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  When you attach photos, sketches, audio recordings, or videos to your story notes, they can be uploaded to your Supabase bucket.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMedia.map((media) => (
                  <div
                    key={media.id}
                    className="p-3 rounded-2xl bg-[#24262b] border border-gray-700/80 hover:border-amber-500/50 flex flex-col justify-between transition group shadow-md"
                  >
                    <div>
                      {/* Media Preview Box */}
                      <div className="h-40 rounded-xl overflow-hidden bg-black/40 border border-gray-800 flex items-center justify-center relative mb-2.5">
                        {media.file_type === 'image' && media.public_url ? (
                          <img
                            src={media.public_url}
                            alt={media.file_name}
                            className="w-full h-full object-cover"
                          />
                        ) : media.file_type === 'audio' && media.public_url ? (
                          <div className="flex flex-col items-center justify-center p-3 text-center">
                            <Volume2 size={36} className="text-amber-400 mb-2" />
                            <audio
                              controls
                              src={media.public_url}
                              className="w-full h-8 scale-90"
                            />
                          </div>
                        ) : media.file_type === 'video' && media.public_url ? (
                          <video
                            src={media.public_url}
                            controls
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-500 text-xs">Preview unavailable</div>
                        )}

                        <span className="absolute top-2 left-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-black/75 text-amber-300">
                          {media.file_type}
                        </span>
                      </div>

                      {/* File Info */}
                      <h4 className="text-xs font-semibold text-gray-200 truncate" title={media.file_name}>
                        {media.file_name}
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
                        {formatBytes(media.file_size)} • {new Date(media.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions: Download Offline & Delete From Server */}
                    <div className="pt-2.5 mt-2 border-t border-gray-700/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          if (media.public_url) {
                            downloadMediaForOfflineBackup(media.public_url, media.file_name);
                          }
                        }}
                        className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition"
                        title="Download to device for offline backup"
                      >
                        <Download size={13} />
                        Offline Backup
                      </button>

                      <button
                        onClick={() => setDeletingMedia(media)}
                        className="p-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/30 transition"
                        title="Delete from Supabase server to free space"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MongoDB Sync Tab */}
        {activeTab === 'mongodb' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="p-6 rounded-2xl bg-[#24262b] border border-gray-700 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-gray-700/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Database size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-gray-100">
                      MongoDB Atlas Text Sync & Backup
                    </h3>
                    <p className="text-xs text-gray-400">
                      Cluster: <span className="font-mono text-gray-300">cluster0.a0wqvhi.mongodb.net</span> • DB: <span className="font-mono text-amber-400">keepscribe_db</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      mongoStatus.connected
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        mongoStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    {mongoStatus.connected ? 'Connected' : 'Connecting'}
                  </span>
                </div>
              </div>

              {/* Status metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-gray-800/80 border border-gray-700/70">
                  <span className="text-[11px] text-gray-400 block mb-1">Local Story Notes</span>
                  <span className="text-xl font-bold text-amber-400 font-mono">{notes.length}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-800/80 border border-gray-700/70">
                  <span className="text-[11px] text-gray-400 block mb-1">Vocabulary Codex Terms</span>
                  <span className="text-xl font-bold text-amber-400 font-mono">{vocabulary.length}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-800/80 border border-gray-700/70">
                  <span className="text-[11px] text-gray-400 block mb-1">MongoDB Stored Notes</span>
                  <span className="text-xl font-bold text-emerald-400 font-mono">
                    {mongoStatus.notesCount ?? '—'}
                  </span>
                </div>
              </div>

              {/* Sync Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={onSyncMongoDB}
                  disabled={isMongoSyncing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={15} className={isMongoSyncing ? 'animate-spin' : ''} />
                  <span>{isMongoSyncing ? 'Syncing with MongoDB...' : 'Sync All Text to MongoDB'}</span>
                </button>

                <button
                  onClick={onPullMongoDB}
                  disabled={isMongoSyncing}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 font-semibold text-xs transition cursor-pointer"
                  title="Pull notes from another device saved on MongoDB"
                >
                  <Download size={15} />
                  <span>Pull Latest from MongoDB</span>
                </button>
              </div>

              {mongoStatus.lastSync && (
                <p className="text-[11px] text-gray-400 font-mono pt-1">
                  Last successful sync: {new Date(mongoStatus.lastSync).toLocaleString()}
                </p>
              )}

              {mongoStatus.error && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{mongoStatus.error}</span>
                </div>
              )}
            </div>

            {/* Cross-device sync guide */}
            <div className="p-5 rounded-2xl bg-gray-800/50 border border-gray-700/70 text-xs text-gray-300 space-y-2">
              <h4 className="font-semibold text-gray-200 flex items-center gap-2">
                <Laptop size={15} className="text-amber-400" />
                Cross-Platform Syncing (Arch Linux & Android)
              </h4>
              <p>
                • <strong>Text & Story Data</strong>: Synchronizes automatically with MongoDB Atlas. Notes created on your Arch Linux laptop will be synced and accessible on your Android device.
              </p>
              <p>
                • <strong>Media Files</strong>: All pictures, voice recordings, and videos stream directly from your Supabase cloud storage bucket.
              </p>
            </div>
          </div>
        )}

        {/* SQL Schema Tab */}
        {activeTab === 'schema' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="p-5 rounded-2xl bg-[#24262b] border border-gray-700 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                    <FileCode size={16} className="text-amber-400" />
                    Supabase Database Schema SQL
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Run this SQL script in your Supabase Dashboard SQL Editor to initialize the <code className="text-amber-400">media_files</code> table.
                  </p>
                </div>
                <button
                  onClick={copySqlCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition cursor-pointer"
                >
                  {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-gray-900 border border-gray-800 text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap leading-relaxed selection:bg-amber-500 selection:text-black">
                {CREATE_MEDIA_TABLE_SQL}
              </pre>

              <div className="text-[11px] text-gray-400 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>
                  The table records file metadata, mime type, size in bytes, and storage paths for all media assets.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog before deleting media from server */}
      {deletingMedia && (
        <ConfirmModal
          isOpen={!!deletingMedia}
          title="Delete Media from Supabase Server"
          message={`Are you sure you want to permanently delete "${deletingMedia.file_name}" from your Supabase cloud bucket? Tip: If you need to keep it, click "Take Full Offline Backup" first.`}
          confirmLabel="Delete from Cloud"
          isDestructive={true}
          onConfirm={confirmDeleteMedia}
          onCancel={() => setDeletingMedia(null)}
        />
      )}
    </div>
  );
};
