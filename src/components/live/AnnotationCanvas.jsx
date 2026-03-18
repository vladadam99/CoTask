import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Pen, Eraser, Circle, Square, Trash2, Minus, Plus } from 'lucide-react';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ffffff'];

export default function AnnotationCanvas({ width = '100%', height = '100%' }) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('pen'); // pen | eraser
  const [color, setColor] = useState('#ef4444');
  const [lineWidth, setLineWidth] = useState(3);
  const [drawing, setDrawing] = useState(false);
  const [annotations, setAnnotations] = useState([]); // stored paths
  const [currentPath, setCurrentPath] = useState(null);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const redraw = useCallback((paths) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paths.forEach(path => {
      if (path.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (path.eraser) {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.moveTo(path.points[0].x, path.points[0].y);
      path.points.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
    });
    ctx.globalCompositeOperation = 'source-over';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }, []);

  const onPointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    setDrawing(true);
    const pos = getPos(e, canvas);
    const path = { color, lineWidth, eraser: tool === 'eraser', points: [pos] };
    setCurrentPath(path);
  };

  const onPointerMove = (e) => {
    if (!drawing || !currentPath) return;
    const canvas = canvasRef.current;
    e.preventDefault();
    const pos = getPos(e, canvas);
    const updated = { ...currentPath, points: [...currentPath.points, pos] };
    setCurrentPath(updated);
    redraw([...annotations, updated]);
  };

  const onPointerUp = () => {
    if (!drawing || !currentPath) return;
    setDrawing(false);
    setAnnotations(prev => [...prev, currentPath]);
    setCurrentPath(null);
  };

  const clearAll = () => {
    setAnnotations([]);
    setCurrentPath(null);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-auto"
        style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none' }}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
      />

      {/* Toolbar */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-md rounded-xl px-3 py-2 pointer-events-auto border border-white/10">
        {/* Tool */}
        <button
          onClick={() => setTool('pen')}
          className={`p-1.5 rounded-lg transition-colors ${tool === 'pen' ? 'bg-primary text-white' : 'text-white/60 hover:text-white'}`}
          title="Pen"
        >
          <Pen className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`p-1.5 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-primary text-white' : 'text-white/60 hover:text-white'}`}
          title="Eraser"
        >
          <Eraser className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/20" />

        {/* Colors */}
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => { setColor(c); setTool('pen'); }}
            className={`w-5 h-5 rounded-full border-2 transition-transform ${color === c && tool === 'pen' ? 'border-white scale-125' : 'border-transparent'}`}
            style={{ background: c }}
          />
        ))}

        <div className="w-px h-5 bg-white/20" />

        {/* Line width */}
        <button onClick={() => setLineWidth(v => Math.max(1, v - 1))} className="text-white/60 hover:text-white p-1">
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-white text-xs w-4 text-center">{lineWidth}</span>
        <button onClick={() => setLineWidth(v => Math.min(12, v + 1))} className="text-white/60 hover:text-white p-1">
          <Plus className="w-3 h-3" />
        </button>

        <div className="w-px h-5 bg-white/20" />

        {/* Clear */}
        <button onClick={clearAll} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg" title="Clear all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}