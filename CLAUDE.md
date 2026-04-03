# Home Manager

## Panoramica
Home Manager e una webapp per la gestione delle faccende domestiche. Gli utenti creano una casa, invitano membri, definiscono attivita ricorrenti, le assegnano e tracciano i completamenti con statistiche.

## Tech Stack
- **Frontend**: React 19 + TypeScript (strict mode) + Vite
- **Styling**: Tailwind CSS v4 con @theme (colori oklch) + componenti shadcn/ui-style
- **Backend**: Firebase Auth (email/password), Firestore, Hosting, Cloud Messaging
- **Animazioni**: Framer Motion
- **Icone**: Lucide React
- **Date**: date-fns
- **Routing**: React Router v7
- **PWA**: vite-plugin-pwa per auto-update

## Regole di Sviluppo
- Tutto il lavoro su branch `main`
- Push su main triggera auto-deploy su Firebase Hosting via GitHub Actions
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
  lib/              - Utility: firebase.ts, utils.ts (cn helper), chore-icons.ts
  contexts/         - React Context providers (AuthContext, HouseholdContext)
  types/            - Interfacce e tipi TypeScript
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

## Comandi
- `npm run dev` - Dev server
- `npm run build` - Build produzione
- `npm run preview` - Preview build
- `npm run lint` - ESLint

## Modello Dati Firestore
- `users/{uid}` - Profilo utente
- `households/{id}` - Casa con membri
- `households/{id}/choreTypes/{id}` - Tipi di attivita
- `households/{id}/chores/{id}` - Attivita assegnate con frequenza
- `households/{id}/completions/{id}` - Completamenti tracciati
