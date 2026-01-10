"use client"

import type { User } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function ProfileCard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
        <CardDescription>Your account information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Full Name</p>
            <p className="text-lg font-semibold text-foreground">{user.fullName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-lg font-semibold text-foreground">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Username</p>
            <p className="text-lg font-semibold text-foreground">{user.identifiant}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <Badge variant="outline" className="mt-1">
              {user.role}
            </Badge>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Link href="/dashboard/profile">
            <Button>Edit Profile</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
