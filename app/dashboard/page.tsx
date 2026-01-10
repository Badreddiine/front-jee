"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { projetApi, tacheApi } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ProfileCard from "@/components/dashboard/profile-card"
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { FolderOpen, CheckCircle2, Clock } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
  })
  const [projectStats, setProjectStats] = useState<any[]>([])
  const [taskStats, setTaskStats] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const [projects, tasks] = await Promise.all([projetApi.getAll(), tacheApi.getAll()])

        const projectData = projects || []
        const taskData = tasks || []

        setStats({
          totalProjects: projectData.length,
          totalTasks: taskData.length,
          completedTasks: taskData.filter((t: any) => t.etat === "TERMINE").length,
          inProgressTasks: taskData.filter((t: any) => t.etat === "EN_COURS").length,
        })

        // Project status distribution
        const projectStatusCount = projectData.reduce((acc: any, p: any) => {
          acc[p.statut] = (acc[p.statut] || 0) + 1
          return acc
        }, {})

        setProjectStats(
          Object.entries(projectStatusCount).map(([status, count]: [string, any]) => ({
            name: status,
            value: count,
          })),
        )

        // Task status distribution
        const taskStatusCount = taskData.reduce((acc: any, t: any) => {
          acc[t.etat] = (acc[t.etat] || 0) + 1
          return acc
        }, {})

        setTaskStats(
          Object.entries(taskStatusCount).map(([status, count]: [string, any]) => ({
            name: status === "A_FAIRE" ? "To Do" : status === "EN_COURS" ? "In Progress" : "Done",
            value: count,
          })),
        )
      } catch (err) {
        console.error("[v0] Error fetching stats:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchStats()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary"></div>
          </div>
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="text-lg text-muted-foreground">Welcome back, {user.displayName || user.fullName}</p>
      </div>

      <ProfileCard user={user} />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">All projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">All tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">Currently working on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">Tasks finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Chart */}
        {taskStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tasks Distribution</CardTitle>
              <CardDescription>Distribution of tasks by status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={taskStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={{ position: "insideRight" }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {taskStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Project Status Chart */}
        {projectStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Projects Distribution</CardTitle>
              <CardDescription>Distribution of projects by status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={projectStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={{ position: "insideRight" }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {projectStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
