# Guide d'intégration — Visiodoc → Jitsi Microservice

## 1. Appel depuis Visiodoc (Bolt to Bolt)

Dans votre app Visiodoc, récupérez l'URL interne du microservice depuis la config Bolt.

### Exemple (Angular / fetch)

```typescript
// jitsi.service.ts dans Visiodoc
export class VideoCallService {
  private msUrl = environment.jitsiMsUrl; // ex: https://jitsi-ms.bolt.internal
  private apiKey = environment.jitsiApiKey;

  async createRoom(options: {
    roomName?: string;
    user: { name: string; email: string };
    role?: 'moderator' | 'participant';
  }) {
    const res = await fetch(`${this.msUrl}/api/jitsi/room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify(options),
    });
    return res.json();
  }

  async getConfig() {
    const res = await fetch(`${this.msUrl}/api/jitsi/config`);
    return res.json();
  }
}
```

### Exemple (intégration iFrame Jitsi)

```html
<!-- Dans votre composant Angular -->
<div id="jitsi-container" [style.height.px]="600"></div>
```

```typescript
const { data } = await this.videoCallService.createRoom({
  roomName: `consultation-${appointmentId}`,
  user: { name: currentUser.name, email: currentUser.email },
  role: currentUser.isDoctor ? 'moderator' : 'participant',
});

const api = new JitsiMeetExternalAPI(domain, {
  roomName: data.roomName,
  parentNode: document.querySelector('#jitsi-container'),
  jwt: data.jwt, // null en mode public
  configOverwrite: data.embedConfig.configOverwrite,
  interfaceConfigOverwrite: data.embedConfig.interfaceConfigOverwrite,
});
```

## 2. Switch dynamique public ↔ privé

```bash
# Via cURL (admin uniquement)
curl -X POST https://jitsi-ms.yourdomain.com/api/jitsi/switch \
  -H 'X-API-Key: your-internal-api-key' \
  -H 'Content-Type: application/json' \
  -d '{"mode": "private"}'
```

## 3. Configuration Hostinger (instance privée)

### Prérequis
- Jitsi installé sur votre VPS Hostinger
- Plugin prosody `token` activé dans `/etc/prosody/conf.d/jitsi.cfg.lua`

### config.js (Jitsi)
```javascript
var config = {
  hosts: {
    domain: 'jitsi.yourdomain.com',
    muc: 'conference.jitsi.yourdomain.com',
  },
  enableUserRolesBasedOnToken: true,
};
```

### prosody token config
```lua
VirtualHost "jitsi.yourdomain.com"
  authentication = "token"
  app_id = "visiodoc"       -- = JITSI_APP_ID
  app_secret = "your-secret" -- = JITSI_APP_SECRET
  allow_empty_token = false
```

## 4. Déploiement Bolt

1. Créer un projet Bolt pointant sur `mackrizo/jitsi-microservice`
2. Configurer les variables d'env (voir `bolt.json`)
3. Dans Visiodoc Bolt, référencer le service via son URL interne
4. Le Bolt-to-Bolt expose le service sur le réseau interne sans passer par internet
