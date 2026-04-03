const express = require('express');
const router = express.Router();
const jitsiService = require('../services/jitsi.service');
const { apiKeyAuth } = require('../middlewares/auth.middleware');

/**
 * GET /api/jitsi/config
 * Retourne la configuration active du service Jitsi
 */
router.get('/config', (req, res) => {
  try {
    const config = jitsiService.getConfig();
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/jitsi/room
 * Crée une nouvelle room Jitsi
 * Body: { roomName?, user?, role?, ttl? }
 */
router.post('/room', apiKeyAuth, (req, res) => {
  try {
    const { roomName, user, role, ttl } = req.body;
    const roomData = jitsiService.createRoom({ roomName, user, role, ttl });
    res.status(201).json({ success: true, data: roomData });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/jitsi/room/:roomId
 * Récupère les infos d'une room (embed config incluse)
 */
router.get('/room/:roomId', apiKeyAuth, (req, res) => {
  try {
    const { roomId } = req.params;
    const roomInfo = jitsiService.getRoomInfo(roomId);
    res.json({ success: true, data: roomInfo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/jitsi/switch
 * Bascule entre mode public et privé à chaud
 * Body: { mode: 'public' | 'private' }
 * ⚠️ En production: protéger cette route par rôle admin
 */
router.post('/switch', apiKeyAuth, (req, res) => {
  try {
    const { mode } = req.body;
    jitsiService.switchMode(mode);
    res.json({
      success: true,
      message: `Switched to ${mode} mode`,
      data: jitsiService.getConfig(),
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
