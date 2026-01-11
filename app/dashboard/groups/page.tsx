"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { groupeApi } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Users, X, CheckCircle2, Shield } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface UtilisateurDTO {
  id: number
  nom: string
  prenom: string
  email: string
  photoProfile?: string
}

interface GroupeDTO {
  id: number
  nom: string
  description: string
  dateCreation: string
  createur: UtilisateurDTO
  membres: UtilisateurDTO[]
  type: "PUBLIC" | "PRIVE"
  nombreMembres: number
}

export default function GroupsContent() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [groups, setGroups] = useState<GroupeDTO[]>([])
  const [filteredGroups, setFilteredGroups] = useState<GroupeDTO[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [joiningGroupId, setJoiningGroupId] = useState<number | null>(null)

  const { toast } = useToast()

  // Local overrides for fields not persisted/returned by the backend (keyed by group id)
  const [dateOverrides, setDateOverrides] = useState<Record<string, string>>({})
  // Debug: last created server response
  const [lastCreatedResponse, setLastCreatedResponse] = useState<any | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    type: "PRIVE" as "PUBLIC" | "PRIVE",
    dateCreation: "",
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setIsLoading(true)
        const data = await groupeApi.getAll()
        setGroups(data || [])
      } catch (err: any) {
        setError(err.message || "Failed to load groups")
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchGroups()
    }
  }, [user])

  useEffect(() => {
    let filtered = groups

    if (searchQuery) {
      filtered = filtered.filter(
        (g) =>
          g.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (typeFilter) {
      filtered = filtered.filter((g) => g.type === typeFilter)
    }

    setFilteredGroups(filtered)
  }, [groups, searchQuery, typeFilter])

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) {
      setCreateError("User not authenticated")
      return
    }
    
    setIsCreating(true)
    setCreateError(null)

    try {
      const payload: any = { ...formData }
      if (!payload.dateCreation) delete payload.dateCreation
      else {
        const d = new Date(payload.dateCreation)
        if (isNaN(d.getTime())) {
          // invalid date format
          setCreateError("La date fournie est invalide")
          setIsCreating(false)
          return
        }
        payload.dateCreation = d.toISOString()
      }

      console.debug("Creating group payload:", payload)

      let newGroup: any = null
      try {
        newGroup = await groupeApi.create(payload, user.id)
      } catch (apiErr: any) {
        console.error("API error creating group:", apiErr)
        // Surface backend message if available
        setCreateError(apiErr.message || "Échec de la création du groupe")
        setIsCreating(false)
        return
      }

      // If server created the group but did not persist the date, try a follow-up update
      const providedDate = payload.dateCreation || null
      if (providedDate && newGroup?.id && !newGroup.dateCreation) {
        try {
          console.debug("Attempting to persist date for group via update", { id: newGroup.id, date: providedDate })
          await groupeApi.update(newGroup.id, { dateCreation: providedDate })

          // fetch the updated group to verify
          const refreshed = await groupeApi.getById(newGroup.id)
          if (refreshed && refreshed.dateCreation) {
            newGroup = refreshed
            toast({ title: "Date enregistrée", description: "La date a été enregistrée en base." })
          } else {
            // server still didn't persist — warn and continue with local override
            setCreateError("Le serveur n'a pas persisté la date après la mise à jour.")
            toast({ title: "Attention", description: "Le serveur n'a pas persisté la date après la mise à jour." })
          }
        } catch (updErr: any) {
          console.error("Failed to update group date:", updErr)
          // non-fatal: we'll fallback to local override
          setCreateError("Impossible d'enregistrer la date sur le serveur (update échoué)")
        }
      }
      try {
        const updated = await groupeApi.getAll()
        let patched = updated || []

        if (providedDate) {
          // 1) Try to match by returned id
          let matchedById = false
          let matchedId: number | null = null
          patched = patched.map((g: any) => {
            if (newGroup?.id && g.id === newGroup.id) {
              matchedById = true
              matchedId = g.id
              return { ...g, dateCreation: g.dateCreation || providedDate }
            }
            return g
          })

          // 2) If not matched by id, try to match by name (best-effort)
          if (!matchedById && newGroup?.nom) {
            let matchedByName = false
            let tempAppended: any | null = null
            patched = patched.map((g: any) => {
              if (!g.dateCreation && g.nom === newGroup.nom) {
                matchedByName = true
                matchedId = g.id
                return { ...g, dateCreation: providedDate }
              }
              return g
            })

            // 3) If still not found, append a local temp group with the provided data so UI shows the date
            if (!matchedByName && !newGroup?.id) {
              const tempGroup = {
                id: -Date.now(),
                nom: newGroup?.nom || payload.nom || "(Sans nom)",
                description: newGroup?.description || payload.description || "",
                dateCreation: providedDate,
                createur: { id: user.id, nom: user.nom || "", prenom: user.prenom || "", email: user.email || "" },
                membres: [],
                type: newGroup?.type || payload.type || "PRIVE",
                nombreMembres: 1,
              }
              tempAppended = tempGroup
              patched = [...patched, tempGroup]
            }

            // if we appended a tempGroup, store its id to set override below
            if (tempAppended) matchedId = tempAppended.id
          }

          // If we found/mutated a group, ensure local override is set so the UI displays the provided date
          if (matchedId !== null) {
            setDateOverrides((prev) => ({ ...prev, [String(matchedId)]: providedDate }))
          }
        }

        setGroups(patched)
      } catch (e) {
        // Fall back to appending the created item if refresh fails
        if (providedDate) {
          const appended = { ...(newGroup || {}), dateCreation: newGroup?.dateCreation || providedDate }
          setGroups((prev) => [...prev, appended])
          // store override so UI shows date even if backend doesn't
          if (appended && appended.id !== undefined) {
            setDateOverrides((prev) => ({ ...prev, [String(appended.id)]: providedDate }))
          }
        } else {
          setGroups((prev) => [...prev, newGroup])
        }
      }

      setIsCreateDialogOpen(false)
      setFormData({
        nom: "",
        description: "",
        type: "PRIVE" as "PUBLIC" | "PRIVE",
        dateCreation: "",
      })

      setLastCreatedResponse(newGroup || null)

      // If user provided a date but server did not return/persist it, surface a warning
      if (providedDate && (!newGroup || !newGroup.dateCreation)) {
        setCreateError("La date n'a pas été enregistrée par le serveur (valeur retournée null)")
        toast({ title: "Attention", description: "La date fournie n'a pas été enregistrée par le serveur." })
      } else {
        toast({ title: "Groupe créé", description: newGroup?.nom ? `"${newGroup.nom}" a été créé.` : "Groupe créé" })
      }
    } catch (err: any) {
      console.error("Unexpected error creating group:", err)
      setCreateError(err.message || "Failed to create group")
    } finally {
      setIsCreating(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const clearFilters = () => {
    setSearchQuery("")
    setTypeFilter("")
  }

  const getTypeColor = (type: string) => {
    return type === "PUBLIC" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
  }

  const isUserMember = (group: GroupeDTO) => {
    // Defensive check: API may omit `membres` for some groups
    if (!user) return false
    if (!Array.isArray(group.membres) || group.membres.length === 0) return false
    return group.membres.some((membre) => membre.id === user.id)
  }

  const handleJoinGroup = async (groupId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) return
    
    setJoiningGroupId(groupId)
    try {
      await groupeApi.addMember(groupId, user.id)
      
      // Refresh groups list
      const updatedGroups = await groupeApi.getAll()
      setGroups(updatedGroups || [])
    } catch (err: any) {
      console.error("Failed to join group:", err)
    } finally {
      setJoiningGroupId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary"></div>
          </div>
          <p className="text-muted-foreground font-medium">Loading groups...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-foreground">Groups</h1>
          <p className="text-lg text-muted-foreground">Manage and collaborate with your teams</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          New Group
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Types</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVE">Private</option>
          </select>
          {(searchQuery || typeFilter) && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Groups Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-12 text-center">
            <p className="text-muted-foreground mb-4">
              {searchQuery || typeFilter ? "No groups match your filters" : "No groups found"}
            </p>
            <Button className="flex items-center gap-2 mx-auto" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Create First Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group) => {
            const isMember = isUserMember(group)
            const isJoining = joiningGroupId === group.id

            return (
              <div key={group.id} className="relative">
                <Link href={isMember ? `/dashboard/groups/${group.id}` : "#"}>
                  <Card className={`hover:shadow-lg transition-shadow h-full ${!isMember ? 'opacity-90' : 'cursor-pointer'}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="line-clamp-2">{group.nom || "(Sans nom)"}</CardTitle>
                          <CardDescription className="line-clamp-3 mt-2">
                            {group.description || "(Aucune description)"}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={getTypeColor(group.type)}>
                          {group.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Group Stats */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="w-4 h-4" />
                              <span>{group.nombreMembres} members</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Shield className="w-4 h-4" />
                            <span>
                              { (dateOverrides[String(group.id)] || group.dateCreation) ? `Created ${new Date(dateOverrides[String(group.id)] || group.dateCreation).toLocaleDateString()}` : "Created —" }
                            </span>
                          </div>
                        </div>

                        {/* Join Button for non-members */}
                        {!isMember && group.type === "PUBLIC" && (
                          <Button
                            className="w-full mt-2"
                            size="sm"
                            onClick={(e) => handleJoinGroup(group.id, e)}
                            disabled={isJoining}
                          >
                            {isJoining ? "Joining..." : "Join Group"}
                          </Button>
                        )}
                        
                        {!isMember && group.type === "PRIVE" && (
                          <div className="text-xs text-center text-muted-foreground italic mt-2 p-2 bg-muted rounded">
                            Private group - Invitation required
                          </div>
                        )}

                        {isMember && (
                          <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 rounded py-2 mt-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="font-medium">Member</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Group Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>Fill in the details to create a new group for collaboration.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGroup}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Group Name *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Enter group name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter group description"
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({ ...formData, type: value as "PUBLIC" | "PRIVE" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVE">Private</SelectItem>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateCreation">Date (optionnelle)</Label>
                <Input
                  id="dateCreation"
                  type="date"
                  value={formData.dateCreation}
                  onChange={(e) => setFormData({ ...formData, dateCreation: e.target.value })}
                />
              </div> 

              {createError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                  {createError}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {lastCreatedResponse && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Dernière réponse du serveur</CardTitle>
            <CardDescription>Contenu JSON retourné par la création (utile pour debug)</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-60 whitespace-pre-wrap break-words">{JSON.stringify(lastCreatedResponse, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}