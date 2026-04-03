import { useState } from 'react'
import {
  HomeIcon,
  PlusCircleIcon,
  CopyIcon,
  CheckIcon,
  UsersIcon,
  LogInIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useHousehold } from '@/contexts/household-context'

export function HouseholdPage() {
  const { households, currentHousehold, members, createHousehold, joinHousehold, selectHousehold } = useHousehold()

  const [newHouseName, setNewHouseName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)

  async function handleCreate() {
    if (!newHouseName.trim()) return
    setCreating(true)
    setError('')
    try {
      await createHousehold(newHouseName.trim())
      setNewHouseName('')
    } catch {
      setError('Errore nella creazione della casa')
    } finally {
      setCreating(false)
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return
    setJoining(true)
    setError('')
    try {
      await joinHousehold(inviteCode.trim())
      setInviteCode('')
    } catch {
      setError('Codice invito non valido')
    } finally {
      setJoining(false)
    }
  }

  function copyCode() {
    if (!currentHousehold) return
    navigator.clipboard.writeText(currentHousehold.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-primary">La Tua Casa</h1>

      {!currentHousehold ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Create */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircleIcon className="h-5 w-5 text-primary" />
                Crea una Casa
              </CardTitle>
              <CardDescription>Inizia creando un nuovo profilo casa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome della casa</Label>
                <Input
                  placeholder="Es. Casa Rossi"
                  value={newHouseName}
                  onChange={(e) => setNewHouseName(e.target.value)}
                />
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating ? 'Creazione...' : 'Crea Casa'}
              </Button>
            </CardContent>
          </Card>

          {/* Join */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogInIcon className="h-5 w-5 text-primary" />
                Unisciti a una Casa
              </CardTitle>
              <CardDescription>Inserisci il codice invito ricevuto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Codice invito</Label>
                <Input
                  placeholder="Es. ABC123"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </div>
              <Button onClick={handleJoin} disabled={joining} className="w-full">
                {joining ? 'Accesso...' : 'Unisciti'}
              </Button>
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive col-span-full">{error}</p>}
        </div>
      ) : (
        <>
          {/* Household switcher */}
          {households.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {households.map((h) => (
                <Button
                  key={h.id}
                  variant={h.id === currentHousehold.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => selectHousehold(h.id)}
                >
                  {h.name}
                </Button>
              ))}
            </div>
          )}

          {/* House profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HomeIcon className="h-5 w-5 text-primary" />
                {currentHousehold.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Codice Invito</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-lg font-bold text-primary bg-primary/10 px-4 py-2 rounded-lg tracking-widest text-center">
                    {currentHousehold.inviteCode}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyCode}>
                    {copied ? <CheckIcon className="h-4 w-4 text-green-400" /> : <CopyIcon className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Condividi questo codice per invitare altri membri
                </p>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground flex items-center gap-2 mb-3">
                  <UsersIcon className="h-4 w-4" />
                  Membri ({members.length})
                </Label>
                <div className="space-y-2">
                  {members.map((m) => (
                    <div
                      key={m.uid}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                        {m.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{m.displayName}</p>
                        <p className="text-xs text-muted-foreground">{m.email}</p>
                      </div>
                      {m.uid === currentHousehold.createdBy && (
                        <Badge variant="secondary">Admin</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add another house */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aggiungi un'altra casa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Crea nuova</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome casa"
                      value={newHouseName}
                      onChange={(e) => setNewHouseName(e.target.value)}
                    />
                    <Button onClick={handleCreate} disabled={creating}>Crea</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Unisciti</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Codice"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                    <Button onClick={handleJoin} disabled={joining}>Unisciti</Button>
                  </div>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
