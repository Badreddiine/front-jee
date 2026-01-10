"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { tacheApi, type TacheDTO } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Task
        </Button>
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
