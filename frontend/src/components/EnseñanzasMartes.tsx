import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useMicroblog } from '../hooks/useMicroblog';
import { Calendar, Clock, User, ExternalLink, RefreshCw } from 'lucide-react';

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

interface EnseñanzasMartesProps {
  maxPosts?: number;
  showFullContent?: boolean;
  className?: string;
}

const EnseñanzasMartes: React.FC<EnseñanzasMartesProps> = ({
  maxPosts = 6,
  showFullContent = false,
  className = ''
}) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const {
    loading,
    error,
    getEnseñanzasMartes,
    getAllPosts,
    formatDate,
    getRelativeTime
  } = useMicroblog();

  useEffect(() => {
    loadPosts();
  }, [maxPosts]);

  const loadPosts = async () => {
    let result = await getEnseñanzasMartes(maxPosts);
    
    // Si no hay posts con la etiqueta específica, cargar todos los posts
    if (!result || result.posts.length === 0) {
      result = await getAllPosts({ maxResults: maxPosts });
    }
    
    if (result) {
      setPosts(result.posts);
    }
  };

  const handleRefresh = () => {
    loadPosts();
  };

  const openPostModal = (post: BlogPost) => {
    setSelectedPost(post);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPost(null);
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <span className="text-sm font-medium">Error:</span>
              <span className="text-sm">{error}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Intentar de nuevo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Enseñanzas de los Martes</h2>
          <p className="text-gray-600 mt-1">
            Reflexiones y enseñanzas bíblicas para fortalecer tu fe
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card 
              key={post.id} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => openPostModal(post)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg group-hover:text-amber-600 transition-colors line-clamp-2">
                    {post.title}
                  </CardTitle>
                  <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
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
                <p className="text-gray-600 line-clamp-3 mb-4">
                  {post.summary}
                </p>
                
                {post.labels && post.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.labels.slice(0, 3).map((label, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {label}
                      </Badge>
                    ))}
                    {post.labels.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{post.labels.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay enseñanzas disponibles</p>
              <p className="text-sm">Las nuevas enseñanzas aparecerán aquí cuando sean publicadas.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal para mostrar post completo */}
      {showModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 pr-4">
                  {selectedPost.title}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(selectedPost.published)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{selectedPost.author.displayName}</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={closeModal}>
                Cerrar
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(90vh-120px)]">
              <div className="p-6">
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                />
                
                {selectedPost.labels && selectedPost.labels.length > 0 && (
                  <>
                    <Separator className="my-6" />
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm font-medium text-gray-700">Etiquetas:</span>
                      {selectedPost.labels.map((label, index) => (
                        <Badge key={index} variant="secondary">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
                
                <Separator className="my-6" />
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Publicado: {formatDate(selectedPost.published)}</span>
                  <a 
                    href={selectedPost.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                  >
                    <span>Ver en Blogger</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnseñanzasMartes;