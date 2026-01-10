"use client"

import { useEffect, useState } from "react"
import { apiCall } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Users } from "lucide-react"

interface ListeDiffusion {
  idListeDiffusion: number
  nom: string
  email: string
  description: string
  nombreAbonnes: number
  statut: string
  dateCreation: string
}

export default function MailingListsPage() {
  const [lists, setLists] = useState<ListeDiffusion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const data = await apiCall("/listes-diffusion")
        setLists(Array.isArray(data) ? data : data.data || [])
      } catch (err) {
        setError("Erreur lors du chargement des listes de diffusion")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchLists()
  }, [])

  if (loading) return <div className="p-6 text-center">Chargement...</div>
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Listes de Diffusion</h1>
        <Button asChild>
          <Link href="/dashboard/mailing-lists/new">Nouvelle Liste</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {lists.map((list) => (
          <Card key={list.idListeDiffusion} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{list.nom}</CardTitle>
                  <CardDescription>{list.email}</CardDescription>
                </div>
                <Badge variant={list.statut === "ACTIF" ? "default" : "secondary"}>{list.statut}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">{list.description}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                {list.nombreAbonnes} abonné(s)
              </div>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href={`/dashboard/mailing-lists/${list.idListeDiffusion}`}>Voir détails</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {lists.length === 0 && (
        <Card className="text-center p-12">
          <p className="text-gray-500 mb-4">Aucune liste de diffusion trouvée</p>
          <Button asChild>
            <Link href="/dashboard/mailing-lists/new">Créer votre première liste</Link>
          </Button>
        </Card>
      )}
    </div>
  )
}
