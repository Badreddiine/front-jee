"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart3, Users, LogOut, Home, Lock } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, logout, loading } = useAuth()

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || user.role !== "ADMIN") {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 bg-card border-r border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Lock className="w-6 h-6" />
            Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">System Management</p>
        </div>

        <nav className="p-4 space-y-2">
          <Link href="/admin">
            <Button variant="ghost" className="w-full justify-start gap-2 text-left">
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="ghost" className="w-full justify-start gap-2 text-left">
              <Users className="w-4 h-4" />
              Utilisateurs
            </Button>
          </Link>
          <Link href="/admin/analytics">
            <Button variant="ghost" className="w-full justify-start gap-2 text-left">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Button>
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
          <Button
            variant="destructive"
            size="sm"
            className="w-full gap-2"
            onClick={() => {
              logout()
              router.push("/login")
            }}
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Admin Panel</h2>
              <p className="text-muted-foreground mt-1">Bienvenue, {user.prenom}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Connecté en tant que</p>
              <p className="font-semibold text-foreground">{user.displayName}</p>
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
