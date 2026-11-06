# 🐨 Betonproeverij: Gangster Koala Parkour

Een snelle, humoristische 3D browsergame in comic-stijl gebouwd met Three.js en cel-shading visuals.

## 🕶️ Het Verhaal & Gameplay
Jij bent **Kees de Koala**, gewapend met een zonnebril en een gouden ketting. Je bent ontsnapt in het betonnen stadspark en zoekt een weg over daken, bomen en rotsformaties naar de top van de **Gouden Eucalyptustoren**!

### 🎮 Besturing & Mechanieken
- **WASD / Pijltjestoetsen**: Lopen en manoeuvreren
- **Muis (Pointer Lock)**: 3rd person rondkijken
- **Spatie**: Springen & Tree-to-tree leaps
- **Shift**: Sprinten
- **Bomen beklimmen**: Loop tegen een boomstam om omhoog te klimmen. Druk bovenin op Spatie om naar een andere boom of rots te springen!
- **Struiken (Stealth)**: Loop door bosjes om jezelf te verbergen voor patrouilles.
- **Eetkramen (Snacks)**: Jat een snack voor een tijdelijke **Sugar Rush** (dubbele snelheid en extra sprongkracht)!
- **Vijanden**:
  - *Dierenvangers*: Patrouilleren met een groot vangnet
  - *Beveiligers / Politie*: Bewaken poorten en rotsdoorgangen
  - *Dierverzorgers*: Komen met kooien achter je aan als je niet verstopt zit in de struiken

## 🚀 Deployment naar Google Cloud Run
Deze repository is geconfigureerd met een geautomatiseerde GitHub Actions workflow (`.github/workflows/deploy.yml`) die bij elke commit op `main` automatisch een lichte Docker container bouwt en uitrolt naar Google Cloud Run.

### GitHub Secrets benodigd voor deployment:
- `GCP_PROJECT_ID`: ID van je Google Cloud project.
- `GCP_SA_KEY`: JSON service account sleutel met de rollen `Cloud Run Admin`, `Storage Admin`, and `Service Account User`.
