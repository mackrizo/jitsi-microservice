const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

/**
 * JitsiService
 * Gère la logique de génération de room URL et JWT
 * selon le mode actif (public | private).
 *
 * Mode public  : meet.jit.si, aucun JWT requis
 * Mode private : instance Hostinger, JWT signé requis
 */
class JitsiService {
  constructor() {
    // Mode actif - peut être surchargé à chaud via switchMode()
    this._mode = process.env.JITSI_MODE || 'public';
  }

  get mode() {
    return this._mode;
  }

  switchMode(newMode) {
    if (!['public', 'private'].includes(newMode)) {
      throw new Error(`Invalid mode: ${newMode}. Must be 'public' or 'private'.`);
    }
    this._mode = newMode;
    console.log(`[JitsiService] Mode switched to: ${newMode}`);
  }

  /**
   * Retourne la config active pour le frontend
   */
  getConfig() {
    const baseUrl = this._getBaseUrl();
    return {
      mode: this._mode,
      baseUrl,
      requiresJwt: this._mode === 'private',
      appId: this._mode === 'private' ? process.env.JITSI_APP_ID : null,
    };
  }

  /**
   * Crée ou rejoint une room Jitsi
   * @param {Object} options
   * @param {string} options.roomName   - Nom de la salle (auto-généré si absent)
   * @param {Object} options.user       - { name, email, avatar }
   * @param {string} options.role       - 'moderator' | 'participant'
   * @param {number} options.ttl        - Durée JWT en secondes (optionnel)
   * @returns {Object} roomData
   */
  createRoom({ roomName, user = {}, role = 'participant', ttl } = {}) {
    const sanitizedRoom = this._sanitizeRoomName(roomName || this._generateRoomName());
    const baseUrl = this._getBaseUrl();

    const result = {
      roomName: sanitizedRoom,
      roomUrl: `${baseUrl}/${sanitizedRoom}`,
      mode: this._mode,
      createdAt: new Date().toISOString(),
    };

    if (this._mode === 'private') {
      const token = this._generateJwt({ roomName: sanitizedRoom, user, role, ttl });
      result.jwt = token;
      result.roomUrl = `${baseUrl}/${sanitizedRoom}?jwt=${token}`;
    }

    return result;
  }

  /**
   * Retourne les infos d'une room existante (embed config)
   */
  getRoomInfo(roomId) {
    const baseUrl = this._getBaseUrl();
    return {
      roomId,
      roomUrl: `${baseUrl}/${roomId}`,
      mode: this._mode,
      embedConfig: this._getEmbedConfig(roomId),
    };
  }

  // ── Private Helpers ───────────────────────────────────────────────

  _getBaseUrl() {
    return this._mode === 'private'
      ? (process.env.JITSI_PRIVATE_URL || 'https://jitsi.yourdomain.com')
      : (process.env.JITSI_PUBLIC_URL || 'https://meet.jit.si');
  }

  _generateRoomName() {
    // Format: visiodoc-xxxx-xxxx
    const short = uuidv4().split('-').slice(0, 2).join('-');
    return `visiodoc-${short}`;
  }

  _sanitizeRoomName(name) {
    // Jitsi room names: alphanumeric + hyphens, no spaces
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 64);
  }

  /**
   * Génère un JWT signé pour l'instance privée
   * Compatible avec le plugin prosody token de Jitsi
   */
  _generateJwt({ roomName, user, role, ttl }) {
    const secret = process.env.JITSI_APP_SECRET;
    const appId = process.env.JITSI_APP_ID;
    const expiresIn = ttl || parseInt(process.env.JITSI_JWT_TTL, 10) || 3600;

    if (!secret || !appId) {
      throw new Error(
        'JITSI_APP_SECRET and JITSI_APP_ID must be set for private mode'
      );
    }

    const payload = {
      context: {
        user: {
          name: user.name || 'Guest',
          email: user.email || '',
          avatar: user.avatar || '',
          affiliation: role === 'moderator' ? 'owner' : 'member',
        },
        features: {
          livestreaming: false,
          recording: role === 'moderator',
          transcription: false,
          'outbound-call': false,
        },
      },
      aud: appId,
      iss: appId,
      sub: new URL(process.env.JITSI_PRIVATE_URL).hostname,
      room: roomName,
      moderator: role === 'moderator',
    };

    return jwt.sign(payload, secret, {
      expiresIn,
      algorithm: 'HS256',
    });
  }

  /**
   * Config pour l'intégration via Jitsi iFrame API
   */
  _getEmbedConfig(roomName) {
    return {
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: false,
        prejoinPageEnabled: true,
        disableDeepLinking: true,
        toolbarButtons: [
          'microphone', 'camera', 'desktop', 'hangup',
          'chat', 'raisehand', 'tileview', 'settings',
        ],
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        MOBILE_APP_PROMO: false,
      },
    };
  }
}

// Singleton
module.exports = new JitsiService();
