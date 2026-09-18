const fs = require('fs');
const file = 'src/components/DesktopM3uUpload.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}`;

const insertion = `
            {/* Global Settings Block (TMDB) */}
            <div className="mt-8 bg-zinc-900/50 border border-white/5 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-500" />
                Global App Settings
              </h3>
              <p className="text-xs text-zinc-400 mb-4">Configure global integrations and metadata services.</p>
              
              <div className="max-w-md">
                <label className="text-[11px] text-zinc-400 font-bold block mb-1">TMDB API Key (Metadata Enrichment)</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={localTmdbKey}
                    onChange={(e) => setLocalTmdbKey(e.target.value)}
                    placeholder="TMDB Read Access Token or API Key"
                    className="flex-1 px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs text-white font-mono outline-none focus:border-cyan-500/50"
                  />
                  <button
                    onClick={() => {
                      setTmdbApiKey(localTmdbKey);
                      setLocalStatus({ type: 'success', message: 'TMDB key updated successfully' });
                      setTimeout(() => setLocalStatus({ type: null, message: '' }), 3000);
                    }}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer"
                  >
                    Save
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Used to fetch rich posters, plots, and ratings for Movies and Series.</p>
              </div>
            </div>`;

if(content.includes(target)) {
  content = content.replace(target, target + insertion);
  fs.writeFileSync(file, content);
  console.log("Updated!");
} else {
  console.log("Target not found!");
}
