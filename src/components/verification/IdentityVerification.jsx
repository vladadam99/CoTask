import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, Loader2, ShieldCheck, AlertTriangle, FileText, User } from 'lucide-react';
import CameraCapture from './CameraCapture';
import QRVerification from './QRVerification';

function useHasCamera() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'available' | 'unavailable'
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable');
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        stream.getTracks().forEach(t => t.stop());
        setStatus('available');
      })
      .catch(() => setStatus('unavailable'));
  }, []);
  return status;
}

export default function IdentityVerification({ profileId, profileType, onComplete }) {
  const cameraStatus = useHasCamera();
  const [idFile, setIdFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Generate a stable session ID for QR flow
  const [sessionId] = useState(() => `verify_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  // Check if coming from mobile QR flow
  const urlParams = new URLSearchParams(window.location.search);
  const isMobileSession = urlParams.get('mobile') === '1';

  const handleSubmit = async () => {
    if (!idFile || !selfieFile) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      setLoadingMsg('Uploading documents...');
      const [idUpload, selfieUpload] = await Promise.all([
        base44.integrations.Core.UploadFile({ file: idFile }),
        base44.integrations.Core.UploadFile({ file: selfieFile }),
      ]);

      setLoadingMsg('AI is analysing your identity...');
      const response = await base44.functions.invoke('verifyIdentity', {
        id_photo_url: idUpload.file_url,
        selfie_url: selfieUpload.file_url,
        profile_id: profileId,
        profile_type: profileType,
        session_id: isMobileSession ? urlParams.get('session') : null,
      });

      setResult(response.data);
      if (response.data.success && onComplete) {
        onComplete(response.data);
      }
    } catch (e) {
      setError(e.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const canSubmit = idFile && selfieFile && !loading;

  // If camera unavailable and not in mobile flow, show QR code
  if (cameraStatus === 'unavailable' && !isMobileSession) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Identity Verification</h3>
            <p className="text-sm text-muted-foreground">Camera not available on this device</p>
          </div>
        </div>
        <QRVerification sessionId={sessionId} onComplete={onComplete} />
      </div>
    );
  }

  if (cameraStatus === 'checking') {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Checking camera availability...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Identity Verification</h3>
          <p className="text-sm text-muted-foreground">Take a photo of your ID and a selfie using your camera</p>
        </div>
      </div>

      {/* Camera capture area */}
      {!result && (
        <>
          <div className="flex gap-4 flex-col sm:flex-row">
            <CameraCapture
              label="Identity Document"
              icon={FileText}
              facingMode="environment"
              captured={idPreview}
              onCapture={(file, preview) => { setIdFile(file); setIdPreview(preview); }}
            />
            <CameraCapture
              label="Selfie Photo"
              icon={User}
              facingMode="user"
              captured={selfiePreview}
              onCapture={(file, preview) => { setSelfieFile(file); setSelfiePreview(preview); }}
            />
          </div>

          <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tips for best results</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Ensure the full document is visible and well-lit</li>
              <li>• Your selfie should clearly show your face</li>
              <li>• Avoid glare, blur, or heavy shadows</li>
              <li>• Remove sunglasses or hats for the selfie</li>
            </ul>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full" size="lg">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{loadingMsg || 'Verifying...'}</>
            ) : (
              <><ShieldCheck className="w-4 h-4 mr-2" />Verify My Identity</>
            )}
          </Button>
        </>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-xl border p-6 space-y-4 ${result.success ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
          <div className="flex items-center gap-3">
            {result.success ? (
              <CheckCircle className="w-8 h-8 text-green-400" />
            ) : (
              <XCircle className="w-8 h-8 text-red-400" />
            )}
            <div>
              <p className={`font-semibold text-lg ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.success ? 'Identity Verified!' : 'Verification Failed'}
              </p>
              <p className="text-sm text-muted-foreground capitalize">Confidence: {result.confidence}</p>
            </div>
          </div>

          {result.full_name && (
            <p className="text-sm text-foreground">
              <span className="text-muted-foreground">Name on document: </span>
              <span className="font-medium">{result.full_name}</span>
            </p>
          )}

          {result.document_type && (
            <p className="text-sm text-foreground capitalize">
              <span className="text-muted-foreground">Document type: </span>
              <span className="font-medium">{result.document_type.replace(/_/g, ' ')}</span>
            </p>
          )}

          {result.rejection_reasons?.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Issues found:</p>
              {result.rejection_reasons.map((r, i) => (
                <p key={i} className="text-sm text-red-400 flex items-start gap-1.5">
                  <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {r}
                </p>
              ))}
            </div>
          )}

          {result.notes && (
            <p className="text-sm text-muted-foreground italic">{result.notes}</p>
          )}

          {!result.success && (
            <Button variant="outline" className="w-full" onClick={() => {
              setResult(null);
              setIdFile(null); setSelfieFile(null);
              setIdPreview(null); setSelfiePreview(null);
            }}>
              Try Again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}