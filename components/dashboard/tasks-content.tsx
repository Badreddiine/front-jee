"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { tacheApi, projetApi } from "@/lib/api-client"
import type { TacheDTO } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, AlertCircle, Clock, CheckCircle2 } from "lucide-react"

export default function TasksContent() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [tasks, setTasks] = useState<TacheDTO[]>([])
  const [filteredTasks, setFilteredTasks] = useState<TacheDTO[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [stateFilter, setStateFilter] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create Task dialog state (local to this component)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [projects, setProjects] = useState<Array<{ id: number; nom: string }>>([])
  const [loadingProjects, setLoadingProjects] = useState(false)

  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    priorite: "MOYENNE",
    dateEcheance: "",
    projetId: "",
  })

  const [titleError, setTitleError] = useState<string | null>(null)
  const [projectError, setProjectError] = useState<string | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    // reset errors when opening dialog
    if (isCreateDialogOpen) {
      setCreateError(null)
      setTitleError(null)
      setProjectError(null)
    }

    const fetchProjects = async () => {
      if (!isCreateDialogOpen) return
      try {
        setLoadingProjects(true)
        const data = await projetApi.getAll()
        setProjects(data || [])
      } catch (err) {
        setProjects([])
      } finally {
        setLoadingProjects(false)
      }
    }

    fetchProjects()
  }, [isCreateDialogOpen])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateError(null)
    setTitleError(null)
    setProjectError(null)

    let hasError = false
    if (!formData.titre || formData.titre.trim() === "") {
      setTitleError("Le titre est requis")
      hasError = true
    }
    if (!formData.projetId) {
      setProjectError("Veuillez sélectionner un projet")
      hasError = true
    }

    if (hasError) {
      setIsCreating(false)
      return
    }

    try {
      const payload = {
        titre: formData.titre,
        description: formData.description,
        priorite: formData.priorite,
        dateEcheance: formData.dateEcheance || null,
        projetId: parseInt(formData.projetId, 10),
        etat: "A_FAIRE",
      }

      const newTask = await tacheApi.create(payload)
      setTasks((prev) => [...prev, newTask])
      setIsCreateDialogOpen(false)
      setFormData({ titre: "", description: "", priorite: "MOYENNE", dateEcheance: "", projetId: "" })
      setTitleError(null)
      setProjectError(null)
      toast({ title: "Task created", description: "La tâche a été créée avec succès." })
    } catch (err: any) {
      setCreateError(err.message || "Échec de la création de la tâche")
    } finally {
      setIsCreating(false)
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true)
        const data = await tacheApi.getAll()
        setTasks(data || [])
      } catch (err: any) {
        setError(err.message || "Failed to load tasks")
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchTasks()
    }
  }, [user])

  useEffect(() => {
    let filtered = tasks

    if (searchQuery) {
      filtered = filtered.filter((t) => t.titre.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (stateFilter) {
      filtered = filtered.filter((t) => t.etat === stateFilter)
    }

    setFilteredTasks(filtered)
  }, [tasks, searchQuery, stateFilter])

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      HAUTE: "bg-red-100 text-red-800",
      MOYENNE: "bg-yellow-100 text-yellow-800",
      BASSE: "bg-green-100 text-green-800",
    }
    return colors[priority] || "bg-gray-100 text-gray-800"
  }

  const getStateIcon = (state: string) => {
    switch (state) {
      case "TERMINE":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case "EN_COURS":
        return <Clock className="w-4 h-4 text-blue-600" />
      case "A_FAIRE":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary"></div>
          </div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold">Tasks</h1>
          <p className="text-lg text-muted-foreground">Track and manage all your tasks</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          New Task
        </Button>

        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => setIsCreateDialogOpen(open)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Task</DialogTitle>
              <DialogDescription>Remplissez les informations pour créer une nouvelle tâche.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateTask} className="grid gap-4">
              <div>
                <Label htmlFor="titre">Titre</Label>
                <Input
                  id="titre"
                  value={formData.titre}
                  onChange={(e) => { setFormData((s) => ({ ...s, titre: e.target.value })); setTitleError(null); setCreateError(null); }}
                  placeholder="Titre de la tâche"
                  autoFocus
                />
                {titleError && <p className="text-destructive text-sm mt-1">{titleError}</p>}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Description de la tâche"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="priorite">Priorité</Label>
                  <select
                    id="priorite"
                    value={formData.priorite}
                    onChange={(e) => setFormData((s) => ({ ...s, priorite: e.target.value }))}
                    className="px-3 py-2 rounded border border-border w-full"
                  >
                    <option value="HAUTE">HAUTE</option>
                    <option value="MOYENNE">MOYENNE</option>
                    <option value="BASSE">BASSE</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="dateEcheance">Date d'échéance</Label>
                  <Input
                    id="dateEcheance"
                    type="date"
                    value={formData.dateEcheance}
                    onChange={(e) => setFormData((s) => ({ ...s, dateEcheance: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="projet">Projet</Label>
                {loadingProjects ? (
                  <div className="text-sm text-muted-foreground">Chargement des projets...</div>
                ) : projects.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground mb-3">Aucun projet disponible. Créez d'abord un projet.</p>
                      <Button variant="outline" onClick={() => router.push('/dashboard/projects')}>Créer un projet</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <select
                      id="projet"
                      value={formData.projetId}
                      onChange={(e) => { setFormData((s) => ({ ...s, projetId: e.target.value })); setProjectError(null); setCreateError(null); }}
                      className="px-3 py-2 rounded border border-border w-full"
                    >
                      <option value="">Sélectionnez un projet</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nom}
                        </option>
                      ))}
                    </select>
                    {projectError && <p className="text-destructive text-sm mt-1">{projectError}</p>}
                  </>
                )}
              </div>

              {createError && <div className="text-destructive text-sm">{createError}</div>}

              <DialogFooter>
                <Button type="submit" disabled={isCreating || (!loadingProjects && projects.length === 0)}>
                  {isCreating ? "Création..." : "Créer la tâche"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All States</option>
          <option value="A_FAIRE">To Do</option>
          <option value="EN_COURS">In Progress</option>
          <option value="TERMINE">Done</option>
        </select>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tasks Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {["A_FAIRE", "EN_COURS", "TERMINE"].map((state) => {
          const stateTasks = filteredTasks.filter((t) => t.etat === state)
          const stateLabels: Record<string, string> = {
            A_FAIRE: "To Do",
            EN_COURS: "In Progress",
            TERMINE: "Done",
          }

          return (
            <div key={state} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {getStateIcon(state)}
                  {stateLabels[state]}
                </h3>
                <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  {stateTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {stateTasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold line-clamp-2">{task.titre}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityColor(task.priorite)}`}
                          >
                            {task.priorite}
                          </span>
                          {task.dateEcheance && (
                            <span className="text-xs text-muted-foreground">
                              Due: {new Date(task.dateEcheance).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {task.nombreSousTaches > 0 && (
                          <div className="bg-secondary/50 rounded p-2">
                            <div className="text-xs text-muted-foreground mb-1">
                              Sub-tasks: {task.sousTachesTerminees}/{task.nombreSousTaches}
                            </div>
                            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{
                                  width: `${(task.sousTachesTerminees / task.nombreSousTaches) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {stateTasks.length === 0 && (
                  <Card className="border-dashed opacity-50">
                    <CardContent className="pt-8 text-center">
                      <p className="text-sm text-muted-foreground">No tasks</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}