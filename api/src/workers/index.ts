#!/usr/bin/env node

import { BackgroundJobsWorker } from './backgroundJobs';
import { logger } from '../utils/logger';

async function startWorker() {
  try {
    logger.info('🚀 Iniciando Background Jobs Worker...');
    
    // Verificar variáveis de ambiente necessárias
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_KEY',
      'REDIS_URL'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Variável de ambiente ${envVar} é obrigatória`);
      }
    }

    // Inicializar e iniciar o worker
    const worker = new BackgroundJobsWorker();
    await worker.start();

    logger.info('✅ Background Jobs Worker iniciado com sucesso');

    // Manter o processo vivo
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Erro ao iniciar worker:', error);
    process.exit(1);
  }
}

// Verificar se está sendo executado diretamente
if (require.main === module) {
  startWorker();
}

export { BackgroundJobsWorker };