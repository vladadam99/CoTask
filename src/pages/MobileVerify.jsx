import React, { useState, useRef } from 'react';
import { ShieldCheck, Camera, RefreshCw, CheckCircle, Loader2, FileText, User, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function CameraStep({ label, icon: Icon, facingMode, onCapture }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onCapture(file);
  };

  const retake = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const captureAttr = facingMode === 'user' ? 'user' : 'environment';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-red-400" />
        <span className="text-sm font-medium text-white">{label}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={captureAttr}
        onChange={handleFileChange}
        className="hidden"
      />

      {!preview ? (
        <button onClick={() => inputRef.current?.click()}
          className="w-full h-36 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-white/50 hover:border-red-400/50 hover:text-red-400 transition-all">
          <Camera className="w-7 h-7" />
          <span className="text-xs">Tap to open camera</span>
        </button>
      ) : (
        <div className="relative">
          <img src={preview} className="w-full rounded-xl object-cover aspect-[4/3]" alt="captured" />
          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <button onClick={retake}
            className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2.5 py-1.5 rounded-lg">
            <RefreshCw className="w-3 h-3" /> Retake
          </button>
        </div>
      )}
    </div>
  );
}

export default function MobileVerify() {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session');

  const [idFile, setIdFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 text-center">
        <div>
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-white font-medium">Invalid verification link</p>
          <p className="text-gray-400 text-sm mt-1">Please scan the QR code again from your desktop.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!idFile || !selfieFile) return;
    setLoading(true);
    setError(null);

    try {
      setLoadingMsg('Uploading photos...');
      const [idUpload, selfieUpload] = await Promise.all([
        base44.integrations.Core.UploadFile({ file: idFile }),
        base44.integrations.Core.UploadFile({ file: selfieFile }),
      ]);

      setLoadingMsg('Verifying your identity...');
      await base44.functions.invoke('mobileVerifyIdentity', {
        id_photo_url: idUpload.file_url,
        selfie_url: selfieUpload.file_url,
        session_id: sessionId,
      });

      setDone(true);
    } catch (e) {
      setError(e.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Verification Complete!</h2>
          <p className="text-gray-400">You can now close this tab and return to your computer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg">Identity Verification</h1>
          <p className="text-gray-400 text-xs">Complete on your phone — results sent to desktop</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-gray-400 space-y-1">
        <p className="font-medium text-white text-sm">How it works</p>
        <p>1. Take a clear photo of your ID document</p>
        <p>2. Take a selfie showing your face</p>
        <p>3. Submit — your desktop will update automatically</p>
      </div>

      <CameraStep label="Identity Document" icon={FileText} facingMode="environment" onCapture={setIdFile} />
      <CameraStep label="Selfie Photo" icon={User} facingMode="user" onCapture={setSelfieFile} />

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!idFile || !selfieFile || loading}
        className="w-full py-4 rounded-2xl bg-red-500 text-white font-semibold text-base disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity">
        {loading ? (
          <><Loader2 className="w-5 h-5 animate-spin" />{loadingMsg || 'Processing...'}</>
        ) : (
          <><ShieldCheck className="w-5 h-5" />Submit for Verification</>
        )}
      </button>
    </div>
  );
}