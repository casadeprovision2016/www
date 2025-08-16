import { useState, useEffect } from 'react';
import { useApi } from './useApi';

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

interface MicroblogResponse {
  posts: BlogPost[];
  total: number;
  category?: string;
  nextPageToken?: string;
}

interface BlogInfo {
  id: string;
  name: string;
  description: string;
  url: string;
  posts: any;
  pages: any;
  updated: string;
}

export const useMicroblog = () => {
  const { makeRequest } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ID del blog por defecto - esto debería venir de configuración
  const DEFAULT_BLOG_ID = import.meta.env.VITE_BLOGGER_ID || '5061445049658068479';

  /**
   * Obtiene las enseñanzas de los martes
   */
  const getEnseñanzasMartes = async (maxResults: number = 10): Promise<MicroblogResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await makeRequest(
        `/api/microblog/enseñanzas-martes?blogId=${DEFAULT_BLOG_ID}&maxResults=${maxResults}`,
        'GET'
      );

      if (response.success) {
        return response.data;
      } else {
        setError(response.message || 'Error al obtener las enseñanzas de martes');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene todos los posts del microblog
   */
  const getAllPosts = async (options: {
    maxResults?: number;
    category?: string;
    pageToken?: string;
  } = {}): Promise<MicroblogResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const { maxResults = 10, category, pageToken } = options;
      
      const params = new URLSearchParams({
        blogId: DEFAULT_BLOG_ID,
        maxResults: maxResults.toString()
      });

      if (category) params.append('category', category);
      if (pageToken) params.append('pageToken', pageToken);

      const response = await makeRequest(
        `/api/microblog/posts?${params.toString()}`,
        'GET'
      );

      if (response.success) {
        return response.data;
      } else {
        setError(response.message || 'Error al obtener los posts');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene un post específico
   */
  const getPost = async (postId: string): Promise<BlogPost | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await makeRequest(
        `/api/microblog/posts/${DEFAULT_BLOG_ID}/${postId}`,
        'GET'
      );

      if (response.success) {
        return response.data;
      } else {
        setError(response.message || 'Error al obtener el post');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene posts por categoría
   */
  const getPostsByCategory = async (category: string, maxResults: number = 10): Promise<MicroblogResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await makeRequest(
        `/api/microblog/category/${category}?blogId=${DEFAULT_BLOG_ID}&maxResults=${maxResults}`,
        'GET'
      );

      if (response.success) {
        return response.data;
      } else {
        setError(response.message || `Error al obtener posts de la categoría ${category}`);
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene información del blog
   */
  const getBlogInfo = async (): Promise<BlogInfo | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await makeRequest(
        `/api/microblog/blog/${DEFAULT_BLOG_ID}`,
        'GET'
      );

      if (response.success) {
        return response.data;
      } else {
        setError(response.message || 'Error al obtener información del blog');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene estadísticas del microblog (público)
   */
  const getStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await makeRequest('/api/microblog/stats', 'GET');

      if (response.success) {
        return response.data;
      } else {
        setError(response.message || 'Error al obtener estadísticas');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Limpia el caché del microblog (solo líderes)
   */
  const clearCache = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await makeRequest(
        `/api/microblog/cache/clear?blogId=${DEFAULT_BLOG_ID}`,
        'POST'
      );

      if (response.success) {
        return true;
      } else {
        setError(response.message || 'Error al limpiar caché');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formatea fecha en español
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Obtiene el tiempo relativo (hace X días)
   */
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semanas`;
    if (diffInDays < 365) return `Hace ${Math.floor(diffInDays / 30)} meses`;
    return `Hace ${Math.floor(diffInDays / 365)} años`;
  };

  return {
    loading,
    error,
    getEnseñanzasMartes,
    getAllPosts,
    getPost,
    getPostsByCategory,
    getBlogInfo,
    getStats,
    clearCache,
    formatDate,
    getRelativeTime
  };
};