import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { useMicroblog } from '../../hooks/useMicroblog';
import { 
  BookOpen, 
  Calendar, 
  User, 
  ExternalLink, 
  RefreshCw, 
  Search,
  Filter,
  TrendingUp,
  Eye,
  Trash2,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../ui/use-toast';

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

const MicroblogManager: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [blogInfo, setBlogInfo] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  const { user } = useAuth();
  const {
    loading,
    error,
    getAllPosts,
    getPostsByCategory,
    getBlogInfo,
    getStats,
    clearCache,
    formatDate,
    getRelativeTime
  } = useMicroblog();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, selectedCategory, searchTerm]);

  const loadInitialData = async () => {
    await Promise.all([
      loadPosts(),
      loadBlogInfo(),
      loadStats()
    ]);
  };

  const loadPosts = async () => {
    const result = await getAllPosts({ maxResults: 50 });
    if (result) {
      setPosts(result.posts);
    }
  };

  const loadBlogInfo = async () => {
    const info = await getBlogInfo();
    if (info) {
      setBlogInfo(info);
    }
  };

  const loadStats = async () => {
    const statsData = await getStats();
    if (statsData) {
      setStats(statsData);
    }
  };

  const filterPosts = () => {
    let filtered = posts;

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => 
        post.labels?.some(label => 
          label.toLowerCase().includes(selectedCategory.toLowerCase())
        )
      );
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPosts(filtered);
  };

  const handleRefresh = async () => {
    await loadInitialData();
    toast({
      title: "Actualizado",
      description: "Los datos del microblog han sido actualizados.",
    });
  };

  const handleClearCache = async () => {
    const success = await clearCache();
    if (success) {
      toast({
        title: "Caché limpiado",
        description: "El caché del microblog ha sido limpiado exitosamente.",
      });
      await loadPosts();
    } else {
      toast({
        title: "Error",
        description: "No se pudo limpiar el caché.",
        variant: "destructive",
      });
    }
  };

  const openPost = (post: BlogPost) => {
    window.open(post.url, '_blank');
  };

  const categories = [
    { value: 'all', label: 'Todos los posts', icon: BookOpen },
    { value: 'enseñanza-martes', label: 'Enseñanzas de Martes', icon: Calendar },
    { value: 'reflexion', label: 'Reflexiones', icon: BookOpen },
    { value: 'devocional', label: 'Devocionales', icon: BookOpen },
    { value: 'anuncio', label: 'Anuncios', icon: TrendingUp },
    { value: 'testimonio', label: 'Testimonios', icon: User }
  ];

  if (!user || (user.role !== 'leader' && user.role !== 'admin')) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-gray-500">No tienes permisos para acceder a esta sección.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Microblog</h2>
          <p className="text-gray-600">Administra las enseñanzas y posts del blog</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="outline" onClick={handleClearCache}>
            <Trash2 className="w-4 h-4 mr-2" />
            Limpiar Caché
          </Button>
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar con estadísticas y filtros */}
          <div className="space-y-4">
            {/* Información del blog */}
            {blogInfo && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Información del Blog</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">{blogInfo.name}</p>
                    <p className="text-xs text-gray-500">{blogInfo.description}</p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">{blogInfo.posts?.totalPosts || 0}</span>
                      <span className="ml-1">posts</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Estadísticas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{filteredPosts.length}</div>
                  <div className="text-sm text-gray-500">Posts encontrados</div>
                </div>
                {stats?.categories && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Categorías disponibles:</p>
                    <div className="space-y-1">
                      {stats.categories.slice(0, 4).map((cat: any, index: number) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-gray-600">{cat.name}</span>
                          <Badge variant="secondary" className="text-xs">{cat.slug}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Búsqueda */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="text"
                  placeholder="Buscar posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </CardContent>
            </Card>
          </div>

          {/* Contenido principal */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Posts del Microblog</CardTitle>
                    <CardDescription>
                      {filteredPosts.length} de {posts.length} posts
                    </CardDescription>
                  </div>
                  <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-6">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <TabsTrigger key={category.value} value={category.value} className="text-xs">
                          <Icon className="w-3 h-3 mr-1" />
                          <span className="hidden lg:inline">{category.label}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600">Error: {error}</p>
                    <Button onClick={handleRefresh} className="mt-4">
                      Reintentar
                    </Button>
                  </div>
                ) : filteredPosts.length > 0 ? (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {filteredPosts.map((post) => (
                        <Card key={post.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 
                                  className="font-semibold text-lg cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
                                  onClick={() => openPost(post)}
                                >
                                  {post.title}
                                </h3>
                                
                                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{getRelativeTime(post.published)}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <User className="w-3 h-3" />
                                    <span>{post.author.displayName}</span>
                                  </div>
                                </div>

                                <p className="text-gray-600 mt-2 line-clamp-2">
                                  {post.summary}
                                </p>

                                {post.labels && post.labels.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {post.labels.slice(0, 4).map((label, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {label}
                                      </Badge>
                                    ))}
                                    {post.labels.length > 4 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{post.labels.length - 4}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col items-end space-y-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPost(post)}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Ver
                                </Button>
                                <div className="text-xs text-gray-400">
                                  {formatDate(post.published)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No se encontraron posts.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default MicroblogManager;