"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import ProfileForm from "@/components/dashboard/profile-form"

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading || !user) return null

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-lg text-muted-foreground">Manage your account information</p>
        </div>
        <ProfileForm user={user} />
      </div>
    </DashboardLayout>
  )
}
