/**
 * API Key middleware
 * Vérifie le header X-API-Key ou le bearer token
 * Désactivé si API_KEY n'est pas défini (dev local)
 */
const apiKeyAuth = (req, res, next) => {
  const apiKey = process.env.API_KEY;

  // Si pas de clé configurée, on laisse passer (dev mode)
  if (!apiKey) {
    console.warn('[Auth] No API_KEY set — running in open mode (dev only)');
    return next();
  }

  const header = req.headers['x-api-key'] || extractBearer(req);

  if (!header || header !== apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized — invalid or missing API key',
    });
  }

  next();
};

function extractBearer(req) {
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) {
    return auth.substring(7);
  }
  return null;
}

module.exports = { apiKeyAuth };
