import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Camera, Upload, CheckCircle, Loader2 } from 'lucide-react';

export default function ProofUpload({ booking, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Booking.update(booking.id, {
      status: 'awaiting_approval',
      proof_url: file_url,
      proof_note: note,
    });
    // Notify client
    await base44.entities.Notification.create({
      user_email: booking.client_email,
      title: '📸 Job Proof Submitted — Please Review',
      message: `${booking.avatar_name} has submitted proof of completion. Review and release payment.`,
      type: 'booking_accepted',
      link: `/BookingDetail?id=${booking.id}`,
      reference_id: booking.id,
    });
    setUploading(false);
    onUpload?.();
  };

  return (
    <GlassCard className="p-5 border-primary/20">
      <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
        <Camera className="w-4 h-4 text-primary" /> Upload Job Completion Proof
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Take or upload a photo proving the job is done. The client will review it before releasing payment.</p>

      {previewUrl ? (
        <div className="mb-3">
          <img src={previewUrl} alt="Proof preview" className="w-full max-h-48 object-cover rounded-xl border border-white/10" />
          <button onClick={() => { setPreviewUrl(null); setFile(null); }} className="text-xs text-muted-foreground hover:text-foreground mt-1.5">Remove</button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors mb-3"
        >
          <Upload className="w-6 h-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Tap to take or upload a photo</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        rows={2}
        placeholder="Optional note about the completed job…"
        className="w-full text-sm bg-muted/50 border border-white/5 rounded-xl px-3 py-2 focus:outline-none focus:border-primary/40 text-foreground placeholder:text-muted-foreground resize-none mb-3"
      />

      <Button
        className="w-full bg-primary hover:bg-primary/90 gap-2"
        onClick={submit}
        disabled={!file || uploading}
      >
        {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><CheckCircle className="w-4 h-4" /> Submit Proof & Request Approval</>}
      </Button>
    </GlassCard>
  );
}