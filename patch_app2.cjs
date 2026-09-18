const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const SIDEBAR_CATEGORIES = [",
  `const SIDEBAR_ITEMS = [
    { id: 'channels', label: 'Live Channels', icon: Tv },
    { id: 'multiscreen', label: 'Quad Multi-Screen', icon: LayoutGrid },
    { id: 'epg', label: 'EPG Program Guide', icon: CalendarRange },
    { id: 'favorites', label: 'Favorites & History', icon: Heart },
    { id: 'upload', label: 'Feeds, Proxies & Settings', icon: UploadCloud },
    { id: 'apk_builder', label: 'APK App Builder', icon: Sparkles },
    { id: 'remote_apps', label: 'Remote OTA Apps', icon: Radio },
    { id: 'xtream', label: 'Xtream / Stalker', icon: Server },
    { id: 'devices', label: 'Certified Devices', icon: ShieldCheck },
    { id: 'premium', label: 'Plans & Billing', icon: Crown },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];
  
  const SIDEBAR_CATEGORIES = [`
);

fs.writeFileSync('src/App.tsx', code);
