"use client"

import { useEffect, useState } from "react"
import { apiCall } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Calendrier {
  idCalendrier: number
  nom: string
  description: string
  couleur: string
  statut: string
  nombreEvenements: number
}

export default function CalendarPage() {
  const [calendars, setCalendars] = useState<Calendrier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        const data = await apiCall("/calendriers")
        setCalendars(Array.isArray(data) ? data : data.data || [])
      } catch (err) {
        setError("Erreur lors du chargement des calendriers")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCalendars()
  }, [])

  if (loading) return <div className="p-6 text-center">Chargement...</div>
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>

  const today = new Date()
  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i))
  }

  const monthName = new Date(year, month).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendrier</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{monthName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2">
                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => (
                  <div
                    key={index}
                    className={`p-2 text-center text-sm rounded-lg border ${
                      day === null
                        ? "bg-gray-50"
                        : day.getDate() === today.getDate() &&
                            day.getMonth() === today.getMonth() &&
                            day.getFullYear() === today.getFullYear()
                          ? "bg-primary text-white font-bold"
                          : "bg-white hover:bg-secondary border-gray-200"
                    }`}
                  >
                    {day?.getDate()}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendars Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Calendriers</CardTitle>
              <CardDescription>{calendars.length} calendrier(s)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {calendars.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun calendrier trouvé</p>
              ) : (
                calendars.map((calendar) => (
                  <div key={calendar.idCalendrier} className="flex items-start gap-3">
                    <div
                      className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: calendar.couleur || "#3b82f6" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-sm font-medium text-foreground truncate">{calendar.nom}</div>
                      <div className="text-xs text-muted-foreground">{calendar.nombreEvenements} événement(s)</div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {calendar.statut}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedDate(new Date(year, month - 1))}
              className="flex-1 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition"
            >
              Précédent
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="flex-1 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition"
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setSelectedDate(new Date(year, month + 1))}
              className="flex-1 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
