import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

export default function EditPostModal({ post, onClose, onSuccess }) {
  const [caption, setCaption] = useState(post.caption || '');
  const [category, setCategory] = useState(post.category || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.entities.Post.update(post.id, { caption, category });
      onSuccess();
    } catch (error) {
      console.error('Failed to update post:', error);
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl p-6 max-w-md w-full border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Edit Post</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="aspect-video rounded-xl overflow-hidden bg-white/5 mb-4">
          {post.type === 'video'
            ? <video src={post.media_url} className="w-full h-full object-cover" controls />
            : <img src={post.media_url} alt={post.caption} className="w-full h-full object-cover" />}
        </div>

        {/* Caption */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1 block">Caption</label>
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="bg-transparent border-white/10 resize-none"
            placeholder="Add a caption..."
          />
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="text-xs text-muted-foreground mb-1 block">Category</label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-transparent border-white/10"
            placeholder="e.g. Tourism, Events"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 border-white/10" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}