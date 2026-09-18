const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Import WelcomeDashboard
code = code.replace(
  "import MarketingHero from './components/MarketingHero';",
  "import MarketingHero from './components/MarketingHero';\nimport WelcomeDashboard from './components/WelcomeDashboard';"
);

// Update activeMenu initialization
code = code.replace(
  "const [activeMenu, setActiveMenu] = React.useState<string>('channels');",
  "const [activeMenu, setActiveMenu] = React.useState<string>('welcome');"
);

// Group SIDEBAR_ITEMS
const sidebarItemsCode = `
  const SIDEBAR_CATEGORIES = [
    {
      title: 'STREAMING',
      items: [
        { id: 'channels', label: 'Live Channels', icon: Tv },
        { id: 'multiscreen', label: 'Quad Multi-Screen', icon: LayoutGrid },
        { id: 'epg', label: 'EPG Program Guide', icon: CalendarRange },
        { id: 'favorites', label: 'Favorites & History', icon: Heart },
      ]
    },
    {
      title: 'SOURCES & CONFIG',
      items: [
        { id: 'upload', label: 'Feeds, Proxies & Settings', icon: UploadCloud },
        { id: 'xtream', label: 'Xtream / Stalker', icon: Server },
      ]
    },
    {
      title: 'DEVELOPER SUITE',
      items: [
        { id: 'apk_builder', label: 'APK App Builder', icon: Sparkles },
        { id: 'remote_apps', label: 'Remote OTA Apps', icon: Radio },
        { id: 'devices', label: 'Certified Devices', icon: ShieldCheck },
      ]
    },
    {
      title: 'ACCOUNT',
      items: [
        { id: 'premium', label: 'Plans & Billing', icon: Crown },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    }
  ];
`;

code = code.replace(
  /const SIDEBAR_ITEMS = \[[\s\S]*?\];\s*/,
  sidebarItemsCode
);

// Add 'welcome' case to renderActiveSection
code = code.replace(
  "switch (activeMenu) {",
  `switch (activeMenu) {
      case 'welcome':
        return (
          <WelcomeDashboard
            onBrowseChannels={() => setActiveMenu('channels')}
            onLaunchSimulator={() => setActiveMenu('channels')}
            onUploadM3u={() => setActiveMenu('upload')}
            onViewPricing={() => {
              document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            onSelectFree={() => setActiveMenu('channels')}
            onSelectPro={() => {
              if (!auth.isLoggedIn) setIsAuthModalOpen(true);
              else setActiveMenu('premium');
            }}
            onSelectBuilder={() => {
              if (!auth.isLoggedIn) setIsAuthModalOpen(true);
              else setActiveMenu('premium');
            }}
          />
        );`
);

// Remove standalone MarketingHero and PricingSection
code = code.replace(
  /\{\/\* Marketing Landing Hero Section \*\/\}[\s\S]*?\{\/\* Inner Content row enclosing Sidebar Navigation & Workspace Grid \*\/\}/,
  "{/* Inner Content row enclosing Sidebar Navigation & Workspace Grid */}"
);

// Update Desktop Sidebar rendering to use categories
const desktopSidebarRender = `
          <nav className="flex-1 w-full flex flex-col gap-6 px-3 overflow-y-auto no-scrollbar pb-6 mt-4">
            {SIDEBAR_CATEGORIES.map((category, catIdx) => (
              <div key={catIdx} className="flex flex-col gap-2 w-full">
                {/* Category Header (visible on hover or expanded if we had a wide sidebar, but since it's 20px wide, maybe we just show a subtle divider) */}
                <div className="w-full flex justify-center pb-2 border-b border-white/5 mb-1">
                   <div className="w-8 h-1 bg-white/10 rounded-full" />
                </div>
                {category.items.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeMenu === item.id;
                  return (
                    <div key={item.id} className="relative group flex items-center justify-center w-full">
                      {/* Glowing left indicator bar */}
                      {isActive && (
                        <div 
                          className="absolute left-0 w-1 h-8 rounded-r-full transition-all duration-300"
                          style={{ 
                            boxShadow: 'inset 3px 0 0 var(--accent-blue)', 
                            background: 'var(--accent-blue)' 
                          }} 
                        />
                      )}
    
                      <button
                        onClick={() => setActiveMenu(item.id)}
                        tabIndex={0}
                        aria-label={item.label}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setActiveMenu(item.id);
                          }
                        }}
                        className={\`p-3 rounded-2xl transition-all duration-300 relative flex items-center justify-center outline-none cursor-pointer border \${
                          isActive
                            ? 'text-white border-blue-500/40 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.25)]'
                            : 'text-zinc-500 hover:text-zinc-200 border-transparent bg-transparent hover:bg-white/5'
                        }\`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </button>
    
                      {/* Glassmorphism tooltip with label on hover */}
                      <div className="absolute left-full ml-4 px-3 py-1.5 bg-black/65 backdrop-blur-md text-[11px] font-bold text-white rounded-xl border border-white/10 opacity-0 translate-x-[-10px] pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-50 shadow-2xl whitespace-nowrap flex flex-col">
                        <span className="text-[8px] text-zinc-400 uppercase tracking-wider mb-0.5">{category.title}</span>
                        <span>{item.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            
            {/* System Admin items if admin */}
            {auth.role === 'admin' && (
               <div className="flex flex-col gap-2 w-full mt-4">
                <div className="w-full flex justify-center pb-2 border-b border-white/5 mb-1">
                   <div className="w-8 h-1 bg-white/10 rounded-full" />
                </div>
                {[
                  { id: 'system_admin', label: 'Platform Admin', icon: ShieldAlert },
                  { id: 'home', label: 'Code Explorer', icon: Home },
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeMenu === item.id;
                  return (
                    <div key={item.id} className="relative group flex items-center justify-center w-full">
                      {isActive && (
                        <div 
                          className="absolute left-0 w-1 h-8 rounded-r-full transition-all duration-300"
                          style={{ 
                            boxShadow: 'inset 3px 0 0 var(--accent-blue)', 
                            background: 'var(--accent-blue)' 
                          }} 
                        />
                      )}
                      <button
                        onClick={() => setActiveMenu(item.id)}
                        className={\`p-3 rounded-2xl transition-all duration-300 relative flex items-center justify-center outline-none cursor-pointer border \${
                          isActive
                            ? 'text-white border-blue-500/40 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.25)]'
                            : 'text-zinc-500 hover:text-zinc-200 border-transparent bg-transparent hover:bg-white/5'
                        }\`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </button>
                      <div className="absolute left-full ml-4 px-3 py-1.5 bg-black/65 backdrop-blur-md text-[11px] font-bold text-white rounded-xl border border-white/10 opacity-0 translate-x-[-10px] pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-50 shadow-2xl whitespace-nowrap flex flex-col">
                        <span className="text-[8px] text-zinc-400 uppercase tracking-wider mb-0.5">ADMIN</span>
                        <span>{item.label}</span>
                      </div>
                    </div>
                  );
                })}
               </div>
            )}
          </nav>
`;

code = code.replace(
  /<nav className="flex-1 w-full flex flex-col gap-1 px-3 overflow-y-auto no-scrollbar pb-6 mt-4">[\s\S]*?<\/nav>/,
  desktopSidebarRender
);


fs.writeFileSync('src/App.tsx', code);
