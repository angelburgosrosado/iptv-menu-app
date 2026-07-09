import * as React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { UploadCloud, Link, FileText, Check, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { parseM3U } from '../utils/m3uParser';
import { authStore } from '../authStore';
import { fetchWithAuth, uploadFileToSignedUrl } from '../lib/apiClient';

export default function DesktopM3uUpload() {
  const { playlistUrl, setPlaylistUrl, loadPlaylist, channels } = usePlayerStore();
  const [urlInput, setUrlInput] = React.useState(playlistUrl);
  const [dragActive, setDragActive] = React.useState(false);
  const [localStatus, setLocalStatus] = React.useState<{ type: 'success' | 'error' | 'loading' | null; message: string }>({ type: null, message: '' });

  // Handle preset clicks
  const handlePresetSync = (url: string) => {
    setUrlInput(url);
    setPlaylistUrl(url);
    loadPlaylist(url);
  };

  const handleUrlSync = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setPlaylistUrl(urlInput);
    loadPlaylist(urlInput);
  };

  // Drag and Drop implementation
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const parseM3uText = (text: string) => {
    try {
      setLocalStatus({ type: 'loading', message: 'Parsing offline stream lines...' });
      
      const parsed = parseM3U(text);
      if (parsed.length === 0) {
        setLocalStatus({ type: 'error', message: 'M3U format invalid or empty.' });
        return;
      }

      // Update Zustand store immediately with parsed local file channels
      const uniqueGroups = Array.from(new Set(parsed.map((c) => c.group))).sort();
      usePlayerStore.setState({
        channels: parsed,
        groups: uniqueGroups,
        isLoading: false,
        parseProgress: 100,
        error: null,
        playlistUrl: 'uploaded-local-file.m3u'
      });

      setLocalStatus({
        type: 'success',
        message: `Successfully loaded ${parsed.length} channels locally with ${uniqueGroups.length} groups!`
      });
    } catch (err: any) {
      setLocalStatus({ type: 'error', message: `Parse failure: ${err.message || err}` });
    }
  };

  const processFileUpload = async (file: File) => {
    try {
      const { isLoggedIn, isPremium } = authStore.getState();
      
      if (!isLoggedIn) {
        setLocalStatus({ type: 'error', message: 'You must be signed in to upload a playlist.' });
        return;
      }
      
      if (!isPremium) {
        setLocalStatus({ type: 'error', message: 'Premium is required to sync custom M3U files to the Cloud.' });
        return;
      }

      setLocalStatus({ type: 'loading', message: 'Generating secure upload URL...' });

      // 1. Create Playlist Record in DB and get Upload URL
      const { playlist, uploadUrl } = await fetchWithAuth('/api/playlists', {
        method: 'POST',
        body: JSON.stringify({
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          sourceType: 'upload',
          originalFileName: file.name
        })
      });

      // 2. Upload file directly to GCS using the signed URL
      setLocalStatus({ type: 'loading', message: `Uploading ${file.name} to Cloud Storage...` });
      await uploadFileToSignedUrl(uploadUrl, file);

      // 3. Dispatch Parse Job
      setLocalStatus({ type: 'loading', message: 'Dispatching parsing job to async workers...' });
      const { runId } = await fetchWithAuth(`/api/playlists/${playlist.playlistId}/parse`, {
        method: 'POST'
      });

      setLocalStatus({ 
        type: 'success', 
        message: `Playlist uploaded successfully! Job ID: ${runId}. It will appear in your channels once processed.`
      });

    } catch (err: any) {
      setLocalStatus({ type: 'error', message: `Upload failed: ${err.message}` });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Upload Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <UploadCloud className="w-6 h-6 text-blue-500" />
          Synchronize IPTV Playlists
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Import playlists from web feeds or drag-and-drop local .m3u files directly. Fast parsing engine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Box: Network URL (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <form onSubmit={handleUrlSync} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Link className="w-4 h-4 text-blue-500" />
              Web M3U Playlist Feed URL
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/playlist.m3u"
                className="flex-1 px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500/50 placeholder-zinc-500 transition-all font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/15 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sync
              </button>
            </div>

            <p className="text-[11px] text-zinc-500 leading-normal">
              Enter any M3U or HLS playlist URL. Ensure the stream provider has configured CORS permissions, or use our pre-vetted fallbacks.
            </p>
          </form>

          {/* Preset templates list */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-3">
              <Layers className="w-4 h-4 text-blue-500" />
              Pre-Vetted Public Playlist Presets
            </h3>
            
            <div className="flex flex-col gap-2">
              {[
                { name: "Global Free Streams (Standby Fallback Feed)", url: "https://iptv-org.github.io/iptv/countries/us.m3u", desc: "Stable world news, science networks, lofi background and entertainment feeds." },
                { name: "Latin America Broadcast Streams", url: "https://iptv-org.github.io/iptv/regions/latam.m3u", desc: "Live regional entertainment, broadcasts, news, and sports schedules." },
                { name: "European Unified Free Feeds", url: "https://iptv-org.github.io/iptv/regions/eur.m3u", desc: "A collection of free regional broadcasts, news streams, and cultural feeds." }
              ].map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetSync(preset.url)}
                  className="w-full text-left p-3 rounded-xl bg-white/2 hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all flex flex-col gap-1"
                >
                  <span className="text-xs font-bold text-blue-400 leading-none">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {preset.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Box: File Upload Dropzone (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-[2px] border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all min-h-[220px] relative overflow-hidden cursor-pointer ${
              dragActive
                ? 'border-blue-500 bg-blue-500/5'
                : 'border-white/15 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/30'
            }`}
          >
            {/* Native file input wrapper */}
            <input
              type="file"
              accept=".m3u,.txt"
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />

            <FileText className="w-12 h-12 text-zinc-500 mb-3 animate-pulse" />
            <h4 className="text-xs font-bold text-white">Drag & Drop M3U File</h4>
            <p className="text-[11px] text-zinc-500 max-w-xs mt-1.5 leading-relaxed font-medium">
              Drop your custom <code>.m3u</code> or <code>.txt</code> list here, or click to browse files.
            </p>
          </div>

          {/* Local Status Alert */}
          {localStatus.type && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                localStatus.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : localStatus.type === 'error'
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}
            >
              {localStatus.type === 'success' ? (
                <Check className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <div className="font-semibold">
                {localStatus.message}
                {localStatus.type === 'success' && (
                  <span className="block text-[10px] text-zinc-400 mt-1">
                    Your desktop feed is now live. Switch to <strong>Channels</strong> view to query results.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Active stats */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
              Active Buffer Stats
            </span>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-zinc-400 font-medium">Loaded Channels:</span>
              <strong className="text-white">{channels.length}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-medium">Parser Engine:</span>
              <strong className="text-blue-400">Regular Expressions</strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
