"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { authApi } from "./api-client"

export interface User {
  id: number
  identifiant: string
  nom: string
  prenom: string
  email: string
  photoProfile?: string
  avatar?: string
  actif: boolean
  estEnLigne: boolean
  estConnecte: boolean
  derniereConnexion: string
  role: string
  roleSecondaire?: string
  displayName: string
  fullName: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => Promise<void>
  updateUser: (userData: any) => Promise<void>
  changePassword: (ancienMotDePasse: string, nouveauMotDePasse: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken")
        if (token) {
          const userData = await authApi.me()
          setUser(userData)
        }
      } catch (err) {
        console.error("[v0] Auth check error:", err)
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await authApi.login(email, password)
      localStorage.setItem("accessToken", response.accessToken)
      localStorage.setItem("refreshToken", response.refreshToken)
      localStorage.setItem("tokenExpiresIn", response.expiresIn.toString())
      setUser(response.utilisateur)
    } catch (err: any) {
      const errorMessage = err.message || "Erreur de connexion"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: any) => {
    setLoading(true)
    setError(null)
    try {
      const response = await authApi.register(userData)
      localStorage.setItem("accessToken", response.accessToken)
      localStorage.setItem("refreshToken", response.refreshToken)
      localStorage.setItem("tokenExpiresIn", response.expiresIn.toString())
      setUser(response.utilisateur)
    } catch (err: any) {
      const errorMessage = err.message || "Erreur d'inscription"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await authApi.logout()
    } catch (err) {
      console.error("[v0] Logout error:", err)
    } finally {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("tokenExpiresIn")
      setUser(null)
      setLoading(false)
    }
  }

  const updateUser = async (userData: any) => {
    setLoading(true)
    setError(null)
    try {
      const updatedUser = await authApi.updateProfile(user?.id!, userData)
      setUser(updatedUser)
    } catch (err: any) {
      const errorMessage = err.message || "Erreur de mise à jour"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async (ancienMotDePasse: string, nouveauMotDePasse: string) => {
    setLoading(true)
    setError(null)
    try {
      await authApi.changePassword(user?.id!, { ancienMotDePasse, nouveauMotDePasse })
      setError(null)
    } catch (err: any) {
      const errorMessage = err.message || "Erreur lors du changement de mot de passe"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateUser,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
