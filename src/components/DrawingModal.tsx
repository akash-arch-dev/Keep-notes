import React, { useRef, useState, useEffect } from 'react';
import { X, Check, RotateCcw, Trash2, Edit3, Circle, Eraser } from 'lucide-react';

interface DrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (drawingDataUrl: string, name: string) => void;
}

const PEN_COLORS = [
  '#ffffff', // Chalk white
  '#f59e0b', // Amber (Keep accent)
  '#ef4444', // Crimson
  '#3b82f6', // Azure
  '#10b981', // Emerald
  '#a855f7', // Violet
  '#94a3b8', // Slate
  '#18181b', // Ink black
];

const STROKE_WIDTHS = [2, 4, 8, 16];

export const DrawingModal: React.FC<DrawingModalProps> = ({ isOpen, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#f59e0b');
  const [lineWidth, setLineWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [title, setTitle] = useState('World Map Sketch');
  const [history, setHistory] = useState<ImageData[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill canvas with dark background
    ctx.fillStyle = '#1e2124';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  }, [isOpen]);

  if (!isOpen) return null;

  const saveHistoryStep = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setHistory((prev) => [...prev.slice(-15), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    const lastState = newHistory[newHistory.length - 1];
    if (lastState) {
      ctx.putImageData(lastState, 0, 0);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#1e2124';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistoryStep();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = isEraser ? '#1e2124' : color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistoryStep();
    }
  };

  const handleSaveAndAttach = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl, title.trim() || 'Creative Sketch');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 md:p-6 animate-in fade-in duration-150">
      <div className="flex flex-col w-full max-w-4xl max-h-[92vh] bg-[#292a2d] text-gray-100 rounded-2xl shadow-2xl border border-gray-700/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/70 bg-[#202124]">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Edit3 size={18} />
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sketch Title (e.g., Dungeon Map, Sigil, Character Face)..."
              className="bg-transparent text-sm md:text-base font-medium text-gray-100 focus:outline-hidden focus:border-b border-amber-500 placeholder-gray-500 w-52 md:w-80"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAndAttach}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs md:text-sm font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-black shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Check size={16} />
              Insert Drawing
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/60 transition cursor-pointer"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#202124]/70 border-b border-gray-700/60 text-xs text-gray-300">
          {/* Tools & Colors */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-lg border border-gray-700">
              <button
                type="button"
                onClick={() => setIsEraser(false)}
                className={`p-1.5 rounded-md transition ${!isEraser ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:text-white'}`}
                title="Pen"
              >
                <Edit3 size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsEraser(true)}
                className={`p-1.5 rounded-md transition ${isEraser ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:text-white'}`}
                title="Eraser"
              >
                <Eraser size={15} />
              </button>
            </div>

            {/* Colors */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-gray-700">
              {PEN_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setColor(c);
                    setIsEraser(false);
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition active:scale-90 ${color === c && !isEraser ? 'scale-110 border-amber-400 ring-2 ring-amber-400/30' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>

            {/* Width presets */}
            <div className="flex items-center gap-1 pl-2 border-l border-gray-700">
              {STROKE_WIDTHS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setLineWidth(w)}
                  className={`px-2 py-1 rounded-md transition ${lineWidth === w ? 'bg-gray-700 text-amber-400 font-bold' : 'text-gray-400 hover:text-white'}`}
                >
                  <span className="inline-block rounded-full bg-current" style={{ width: w + 2, height: w + 2 }} />
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons: Undo & Clear */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-gray-800 text-gray-300 transition cursor-pointer"
              title="Undo stroke"
            >
              <RotateCcw size={14} />
              Undo
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-800/40 transition cursor-pointer"
              title="Clear entire canvas"
            >
              <Trash2 size={14} />
              Clear
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-[#141517] p-2 flex items-center justify-center overflow-auto min-h-[360px] md:min-h-[460px]">
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full max-w-full h-auto max-h-[70vh] rounded-lg shadow-inner border border-gray-800 touch-none cursor-crosshair bg-[#1e2124]"
          />
        </div>

        {/* Footer tip */}
        <div className="px-4 py-2 bg-[#202124] text-[11px] text-gray-400 border-t border-gray-800 flex justify-between items-center">
          <span>Tip: Draw world maps, scene diagrams, sigils, or character sketches. Works with touch/stylus on Android and mouse on Arch Linux.</span>
          <span className="font-mono text-gray-500">800 × 500 px</span>
        </div>
      </div>
    </div>
  );
};
