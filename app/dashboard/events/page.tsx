"use client"

import { useEffect, useState } from "react"
import { apiCall } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Calendar, Clock, Users } from "lucide-react"

interface Evenement {
  idEvenement: number
  titre: string
  description: string
  dateDebut: string
  dateFin: string
  lieu: string
  typeEvenement: string
  statut: string
  participants: number
}

export default function EventsPage() {
  const [events, setEvents] = useState<Evenement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await apiCall("/evenements")
        setEvents(Array.isArray(data) ? data : data.data || [])
      } catch (err) {
        setError("Erreur lors du chargement des événements")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  if (loading) return <div className="p-6 text-center">Chargement...</div>
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Événements</h1>
        <Button asChild>
          <Link href="/dashboard/events/new">Nouvel Événement</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.idEvenement} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{event.titre}</CardTitle>
                  <CardDescription>{event.description}</CardDescription>
                </div>
                <Badge variant={event.statut === "ACTIF" ? "default" : "secondary"}>{event.statut}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                {new Date(event.dateDebut).toLocaleDateString("fr-FR")}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                {new Date(event.dateDebut).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                {event.participants} participant(s)
              </div>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href={`/dashboard/events/${event.idEvenement}`}>Voir détails</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <Card className="text-center p-12">
          <p className="text-gray-500 mb-4">Aucun événement trouvé</p>
          <Button asChild>
            <Link href="/dashboard/events/new">Créer votre premier événement</Link>
          </Button>
        </Card>
      )}
    </div>
  )
}
