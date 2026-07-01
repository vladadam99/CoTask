import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function TagInput({ tags = [], setTags, placeholder = "Add tag..." }) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.trim();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 border border-border rounded-md bg-transparent focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-colors">
      {tags.map((tag, index) => (
        <span key={index} className="flex items-center gap-1 px-2.5 py-1 bg-primary/20 text-primary font-medium text-xs rounded-full">
          {tag}
          <button type="button" onClick={() => removeTag(index)} className="hover:text-foreground hover:bg-black/10 rounded-full p-0.5 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-transparent border-none outline-none text-sm min-w-[120px] focus:ring-0 p-1 placeholder:text-muted-foreground"
        placeholder={tags.length === 0 ? placeholder : 'Add another...'}
      />
    </div>
  );
}