# Jitsi Microservice

Microservice Node.js/Express exposant une API REST pour créer et gérer des sessions de visioconférence Jitsi.

## Features

- 🔀 **Switch dynamique** entre instance publique (`meet.jit.si`) et instance privée (Hostinger)
- 🔐 **JWT tokens** pour les instances privées (authentification Jitsi)
- 🚀 **REST API** : création de room, récupération de config, health check
- 🐳 **Docker ready** pour déploiement Bolt
- ⚙️ **Config via `.env`** — aucun rebuild nécessaire pour switcher d'instance

## Architecture

```
jitsi-microservice/
├── src/
│   ├── server.js          # Entry point Express
│   ├── routes/
│   │   └── jitsi.routes.js
│   ├── services/
│   │   └── jitsi.service.js  # Logique public/private
│   └── middlewares/
│       └── auth.middleware.js
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Quick Start (local)

```bash
cp .env.example .env
# Éditer .env selon votre config
npm install
npm run dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/jitsi/config` | Config active (public/private) |
| POST | `/api/jitsi/room` | Créer/rejoindre une room |
| GET | `/api/jitsi/room/:roomId` | Infos d'une room |

## Switch public ↔ privé

Dans `.env` :
```
JITSI_MODE=public    # ou private
```

Ou via API :
```bash
curl -X POST http://localhost:3000/api/jitsi/switch -d '{"mode":"private"}'
```

## Déploiement Bolt

Voir `bolt.json` pour la configuration du projet Bolt.
