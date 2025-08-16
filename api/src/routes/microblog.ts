import { Router } from 'express';
import {
  getEnseñanzasMartes,
  getAllPosts,
  getPost,
  getBlogInfo,
  clearCache,
  getPostsByChurchCategory
} from '../controllers/microblogController';
import { authenticateToken, requireMemberOrAbove, requireLeaderOrAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/microblog/enseñanzas-martes
 * @desc Obtiene las enseñanzas de los martes
 * @access Public
 * @param {string} blogId - ID del blog de Blogger
 * @param {number} [maxResults=10] - Número máximo de resultados
 */
router.get('/enseñanzas-martes', getEnseñanzasMartes);

/**
 * @route GET /api/microblog/posts
 * @desc Obtiene todos los posts del microblog
 * @access Public
 * @param {string} blogId - ID del blog de Blogger
 * @param {string} [category] - Categoría específica
 * @param {number} [maxResults=10] - Número máximo de resultados
 * @param {string} [pageToken] - Token para paginación
 */
router.get('/posts', getAllPosts);

/**
 * @route GET /api/microblog/posts/:blogId/:postId
 * @desc Obtiene un post específico
 * @access Private (Member+)
 * @param {string} blogId - ID del blog de Blogger
 * @param {string} postId - ID del post
 */
router.get('/posts/:blogId/:postId', authenticateToken, requireMemberOrAbove, getPost);

/**
 * @route GET /api/microblog/blog/:blogId
 * @desc Obtiene información del blog
 * @access Private (Member+)
 * @param {string} blogId - ID del blog de Blogger
 */
router.get('/blog/:blogId', authenticateToken, requireMemberOrAbove, getBlogInfo);

/**
 * @route GET /api/microblog/category/:category
 * @desc Obtiene posts por categoría específica de la iglesia
 * @access Public
 * @param {string} category - Categoría (enseñanzas-martes, reflexiones, devocionales, etc.)
 * @param {string} blogId - ID del blog de Blogger (query param)
 * @param {number} [maxResults=10] - Número máximo de resultados
 */
router.get('/category/:category', getPostsByChurchCategory);

/**
 * @route POST /api/microblog/cache/clear
 * @desc Limpia el caché del microblog
 * @access Private (Leader+)
 * @param {string} [blogId] - ID del blog específico (opcional)
 */
router.post('/cache/clear', authenticateToken, requireLeaderOrAdmin, clearCache);

/**
 * @route GET /api/microblog/stats
 * @desc Obtiene estadísticas del microblog (público)
 * @access Public
 */
router.get('/stats', async (req, res) => {
  try {
    // Estadísticas básicas sin autenticación
    res.json({
      success: true,
      data: {
        categories: [
          { name: 'Enseñanzas de Martes', slug: 'enseñanzas-martes', description: 'Enseñanzas semanales de los martes' },
          { name: 'Reflexiones', slug: 'reflexiones', description: 'Reflexiones pastorales' },
          { name: 'Devocionales', slug: 'devocionales', description: 'Devocionales diarios' },
          { name: 'Anuncios', slug: 'anuncios', description: 'Anuncios de la iglesia' },
          { name: 'Eventos', slug: 'eventos', description: 'Información sobre eventos' },
          { name: 'Testimonios', slug: 'testimonios', description: 'Testimonios de fe' }
        ],
        totalCategories: 6,
        status: 'active'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
});

export default router;