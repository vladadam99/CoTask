import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Image, Video, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PostUpload({ user, profile, onClose }) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState([]); // [{file, preview, fileType}]
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  const addFiles = (fileList) => {
    setError('');
    const newItems = [];
    let pending = fileList.length;

    Array.from(fileList).forEach(f => {
      const isVideo = f.type.startsWith('video/');
      const isImage = f.type.startsWith('image/');
      if (!isVideo && !isImage) {
        setError('Only photos and videos are allowed.');
        pending--;
        return;
      }

      if (isVideo) {
        const url = URL.createObjectURL(f);
        const vid = document.createElement('video');
        vid.src = url;
        vid.onloadedmetadata = () => {
          if (vid.duration > 60) {
            setError('Videos must be 60 seconds or less.');
            URL.revokeObjectURL(url);
          } else {
            newItems.push({ file: f, preview: url, fileType: 'video' });
          }
          pending--;
          if (pending === 0) setItems(prev => [...prev, ...newItems]);
        };
      } else {
        newItems.push({ file: f, preview: URL.createObjectURL(f), fileType: 'photo' });
        pending--;
        if (pending === 0) setItems(prev => [...prev, ...newItems]);
      }
    });
  };

  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const publish = useMutation({
    mutationFn: async () => {
      setUploading(true);
      setProgress(0);
      for (let i = 0; i < items.length; i++) {
        const { file, fileType } = items[i];
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
        setProgress(Math.round(((i + 1) / items.length) * 100));
      }
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
          <h3 className="font-bold">New Post{items.length > 1 ? ` (${items.length} files)` : ''}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Preview grid */}
          {items.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {items.map((item, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden bg-black aspect-square">
                  {item.fileType === 'video'
                    ? <video src={item.preview} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                    : <img src={item.preview} alt="preview" className="w-full h-full object-cover" />}
                  <button
                    onClick={() => removeItem(idx)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                  {item.fileType === 'video' && (
                    <div className="absolute bottom-1 left-1">
                      <Video className="w-3.5 h-3.5 text-white drop-shadow" />
                    </div>
                  )}
                </div>
              ))}
              {/* Add more button */}
              <button
                onClick={() => inputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 hover:border-primary/30 transition-colors"
              >
                <Plus className="w-5 h-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Add</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full h-48 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Image className="w-8 h-8" />
                  <span className="text-xs">Photos</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Video className="w-8 h-8" />
                  <span className="text-xs">Videos ≤60s</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Tap to select (multiple)</p>
            </button>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={e => addFiles(e.target.files)}
          />

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

          {uploading && (
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}

          <Button
            onClick={() => publish.mutate()}
            disabled={items.length === 0 || publish.isPending || uploading}
            className="w-full"
          >
            {uploading
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Uploading {progress}%</>
              : `Publish ${items.length > 1 ? `${items.length} Posts` : 'Post'}`}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}