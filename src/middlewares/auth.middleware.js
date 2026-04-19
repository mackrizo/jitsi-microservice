'use strict';

/**
 * auth      â€” protÃ¨ge les endpoints mÃ©tier (X-API-Key)
 * adminAuth â€” protÃ¨ge /switch (mÃªme clÃ© pour l'instant, extensible)
 */

const auth = (req, res, next) => {
  const key = req.headers['x-api-key'];
  console.log("KEY reçue:", JSON.stringify(key));
  console.log("API_KEY env:", JSON.stringify(process.env.API_KEY));
  console.log("Match:", key === process.env.API_KEY);
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
console.log("API_KEY reçue:", process.env.API_KEY ? "présente" : "VIDE")
