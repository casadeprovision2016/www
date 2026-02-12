import { getDB } from '@/lib/db/client'
import Header from '@/components/home/Header'
import HeroSection from '@/components/home/HeroSection'
import AboutSection from '@/components/home/AboutSection'
import CalendarSection from '@/components/home/CalendarSection'
import LiveStreamSection from '@/components/home/LiveStreamSection'
import DonationsSection from '@/components/home/DonationsSection'
import ContactSection from '@/components/home/ContactSection'
import MisionesSection from '@/components/home/MisionesSection'
import Footer from '@/components/home/Footer'

type PublicEvent = {
  id: string
  title: string
  description: string | null
  event_date: string
  end_date: string | null
  location: string | null
  event_type: string | null
  status: string
}

type PublicStream = {
  id: string
  title: string
  description: string | null
  stream_url: string
  platform: string | null
  scheduled_date: string
  status: string | null
}

export default async function Home() {
  let events: PublicEvent[] = []
  let streams: PublicStream[] = []

  try {
    const db = await getDB()

    // Buscar próximos eventos (scheduled ou ongoing)
    const eventsResult = await db
      .prepare(`
        SELECT * FROM events 
        WHERE status IN ('scheduled', 'ongoing')
        ORDER BY event_date ASC
        LIMIT 6
      `)
      .all<PublicEvent>()
    events = eventsResult.results || []

    // Buscar próximas transmisiones (scheduled o live)
    const streamsResult = await db
      .prepare(`
        SELECT * FROM streams 
        WHERE status IN ('scheduled', 'live')
        ORDER BY scheduled_date ASC
        LIMIT 3
      `)
      .all<PublicStream>()
    streams = streamsResult.results || []
  } catch (error) {
    // Handle build-time database errors (e.g., missing tables during initial build)
    // This allows the page to render with empty data while migrations are pending
    const errorMsg = error instanceof Error ? error.message : String(error)
    
    if (errorMsg.includes('no such table') || errorMsg.includes('SQLITE_ERROR')) {
      console.warn('[Homepage] Database tables not yet initialized. Rendering with empty data. Run migrations to populate events and streams.')
    } else {
      // Re-throw unexpected errors
      console.error('[Homepage] Database error:', error)
      throw error
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <AboutSection />
      <CalendarSection events={events} />
      <LiveStreamSection streams={streams} />
      <DonationsSection />
      <ContactSection />
      <MisionesSection />
      <Footer />
    </div>
  )
}
