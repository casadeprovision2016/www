import { Request, Response } from 'express';
import { bloggerService } from '../services/bloggerService';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';

interface MicroblogRequest extends Request {
  query: {
    blogId?: string;
    maxResults?: string;
    category?: string;
    pageToken?: string;
  };
  params: {
    blogId?: string;
    postId?: string;
    category?: string;
  };
}

/**
 * Busca las enseñanzas de los martes
 */
export const getEnseñanzasMartes = asyncHandler(async (req: MicroblogRequest, res: Response) => {
  const { blogId } = req.query;
  const maxResults = parseInt(req.query.maxResults || '10');

  if (!blogId) {
    return res.status(400).json({
      success: false,
      message: 'El parámetro blogId es requerido'
    });
  }

  try {
    const posts = await bloggerService.getEnseñanzasMartes(blogId, maxResults);
    
    // Procesar contenido para visualización segura
    const processedPosts = posts.items?.map(post => ({
      id: post.id,
      title: post.title,
      content: bloggerService.processPostContent(post.content),
      summary: bloggerService.extractSummary(post.content),
      published: post.published,
      updated: post.updated,
      url: post.url,
      author: post.author,
      labels: post.labels,
      images: post.images
    })) || [];

    logger.info('Enseñanzas de martes retrieved successfully', { 
      blogId, 
      count: processedPosts.length 
    });

    res.json({
      success: true,
      data: {
        posts: processedPosts,
        total: processedPosts.length,
        nextPageToken: posts.nextPageToken
      }
    });
  } catch (error) {
    logger.error('Error retrieving enseñanzas de martes', { 
      error: error.message,
      blogId 
    });
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener las enseñanzas de martes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Busca todos los posts del microblog
 */
export const getAllPosts = asyncHandler(async (req: MicroblogRequest, res: Response) => {
  const { blogId, category, pageToken } = req.query;
  const maxResults = parseInt(req.query.maxResults || '10');

  if (!blogId) {
    return res.status(400).json({
      success: false,
      message: 'El parámetro blogId es requerido'
    });
  }

  try {
    let posts;
    
    if (category) {
      posts = await bloggerService.getPostsByCategory(blogId, category, maxResults);
    } else {
      posts = await bloggerService.getPosts(blogId, {
        maxResults,
        pageToken: pageToken || undefined
      });
    }
    
    // Procesar contenido para visualización segura
    const processedPosts = posts.items?.map(post => ({
      id: post.id,
      title: post.title,
      content: bloggerService.processPostContent(post.content),
      summary: bloggerService.extractSummary(post.content),
      published: post.published,
      updated: post.updated,
      url: post.url,
      author: post.author,
      labels: post.labels,
      images: post.images
    })) || [];

    logger.info('Microblog posts retrieved successfully', { 
      blogId, 
      category,
      count: processedPosts.length 
    });

    res.json({
      success: true,
      data: {
        posts: processedPosts,
        total: processedPosts.length,
        nextPageToken: posts.nextPageToken,
        category: category || 'all'
      }
    });
  } catch (error) {
    logger.error('Error retrieving microblog posts', { 
      error: error.message,
      blogId,
      category 
    });
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener los posts del microblog',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Busca un post específico
 */
export const getPost = asyncHandler(async (req: MicroblogRequest, res: Response) => {
  const { blogId, postId } = req.params;

  if (!blogId || !postId) {
    return res.status(400).json({
      success: false,
      message: 'Los parámetros blogId y postId son requeridos'
    });
  }

  try {
    const post = await bloggerService.getPost(blogId, postId);
    
    // Procesar contenido para visualización segura
    const processedPost = {
      id: post.id,
      title: post.title,
      content: bloggerService.processPostContent(post.content),
      summary: bloggerService.extractSummary(post.content),
      published: post.published,
      updated: post.updated,
      url: post.url,
      author: post.author,
      labels: post.labels,
      images: post.images
    };

    logger.info('Microblog post retrieved successfully', { 
      blogId, 
      postId,
      title: post.title 
    });

    res.json({
      success: true,
      data: processedPost
    });
  } catch (error) {
    logger.error('Error retrieving microblog post', { 
      error: error.message,
      blogId,
      postId 
    });
    
    if (error.message.includes('404') || error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Post no encontrado'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener el post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Obtiene información del blog
 */
export const getBlogInfo = asyncHandler(async (req: MicroblogRequest, res: Response) => {
  const { blogId } = req.params;

  if (!blogId) {
    return res.status(400).json({
      success: false,
      message: 'El parámetro blogId es requerido'
    });
  }

  try {
    const blogInfo = await bloggerService.getBlogInfo(blogId);

    logger.info('Blog info retrieved successfully', { 
      blogId,
      name: blogInfo.name 
    });

    res.json({
      success: true,
      data: {
        id: blogInfo.id,
        name: blogInfo.name,
        description: blogInfo.description,
        url: blogInfo.url,
        posts: blogInfo.posts,
        pages: blogInfo.pages,
        updated: blogInfo.updated
      }
    });
  } catch (error) {
    logger.error('Error retrieving blog info', { 
      error: error.message,
      blogId 
    });
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del blog',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Limpia el caché del microblog
 */
export const clearCache = asyncHandler(async (req: MicroblogRequest, res: Response) => {
  const { blogId } = req.query;

  try {
    await bloggerService.clearCache(blogId);

    logger.info('Microblog cache cleared successfully', { blogId });

    res.json({
      success: true,
      message: 'Caché del microblog limpiado exitosamente'
    });
  } catch (error) {
    logger.error('Error clearing microblog cache', { 
      error: error.message,
      blogId 
    });
    
    res.status(500).json({
      success: false,
      message: 'Error al limpiar el caché',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Busca posts por categorías específicas de la iglesia
 */
export const getPostsByChurchCategory = asyncHandler(async (req: MicroblogRequest, res: Response) => {
  const { blogId } = req.query;
  const { category } = req.params;
  const maxResults = parseInt(req.query.maxResults || '10');

  if (!blogId) {
    return res.status(400).json({
      success: false,
      message: 'El parámetro blogId es requerido'
    });
  }

  // Mapear categorías específicas de la iglesia
  const categoryMap: { [key: string]: string } = {
    'enseñanzas-martes': 'enseñanza-martes',
    'reflexiones': 'reflexion',
    'devocionales': 'devocional',
    'anuncios': 'anuncio',
    'eventos': 'evento',
    'testimonios': 'testimonio'
  };

  const bloggerLabel = categoryMap[category] || category;

  try {
    const posts = await bloggerService.getPostsByCategory(blogId, bloggerLabel, maxResults);
    
    // Procesar contenido para visualización segura
    const processedPosts = posts.items?.map(post => ({
      id: post.id,
      title: post.title,
      content: bloggerService.processPostContent(post.content),
      summary: bloggerService.extractSummary(post.content),
      published: post.published,
      updated: post.updated,
      url: post.url,
      author: post.author,
      labels: post.labels,
      images: post.images
    })) || [];

    logger.info('Church category posts retrieved successfully', { 
      blogId, 
      category,
      bloggerLabel,
      count: processedPosts.length 
    });

    res.json({
      success: true,
      data: {
        posts: processedPosts,
        total: processedPosts.length,
        category: category,
        nextPageToken: posts.nextPageToken
      }
    });
  } catch (error) {
    logger.error('Error retrieving church category posts', { 
      error: error.message,
      blogId,
      category 
    });
    
    res.status(500).json({
      success: false,
      message: `Error al obtener posts de la categoría ${category}`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});