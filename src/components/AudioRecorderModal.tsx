import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, Square, Play, Pause, Upload, Check, Volume2, AlertCircle } from 'lucide-react';

interface AudioRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (audioUrl: string, name: string, duration: number) => void;
}

export const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({ isOpen, onClose, onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioName, setAudioName] = useState('Voice Memo');
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
    } else {
      setAudioName(`Voice Note ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      setRecordingSeconds(0);
      setAudioBlobUrl(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const cleanup = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPlaying(false);
  };

  const startRecording = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBlobUrl(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Audio recording failed:', err);
      setErrorMsg('Microphone access denied or not available. You can also upload an audio file below.');
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setErrorMsg('Please select an audio file (MP3, WAV, OGG, AAC, etc.).');
      return;
    }

    setAudioName(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = () => {
      setAudioBlobUrl(reader.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const togglePlay = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSave = () => {
    if (!audioBlobUrl) return;
    onSave(audioBlobUrl, audioName.trim() || 'Audio Note', recordingSeconds || 0);
    onClose();
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="flex flex-col w-full max-w-md bg-[#292a2d] text-gray-100 rounded-2xl shadow-2xl border border-gray-700/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/70 bg-[#202124]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Volume2 size={18} />
            </span>
            <span className="font-semibold text-sm md:text-base">Record or Attach Audio</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/60 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center gap-5">
          {errorMsg && (
            <div className="w-full p-3 rounded-lg bg-red-900/40 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Name input */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-400 mb-1">Audio Clip Name</label>
            <input
              type="text"
              value={audioName}
              onChange={(e) => setAudioName(e.target.value)}
              placeholder="e.g. Chapter 3 Dialogue Rhythm, Tavern Ambience..."
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-100 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Live Recording Section */}
          <div className="w-full flex flex-col items-center justify-center py-6 bg-[#202124] rounded-xl border border-gray-800 relative overflow-hidden">
            {isRecording && (
              <div className="absolute inset-0 bg-red-500/5 animate-pulse flex items-center justify-center pointer-events-none" />
            )}

            <div className="font-mono text-3xl font-bold tracking-wider text-amber-400 mb-4">
              {formatTime(recordingSeconds)}
            </div>

            {/* Soundwave bars animation when recording */}
            {isRecording && (
              <div className="flex items-center gap-1.5 h-8 mb-4">
                {[12, 24, 18, 30, 16, 26, 20, 32, 14, 28].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-red-500 rounded-full animate-bounce"
                    style={{
                      height: `${h}px`,
                      animationDelay: `${(i * 0.1).toFixed(1)}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-medium text-sm shadow-lg transition active:scale-95 cursor-pointer"
              >
                <Mic size={18} />
                Start Recording
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-medium text-sm shadow-lg transition active:scale-95 cursor-pointer"
              >
                <Square size={18} className="fill-current" />
                Stop Recording
              </button>
            )}
          </div>

          {/* Preview Player if recorded or uploaded */}
          {audioBlobUrl && (
            <div className="w-full p-3.5 bg-gray-800/80 rounded-xl border border-gray-700 flex items-center justify-between gap-3">
              <audio
                ref={audioPlayerRef}
                src={audioBlobUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <div className="flex items-center gap-3 overflow-hidden">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-2.5 rounded-full bg-amber-500 text-black hover:bg-amber-400 transition cursor-pointer shrink-0"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <div className="truncate">
                  <div className="text-xs font-semibold text-gray-200 truncate">{audioName}</div>
                  <div className="text-[11px] text-gray-400">Ready to attach</div>
                </div>
              </div>
              <span className="text-xs font-mono text-gray-400">
                {recordingSeconds > 0 ? formatTime(recordingSeconds) : 'Audio'}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="w-full flex items-center gap-3 text-xs text-gray-500">
            <div className="flex-1 h-px bg-gray-800" />
            <span>OR UPLOAD AUDIO</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* File upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-medium text-gray-300 transition cursor-pointer"
          >
            <Upload size={14} />
            Choose Audio File (.mp3, .wav, .m4a)
          </button>
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
            disabled={!audioBlobUrl}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-amber-500 text-black text-xs font-semibold transition active:scale-95 cursor-pointer"
          >
            <Check size={16} />
            Attach Audio to Page
          </button>
        </div>
      </div>
    </div>
  );
};
