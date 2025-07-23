import cron from 'node-cron';
import { logger } from '../utils/logger';
import { createClient } from '@supabase/supabase-js';
import { redis } from '../services/cacheService';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class BackgroundJobsWorker {
  private isRunning = false;

  constructor() {
    this.setupGracefulShutdown();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Worker já está rodando');
      return;
    }

    this.isRunning = true;
    logger.info('🚀 Background Jobs Worker iniciado');

    this.setupJobs();
  }

  private setupJobs(): void {
    // Relatórios diários às 6h
    cron.schedule('0 6 * * *', async () => {
      try {
        logger.info('📊 Executando relatórios diários...');
        await this.generateDailyReports();
      } catch (error) {
        logger.error('Erro ao gerar relatórios diários:', error);
      }
    });

    // Limpeza de cache às 3h
    cron.schedule('0 3 * * *', async () => {
      try {
        logger.info('🧹 Limpando cache expirado...');
        await this.cleanExpiredCache();
      } catch (error) {
        logger.error('Erro ao limpar cache:', error);
      }
    });

    // Backup semanal aos domingos às 2h
    cron.schedule('0 2 * * 0', async () => {
      try {
        logger.info('💾 Executando backup semanal...');
        await this.performWeeklyBackup();
      } catch (error) {
        logger.error('Erro ao executar backup:', error);
      }
    });

    // Limpeza de logs mensalmente no dia 1 às 1h
    cron.schedule('0 1 1 * *', async () => {
      try {
        logger.info('🗂️ Limpando logs antigos...');
        await this.cleanOldLogs();
      } catch (error) {
        logger.error('Erro ao limpar logs:', error);
      }
    });

    // Health check a cada 5 minutos
    cron.schedule('*/5 * * * *', async () => {
      try {
        await this.healthCheck();
      } catch (error) {
        logger.error('Erro no health check:', error);
      }
    });

    // Notificações de aniversários às 8h
    cron.schedule('0 8 * * *', async () => {
      try {
        logger.info('🎂 Verificando aniversários do dia...');
        await this.checkBirthdays();
      } catch (error) {
        logger.error('Erro ao verificar aniversários:', error);
      }
    });

    // Sincronização de dados a cada hora
    cron.schedule('0 * * * *', async () => {
      try {
        logger.info('🔄 Sincronizando dados...');
        await this.syncData();
      } catch (error) {
        logger.error('Erro na sincronização:', error);
      }
    });
  }

  private async generateDailyReports(): Promise<void> {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    // Relatório de eventos do dia
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .gte('date', yesterday)
      .lt('date', format(new Date(), 'yyyy-MM-dd'));

    if (eventsError) {
      logger.error('Erro ao buscar eventos:', eventsError);
      return;
    }

    // Relatório de doações do dia
    const { data: donations, error: donationsError } = await supabase
      .from('donations')
      .select('amount')
      .gte('created_at', yesterday);

    if (donationsError) {
      logger.error('Erro ao buscar doações:', donationsError);
      return;
    }

    const totalDonations = donations?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

    logger.info(`📊 Relatório diário: ${events?.length || 0} eventos, R$ ${totalDonations} em doações`);

    // Salvar relatório no cache para consulta rápida
    await redis.setex(`daily_report:${yesterday}`, 86400 * 7, JSON.stringify({
      date: yesterday,
      events: events?.length || 0,
      totalDonations,
      generatedAt: new Date().toISOString()
    }));
  }

  private async cleanExpiredCache(): Promise<void> {
    const keys = await redis.keys('temp:*');
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`🧹 ${keys.length} chaves de cache temporário removidas`);
    }
  }

  private async performWeeklyBackup(): Promise<void> {
    const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd');

    // Backup básico de metadados (em produção seria um backup real)
    const tables = ['events', 'members', 'donations', 'ministries'];
    const backupData: any = {};

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('id, created_at, updated_at')
        .gte('updated_at', weekStart)
        .lte('updated_at', weekEnd);

      if (!error && data) {
        backupData[table] = data.length;
      }
    }

    logger.info(`💾 Backup semanal: ${JSON.stringify(backupData)}`);
    
    // Salvar metadados do backup
    await redis.setex(`backup:${weekStart}`, 86400 * 30, JSON.stringify({
      week: `${weekStart} to ${weekEnd}`,
      tables: backupData,
      backedUpAt: new Date().toISOString()
    }));
  }

  private async cleanOldLogs(): Promise<void> {
    // Em produção, aqui limparia arquivos de log antigos
    logger.info('🗂️ Limpeza de logs executada (simulada)');
  }

  private async healthCheck(): Promise<void> {
    try {
      // Verificar conexão com Supabase
      const { error } = await supabase.from('users').select('id').limit(1);
      if (error) throw error;

      // Verificar conexão com Redis
      await redis.ping();

      // Criar arquivo de health check para Docker
      require('fs').writeFileSync('/tmp/worker-health', new Date().toISOString());
      
    } catch (error) {
      logger.error('❌ Health check falhou:', error);
      throw error;
    }
  }

  private async checkBirthdays(): Promise<void> {
    const today = format(new Date(), 'MM-dd');
    
    const { data: members, error } = await supabase
      .from('members')
      .select('id, name, birth_date, email')
      .like('birth_date', `%-${today}`);

    if (error) {
      logger.error('Erro ao buscar aniversariantes:', error);
      return;
    }

    if (members && members.length > 0) {
      logger.info(`🎂 ${members.length} aniversariante(s) hoje: ${members.map(m => m.name).join(', ')}`);
      
      // Salvar lista de aniversariantes no cache
      await redis.setex(`birthdays:${format(new Date(), 'yyyy-MM-dd')}`, 86400, JSON.stringify(members));
    }
  }

  private async syncData(): Promise<void> {
    // Sincronizar contadores e estatísticas
    const { data: eventCount } = await supabase
      .from('events')
      .select('id', { count: 'exact' });

    const { data: memberCount } = await supabase
      .from('members')
      .select('id', { count: 'exact' });

    const { data: ministryCount } = await supabase
      .from('ministries')
      .select('id', { count: 'exact' });

    const stats = {
      events: eventCount?.length || 0,
      members: memberCount?.length || 0,
      ministries: ministryCount?.length || 0,
      lastSync: new Date().toISOString()
    };

    await redis.setex('app:stats', 3600, JSON.stringify(stats));
    logger.info(`🔄 Estatísticas sincronizadas: ${JSON.stringify(stats)}`);
  }

  private setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      logger.info(`Worker recebeu ${signal}, finalizando graciosamente...`);
      this.isRunning = false;
      
      setTimeout(() => {
        logger.info('Worker finalizado');
        process.exit(0);
      }, 1000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // Para ts-node-dev
  }

  stop(): void {
    this.isRunning = false;
    logger.info('Worker parado');
  }
}