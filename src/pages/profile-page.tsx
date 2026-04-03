import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { UserIcon, SaveIcon, BellIcon, BellOffIcon, LogOutIcon, Loader2Icon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/auth-context'
import { useNotifications } from '@/hooks/use-notifications'
import { db } from '@/lib/firebase'

export function ProfilePage() {
  const { user, userProfile, logout, updateProfileData } = useAuth()
  const { isEnabled, loading: notifLoading, error: notifError, enableNotifications, disableNotifications } = useNotifications()
  const [displayName, setDisplayName] = useState(userProfile?.displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!user || !displayName.trim()) return
    setSaving(true)
    setError('')
    try {
      await updateProfile(user, { displayName: displayName.trim() })
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
      })
      updateProfileData({ displayName: displayName.trim() })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Errore salvataggio profilo:', err)
      setError('Errore nel salvataggio. Riprova.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleNotifications() {
    if (isEnabled) {
      await disableNotifications()
    } else {
      await enableNotifications()
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-primary">Profilo</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            Informazioni Personali
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
              {userProfile?.displayName?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-semibold">{userProfile?.displayName}</p>
              <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Nome visualizzato</Label>
            <div className="flex gap-2">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <Button onClick={handleSave} disabled={saving}>
                <SaveIcon className="h-4 w-4" />
                {saved ? 'Salvato!' : 'Salva'}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={userProfile?.email ?? ''} disabled />
            <p className="text-xs text-muted-foreground">L'email non puo essere modificata</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellIcon className="h-5 w-5 text-primary" />
            Notifiche Push
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Notifiche push</p>
              <p className="text-xs text-muted-foreground">
                Ricevi notifiche per le attivita in scadenza
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleToggleNotifications}
              disabled={notifLoading}
              className={isEnabled ? 'text-primary' : 'text-muted-foreground'}
            >
              {notifLoading ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : isEnabled ? (
                <>
                  <BellIcon className="h-4 w-4" />
                  Attive
                </>
              ) : (
                <>
                  <BellOffIcon className="h-4 w-4" />
                  Disattivate
                </>
              )}
            </Button>
          </div>
          {notifError && <p className="text-sm text-destructive">{notifError}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Button variant="destructive" className="w-full" onClick={logout}>
            <LogOutIcon className="h-4 w-4" />
            Esci dall'account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
