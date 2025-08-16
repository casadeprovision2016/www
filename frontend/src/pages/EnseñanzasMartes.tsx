import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import EnseñanzasMartes from '../components/EnseñanzasMartes';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ArrowLeft, BookOpen, Calendar, Heart, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EnseñanzasMartesPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-amber-600 to-yellow-700 text-white py-16">
          <div className="container mx-auto px-4">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="mb-8 text-white border-white hover:bg-white hover:text-amber-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
            
            <div className="max-w-4xl">
              <div className="flex items-center mb-6">
                <BookOpen className="w-12 h-12 mr-4" />
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Enseñanzas de los Martes
                  </h1>
                  <p className="text-xl md:text-2xl text-blue-100">
                    Reflexiones bíblicas para fortalecer tu fe y caminar con Dios
                  </p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-6 h-6 text-amber-200" />
                  <div>
                    <p className="font-semibold">Cada Martes</p>
                    <p className="text-amber-200 text-sm">Nuevas enseñanzas semanales</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Heart className="w-6 h-6 text-amber-200" />
                  <div>
                    <p className="font-semibold">Crecimiento Espiritual</p>
                    <p className="text-amber-200 text-sm">Fortalece tu relación con Dios</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Share2 className="w-6 h-6 text-amber-200" />
                  <div>
                    <p className="font-semibold">Para Compartir</p>
                    <p className="text-amber-200 text-sm">Bendice a otros con la Palabra</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Sobre las Enseñanzas de los Martes
                    </h2>
                    <p className="text-gray-600 mb-4">
                      Cada martes, nuestro pastor comparte reflexiones profundas basadas en la Palabra de Dios, 
                      diseñadas para nutrir tu alma y fortalecer tu fe. Estas enseñanzas abordan temas relevantes 
                      para la vida cristiana contemporánea.
                    </p>
                    <p className="text-gray-600">
                      Ya sea que busques crecimiento espiritual personal o material para compartir con otros, 
                      encontrarás en estas enseñanzas una fuente de sabiduría bíblica y aplicación práctica.
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-100 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      ¿Qué puedes encontrar?
                    </h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                        Estudios bíblicos profundos
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                        Aplicaciones prácticas
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                        Reflexiones espirituales
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                        Testimonios y experiencias
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                        Oraciones y meditaciones
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <EnseñanzasMartes 
              maxPosts={12} 
              showFullContent={false}
              className="max-w-7xl mx-auto"
            />
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Mantente Conectado
                </h2>
                <p className="text-gray-600 mb-6">
                  Recibe notificaciones cuando publiquemos nuevas enseñanzas y reflexiones bíblicas.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-amber-600 hover:bg-amber-700">
                    Suscribirse por Email
                  </Button>
                  <Button variant="outline" size="lg">
                    Seguir en WhatsApp
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  También puedes seguirnos en nuestras redes sociales para más contenido.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default EnseñanzasMartesPage;