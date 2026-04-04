# Home Manager

Gestisci le faccende domestiche in modo semplice e organizzato, insieme a chi vive con te.

## Cosa fa

Home Manager ti permette di organizzare la vita domestica della tua casa. Crea la tua casa virtuale, invita i coinquilini o familiari, e gestite insieme le attivita da fare.

### Funzionalita principali

- **Crea la tua casa** e invita i membri con un codice di invito
- **Definisci le attivita** ricorrenti (pulizie, spesa, bucato, ecc.) con icone e frequenze personalizzabili
- **Assegna i compiti** ai membri della casa, con scadenze automatiche
- **Calendario** per vedere cosa c'e da fare giorno per giorno
- **Statistiche** per tenere traccia di chi fa cosa e quanto
- **Notifiche** per non dimenticare le attivita in scadenza
- **Dashboard** con panoramica immediata della situazione

### Disponibile su

- **Web** — Accessibile da qualsiasi browser, funziona anche offline grazie alla modalita PWA
- **Android** — App nativa installabile, con notifiche push vere

## Come si usa

1. Registrati con email e password
2. Crea una nuova casa o unisciti a una esistente con il codice di invito
3. Aggiungi le attivita ricorrenti della casa
4. Assegna i compiti ai membri
5. Segna le attivita come completate man mano che le fai

## Interfaccia

L'app ha un tema scuro con accenti cyan, pensata per essere piacevole da usare in qualsiasi momento della giornata. Interamente in italiano.

## Tech Stack

- **Frontend**: React 19, TypeScript (strict mode), Vite
- **Styling**: Tailwind CSS v4 + componenti UI custom (shadcn-style)
- **Backend**: Firebase (Auth, Firestore, Hosting, Cloud Messaging)
- **Animazioni**: Framer Motion
- **Routing**: React Router v7
- **PWA**: vite-plugin-pwa
- **Android**: Capacitor + @capacitor/push-notifications

## Struttura del progetto

```
src/
  components/
    ui/             Componenti riutilizzabili (Button, Card, Badge, Dialog, Input...)
    auth/           Login, registrazione, protezione route
    layout/         Navbar, layout principale
    notifications/  Campanella notifiche
  pages/            Una pagina per ogni sezione (Dashboard, Calendario, Attivita,
                    Casa, Profilo, Statistiche)
  hooks/            Logica riutilizzabile (auth, chores, notifiche push)
  contexts/         Stato globale (AuthContext, HouseholdContext)
  lib/              Firebase config, utility, icone attivita
  types/            Interfacce e tipi TypeScript
android/            Progetto Android nativo (solo branch Android)
.github/workflows/  CI/CD: deploy web (main) e build APK (Android)
```

## Versioning

La versione viene incrementata automaticamente ad ogni deploy:
- **Web**: ogni push su `main` → deploy Firebase + bump patch version
- **Android**: ogni push su `Android` → build APK + bump patch + versionCode incrementale

La versione corrente e visibile nella pagina Profilo dell'app.
