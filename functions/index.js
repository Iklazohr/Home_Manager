const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')
const { onSchedule } = require('firebase-functions/v2/scheduler')

initializeApp()
const db = getFirestore()

// Esegue ogni ora, controlla attivita in scadenza e invia notifiche push
exports.sendChoreReminders = onSchedule(
  { schedule: 'every 1 hours', region: 'europe-west1' },
  async () => {
    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Recupera tutte le household
    const householdsSnap = await db.collection('households').get()

    for (const householdDoc of householdsSnap.docs) {
      const household = householdDoc.data()

      // Recupera attivita in scadenza nelle prossime 24h o in ritardo
      const choresSnap = await db
        .collection('households')
        .doc(householdDoc.id)
        .collection('chores')
        .where('status', 'in', ['in_attesa', 'in_ritardo'])
        .get()

      const dueChores = choresSnap.docs.filter((d) => {
        const dueDate = d.data().nextDueDate?.toDate()
        return dueDate && dueDate <= in24h
      })

      if (dueChores.length === 0) continue

      // Determina gli utenti da notificare
      const memberUids = new Set()
      for (const chore of dueChores) {
        const data = chore.data()
        if (data.assignedTo === 'everyone') {
          household.memberUids.forEach((uid) => memberUids.add(uid))
        } else {
          memberUids.add(data.assignedTo)
        }
      }

      // Recupera i token FCM degli utenti
      for (const uid of memberUids) {
        const userDoc = await db.collection('users').doc(uid).get()
        const userData = userDoc.data()

        if (!userData?.notificationsEnabled || !userData?.fcmToken) continue

        // Conta attivita per questo utente
        const userChores = dueChores.filter((c) => {
          const d = c.data()
          return d.assignedTo === uid || d.assignedTo === 'everyone'
        })

        if (userChores.length === 0) continue

        const isOverdue = userChores.some(
          (c) => c.data().nextDueDate?.toDate() < now
        )

        const title = isOverdue
          ? `${userChores.length} attivita in ritardo!`
          : `${userChores.length} attivita in scadenza`

        const body = userChores
          .slice(0, 3)
          .map((c) => c.data().choreTypeName)
          .join(', ')

        try {
          await getMessaging().send({
            token: userData.fcmToken,
            notification: { title, body },
            webpush: {
              fcmOptions: { link: 'https://home-manager-c77eb.web.app/dashboard' },
            },
          })
        } catch (err) {
          // Token scaduto o invalido — rimuovilo
          if (
            err.code === 'messaging/invalid-registration-token' ||
            err.code === 'messaging/registration-token-not-registered'
          ) {
            await db
              .collection('users')
              .doc(uid)
              .update({ fcmToken: null, notificationsEnabled: false })
          }
          console.error(`Errore invio notifica a ${uid}:`, err.message)
        }
      }
    }
  }
)
