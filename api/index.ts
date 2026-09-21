import type { Request, Response } from 'express';

let app: any;

try {
  // Prefer the pre-compiled server output from `npm run build`
  const mod = require('../apps/api/dist/server');
  app = mod.default || mod.app || mod;
} catch (distErr: any) {
  try {
    const mod = require('../apps/api/src/server');
    app = mod.default || mod.app || mod;
  } catch (srcErr: any) {
    console.error('Failed to load server module:', { distErr: distErr?.message, srcErr: srcErr?.message });
  }
}

export default function handler(req: Request, res: Response) {
  if (!app) {
    return res.status(500).json({
      error: 'API server module failed to initialize',
      timestamp: new Date().toISOString()
    });
  }
  return app(req, res);
}

