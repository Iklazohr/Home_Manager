# Home Manager

## Panoramica
Home Manager e una webapp per la gestione delle faccende domestiche. Gli utenti creano una casa, invitano membri, definiscono attivita ricorrenti, le assegnano e tracciano i completamenti con statistiche. Disponibile come sito web (PWA) e come app Android nativa (APK).

## Piattaforme e Branch

### Web App (branch `main`)
- PWA deployata su Firebase Hosting
- Push su `main` triggera auto-deploy via GitHub Actions
- Versioning automatico: ogni deploy incrementa la patch version (1.0.0 → 1.0.1 → 1.0.2...)
- La versione e visibile nella pagina Profilo dell'app
- Notifiche via Web Notifications API (browser) + notifiche eventi real-time via onSnapshot

### App Android (branch `Android`)
- APK generato via Capacitor (wrappa la webapp in una shell nativa)
- Push su `Android` triggera build APK via GitHub Actions
- APK scaricabile dagli Artifacts nella tab Actions di GitHub
- Versioning automatico: versionCode incrementa ad ogni build, versionName sincronizzato da package.json
- Notifiche push native via @capacitor/local-notifications (schedulate localmente, gratuite)
- Notifiche FCM token via @capacitor/push-notifications (per futuro uso server)
- Supporta sia APK debug che release firmato

## Flusso di Lavoro
1. **Sviluppo e aggiornamenti vanno sempre su `main` prima** (webapp)
2. Le modifiche vengono portate su `Android` solo quando richiesto esplicitamente
3. Per aggiornare Android: merge da main verso Android, poi push per triggerare il build APK
4. NON fare modifiche direttamente su `Android` che non siano specifiche per la piattaforma nativa

## Tech Stack
- **Frontend**: React 19 + TypeScript (strict mode) + Vite
- **Styling**: Tailwind CSS v4 con @theme (colori oklch) + componenti shadcn/ui-style
- **Backend**: Firebase Auth (email/password), Firestore, Hosting
- **Animazioni**: Framer Motion
- **Icone**: Lucide React
- **Date**: date-fns
- **Routing**: React Router v7
- **PWA**: vite-plugin-pwa per auto-update
- **Android**: Capacitor + @capacitor/push-notifications + @capacitor/local-notifications

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
.claude/
  agents/           - 7 subagent per Claude Code (scout, architect, implementer, etc.)
  settings.json     - Impostazioni Claude Code (modello, effort, env vars)
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
- Indice composito in `firestore.indexes.json` (completions: choreId + completedAt)

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
- `users/{uid}` - Profilo utente (include fcmToken, notificationsEnabled)
- `households/{id}` - Casa con membri (memberUids, inviteCode)
- `households/{id}/choreTypes/{id}` - Tipi di attivita (con category: ChoreCategory)
- `households/{id}/chores/{id}` - Attivita assegnate (con scheduleMode, status include 'parziale')
- `households/{id}/completions/{id}` - Completamenti (con isPartial, wasOnTime)

## Feature Attive
- **Categorie pulizie**: 8 categorie predefinite (cucina, bagno, camera, soggiorno, bucato, esterno, manutenzione, altro) con filtro e ordinamento
- **Deadline flessibili**: ScheduleMode (esatto, weekend piu vicino, giorno specifico della settimana)
- **Completamento parziale**: Status 'parziale' (giallo) — non avanza la scadenza
- **Undo completamento**: Ripristina scadenza precedente e cancella ultimo record
- **Shift cadenza**: Se in ritardo la prossima scadenza parte da ORA, se puntuale dalla scadenza originale
- **Notifiche eventi real-time**: onSnapshot per nuovo membro, completamento altri, assegnazione a me

---

# Preferenze personali e routing agenti

## Token discipline (LEGGERE PRIMA)

Prima di fare QUALSIASI task, chiediti: "Un subagent puo gestirlo in isolamento?"

Se si, delega. I token di esplorazione del subagent restano nel suo contesto e non si accumulano nel mio. Questa e la singola riduzione di costo piu efficace.

## Routing rules (in ordine di priorita)

1. **Ricerca, grep, glob, "trova X", "dove e Y"** -> SEMPRE usare il subagent `scout`. Mai fare grep direttamente nella sessione principale a meno che il risultato non sia 1-2 righe.

2. **"Come devo strutturare / progettare / refactorizzare"** -> usare `architect`. Mai scrivere codice nella sessione principale per domande di design.

3. **Scrivere o modificare codice da un piano chiaro** -> usare `implementer`.

4. **Code review, security audit, "e sicuro questo?"** -> usare `reviewer`.

5. **Docstrings, README, commenti, aggiornamenti doc** -> usare `doc-writer`.

6. **Find-and-replace su molti file, rinominare in massa** -> usare `bulk-editor`.

7. **Eseguire, fixare, o scrivere test** -> usare `test-runner`.

## Quando NON usare un subagent

- Edit di una singola riga
- Domande dirette rispondibili dal contesto esistente
- Chiarimenti rapidi
- Qualsiasi cosa dove l'overhead del round-trip supera il lavoro stesso

## Effort discipline

- Il default che voglio e `high` per la sessione principale, NON xhigh. xhigh sulla coordinazione e overthinking.
- Alzare a `xhigh` solo quando chiedo esplicitamente "pensaci bene" o "questo e complicato"
- Abbassare a `medium` per pianificazione e discussione, `low` per chiacchiere

## Preferenze output

- Conciso > verboso. Preferisco risposte da 5 righe piuttosto che da 30.
- Codice prima, prosa dopo. Non spiegare cosa fa il codice in aggiunta a scriverlo, a meno che non lo chieda.
- Niente preamboli "Ecco una soluzione completa..."
- Citare file:riga quando si fa riferimento a codice specifico.
- Blocco riassuntivo alla fine di lavori multi-step, non intercalato.

## Mai fare

- Aggiungere commenti come "# Updated by Claude"
- Modificare file fuori dallo scope richiesto
- Eseguire comandi bash distruttivi (rm -rf, drop database, force push) senza conferma esplicita
- Leggere piu di 5 file nel contesto principale - delegare a scout se serve esplorazione piu ampia

## HARD RULE - modifiche al codice

Se un prompt chiede di "fixare", "implementare", "applicare", "editare", "cambiare", "aggiornare", "aggiungere", o "modificare" codice in qualsiasi file, DEVI delegare al subagent `implementer`. NON fare l'edit nella sessione principale, anche se e un cambio di una riga. Le uniche eccezioni sono:
- Il cambio e un singolo carattere/typo fix
- L'utente dice esplicitamente "fallo tu" o "non delegare"

Motivo: implementer gira su Sonnet che e significativamente piu economico per token rispetto a Opus, e il task e ben adatto alle capacita di Sonnet.
