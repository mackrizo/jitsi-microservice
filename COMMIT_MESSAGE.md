feat(jitsi-ms): support 3 modes public | jaas | private + Cloud Run

- jitsi.service.js: refactor complet avec 3 modes
  * public  : meet.jit.si, sans JWT (dev + dÃ©marrage)
  * jaas    : 8x8 JaaS, JWT RS256 (croissance)
  * private : Hetzner auto-hÃ©bergÃ©, JWT HS256 (contrÃ´le total)
- jitsi.routes.js: endpoint /switch avec validation des variables avant bascule
- auth.middleware.js: extraction du middleware dans son propre fichier
- .env.example: variables complÃ¨tes documentÃ©es pour les 3 modes (visiodoc.online)
- Dockerfile: port 8080, lit process.env.PORT pour compatibilitÃ© Cloud Run
- .dockerignore: exclusions propres
- .github/workflows/deploy-cloud-run.yml: CI/CD vers GCP europe-west1
- tests/jitsi.service.test.js: couverture Jest des 3 modes

BREAKING CHANGE: JITSI_MODE='public' par dÃ©faut si variable non dÃ©finie
