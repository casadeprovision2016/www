import axios from 'axios';
import { logger } from '../utils/logger';
import { cacheService } from './cacheService';

interface BloggerPost {
  id: string;
  title: string;
  content: string;
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

interface BloggerResponse {
  items: BloggerPost[];
  nextPageToken?: string;
}

class BloggerService {
  private readonly apiKey = 'AIzaSyAGzTT-4vd5AwSm_T34rWF_Q1vqiAiaOHY';
  private readonly baseUrl = 'https://www.googleapis.com/blogger/v3';
  private readonly cachePrefix = 'blogger:';
  private readonly cacheTTL = 3600; // 1 hora

  /**
   * Busca posts de um blog específico
   */
  async getPosts(blogId: string, options: {
    maxResults?: number;
    labels?: string;
    status?: 'draft' | 'live' | 'scheduled';
    orderBy?: 'published' | 'updated';
    pageToken?: string;
  } = {}): Promise<BloggerResponse> {
    try {
      const {
        maxResults = 10,
        labels,
        status = 'live',
        orderBy = 'published',
        pageToken
      } = options;

      // Criar chave de cache baseada nos parâmetros
      const cacheKey = `${this.cachePrefix}posts:${blogId}:${JSON.stringify(options)}`;
      
      // Tentar buscar do cache primeiro
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        logger.info('Blogger posts retrieved from cache', { blogId, options });
        return JSON.parse(cached);
      }

      const params = new URLSearchParams({
        key: this.apiKey,
        maxResults: maxResults.toString(),
        status,
        orderBy
      });

      if (labels) params.append('labels', labels);
      if (pageToken) params.append('pageToken', pageToken);

      const response = await axios.get(`${this.baseUrl}/blogs/${blogId}/posts?${params}`);
      const data: BloggerResponse = response.data;

      // Cache do resultado
      await cacheService.set(cacheKey, JSON.stringify(data), this.cacheTTL);

      logger.info('Blogger posts retrieved successfully', { 
        blogId, 
        count: data.items?.length || 0,
        options 
      });

      return data;
    } catch (error) {
      logger.error('Error fetching Blogger posts', { 
        error: error.message, 
        blogId, 
        options 
      });
      throw new Error(`Error al buscar posts del Blogger: ${error.message}`);
    }
  }

  /**
   * Busca um post específico
   */
  async getPost(blogId: string, postId: string): Promise<BloggerPost> {
    try {
      const cacheKey = `${this.cachePrefix}post:${blogId}:${postId}`;
      
      // Tentar buscar do cache primeiro
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        logger.info('Blogger post retrieved from cache', { blogId, postId });
        return JSON.parse(cached);
      }

      const params = new URLSearchParams({
        key: this.apiKey
      });

      const response = await axios.get(`${this.baseUrl}/blogs/${blogId}/posts/${postId}?${params}`);
      const post: BloggerPost = response.data;

      // Cache do resultado
      await cacheService.set(cacheKey, JSON.stringify(post), this.cacheTTL);

      logger.info('Blogger post retrieved successfully', { blogId, postId, title: post.title });

      return post;
    } catch (error) {
      logger.error('Error fetching Blogger post', { 
        error: error.message, 
        blogId, 
        postId 
      });
      throw new Error(`Error al buscar post del Blogger: ${error.message}`);
    }
  }

  /**
   * Busca posts con la etiqueta "enseñanza-martes"
   */
  async getEnseñanzasMartes(blogId: string, maxResults: number = 10): Promise<BloggerResponse> {
    return this.getPosts(blogId, {
      labels: 'enseñanza-martes',
      maxResults,
      orderBy: 'published'
    });
  }

  /**
   * Busca posts por categoría/etiqueta
   */
  async getPostsByCategory(blogId: string, category: string, maxResults: number = 10): Promise<BloggerResponse> {
    return this.getPosts(blogId, {
      labels: category,
      maxResults,
      orderBy: 'published'
    });
  }

  /**
   * Busca información del blog
   */
  async getBlogInfo(blogId: string): Promise<any> {
    try {
      const cacheKey = `${this.cachePrefix}blog:${blogId}`;
      
      // Tentar buscar do cache primeiro
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const params = new URLSearchParams({
        key: this.apiKey
      });

      const response = await axios.get(`${this.baseUrl}/blogs/${blogId}?${params}`);
      const blogInfo = response.data;

      // Cache do resultado por 24 horas (informações do blog mudam pouco)
      await cacheService.set(cacheKey, JSON.stringify(blogInfo), 86400);

      logger.info('Blog info retrieved successfully', { blogId, name: blogInfo.name });

      return blogInfo;
    } catch (error) {
      logger.error('Error fetching blog info', { 
        error: error.message, 
        blogId 
      });
      throw new Error(`Error al buscar información del blog: ${error.message}`);
    }
  }

  /**
   * Limpia caché de posts
   */
  async clearCache(blogId?: string): Promise<void> {
    try {
      if (blogId) {
        await cacheService.invalidate(`${this.cachePrefix}*${blogId}*`);
      } else {
        await cacheService.invalidate(`${this.cachePrefix}*`);
      }
      logger.info('Blogger cache cleared', { blogId });
    } catch (error) {
      logger.error('Error clearing Blogger cache', { error: error.message, blogId });
    }
  }

  /**
   * Procesa contenido HTML de los posts para visualización segura
   */
  processPostContent(content: string): string {
    // Remueve scripts y contenido peligroso
    let processedContent = content
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '');

    // Añade clases de Tailwind para estilización
    processedContent = processedContent
      .replace(/<h1[^>]*>/gi, '<h1 class="text-3xl font-bold mb-4 text-gray-900">')
      .replace(/<h2[^>]*>/gi, '<h2 class="text-2xl font-semibold mb-3 text-gray-800">')
      .replace(/<h3[^>]*>/gi, '<h3 class="text-xl font-medium mb-2 text-gray-700">')
      .replace(/<p[^>]*>/gi, '<p class="mb-4 text-gray-600 leading-relaxed">')
      .replace(/<ul[^>]*>/gi, '<ul class="list-disc pl-6 mb-4 text-gray-600">')
      .replace(/<ol[^>]*>/gi, '<ol class="list-decimal pl-6 mb-4 text-gray-600">')
      .replace(/<li[^>]*>/gi, '<li class="mb-1">')
      .replace(/<blockquote[^>]*>/gi, '<blockquote class="border-l-4 border-blue-500 pl-4 italic text-gray-700 mb-4">')
      .replace(/<img([^>]*)>/gi, '<img$1 class="max-w-full h-auto rounded-lg shadow-md mb-4">');

    return processedContent;
  }

  /**
   * Extrae resumen del post (primeros 200 caracteres sin HTML)
   */
  extractSummary(content: string, maxLength: number = 200): string {
    const textOnly = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return textOnly.length > maxLength 
      ? textOnly.substring(0, maxLength) + '...' 
      : textOnly;
  }
}

export const bloggerService = new BloggerService();