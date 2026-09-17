/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { Tag, Plus, X, Sparkles, Check, Hash } from 'lucide-react';
import { Channel } from '../types/iptv';
import { usePlayerStore } from '../store/usePlayerStore';

interface ChannelTagModalProps {
  channel: Channel | null;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_TAG_SUGGESTIONS = [
  'Sports Prime',
  '4K UHD',
  'News Live',
  'Movie Night',
  'Kids Safe',
  'Documentary',
  'Music Beats',
  'Late Night',
  'Weekend Binge',
  'Local Regional'
];

export function ChannelTagModal({ channel, isOpen, onClose }: ChannelTagModalProps) {
  const { customTags, addChannelTag, removeChannelTag } = usePlayerStore();
  const [newTagInput, setNewTagInput] = React.useState('');

  if (!isOpen || !channel) return null;

  const activeChannelTags = customTags[channel.id] || [];

  const handleAddTag = (tagToAdd?: string) => {
    const tag = (tagToAdd || newTagInput).trim();
    if (!tag) return;
    addChannelTag(channel.id, tag);
    setNewTagInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#0f1015] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-white/[0.02]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white tracking-tight truncate">
                Manage Custom Tags
              </h3>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {channel.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {/* Tag Input Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Hash className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add custom tag (e.g. 4K Sports)..."
                className="w-full bg-black/60 border border-white/15 focus:border-cyan-500 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none transition-all"
                autoFocus
              />
            </div>
            <button
              onClick={() => handleAddTag()}
              disabled={!newTagInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {/* Active Tags */}
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
              Active Channel Tags ({activeChannelTags.length})
            </span>
            {activeChannelTags.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-1">
                No custom tags assigned to this channel yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {activeChannelTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-semibold"
                  >
                    <span>#{tag}</span>
                    <button
                      onClick={() => removeChannelTag(channel.id, tag)}
                      className="hover:text-white transition-colors cursor-pointer"
                      title="Remove tag"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Preset Suggestions */}
          <div className="border-t border-white/5 pt-3">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Quick Suggestions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TAG_SUGGESTIONS.map((suggestion) => {
                const isAlreadyAdded = activeChannelTags.some(
                  (t) => t.toLowerCase() === suggestion.toLowerCase()
                );
                return (
                  <button
                    key={suggestion}
                    onClick={() => {
                      if (isAlreadyAdded) {
                        removeChannelTag(channel.id, suggestion);
                      } else {
                        handleAddTag(suggestion);
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all cursor-pointer border ${
                      isAlreadyAdded
                        ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {isAlreadyAdded ? (
                      <Check className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                    <span>{suggestion}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end bg-black/40">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
