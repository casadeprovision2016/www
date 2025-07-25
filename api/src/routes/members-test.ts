import { Router } from 'express';

const router = Router();

// Teste super simples
router.get('/simple', (req, res) => {
  res.json({
    success: true,
    message: 'Rota de teste funcionando',
    timestamp: new Date().toISOString()
  });
});

export default router;