import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Upload, Camera, CheckCircle, XCircle, Loader2, ShieldCheck, AlertTriangle, FileText, User } from 'lucide-react';

const UploadBox = ({ label, icon: Icon, file, onFileChange, preview, hint }) => {
  const inputRef = useRef();
  return (
    <div className="flex-1">
      <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" /> {label}
      </p>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden
          ${preview ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-white/5'}
        `}
        style={{ minHeight: 160 }}
      >
        {preview ? (
          <img src={preview} alt={label} className="w-full h-full object-cover rounded-xl" style={{ maxHeight: 200 }} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 gap-2 text-center">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{hint}</p>
            <p className="text-xs text-muted-foreground/60">JPG, PNG up to 10MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => onFileChange(e.target.files[0])}
        />
      </div>
      {file && (
        <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
      )}
    </div>
  );
};

const ResultBadge = ({ success, children }) => (
  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
    ${success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
    {success ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
    {children}
  </span>
);

export default function IdentityVerification({ profileId, profileType, onComplete }) {
  const [idFile, setIdFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSet = (file, setFile, setPreview) => {
    setFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Identity Verification</h3>
          <p className="text-sm text-muted-foreground">Upload your ID and a selfie for AI-powered verification</p>
        </div>
      </div>

      {/* Upload Area */}
      {!result && (
        <>
          <div className="flex gap-4">
            <UploadBox
              label="Identity Document"
              icon={FileText}
              file={idFile}
              onFileChange={f => handleFileSet(f, setIdFile, setIdPreview)}
              preview={idPreview}
              hint="Passport, driving licence or national ID"
            />
            <UploadBox
              label="Selfie Photo"
              icon={User}
              file={selfieFile}
              onFileChange={f => handleFileSet(f, setSelfieFile, setSelfiePreview)}
              preview={selfiePreview}
              hint="Clear photo of your face, no sunglasses"
            />
          </div>

          {/* Tips */}
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
            <Button variant="outline" className="w-full" onClick={() => { setResult(null); setIdFile(null); setSelfieFile(null); setIdPreview(null); setSelfiePreview(null); }}>
              Try Again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}