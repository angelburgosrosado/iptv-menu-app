/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { 
  X, 
  Search, 
  Globe, 
  Download, 
  Check, 
  Sparkles, 
  Subtitles,
  Loader2,
  Ear
} from 'lucide-react';
import { 
  ExternalSubtitleTrack, 
  searchExternalSubtitles 
} from '../utils/subtitleEngine';

interface ExternalSubtitleModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelName?: string;
  programTitle?: string;
  onSelectTrack: (track: ExternalSubtitleTrack) => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'fr', label: 'French (Français)' },
  { code: 'de', label: 'German (Deutsch)' },
  { code: 'it', label: 'Italian (Italiano)' },
  { code: 'pt', label: 'Portuguese (Português)' },
];

export function ExternalSubtitleModal({
  isOpen,
  onClose,
  channelName,
  programTitle,
  onSelectTrack
}: ExternalSubtitleModalProps) {
  const initialQuery = (programTitle || channelName || '').replace(/\[.*?\]|\(.*?\)/g, '').trim();
  const [searchTerm, setSearchTerm] = React.useState(initialQuery);
  const [selectedLanguage, setSelectedLanguage] = React.useState('en');
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<ExternalSubtitleTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = React.useState<string | null>(null);

  const performSearch = React.useCallback(async (query: string, lang: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const tracks = await searchExternalSubtitles(query.trim(), lang);
      setResults(tracks);
    } catch (e) {
      console.error('Failed to query external subtitles', e);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      const q = (programTitle || channelName || '').replace(/\[.*?\]|\(.*?\)/g, '').trim();
      setSearchTerm(q);
      performSearch(q, selectedLanguage);
    }
  }, [isOpen, programTitle, channelName, selectedLanguage, performSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121316] border border-white/10 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Subtitles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                External Subtitles Discovery
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  OpenSubtitles
                </span>
              </h3>
              <p className="text-xs text-zinc-400">Search and stream subtitles on-demand</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Controls */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') performSearch(searchTerm, selectedLanguage);
              }}
              placeholder="Search movie, episode or live show title..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            />
            <button
              type="button"
              onClick={() => performSearch(searchTerm, selectedLanguage)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
            >
              Search
            </button>
          </div>

          {/* Language Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setSelectedLanguage(lang.code);
                  performSearch(searchTerm, lang.code);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                  selectedLanguage === lang.code
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Area */}
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-xs">Searching subtitle indices...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center text-zinc-500 text-xs">
              No external subtitles found for "{searchTerm}". Try a broader title keyword.
            </div>
          ) : (
            results.map((track) => {
              const isSelected = selectedTrackId === track.id;
              return (
                <div
                  key={track.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400/40'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                  }`}
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{track.label}</span>
                      {track.hearingImpaired && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[8px] font-bold">
                          <Ear className="w-2.5 h-2.5" />
                          <span>SDH</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-1">
                      <span>Source: <strong className="text-zinc-300">{track.source}</strong></span>
                      {track.rating && <span>Rating: <strong className="text-emerald-400">{track.rating}★</strong></span>}
                      {track.downloads && <span>Downloads: {track.downloads.toLocaleString()}</span>}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTrackId(track.id);
                      onSelectTrack(track);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shrink-0 flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Apply</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[11px] text-zinc-500">
          <span>Subtitles dynamically injected as HTML5 WebVTT track</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
