'use client'

import dynamic from 'next/dynamic'

type Event = {
  id: string
  title: string
  description: string | null
  event_date: string
  end_date: string | null
  location: string | null
  event_type: string | null
  status: string
}

interface CalendarSectionIslandProps {
  events: Event[]
}

const CalendarSectionClient = dynamic(
  () => import('@/components/home/CalendarSectionClient'),
  {
    ssr: false,
    loading: () => (
      <section id="calendario" className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-church-blue-dark mb-3">
              Calendario de Actividades
            </h2>
            <p className="text-lg text-gray-600">Cargando calendario...</p>
          </div>
          <div className="h-64 bg-white rounded-lg animate-pulse" />
        </div>
      </section>
    ),
  }
)

export default function CalendarSectionIsland({ events }: CalendarSectionIslandProps) {
  return <CalendarSectionClient events={events} />
}
