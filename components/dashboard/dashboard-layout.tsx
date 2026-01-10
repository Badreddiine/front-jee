"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings, Menu, X } from "lucide-react"
import { useState } from "react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/projects", label: "Projects" },
    { href: "/dashboard/tasks", label: "Tasks" },
    { href: "/dashboard/meetings", label: "Meetings" },
    { href: "/dashboard/groups", label: "Groups" },
    { href: "/dashboard/events", label: "Events" },
    { href: "/dashboard/calendar", label: "Calendar" },
    { href: "/dashboard/mailing-lists", label: "Mailing Lists" },
    { href: "/dashboard/chat-rooms", label: "Chat Rooms" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
              >
                Dashboard
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex space-x-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded-md transition"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-secondary hidden sm:flex">
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">{user?.displayName || user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="flex items-center space-x-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    <span>Profile Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center space-x-2 cursor-pointer text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="lg:hidden mt-4 space-y-2 border-t border-border pt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded-md transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
