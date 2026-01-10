"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authApi } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context" // Si vous utilisez un contexte

export default function RegisterPage() {
  const router = useRouter()
  // const { setAuth } = useAuth() // Optionnel : si vous voulez mettre à jour le contexte global
  
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    identifiant: "",
    motDePasse: "",
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // 1. Inscription + Réception des tokens (grâce à la modif Backend)
      const response = await authApi.register(formData)

      console.log("Réponse inscription:", response)

      // 2. Vérification et Stockage des tokens
      if (response && response.accessToken) {
        localStorage.setItem("accessToken", response.accessToken)
        localStorage.setItem("refreshToken", response.refreshToken)
        
        // Si vous avez un contexte d'auth, mettez-le à jour ici si besoin
        // setAuth(response.utilisateur) 

        // 3. Redirection vers le Dashboard (car l'utilisateur est connecté !)
        alert("Compte créé et connecté !") 
        router.push("/dashboard")
      } else {
        throw new Error("Inscription réussie mais aucun token reçu.")
      }

    } catch (err: any) {
      console.error("Erreur:", err)
      setError(err.message || "Erreur lors de l'inscription")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* ... Le reste du JSX (formulaire) reste identique à avant ... */}
      <div className="w-full max-w-md space-y-6">
         {/* ... card, inputs, button ... */}
         {/* Je ne remets pas tout le HTML pour ne pas surcharger, gardez votre design */}
         <Card className="border-border shadow-sm">
            <CardHeader><CardTitle>Inscription</CardTitle></CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                    
                    {/* Vos Inputs Nom, Prénom, Email, Password ici... */}
                    <Input name="prenom" placeholder="Prénom" onChange={handleChange} required />
                    <Input name="nom" placeholder="Nom" onChange={handleChange} required />
                    <Input name="identifiant" placeholder="Identifiant" onChange={handleChange} required />
                    <Input name="email" type="email" placeholder="Email" onChange={handleChange} required />
                    <Input name="motDePasse" type="password" placeholder="Mot de passe" onChange={handleChange} required />

                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="animate-spin" /> : "S'inscrire et se connecter"}
                    </Button>
                </form>
            </CardContent>
         </Card>
      </div>
    </div>
  )
}