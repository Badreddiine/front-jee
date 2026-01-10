"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiCall } from "@/lib/api-client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Users, FileText, Activity, TrendingUp } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await apiCall("/statistiques")
        setStats(data)
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  const statCards = [
    {
      title: "Total Utilisateurs",
      value: stats?.totalUtilisateurs || 0,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Total Projets",
      value: stats?.totalProjets || 0,
      icon: FileText,
      color: "text-green-500",
    },
    {
      title: "Utilisateurs Actifs",
      value: stats?.utilisateursActifs || 0,
      icon: Activity,
      color: "text-purple-500",
    },
    {
      title: "Taux de Croissance",
      value: `${stats?.tauxCroissance || 0}%`,
      icon: TrendingUp,
      color: "text-orange-500",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  {stat.title}
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs par Mois</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.utilisateursMensuel || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribution des Rôles</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.distributionRoles || []}
                  dataKey="value"
                  nameKey="role"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {(stats?.distributionRoles || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
