"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiCall } from "@/lib/api-client"
import { Trash2, Shield, Eye, EyeOff } from "lucide-react"
import type { User } from "@/lib/auth-context"

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<string>("ALL")

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const data = await apiCall("/utilisateurs")
        setUsers(Array.isArray(data) ? data : data.data || [])
      } catch (error) {
        console.error("Failed to fetch users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur?")) return

    try {
      await apiCall(`/utilisateurs/${userId}`, { method: "DELETE" })
      setUsers(users.filter((u) => u.id !== userId))
    } catch (error) {
      console.error("Failed to delete user:", error)
    }
  }

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      await apiCall(`/utilisateurs/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ actif: !currentStatus }),
      })
      setUsers(users.map((u) => (u.id === userId ? { ...u, actif: !currentStatus } : u)))
    } catch (error) {
      console.error("Failed to update user:", error)
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) || u.displayName.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "ALL" || u.role === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gestion des Utilisateurs</span>
            <span className="text-sm font-normal text-muted-foreground">{users.length} total</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Rechercher par email ou nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-64"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="ALL">Tous les rôles</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">Utilisateur</option>
              <option value="MODERATOR">Modérateur</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Utilisateur</th>
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 font-semibold">Rôle</th>
                  <th className="text-left py-3 px-4 font-semibold">Statut</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      Chargement...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-secondary/30 transition">
                      <td className="py-3 px-4">
                        <div className="font-medium">{user.displayName}</div>
                        <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                      </td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          <Shield className="w-3 h-3" />
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.actif
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {user.actif ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(user.id, user.actif)}
                            title={user.actif ? "Désactiver" : "Activer"}
                          >
                            {user.actif ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
