import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Check, Loader2 } from 'lucide-react';

export default function CameraCapture({ label, icon: Icon, facingMode = 'user', onCapture, captured }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const startCamera = async () => {
    setLoading(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreaming(true);
      }
    } catch (e) {
      setError('Camera access denied or not available.');
    }
    setLoading(false);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setStreaming(false);
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      const file = new File([blob], `${label.replace(/\s+/g, '_')}.jpg`, { type: 'image/jpeg' });
      const preview = canvas.toDataURL('image/jpeg');
      onCapture(file, preview);
      stopCamera();
    }, 'image/jpeg', 0.92);
  };

  const retake = () => {
    onCapture(null, null);
    startCamera();
  };

  useEffect(() => () => stopCamera(), []);

  return (
    <div className="flex-1">
      <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" /> {label}
      </p>

      <div className="relative rounded-xl overflow-hidden bg-black" style={{ minHeight: 160, aspectRatio: '4/3' }}>
        {/* Captured preview */}
        {captured ? (
          <img src={captured} alt={label} className="w-full h-full object-cover" />
        ) : streaming ? (
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-4 bg-muted/30 rounded-xl border-2 border-dashed border-border" style={{ minHeight: 160 }}>
            <Camera className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">{label}</p>
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
          </div>
        )}

        {/* Capture button overlay */}
        {streaming && !captured && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <button
              type="button"
              onClick={capture}
              className="w-14 h-14 rounded-full bg-white border-4 border-primary shadow-lg hover:scale-105 transition-transform"
            />
          </div>
        )}

        {/* Captured checkmark */}
        {captured && (
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="mt-2">
        {!streaming && !captured && (
          <Button type="button" size="sm" onClick={startCamera} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Camera className="w-3.5 h-3.5 mr-1" />}
            Open Camera
          </Button>
        )}
        {captured && (
          <Button type="button" size="sm" variant="outline" onClick={retake} className="w-full border-white/10">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Retake
          </Button>
        )}
        {streaming && !captured && (
          <p className="text-xs text-muted-foreground text-center mt-1">Tap the white circle to capture</p>
        )}
      </div>
    </div>
  );
}