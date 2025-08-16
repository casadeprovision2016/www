import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Clock, User, ArrowRight, BookOpen } from 'lucide-react';
import { useMicroblog } from '../hooks/useMicroblog';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  summary: string;
  published: string;
  updated: string;
  url: string;
  author: {
    id: string;
    displayName: string;
    image?: {
      url: string;
    };
  };
  labels?: string[];
  images?: Array<{
    url: string;
  }>;
}

const EnseñanzasMartesSection: React.FC = () => {
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const navigate = useNavigate();
  
  const {
    loading,
    error,
    getEnseñanzasMartes,
    getAllPosts,
    getRelativeTime
  } = useMicroblog();

  useEffect(() => {
    loadRecentPosts();
  }, []);

  const loadRecentPosts = async () => {
    // Cargar solo los 3 posts más recientes para la vista de resumen
    let result = await getEnseñanzasMartes(3);
    
    // Si no hay posts con la etiqueta específica, cargar todos los posts
    if (!result || result.posts.length === 0) {
      result = await getAllPosts({ maxResults: 3 });
    }
    
    if (result) {
      setRecentPosts(result.posts);
    }
  };

  const handleViewAll = () => {
    // Navegar a la página completa de enseñanzas
    navigate('/enseñanzas-martes');
  };

  const openPost = (post: BlogPost) => {
    // Abrir en nueva ventana o navegar a vista detallada
    window.open(post.url, '_blank');
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto border-orange-200 bg-orange-50">
            <CardContent className="pt-6 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-orange-500" />
              <p className="text-orange-800 font-medium">
                Las enseñanzas no están disponibles en este momento
              </p>
              <p className="text-orange-600 text-sm mt-2">
                Por favor, intenta más tarde
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-r from-amber-50 to-yellow-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-amber-600 mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">
              Enseñanzas de los Martes
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Reflexiones bíblicas y enseñanzas pastorales para fortalecer tu caminar con Dios
          </p>
        </div>

        {/* Posts Grid */}
        {recentPosts.length > 0 ? (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {recentPosts.map((post, index) => (
                <Card 
                  key={post.id} 
                  className={`hover:shadow-lg transition-all duration-200 cursor-pointer group ${
                    index === 0 ? 'md:col-span-2' : ''
                  }`}
                  onClick={() => openPost(post)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className={`group-hover:text-amber-600 transition-colors line-clamp-2 ${
                        index === 0 ? 'text-xl' : 'text-lg'
                      }`}>
                        {post.title}
                      </CardTitle>
                      <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{getRelativeTime(post.published)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{post.author.displayName}</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className={`text-gray-600 mb-4 ${
                      index === 0 ? 'line-clamp-4' : 'line-clamp-3'
                    }`}>
                      {post.summary}
                    </p>
                    
                    {post.labels && post.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.labels.slice(0, index === 0 ? 4 : 2).map((label, labelIndex) => (
                          <Badge key={labelIndex} variant="secondary" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                        {post.labels.length > (index === 0 ? 4 : 2) && (
                          <Badge variant="outline" className="text-xs">
                            +{post.labels.length - (index === 0 ? 4 : 2)}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Ver todas las enseñanzas */}
            <div className="text-center">
              <Button 
                onClick={handleViewAll}
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3"
              >
                Ver todas las enseñanzas
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </>
        ) : (
          /* Estado vacío */
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Próximamente
              </h3>
              <p className="text-gray-600">
                Las enseñanzas de los martes aparecerán aquí cuando sean publicadas.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Te gustaría recibir notificaciones?
            </h3>
            <p className="text-gray-600 mb-6">
              Mantente al día con las nuevas enseñanzas y reflexiones bíblicas.
              Únete a nuestra comunidad para crecer espiritualmente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="lg">
                Suscribirse por Email
              </Button>
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                Unirse al WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnseñanzasMartesSection;