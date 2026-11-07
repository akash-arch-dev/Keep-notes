import React, { useState, useRef } from 'react';
import { X, Video, Upload, Link2, Check, AlertCircle } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (videoUrl: string, name: string, caption?: string) => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoName, setVideoName] = useState('Visual Scene Reference');
  const [caption, setCaption] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setErrorMsg('Please select a valid video file.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File exceeds 50MB. Consider using a video URL instead.');
      return;
    }

    setVideoName(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = () => {
      setVideoUrl(reader.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const formatVideoEmbed = (url: string) => {
    // Check if YouTube
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    // Check if Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    return url;
  };

  const handleSave = () => {
    if (!videoUrl.trim()) {
      setErrorMsg('Please provide a video file or URL.');
      return;
    }
    const finalUrl = activeTab === 'url' ? formatVideoEmbed(videoUrl.trim()) : videoUrl;
    onSave(finalUrl, videoName.trim() || 'Video Reference', caption.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="flex flex-col w-full max-w-lg bg-[#292a2d] text-gray-100 rounded-2xl shadow-2xl border border-gray-700/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/70 bg-[#202124]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Video size={18} />
            </span>
            <span className="font-semibold text-sm md:text-base">Attach Video Reference</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/60 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-gray-700/60 bg-[#202124]/50">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${activeTab === 'url' ? 'border-amber-500 text-amber-400 bg-amber-500/10' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            <Link2 size={14} />
            Video Link (YouTube / MP4 URL)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${activeTab === 'upload' ? 'border-amber-500 text-amber-400 bg-amber-500/10' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            <Upload size={14} />
            Upload Local Video
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {errorMsg && (
            <div className="w-full p-2.5 rounded-lg bg-red-900/40 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Title / Scene Description</label>
            <input
              type="text"
              value={videoName}
              onChange={(e) => setVideoName(e.target.value)}
              placeholder="e.g. Sword Duel Choreography Reference"
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-100 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {activeTab === 'url' ? (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Video URL</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://.../video.mp4"
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-100 focus:outline-hidden focus:border-amber-500"
              />
              <p className="mt-1 text-[11px] text-gray-400">Supports YouTube links or direct MP4/WebM video streams.</p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Local Video File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-gray-700 hover:border-amber-500/60 bg-gray-800/50 hover:bg-gray-800 flex flex-col items-center justify-center gap-2 text-xs font-medium text-gray-300 transition cursor-pointer"
              >
                <Video size={24} className="text-amber-400" />
                <span>{videoUrl.startsWith('data:video') ? 'Video file selected (click to replace)' : 'Click to select video (Max 50MB)'}</span>
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Optional Notes / Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              placeholder="Notice the rapid footwork at 0:42 for Lysander's duel..."
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-100 focus:outline-hidden focus:border-amber-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-700/70 bg-[#202124]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:bg-gray-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!videoUrl.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-amber-500 text-black text-xs font-semibold transition active:scale-95 cursor-pointer"
          >
            <Check size={16} />
            Attach Video
          </button>
        </div>
      </div>
    </div>
  );
};
