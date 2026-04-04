# Home Manager

## Panoramica
Home Manager e una webapp per la gestione delle faccende domestiche. Gli utenti creano una casa, invitano membri, definiscono attivita ricorrenti, le assegnano e tracciano i completamenti con statistiche. Disponibile come sito web (PWA) e come app Android nativa (APK).

## Piattaforme e Branch

### Web App (branch `main`)
- PWA deployata su Firebase Hosting
- Push su `main` triggera auto-deploy via GitHub Actions
- Versioning automatico: ogni deploy incrementa la patch version (1.0.0 → 1.0.1 → 1.0.2...)
- La versione e visibile nella pagina Profilo dell'app
- Notifiche via Web Notifications API (browser)

### App Android (branch `Android`)
- APK generato via Capacitor (wrappa la webapp in una shell nativa)
- Push su `Android` triggera build APK via GitHub Actions
- APK scaricabile dagli Artifacts nella tab Actions di GitHub
- Versioning automatico: versionCode incrementa ad ogni build, versionName sincronizzato da package.json
- Notifiche push native via Firebase Cloud Messaging (FCM)
- Supporta sia APK debug che release firmato

## Flusso di Lavoro
1. **Sviluppo e aggiornamenti vanno sempre su `main` prima** (webapp)
2. Le modifiche vengono portate su `Android` solo quando richiesto esplicitamente
3. Per aggiornare Android: merge da main verso Android, poi push per triggerare il build APK
4. NON fare modifiche direttamente su `Android` che non siano specifiche per la piattaforma nativa

## Tech Stack
- **Frontend**: React 19 + TypeScript (strict mode) + Vite
- **Styling**: Tailwind CSS v4 con @theme (colori oklch) + componenti shadcn/ui-style
- **Backend**: Firebase Auth (email/password), Firestore, Hosting, Cloud Messaging
- **Animazioni**: Framer Motion
- **Icone**: Lucide React
- **Date**: date-fns
- **Routing**: React Router v7
- **PWA**: vite-plugin-pwa per auto-update
- **Android**: Capacitor + @capacitor/push-notifications

## Regole di Sviluppo
- NO login Google - solo email/password via Firebase Auth
- Interfaccia UI interamente in italiano
- Tema dark con accenti cyan (estetica terminale/hacker)
- Font mono per headings e UI chiave

## Struttura File
```
src/
  components/ui/    - Componenti base riutilizzabili (Button, Card, Badge, etc.)
  components/       - Componenti composti specifici dell'app
  pages/            - Componenti pagina (uno per route)
  hooks/            - Custom React hooks (useAuth, useHousehold, useChores, etc.)
  lib/              - Utility: firebase.ts, utils.ts (cn helper), chore-icons.ts, capacitor.ts
  contexts/         - React Context providers (AuthContext, HouseholdContext)
  types/            - Interfacce e tipi TypeScript
android/            - Progetto Android nativo (solo su branch Android)
capacitor.config.ts - Config Capacitor (solo su branch Android)
```

## Convenzioni di Codice
- Usare `cn()` (clsx + tailwind-merge) per classi condizionali
- Usare class-variance-authority (cva) per varianti componenti
- Operazioni Firestore nei hooks dedicati, mai inline nei componenti
- Named exports per i componenti
- TypeScript strict, no tipi `any`
- File naming: kebab-case (es. chore-card.tsx, use-auth.ts)
- Preferire `interface` per oggetti, `type` per union/intersection

## Firebase
- Config in `src/lib/firebase.ts` (legge da env vars)
- Variabili ambiente: `VITE_FIREBASE_*`
- Regole Firestore in `firestore.rules`
- Config hosting in `firebase.json`

## Versioning
- Versione definita in `package.json` (campo `version`)
- Esposta nell'app tramite `__APP_VERSION__` (definita in vite.config.ts)
- Auto-incrementata dalla GitHub Action di deploy (`[skip ci]` per evitare loop)
- Su Android: `versionCode` incrementa automaticamente, `versionName` = versione da package.json

## Comandi
- `npm run dev` - Dev server
- `npm run build` - Build produzione
- `npm run preview` - Preview build
- `npm run lint` - ESLint

## Modello Dati Firestore
- `users/{uid}` - Profilo utente (include fcmToken per notifiche push)
- `households/{id}` - Casa con membri
- `households/{id}/choreTypes/{id}` - Tipi di attivita
- `households/{id}/chores/{id}` - Attivita assegnate con frequenza
- `households/{id}/completions/{id}` - Completamenti tracciati
