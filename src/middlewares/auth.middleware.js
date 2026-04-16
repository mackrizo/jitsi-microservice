'use strict';

/**
 * auth      â€” protÃ¨ge les endpoints mÃ©tier (X-API-Key)
 * adminAuth â€” protÃ¨ge /switch (mÃªme clÃ© pour l'instant, extensible)
 */

const auth = (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.API_KEY) {
    return res.status(401).json({ success: false, error: 'API key invalide ou manquante' });
  }
  next();
};

const adminAuth = (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.API_KEY) {
    return res.status(401).json({ success: false, error: 'API key invalide ou manquante' });
  }
  next();
};

module.exports = { auth, adminAuth };
