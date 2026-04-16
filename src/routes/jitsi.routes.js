'use strict';

const express    = require('express');
const router     = express.Router();
const jitsiSvc   = require('../services/jitsi.service');
const { auth, adminAuth } = require('../middlewares/auth.middleware');

// GET /api/jitsi/config â€” config du mode actif (public)
router.get('/config', (req, res) => {
  try {
    res.json({ success: true, data: jitsiSvc.getConfig() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/jitsi/room â€” crÃ©er une room
router.post('/room', auth, (req, res) => {
  try {
    const { roomName, user, role } = req.body;
    if (!roomName) return res.status(400).json({ success: false, error: 'roomName requis' });
    if (!user || !user.name) return res.status(400).json({ success: false, error: 'user.name requis' });

    const data = jitsiSvc.createRoom(roomName, user, role);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/jitsi/room/:id â€” infos d'une room
router.get('/room/:id', auth, (req, res) => {
  try {
    const roomName = req.params.id;
    const user     = { name: req.query.name || 'Guest', email: req.query.email };
    const role     = req.query.role || 'participant';
    const data     = jitsiSvc.createRoom(roomName, user, role);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/jitsi/switch â€” switch de mode Ã  chaud (admin uniquement)
router.post('/switch', adminAuth, (req, res) => {
  const { mode } = req.body;
  const validModes = ['public', 'jaas', 'private'];

  if (!validModes.includes(mode)) {
    return res.status(400).json({
      success: false,
      error: `Mode invalide. Valeurs acceptÃ©es : ${validModes.join(' | ')}`
    });
  }

  // Valider les variables requises AVANT de switcher
  const missing = [];
  if (mode === 'jaas') {
    if (!process.env.JAAS_APP_ID)      missing.push('JAAS_APP_ID');
    if (!process.env.JAAS_PRIVATE_KEY) missing.push('JAAS_PRIVATE_KEY');
    if (!process.env.JAAS_API_KEY_ID)  missing.push('JAAS_API_KEY_ID');
  }
  if (mode === 'private') {
    if (!process.env.JITSI_PRIVATE_URL) missing.push('JITSI_PRIVATE_URL');
    if (!process.env.JITSI_APP_SECRET)  missing.push('JITSI_APP_SECRET');
    if (!process.env.JITSI_APP_ID)      missing.push('JITSI_APP_ID');
  }

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      error:   `Variables manquantes pour le mode "${mode}" : ${missing.join(', ')}`
    });
  }

  const previousMode       = process.env.JITSI_MODE || 'public';
  process.env.JITSI_MODE   = mode;
  console.log(`[jitsi-ms] Switch mode : ${previousMode} â†’ ${mode}`);

  res.json({
    success: true,
    data: {
      previousMode,
      currentMode: mode,
      switchedAt:  new Date().toISOString()
    }
  });
});

module.exports = router;
