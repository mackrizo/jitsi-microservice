'use strict';

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * JitsiService â€” abstraction des 3 modes de fonctionnement
 *
 * Modes :
 *   public  â†’ meet.jit.si, gratuit, sans JWT (dev + dÃ©marrage prod)
 *   jaas    â†’ 8x8 JaaS, JWT RS256, pay-per-MAU (croissance maÃ®trisÃ©e)
 *   private â†’ instance Hetzner auto-hÃ©bergÃ©e, JWT HS256 (contrÃ´le total)
 *
 * Un seul mode est actif Ã  la fois, contrÃ´lÃ© par process.env.JITSI_MODE.
 * Le switch se fait Ã  chaud via POST /api/jitsi/switch sans redÃ©ploiement.
 */
class JitsiService {

  // â”€â”€ Base URL selon le mode actif â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  _getBaseUrl() {
    switch (process.env.JITSI_MODE) {
      case 'jaas':
        return `https://8x8.vc/${process.env.JAAS_APP_ID}`;
      case 'private': {
        const url = process.env.JITSI_PRIVATE_URL;
        if (!url) throw new Error('[jitsi-ms] JITSI_PRIVATE_URL est requis en mode private');
        return url;
      }
      default:
        return process.env.JITSI_PUBLIC_URL || 'https://meet.jit.si';
    }
  }

  // â”€â”€ GÃ©nÃ©ration JWT selon le mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  _generateJwt(roomName, user, role) {
    const mode        = process.env.JITSI_MODE || 'public';
    const isModerator = role === 'moderator';

    if (mode === 'public') return null;

    // â”€â”€ Mode JaaS : RS256, format 8x8 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (mode === 'jaas') {
      const appId      = process.env.JAAS_APP_ID;
      const privateKey = process.env.JAAS_PRIVATE_KEY;
      const apiKeyId   = process.env.JAAS_API_KEY_ID;

      if (!appId || !privateKey || !apiKeyId) {
        throw new Error(
          '[jitsi-ms] JAAS_APP_ID, JAAS_PRIVATE_KEY et JAAS_API_KEY_ID sont requis en mode jaas'
        );
      }

      return jwt.sign(
        {
          aud: 'jitsi',
          iss: 'chat',
          sub: appId,
          room: roomName,
          context: {
            user: {
              id:        user.email || crypto.randomUUID(),
              name:      user.name,
              email:     user.email     || '',
              avatar:    user.avatar    || '',
              moderator: isModerator
            },
            features: {
              recording:       isModerator,
              livestreaming:   false,
              'screen-sharing': true,
              'outbound-call':  false
            }
          }
        },
        privateKey,
        {
          algorithm:  'RS256',
          expiresIn:  parseInt(process.env.JITSI_JWT_TTL) || 3600,
          header: {
            kid: `vpaas-magic-cookie-${appId}/${apiKeyId}`,
            alg: 'RS256'
          }
        }
      );
    }

    // â”€â”€ Mode private : HS256, instance Hetzner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (mode === 'private') {
      const secret = process.env.JITSI_APP_SECRET;
      const appId  = process.env.JITSI_APP_ID;
      const sub    = new URL(process.env.JITSI_PRIVATE_URL).hostname;

      if (!secret || !appId) {
        throw new Error(
          '[jitsi-ms] JITSI_APP_SECRET et JITSI_APP_ID sont requis en mode private'
        );
      }

      return jwt.sign(
        {
          sub,
          room: roomName,
          context: {
            user: {
              name:      user.name,
              email:     user.email || '',
              moderator: isModerator
            },
            features: {
              recording:       isModerator,
              'screen-sharing': true
            }
          }
        },
        secret,
        {
          algorithm: 'HS256',
          issuer:    appId,
          expiresIn: parseInt(process.env.JITSI_JWT_TTL) || 3600
        }
      );
    }

    throw new Error(
      `[jitsi-ms] JITSI_MODE invalide : "${mode}". Valeurs acceptÃ©es : public | jaas | private`
    );
  }

  // â”€â”€ Config iFrame Jitsi External API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  _getEmbedConfig(mode, baseUrl) {
    const hostname = new URL(baseUrl).hostname;
    const domain   = mode === 'jaas'
      ? `${hostname}/${process.env.JAAS_APP_ID}`
      : hostname;

    return {
      domain,
      configOverwrite: {
        startWithAudioMuted:    false,
        startWithVideoMuted:    false,
        disableDeepLinking:     true,
        enableNoisyMicDetection: true
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: mode === 'public',
        SHOW_BRAND_WATERMARK: false,
        TOOLBAR_BUTTONS: ['microphone','camera','desktop','chat','tileview','hangup']
      }
    };
  }

  // â”€â”€ CrÃ©ation d'une room â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  createRoom(roomName, user, role = 'participant') {
    if (!roomName || typeof roomName !== 'string') {
      throw new Error('[jitsi-ms] roomName est requis et doit Ãªtre une chaÃ®ne');
    }

    const mode    = process.env.JITSI_MODE || 'public';
    const baseUrl = this._getBaseUrl();
    const token   = this._generateJwt(roomName, user, role);

    const roomUrl = mode === 'jaas'
      ? `${baseUrl}/${roomName}${token ? `?jwt=${token}` : ''}`
      : `${baseUrl}/${roomName}`;

    return {
      roomName,
      roomUrl,
      mode,
      jwt:          token   || undefined,
      requiresJwt:  !!token,
      embedConfig:  this._getEmbedConfig(mode, baseUrl),
      createdAt:    new Date().toISOString()
    };
  }

  // â”€â”€ Config active (GET /api/jitsi/config) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  getConfig() {
    const mode = process.env.JITSI_MODE || 'public';
    return {
      mode,
      baseUrl:      this._getBaseUrl(),
      requiresJwt:  mode !== 'public',
      jwtAlgorithm: mode === 'jaas' ? 'RS256' : mode === 'private' ? 'HS256' : null
    };
  }
}

module.exports = new JitsiService();
