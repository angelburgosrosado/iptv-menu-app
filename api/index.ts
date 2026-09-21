let appInstance: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!appInstance) {
      let mod: any;
      try {
        mod = await import('../apps/api/src/server');
      } catch (e1) {
        try {
          mod = await import('../apps/api/dist/server.js');
        } catch (e2) {
          mod = await import('../apps/api/dist/server');
        }
      }
      appInstance = mod.default || mod.app || mod;
    }
    return appInstance(req, res);
  } catch (err: any) {
    return res.status(500).json({
      error: 'API Serverless Invocation Error',
      message: err?.message || String(err),
      stack: err?.stack || null
    });
  }
}


