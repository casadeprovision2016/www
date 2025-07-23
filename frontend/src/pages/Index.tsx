
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import CalendarSection from '@/components/CalendarSection';
import LiveStreamSection from '@/components/LiveStreamSection';
import DonationsSection from '@/components/DonationsSection';
import ContactSection from '@/components/ContactSection';
import MisionesSection from '@/components/MisionesSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <AboutSection />
      <CalendarSection />
      <LiveStreamSection />
      <DonationsSection />
      <ContactSection />
      <MisionesSection />
      <Footer />
    </div>
  );
};

export default Index;
