"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { projetApi, apiCall } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Clock, Users, CheckCircle2, AlertCircle, X } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"

interface ProjetDTO {
  id: number
  nom: string
  description: string
  theme?: string
  statut: "EN_ATTENTE" | "ACCEPTE" | "REJETE" | "CLOTURE"
  visibilite: "PUBLIC" | "PRIVE"
  dateCreation: string
  dateModification: string
  dateEcheance?: string
  creatorId: number
  nombreMembres: number
  nombreTaches: number
  tauxCompletion: number
  membres?: Array<{ id: number; nom: string; prenom: string }>
}

export default function ProjectsContent() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [projects, setProjects] = useState<ProjetDTO[]>([])
  const [filteredProjects, setFilteredProjects] = useState<ProjetDTO[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [groups, setGroups] = useState<Array<{ id: number; nom: string }>>([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [groupError, setGroupError] = useState<string | null>(null)

  // Inline Create Group state
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [createGroupError, setCreateGroupError] = useState<string | null>(null)
  const [groupForm, setGroupForm] = useState({ nom: "", description: "", type: "PRIVE" })

  const [joiningProjectId, setJoiningProjectId] = useState<number | null>(null)
  // Debug: last server request/response for project creation
  const [lastProjectRequest, setLastProjectRequest] = useState<any | null>(null)
  const [lastProjectResponse, setLastProjectResponse] = useState<any | null>(null)

  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    theme: "",
    visibilite: "PRIVE" as "PUBLIC" | "PRIVE",
    dateEcheance: "",
    groupeId: "",
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true)
        const data = await projetApi.getAll()
        setProjects(data || [])
      } catch (err: any) {
        setError(err.message || "Failed to load projects")
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchProjects()
    }
  }, [user])

  // Fetch groups when dialog opens
  useEffect(() => {
    const fetchGroups = async () => {
      if (!isCreateDialogOpen) return
      
      try {
        setLoadingGroups(true)
        const { groupeApi } = await import("@/lib/api-client")
        const data = await groupeApi.getAll()
        const groupsData = data || []
        setGroups(groupsData)

        // If there's exactly one group, preselect it to avoid required errors
        if (groupsData.length === 1 && !formData.groupeId) {
          setFormData((f) => ({ ...f, groupeId: groupsData[0].id.toString() }))
        }
      } catch (err: any) {
        console.error("Failed to load groups:", err)
        setGroups([])
      } finally {
        setLoadingGroups(false)
      }
    }

    fetchGroups()
  }, [isCreateDialogOpen])

  useEffect(() => {
    let filtered = projects

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter) {
      filtered = filtered.filter((p) => p.statut === statusFilter)
    }

    setFilteredProjects(filtered)
  }, [projects, searchQuery, statusFilter])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateError(null)
    setGroupError(null)

    // Validate group selection
    if (!formData.groupeId || formData.groupeId === "") {
      setGroupError("Le groupe est requis pour créer un projet. Veuillez en sélectionner un.")
      setIsCreating(false)
      return
    }

    const groupeIdNum = parseInt(formData.groupeId, 10)
    if (isNaN(groupeIdNum)) {
      setGroupError("Le groupe sélectionné est invalide.")
      setIsCreating(false)
      return
    }

    try {
      // Prepare payload and normalize dateEcheance to ISO if present
      const projectData: any = {
        ...formData,
        groupeId: groupeIdNum,
      }

      // Ensure minimal required fields/defaults to avoid server-side exceptions
      projectData.statut = projectData.statut || "EN_ATTENTE"
      // Send creator id in body as well (some backends expect it)
      projectData.creatorId = user?.id

      if (projectData.dateEcheance) {
        const d = new Date(projectData.dateEcheance)
        if (isNaN(d.getTime())) {
          setCreateError("La date d'échéance fournie est invalide")
          setIsCreating(false)
          return
        }
        projectData.dateEcheance = d.toISOString()
      } else {
        delete projectData.dateEcheance
      }

      // Debug: store payload being sent
      console.debug("Creating project payload:", projectData)
      setLastProjectRequest(projectData)
      setLastProjectResponse(null)

      let newProject: any = null
      try {
        newProject = await projetApi.create(projectData, user?.id)
        console.debug("Create project response:", newProject)
        setLastProjectResponse(newProject || null)

        if (!newProject) throw new Error("Serveur: réponse vide lors de la création du projet")

        setProjects([...projects, newProject])
        setIsCreateDialogOpen(false)
        setFormData({
          nom: "",
          description: "",
          theme: "",
          visibilite: "PRIVE" as "PUBLIC" | "PRIVE",
          dateEcheance: "",
          groupeId: "",
        })
      } catch (firstErr: any) {
        console.warn("Primary create failed, attempting fallbacks:", firstErr)

        // Fallback 1: send groupeId inside body
        try {
          const bodyPayload = { ...projectData, groupeId: groupeIdNum }
          console.debug("Fallback attempt 1 - body includes groupeId:", bodyPayload)
          setLastProjectRequest(bodyPayload)
          const resp = await apiCall("/projets/creer", { method: "POST", body: JSON.stringify(bodyPayload) })
          console.debug("Fallback1 response:", resp)
          setLastProjectResponse(resp)
          if (resp) {
            setProjects([...projects, resp])
            setIsCreateDialogOpen(false)
            setFormData({ nom: "", description: "", theme: "", visibilite: "PRIVE" as "PUBLIC" | "PRIVE", dateEcheance: "", groupeId: "" })
            toast({ title: "Projet créé (fallback)", description: "Le projet a été créé en utilisant un format alternatif." })
            return
          }
        } catch (fb1Err: any) {
          console.warn("Fallback1 failed:", fb1Err)
          try {
            setLastProjectResponse(JSON.parse(fb1Err.message))
          } catch { setLastProjectResponse({ error: fb1Err.message }) }
        }

        // Fallback 2: include groupeId + idUserConnecter in query string
        try {
          const qs = `?groupeId=${encodeURIComponent(String(groupeIdNum))}${user?.id ? `&idUserConnecter=${encodeURIComponent(String(user.id))}` : ""}`
          const body2: any = { ...projectData }
          delete body2.groupeId
          console.debug("Fallback attempt 2 - query params:", qs, "body:", body2)
          setLastProjectRequest({ qs, body: body2 })
          const resp2 = await apiCall(`/projets/creer${qs}`, { method: "POST", body: JSON.stringify(body2) })
          console.debug("Fallback2 response:", resp2)
          setLastProjectResponse(resp2)
          if (resp2) {
            setProjects([...projects, resp2])
            setIsCreateDialogOpen(false)
            setFormData({ nom: "", description: "", theme: "", visibilite: "PRIVE" as "PUBLIC" | "PRIVE", dateEcheance: "", groupeId: "" })
            toast({ title: "Projet créé (fallback)", description: "Le projet a été créé en utilisant un format alternatif." })
            return
          }
        } catch (fb2Err: any) {
          console.warn("Fallback2 failed:", fb2Err)
          try {
            setLastProjectResponse(JSON.parse(fb2Err.message))
          } catch { setLastProjectResponse({ error: fb2Err.message }) }
        }

        // Fallback 3: send nested groupe object in body (some endpoints expect nested resource)
        try {
          const body3: any = { ...projectData, groupe: { id: groupeIdNum } }
          delete body3.groupeId
          console.debug("Fallback attempt 3 - nested groupe in body:", body3)
          setLastProjectRequest(body3)
          const resp3 = await apiCall(`/projets/creer`, { method: "POST", body: JSON.stringify(body3) })
          console.debug("Fallback3 response:", resp3)
          setLastProjectResponse(resp3)
          if (resp3) {
            setProjects([...projects, resp3])
            setIsCreateDialogOpen(false)
            setFormData({ nom: "", description: "", theme: "", visibilite: "PRIVE" as "PUBLIC" | "PRIVE", dateEcheance: "", groupeId: "" })
            toast({ title: "Projet créé (fallback)", description: "Le projet a été créé en utilisant un format alternatif." })
            return
          }
        } catch (fb3Err: any) {
          console.warn("Fallback3 failed:", fb3Err)
          try {
            setLastProjectResponse(JSON.parse(fb3Err.message))
          } catch { setLastProjectResponse({ error: fb3Err.message }) }
        }

        // All attempts failed
        throw firstErr
      }
    } catch (err: any) {
      console.error("Create project failed:", err)

      // Prefer structured error info if apiCall attached it
      const status = err?.status
      const body = err?.body ?? (() => {
        try {
          return JSON.parse(err?.message || "")
        } catch {
          return { error: err?.message || "Unknown error" }
        }
      })()

      setLastProjectResponse({ status, body })

      setCreateError(err.message || "Failed to create project")
      toast({ title: "Erreur création projet", description: err.message || "Failed to create project" })
    } finally {
      setIsCreating(false)
    }
  }



  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingGroup(true)
    setCreateGroupError(null)

    if (!groupForm.nom || groupForm.nom.trim() === "") {
      setCreateGroupError("Le nom du groupe est requis")
      setIsCreatingGroup(false)
      return
    }

    if (!user) {
      setCreateGroupError("Utilisateur non authentifié")
      setIsCreatingGroup(false)
      return
    }

    try {
      const { groupeApi } = await import("@/lib/api-client")
      const payload = { nom: groupForm.nom, description: groupForm.description, type: groupForm.type }
      const newGroup = await groupeApi.create(payload, user.id)

      // refresh groups and auto-select the new group
      const freshGroups = await groupeApi.getAll()
      setGroups(freshGroups || [])
      setFormData((f) => ({ ...f, groupeId: newGroup.id.toString() }))

      setIsCreateGroupOpen(false)
      setGroupForm({ nom: "", description: "", type: "PRIVE" })
      toast({ title: "Groupe créé", description: "Le groupe a été créé et sélectionné." })
    } catch (err: any) {
      setCreateGroupError(err.message || "Échec de la création du groupe")
    } finally {
      setIsCreatingGroup(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("")
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      EN_ATTENTE: "bg-yellow-100 text-yellow-800",
      ACCEPTE: "bg-green-100 text-green-800",
      REJETE: "bg-red-100 text-red-800",
      CLOTURE: "bg-gray-100 text-gray-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACCEPTE":
        return <CheckCircle2 className="w-4 h-4" />
      case "EN_ATTENTE":
        return <Clock className="w-4 h-4" />
      case "REJETE":
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const isUserMember = (project: ProjetDTO) => {
    if (!user || !project.membres) return false
    return project.membres.some((membre) => membre.id === user.id)
  }

  const handleJoinProject = async (projectId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) return
    
    setJoiningProjectId(projectId)
    try {
      await projetApi.addMember(projectId, user.id)
      
      // Refresh projects list
      const updatedProjects = await projetApi.getAll()
      setProjects(updatedProjects || [])
    } catch (err: any) {
      console.error("Failed to join project:", err)
    } finally {
      setJoiningProjectId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary"></div>
          </div>
          <p className="text-muted-foreground font-medium">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-foreground">Projects</h1>
          <p className="text-lg text-muted-foreground">Manage all your projects in one place</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Status</option>
            <option value="EN_ATTENTE">Pending</option>
            <option value="ACCEPTE">Accepted</option>
            <option value="REJETE">Rejected</option>
            <option value="CLOTURE">Closed</option>
          </select>
          {(searchQuery || statusFilter) && (
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

      {/* Projects Grid */}
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
      ) : filteredProjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-12 text-center">
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter ? "No projects match your filters" : "No projects found"}
            </p>
            <Button className="flex items-center gap-2 mx-auto" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Create First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const isMember = isUserMember(project)
            const isJoining = joiningProjectId === project.id
            const canJoin = project.visibilite === "PUBLIC" && project.statut === "ACCEPTE"

            return (
              <div key={project.id} className="relative">
                <Link href={isMember ? `/dashboard/projects/${project.id}` : "#"}>
                  <Card className={`hover:shadow-lg transition-shadow h-full ${!isMember ? 'opacity-90' : 'cursor-pointer'}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="line-clamp-2">{project.nom}</CardTitle>
                          <CardDescription className="line-clamp-2 mt-2">
                            {project.description}
                          </CardDescription>
                        </div>
                        <div
                          className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${getStatusColor(project.statut)}`}
                        >
                          {getStatusIcon(project.statut)}
                          {project.statut}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Completion</span>
                            <span className="font-semibold">{project.tauxCompletion}%</span>
                          </div>
                          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${project.tauxCompletion}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Project Stats */}
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{project.nombreMembres} members</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{project.nombreTaches} tasks</span>
                          </div>
                        </div>

                        {/* Join Button for non-members */}
                        {!isMember && canJoin && (
                          <Button
                            className="w-full"
                            size="sm"
                            onClick={(e) => handleJoinProject(project.id, e)}
                            disabled={isJoining}
                          >
                            {isJoining ? "Joining..." : "Join Project"}
                          </Button>
                        )}
                        
                        {!isMember && project.visibilite === "PRIVE" && (
                          <div className="text-xs text-center text-muted-foreground italic">
                            Private project - Invitation required
                          </div>
                        )}

                        {!isMember && project.statut !== "ACCEPTE" && project.visibilite === "PUBLIC" && (
                          <div className="text-xs text-center text-muted-foreground italic">
                            Project not yet accepted
                          </div>
                        )}

                        {isMember && (
                          <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 rounded py-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Member</span>
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

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Fill in the details to create a new project.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProject}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="groupeId">Group *</Label>
                <Select 
                  value={formData.groupeId} 
                  onValueChange={(value) => { setFormData({ ...formData, groupeId: value }); setGroupError(null); setCreateError(null);} }
                  disabled={loadingGroups}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingGroups ? "Chargement des groupes..." : "Sélectionnez un groupe"} />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.length === 0 && !loadingGroups ? (
                      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                        Aucun groupe disponible. Créez d'abord un groupe.
                      </div>
                    ) : (
                      groups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.nom}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {groupError && <p className="text-destructive text-sm mt-2">{groupError}</p>}
              </div>

              {!loadingGroups && groups.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground mb-3">Aucun groupe disponible. Vous pouvez en créer un ici.</p>
                    <div className="flex gap-2">
                      <Button onClick={() => setIsCreateGroupOpen(true)}>Créer un groupe</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="nom">Project Name *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter project description"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Input
                  id="theme"
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  placeholder="e.g., Development, Marketing, Design"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibilite">Visibility</Label>
                <Select value={formData.visibilite} onValueChange={(value) => setFormData({ ...formData, visibilite: value as "PUBLIC" | "PRIVE" })}>
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
                <Label htmlFor="dateEcheance">Deadline</Label>
                <Input
                  id="dateEcheance"
                  type="date"
                  value={formData.dateEcheance}
                  onChange={(e) => setFormData({ ...formData, dateEcheance: e.target.value })}
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
              <Button type="submit" disabled={isCreating || (!loadingGroups && groups.length === 0)}>
                {isCreating ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Créer un groupe</DialogTitle>
            <DialogDescription>Créez un groupe qui pourra être sélectionné pour le projet.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGroup}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="group-nom">Nom du groupe *</Label>
                <Input
                  id="group-nom"
                  value={groupForm.nom}
                  onChange={(e) => setGroupForm((s) => ({ ...s, nom: e.target.value }))}
                  placeholder="Nom du groupe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-description">Description</Label>
                <Textarea
                  id="group-description"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Description (optionnelle)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-type">Type</Label>
                <Select value={groupForm.type} onValueChange={(v) => setGroupForm((s) => ({ ...s, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVE">Privé</SelectItem>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {createGroupError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{createGroupError}</div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateGroupOpen(false)} disabled={isCreatingGroup}>
                Annuler
              </Button>
              <Button type="submit" disabled={isCreatingGroup}>
                {isCreatingGroup ? "Création..." : "Créer le groupe"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {(lastProjectRequest || lastProjectResponse) && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Debug création projet</CardTitle>
            <CardDescription>Requête / Réponse JSON (utile pour debug)</CardDescription>
          </CardHeader>
          <CardContent>
            {lastProjectRequest && (
              <div className="mb-3">
                <div className="text-xs font-semibold mb-1">Dernière requête :</div>
                <pre className="text-xs overflow-auto max-h-40 whitespace-pre-wrap wrap-break-word">{JSON.stringify(lastProjectRequest, null, 2)}</pre>
              </div>
            )}
            {lastProjectResponse && (
              <div>
                <div className="text-xs font-semibold mb-1">Dernière réponse :</div>
                <pre className="text-xs overflow-auto max-h-40 whitespace-pre-wrap wrap-break-word">{JSON.stringify(lastProjectResponse, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}