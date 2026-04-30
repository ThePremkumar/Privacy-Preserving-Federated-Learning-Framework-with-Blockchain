import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface TagInputProps {
  label: string;
  tags: string[];
  setTags: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({ 
  label, tags, setTags, suggestions = [], placeholder 
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</label>
      
      <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-100 rounded-xl focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        {tags.map((tag, index) => (
          <span key={index} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[11px] font-black border border-blue-100">
            {tag}
            <button type="button" onClick={() => removeTag(index)} className="hover:text-red-500 transition-colors">
              <X size={12} />
            </button>
          </span>
        ))}
        <input 
          className="flex-1 min-w-[120px] bg-transparent border-none focus:outline-none text-xs font-bold p-1 placeholder:text-slate-300"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Type and press Enter...'}
        />
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mr-1">Quick add:</span>
          {suggestions.map(s => (
            <button 
              key={s}
              type="button"
              onClick={() => handleAddTag(s)}
              className="text-[9px] font-black text-slate-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-0.5 rounded border border-slate-100 transition-all"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
