import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Pencil, Eraser, Circle, Square, Trash2, Palette } from 'lucide-react';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ffffff'];

export default function AnnotationCanvas({ width, height, enabled }) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('pen'); // pen | eraser | circle | rect
  const [color, setColor] = useState('#ef4444');
  const [lineWidth, setLineWidth] = useState(3);
  const [drawing, setDrawing] = useState(false);
  const startPos = useRef(null);
  const snapshotRef = useRef(null);

  const getCtx = () => canvasRef.current?.getContext('2d');

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvasRef.current.width / rect.width),
      y: (clientY - rect.top) * (canvasRef.current.height / rect.height),
    };
  };

  const onDown = useCallback((e) => {
    if (!enabled) return;
    e.preventDefault();
    const pos = getPos(e);
    startPos.current = pos;
    const ctx = getCtx();
    if (!ctx) return;
    snapshotRef.current = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
  }, [enabled]);

  const onMove = useCallback((e) => {
    if (!drawing || !enabled) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = getCtx();
    if (!ctx) return;

    if (tool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = lineWidth * 4;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else {
      // shapes — restore snapshot then draw
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      const sx = startPos.current.x, sy = startPos.current.y;
      if (tool === 'circle') {
        const rx = Math.abs(pos.x - sx) / 2, ry = Math.abs(pos.y - sy) / 2;
        ctx.beginPath();
        ctx.ellipse(sx + (pos.x - sx) / 2, sy + (pos.y - sy) / 2, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tool === 'rect') {
        ctx.beginPath();
        ctx.strokeRect(sx, sy, pos.x - sx, pos.y - sy);
      }
    }
  }, [drawing, enabled, tool, color, lineWidth]);

  const onUp = useCallback(() => setDrawing(false), []);

  const clearCanvas = () => {
    const ctx = getCtx();
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onUp);
    return () => {
      canvas.removeEventListener('touchstart', onDown);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onUp);
    };
  }, [onDown, onMove, onUp]);

  if (!enabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Canvas layer */}
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="absolute inset-0 w-full h-full pointer-events-auto"
        style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
      />

      {/* Toolbar */}
      <div className="absolute top-16 right-3 flex flex-col gap-1.5 pointer-events-auto">
        <div className="glass border border-white/10 rounded-xl p-2 flex flex-col gap-1.5">
          {[
            { id: 'pen', icon: Pencil },
            { id: 'eraser', icon: Eraser },
            { id: 'circle', icon: Circle },
            { id: 'rect', icon: Square },
          ].map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTool(id)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${tool === id ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground hover:bg-white/10'}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
          <div className="border-t border-white/10 my-0.5" />
          <button onClick={clearCanvas} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Colors */}
        <div className="glass border border-white/10 rounded-xl p-2 flex flex-col gap-1">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full mx-auto border-2 transition-transform ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Stroke size */}
        <div className="glass border border-white/10 rounded-xl p-2 flex flex-col gap-1 items-center">
          {[2, 4, 8].map(s => (
            <button
              key={s}
              onClick={() => setLineWidth(s)}
              className={`w-6 h-6 rounded-lg flex items-center justify-center ${lineWidth === s ? 'bg-primary/20' : 'hover:bg-white/10'}`}
            >
              <span className="rounded-full bg-white" style={{ width: s + 2, height: s + 2 }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}