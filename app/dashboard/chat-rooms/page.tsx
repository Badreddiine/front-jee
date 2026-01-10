"use client"

import { useEffect, useState } from "react"
import { apiCall } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { MessageSquare, Users, Lock } from "lucide-react"

interface SalleDiscussion {
  idSalle: number
  nom: string
  description: string
  type: string
  nombreParticipants: number
  statut: string
  dateCreation: string
  isPrivee: boolean
}

export default function ChatRoomsPage() {
  const [rooms, setRooms] = useState<SalleDiscussion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await apiCall("/salles-discussion")
        setRooms(Array.isArray(data) ? data : data.data || [])
      } catch (err) {
        setError("Erreur lors du chargement des salles de discussion")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchRooms()
  }, [])

  if (loading) return <div className="p-6 text-center">Chargement...</div>
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Salles de Discussion</h1>
        <Button asChild>
          <Link href="/dashboard/chat-rooms/new">Nouvelle Salle</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rooms.map((room) => (
          <Card key={room.idSalle} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{room.nom}</CardTitle>
                    {room.isPrivee && <Lock className="w-4 h-4 text-gray-500" />}
                  </div>
                  <CardDescription>{room.description}</CardDescription>
                </div>
                <Badge variant={room.statut === "ACTIF" ? "default" : "secondary"}>{room.statut}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MessageSquare className="w-4 h-4" />
                {room.type}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                {room.nombreParticipants} participant(s)
              </div>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href={`/dashboard/chat-rooms/${room.idSalle}`}>Entrer</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {rooms.length === 0 && (
        <Card className="text-center p-12">
          <p className="text-gray-500 mb-4">Aucune salle de discussion trouvée</p>
          <Button asChild>
            <Link href="/dashboard/chat-rooms/new">Créer votre première salle</Link>
          </Button>
        </Card>
      )}
    </div>
  )
}
