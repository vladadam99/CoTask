import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Image, Video } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PostUpload({ user, profile, onClose }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    setError('');
    const isVideo = f.type.startsWith('video/');
    const isImage = f.type.startsWith('image/');
    if (!isVideo && !isImage) { setError('Please select a photo or video.'); return; }

    if (isVideo) {
      const url = URL.createObjectURL(f);
      const vid = document.createElement('video');
      vid.src = url;
      vid.onloadedmetadata = () => {
        if (vid.duration > 20) {
          setError('Videos must be 20 seconds or less.');
          URL.revokeObjectURL(url);
          return;
        }
        setFile(f);
        setPreview(url);
        setFileType('video');
      };
    } else {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setFileType('photo');
    }
  };

  const publish = useMutation({
    mutationFn: async () => {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Post.create({
        avatar_email: user.email,
        avatar_name: profile?.display_name || user.full_name,
        avatar_photo_url: profile?.photo_url || '',
        avatar_profile_id: profile?.id || '',
        type: fileType,
        media_url: file_url,
        caption: caption.trim(),
        category: category.trim(),
        is_published: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['explore-posts'] });
      queryClient.invalidateQueries({ queryKey: ['avatar-posts'] });
      setUploading(false);
      onClose();
    },
    onError: () => setUploading(false),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-card border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="font-bold">New Post</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Media picker */}
          {!preview ? (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full h-48 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Image className="w-8 h-8" />
                  <span className="text-xs">Photo</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Video className="w-8 h-8" />
                  <span className="text-xs">Video ≤20s</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Tap to select</p>
            </button>
          ) : (
            <div className="relative rounded-xl overflow-hidden aspect-square bg-black">
              {fileType === 'video'
                ? <video src={preview} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                : <img src={preview} alt="preview" className="w-full h-full object-cover" />}
              <button onClick={() => { setFile(null); setPreview(null); setFileType(null); }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />

          <input
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Write a caption..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/40 text-foreground placeholder:text-muted-foreground"
          />
          <input
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="Category (e.g. City Guide)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/40 text-foreground placeholder:text-muted-foreground"
          />

          <Button
            onClick={() => publish.mutate()}
            disabled={!file || publish.isPending || uploading}
            className="w-full"
          >
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Uploading...</> : 'Publish Post'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}