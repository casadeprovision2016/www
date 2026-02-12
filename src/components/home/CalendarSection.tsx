import CalendarSectionIsland from '@/components/home/CalendarSectionIsland'

interface Event {
  id: string
  title: string
  description: string | null
  event_date: string
  end_date: string | null
  location: string | null
  event_type: string | null
  status: string
}

interface CalendarSectionProps {
  events: Event[]
}

export default function CalendarSection({ events }: CalendarSectionProps) {
  return <CalendarSectionIsland events={events} />
}
