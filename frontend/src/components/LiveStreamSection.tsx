
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Video, Youtube, ExternalLink } from 'lucide-react';

const LiveStreamSection = () => {
  const recordings = [
    {
      id: 1,
      title: "Culto Dominical - Pastor Ricardo",
      date: "15 de Enero, 2024",
      duration: "45 min",
      thumbnail: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=400&h=225&fit=crop",
      type: "Culto Dominical"
    },
    {
      id: 2,
      title: "Estudio Bíblico - Pastora Luzinete",
      date: "12 de Enero, 2024",
      duration: "35 min",
      thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=225&fit=crop",
      type: "Estudio Bíblico"
    },
    {
      id: 3,
      title: "Mensaje Especial - Anciano Alejandro",
      date: "10 de Enero, 2024",
      duration: "40 min",
      thumbnail: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=225&fit=crop",
      type: "Mensaje"
    }
  ];

  return (
    <section id="transmisiones" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-church-blue-dark mb-6">
            Transmisiones en Vivo
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Conecta con nosotros desde cualquier lugar y mantente en comunión
          </p>
        </div>

        {/* Live Stream Section */}
        <div className="mb-16">
          <Card className="bg-gradient-to-r from-church-blue to-church-blue-dark text-white shadow-2xl">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-200 font-semibold">EN VIVO</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-4">
                    Culto Dominical
                  </h3>
                  <p className="text-xl text-blue-100 mb-6">
                    Únete a nuestro culto dominical en vivo cada domingo a las 9:00 AM
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      size="lg" 
                      className="bg-church-gold hover:bg-church-gold-dark text-white font-semibold"
                      onClick={() => window.open('https://www.youtube.com/channel/UCiZGj9wHkU6X4XBjZZ5VoFg', '_blank')}
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Ver Transmisión
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="border-white text-white hover:bg-white hover:text-church-blue"
                      onClick={() => window.open('https://www.youtube.com/@cc.casadeprovision', '_blank')}
                    >
                      <Youtube className="mr-2 h-5 w-5" />
                      Canal de YouTube
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <div className="bg-black/20 rounded-lg p-8 text-center">
                    <Video className="h-20 w-20 mx-auto mb-4 text-church-gold" />
                    <p className="text-lg">Transmisión comenzará pronto...</p>
                    <p className="text-blue-200">Domingos 9:00 AM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Previous Recordings */}
        <div>
          <h3 className="text-3xl font-bold text-church-blue-dark mb-8 text-center">
            Grabaciones Anteriores
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recordings.map((recording) => (
              <Card key={recording.id} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="relative">
                  <img 
                    src={recording.thumbnail} 
                    alt={recording.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-t-lg">
                    <Button 
                      size="lg"
                      className="bg-church-gold hover:bg-church-gold-dark text-white"
                      onClick={() => window.open('https://www.youtube.com/@cc.casadeprovision/streams', '_blank')}
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Reproducir
                    </Button>
                  </div>
                  <div className="absolute top-4 left-4 bg-church-gold text-white px-2 py-1 rounded text-sm font-semibold">
                    {recording.type}
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    {recording.duration}
                  </div>
                </div>
                <CardContent className="p-6">
                  <h4 className="text-lg font-bold text-church-blue-dark mb-2 line-clamp-2">
                    {recording.title}
                  </h4>
                  <p className="text-gray-600 mb-4">{recording.date}</p>
                  <Button 
                    variant="outline" 
                    className="w-full border-church-blue text-church-blue hover:bg-church-blue hover:text-white"
                    onClick={() => window.open('https://www.youtube.com/@cc.casadeprovision/streams', '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver en YouTube
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            size="lg"
            className="border-church-blue text-church-blue hover:bg-church-blue hover:text-white font-semibold px-8"
            onClick={() => window.open('https://www.youtube.com/@cc.casadeprovision/streams', '_blank')}
          >
            Ver Más Grabaciones
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LiveStreamSection;
