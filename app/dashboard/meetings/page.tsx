"use client"

import { useEffect, useState } from "react"
import { apiCall } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Calendar, Users, MapPin, Clock } from "lucide-react"

interface Reunion {
  idReunion: number
  titre: string
  description: string
  dateDebut: string
  dateFin: string
  salle: string
  idOrganisateur: number
  statut: string
  participants: Array<{ idUtilisateur: number; nom: string }>
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Reunion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const data = await apiCall("/reunions")
        setMeetings(Array.isArray(data) ? data : data.data || [])
      } catch (err) {
        setError("Erreur lors du chargement des réunions")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchMeetings()
  }, [])

  if (loading) return <div className="p-6 text-center">Chargement...</div>
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Réunions</h1>
        <Button asChild>
          <Link href="/dashboard/meetings/new">Nouvelle Réunion</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {meetings.map((meeting) => (
          <Card key={meeting.idReunion} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{meeting.titre}</CardTitle>
                  <CardDescription>{meeting.description}</CardDescription>
                </div>
                <Badge variant={meeting.statut === "CONFIRMEE" ? "default" : "secondary"}>{meeting.statut}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                {new Date(meeting.dateDebut).toLocaleDateString("fr-FR")}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                {new Date(meeting.dateDebut).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                {meeting.salle}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                {meeting.participants.length} participant(s)
              </div>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href={`/dashboard/meetings/${meeting.idReunion}`}>Voir détails</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {meetings.length === 0 && (
        <Card className="text-center p-12">
          <p className="text-gray-500 mb-4">Aucune réunion trouvée</p>
          <Button asChild>
            <Link href="/dashboard/meetings/new">Créer votre première réunion</Link>
          </Button>
        </Card>
      )}
    </div>
  )
}
