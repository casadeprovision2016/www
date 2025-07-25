# 🏗️ Plano Arquitetural Full-Stack - CCCP (Casa de Provisão)

## 📋 Arquitetura Proposta

**Stack Tecnológica**
- **Frontend:** React 18 + TypeScript + Vite + ShadCN + Tailwind
- **Backend API:** Node.js + Express + TypeScript
- **Database:** Supabase Database (BaaS)
- **Storage:** Supabase Storage
- **Auth:** Supabase Auth + JWT
- **Cache:** Redis (Upstash Cloud - Free Tier)
- **Deploy:** Docker + Cloudflare Tunnel

## 💻 Tecnologias e Serviços

Esta sección detalla las principales tecnologías y servicios utilizados en el proyecto, explicando el propósito de cada uno.

- **[React 18](https://react.dev/)**: Biblioteca para construir interfaces de usuário com componentes reutilizáveis e eficientes.
- **[TypeScript](https://www.typescriptlang.org/docs/)**: Superset de JavaScript que añade tipado estático, mejorando la mantenibilidad y la detección de errores.
- **[Vite](https://vitejs.dev/guide/)**: Ferramenta de build moderna que oferece um desenvolvimento rápido com Hot Module Replacement (HMR).
- **[ShadCN/UI](https://ui.shadcn.com/docs)**: Colección de componentes de UI reutilizables y accesibles, construidos sobre Tailwind CSS y Radix UI.
- **[Tailwind CSS](https://tailwindcss.com/docs)**: Framework CSS utility-first para criar designs customizados rapidamente sem sair do HTML.
- **[Node.js](https://nodejs.org/en/docs/)**: Entorno de ejecución JavaScript en el servidor, permitiendo la construcción de APIs rápidas y escalables.
- **[Express](https://expressjs.com/)**: Framework minimalista para Node.js, usado para criar a estrutura da API RESTful.
- **[Supabase](https://supabase.com/docs)**: Plataforma Backend-as-a-Service (BaaS) que oferece banco de dados PostgreSQL, autenticação, storage e APIs auto-geradas.
  - **[Database](https://supabase.com/docs/guides/database/overview/)**: Banco de dados relacional robusto e escalável.
  - **[Supabase Auth](https://supabase.com/docs/guides/auth)**: Gerencia a autenticação de usuários com JWT e integração com RLS.
  - **[Supabase Storage](https://supabase.com/docs/guides/storage)**: Armazena arquivos como imagens de perfil e comprovantes de doação.
- **[Redis (Upstash)](https://upstash.com/docs/redis)**: Banco de dados em memória usado para cache de alta performance, reduzindo a carga no banco de dados principal.
- **[Docker](https://docs.docker.com/)**: Plataforma de containerização para empacotar e distribuir a aplicação de forma consistente em diferentes ambientes.
- **[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)**: Cria um túnel seguro entre o servidor local e a rede da Cloudflare, permitindo a exposição da aplicação na internet sem IP público.
- **[Zod](https://zod.dev/)**: Biblioteca de validação de schemas para garantir a integridade dos dados que entram na API.
- **[DOMPurify](https://github.com/cure53/DOMPurify)**: Sanitizador de HTML para prevenir ataques de XSS ao lidar com conteúdo gerado pelo usuário.
- **[Multer](https://github.com/expressjs/multer)**: Middleware para Node.js que facilita o upload de arquivos.
- **[Sharp](https://sharp.pixelplumbing.com/)**: Biblioteca de processamento de imagens de alta performance para Node.js.
- **[Winston](https://github.com/winstonjs/winston)**: Biblioteca de logging para registrar eventos e erros da aplicação de forma estruturada.
- **[node-cron](https://github.com/node-cron/node-cron)**: Agendador de tarefas para executar rotinas em segundo plano, como backups e relatórios.

## 🐳 Estrutura Docker

Arquivo: `docker-compose.yml`
```yaml
version: '3.8'
services:
  # Frontend React + Vite
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://api:4000
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
    depends_on:
      - api
    networks:
      - cccp-network

  # Backend API Node.js
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - SUPABASE_URL=${VITE_SUPABASE_URL}
      - SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - cron-jobs
    networks:
      - cccp-network

  # Background Jobs & Cron
  cron-jobs:
    build:
      context: ./api
      dockerfile: Dockerfile.worker
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - SUPABASE_URL=${VITE_SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - REDIS_URL=${REDIS_URL}
    networks:
      - cccp-network

  # Cloudflare Tunnel
  cloudflare-tunnel:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    depends_on:
      - frontend
    networks:
      - cccp-network

networks:
  cccp-network:
    driver: bridge
```

## 📁 Estrutura de Diretorios

```
cccp/
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── api/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── Dockerfile
│   ├── Dockerfile.worker
│   └── package.json
├── shared/
│   └── types/
├── docker-compose.yml
├── .env.production
└── scripts/
    ├── deploy.sh
    ├── backup.sh
    └── health-check.sh
```

## 🔧 Implementação Detalhada

1. **Backend API (Node.js + Express)**
   - Estrutura da API:
     ```typescript
     // api/src/app.ts
     import express from 'express';
     import cors from 'cors';
     import helmet from 'helmet';
     import rateLimit from 'express-rate-limit';
     import { createClient } from '@supabase/supabase-js';

     const app = express();

     // Middlewares de segurança
     app.use(helmet());
     app.use(cors({ origin: process.env.FRONTEND_URL }));
     app.use(express.json({ limit: '10mb' }));

     // Rate limiting
     const limiter = rateLimit({
       windowMs: 15 * 60 * 1000, // 15 minutos
       max: 100 // máximo 100 requests por IP
     });
     app.use('/api/', limiter);

     // Routes
     app.use('/api/auth', authRoutes);
     app.use('/api/events', eventsRoutes);
     app.use('/api/donations', donationsRoutes);
     app.use('/api/members', membersRoutes);
     app.use('/api/reports', reportsRoutes);
     ```

   - Principais endpoints:
     - **Home (Página Pública):**
       - `GET /api/events?upcoming=true&limit=6`: Busca os próximos 6 eventos.
       - `GET /api/streams/live`: Verifica se há transmissão ao vivo.
       - `GET /api/streams?status=finalizado&limit=6`: Busca as últimas 6 gravações.
       - `GET /api/donations/stats`: Busca estatísticas de doações.
     - **Login:**
       - `POST /api/auth/login`: Autentica o usuário.
     - **Painel (Dashboard e Seções):**
       - **Dashboard:**
         - `GET /api/events/stats`: Estatísticas de eventos (ex: total, por mês).
         - `GET /api/members/stats`: Estatísticas de membros (ex: total, ativos).
         - `GET /api/visitors/stats`: Estatísticas de visitantes.
         - `GET /api/members/birthdays`: Aniversariantes da semana.
       - **Eventos:**
         - `GET /api/events`: Lista todos os eventos.
         - `POST /api/events`: Cria um novo evento.
         - `PUT /api/events/:id`: Atualiza um evento.
         - `DELETE /api/events/:id`: Deleta um evento.
       - **Transmissões:**
         - `GET /api/streams`: Lista todas as transmissões.
         - `POST /api/streams`: Cria uma nova transmissão.
         - `PUT /api/streams/:id`: Atualiza uma transmissão.
         - `DELETE /api/streams/:id`: Deleta uma transmissão.
       - **Doações:**
         - `GET /api/donations`: Lista todas as doações (com filtros).
         - `POST /api/donations`: Cria uma nova doação.
         - `PUT /api/donations/:id`: Atualiza uma doação.
         - `DELETE /api/donations/:id`: Deleta uma doação.
         - `POST /api/donations/receipt`: Upload de comprovante.
         - `GET /api/donations/export`: Exporta doações (CSV/PDF).
       - **Membros:**
         - `GET /api/members`: Lista todos os membros (com filtros).
         - `POST /api/members`: Cria um novo membro.
         - `PUT /api/members/:id`: Atualiza um membro.
         - `DELETE /api/members/:id`: Deleta um membro.
         - `POST /api/members/:id/deactivate`: Desativa um membro.
       - **Visitantes:**
         - `GET /api/visitors`: Lista todos os visitantes.
         - `POST /api/visitors`: Cria um novo visitante.
         - `PUT /api/visitors/:id`: Atualiza um visitante.
         - `DELETE /api/visitors/:id`: Deleta um visitante.
       - **Visitas Pastorais:**
         - `GET /api/pastoral-visits`: Lista todas as visitas.
         - `POST /api/pastoral-visits`: Cria um novo visita.
         - `PUT /api/pastoral-visits/:id`: Atualiza um visita.
         - `DELETE /api/pastoral-visits/:id`: Deleta um visita.
         - `GET /api/pastoral-visits/stats`: Estatísticas de visitas.
       - **Ministérios:**
         - `GET /api/ministries`: Lista todos os ministérios.
         - `POST /api/ministries`: Cria um novo ministério.
         - `PUT /api/ministries/:id`: Atualiza um ministério.
         - `DELETE /api/ministries/:id`: Deleta um ministério.
         - `GET /api/ministries/:id/members`: Lista membros de um ministério.
         - `POST /api/ministries/members`: Adiciona membro a um ministério.
         - `DELETE /api/ministries/members/:id`: Remove membro de um ministério.
       - **Controle de Assistência:**
         - `GET /api/attendance`: Lista todas as presenças com paginação.
         - `GET /api/attendance/event/:eventId`: Presenças por evento específico.
         - `GET /api/attendance/stats`: Estatísticas de presença.
         - `POST /api/attendance`: Marcar presença em evento.
         - `PUT /api/attendance/:id`: Atualizar presença (requer permissões).

2. **Frontend (React + Vite)**
   - **Configuração de Ambiente:**
     - Criar um arquivo `.env` na raiz do frontend com a variável `VITE_API_URL=http://localhost:4000` (ou o endereço da API).
   - **Autenticação:**
     - Modificar `src/contexts/AuthContext.tsx` para usar a API em vez de `localStorage`.
     - A função `login` deve fazer uma chamada `POST /api/auth/login`.
     - A função `logout` deve chamar `POST /api/auth/logout`.
     - O estado de autenticação deve ser gerenciado com base no token JWT recebido da API.
   - **Migração de Dados (localStorage para API):**
     - Substituir o uso de `localStorage` em todos os componentes de gerenciamento (`EventsManager`, `DonationsManager`, etc.) por chamadas à API.
     - Utilizar `@tanstack/react-query` para gerenciar o estado do servidor (fetching, caching, updating).
     - Criar hooks customizados (ex: `useEvents`, `useMembers`) para encapsular a lógica de acesso à API com React Query.
   - **Componentes de UI:**
     - Adaptar os componentes para lidar com os estados de `isLoading`, `error` e `isSuccess` do React Query, mostrando indicadores de carregamento e mensagens de erro adequadas.

2. **Segurança & Autenticação**
   - JWT Middleware:
     ```typescript
     // api/src/middleware/auth.ts
     import jwt from 'jsonwebtoken';
     import { createClient } from '@supabase/supabase-js';

     export const authenticateToken = async (req, res, next) => {
       const token = req.headers.authorization?.split(' ')[1];

       if (!token) {
         return res.status(401).json({ error: 'Token required' });
       }

       try {
         const supabase = createClient(
           process.env.SUPABASE_URL!,
           process.env.SUPABASE_SERVICE_KEY!
         );

         const { data: { user }, error } = await supabase.auth.getUser(token);

         if (error || !user) {
           return res.status(401).json({ error: 'Invalid token' });
         }

         req.user = user;
         next();
       } catch (error) {
         res.status(403).json({ error: 'Token validation failed' });
       }
     };
     ```
   - RBAC Middleware:
     ```typescript
     export const requireRole = (roles: string[]) => {
       return async (req, res, next) => {
         const userRole = req.user.user_metadata?.role || 'member';

         if (!roles.includes(userRole)) {
           return res.status(403).json({ error: 'Insufficient permissions' });
         }

         next();
       };
     };
     ```

3. **Background Jobs & Cron**
   - Worker Service:
     ```typescript
     // api/src/workers/cronJobs.ts
     import cron from 'node-cron';
     import { generateReports } from '../services/reportService';
     import { backupDatabase } from '../services/backupService';

     // Relatórios diários às 6h
     cron.schedule('0 6 * * *', async () => {
       console.log('Gerando relatórios diários...');
       await generateReports('daily');
     });

     // Backup semanal aos domingos às 2h
     cron.schedule('0 2 * * 0', async () => {
       console.log('Executando backup semanal...');
       await backupDatabase();
     });

     // Limpeza de logs mensalmente
     cron.schedule('0 0 1 * *', async () => {
       console.log('Limpando logs antigos...');
       await cleanOldLogs();
     });
     ```

4. **Cache Strategy (Redis Cloud)**
   - Serviço de cache:
     ```typescript
     // api/src/services/cacheService.ts
     import Redis from 'ioredis';

     const redis = new Redis(process.env.REDIS_URL);

     export const cacheService = {
       async get(key: string) {
         const cached = await redis.get(key);
         return cached ? JSON.parse(cached) : null;
       },

       async set(key: string, data: any, ttl: number = 3600) {
         await redis.setex(key, ttl, JSON.stringify(data));
       },

       async invalidate(pattern: string) {
         const keys = await redis.keys(pattern);
         if (keys.length > 0) {
           await redis.del(...keys);
         }
       }
     };

     // Uso: cache de estatísticas por 1h
     app.get('/api/stats', async (req, res) => {
       const cached = await cacheService.get('stats:dashboard');
       if (cached) return res.json(cached);

       const stats = await getDashboardStats();
       await cacheService.set('stats:dashboard', stats, 3600);
       res.json(stats);
     });
     ```

## 🔒 Estratégias de Segurança

- Sanitização & Validação
  ```typescript
  // api/src/middleware/validation.ts
  import { z } from 'zod';
  import DOMPurify from 'isomorphic-dompurify';

  const eventSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000),
    date: z.string().datetime(),
    capacity: z.number().int().positive().max(1000)
  });

  export const validateAndSanitize = (schema: z.ZodSchema) => {
    return (req, res, next) => {
      try {
        // Sanitizar strings
        const sanitized = Object.keys(req.body).reduce((acc, key) => {
          const value = req.body[key];
          acc[key] = typeof value === 'string' ? DOMPurify.sanitize(value) : value;
          return acc;
        }, {});

        // Validar com Zod
        const validated = schema.parse(sanitized);
        req.body = validated;
        next();
      } catch (error) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
    };
  };
  ```
- Rate Limiting Específico
  ```typescript
  // Diferentes limites por endpoint
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Apenas 5 tentativas de login por 15min
    message: 'Muitas tentativas de login'
  });

  const uploadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10, // 10 uploads por minuto
    message: 'Limite de upload excedido'
  });

  app.use('/api/auth/login', authLimiter);
  app.use('/api/upload', uploadLimiter);
  ```
- File Upload Security
  ```typescript
  // api/src/services/uploadService.ts
  import multer from 'multer';
  import sharp from 'sharp';

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZE },
    fileFilter: (req, file, cb) => {
      if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Tipo de arquivo não permitido'));
      }
    }
  });

  export const uploadImage = async (file: Express.Multer.File) => {
    // Comprimir imagem
    const compressedBuffer = await sharp(file.buffer)
      .jpeg({ quality: 80 })
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    // Upload para Supabase Storage
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, compressedBuffer, {
        contentType: 'image/jpeg'
      });

    if (error) throw error;
    return data.path;
  };
  ```

## 📊 Dados de Produção & Configurações

- Configuração `.env.production`:
  ```env
  NODE_ENV=production
  PORT=4000

  # Supabase
  VITE_SUPABASE_URL=https://pzchczilvfhzudybmgms.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

  # Database
  DATABASE_URL=postgresql://postgres:2GZPkxTmfSiTY64E@db.pzchczilvfhzudybmgms.supabase.co:5432/postgres

  # Redis Cache (Upstash Free)
  REDIS_URL=redis://default:password@region.upstash.io:6379

  # Security
  JWT_SECRET=sua_chave_super_secreta_256_bits
  ENCRYPTION_KEY=sua_chave_de_criptografia_32_bytes

  # Cloudflare
  CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiYWQ4NjRiN2Q3ZjRjMDM3OThmYWQwM2VjMGQzY2RkYTgiLCJ0IjoiNDNkZWVkNjktYjNkYS00NmNhLTlkYzItNDIyMmJkYWNkODRkIiw
  icyI6Ik1qYzVNalUwWlRrdFpXWm1aQzAwWWpSa0xUa3pOemd0T1dKaE5Ea3pZVE0zTjJWaCJ9

  # Monitoring
  LOG_LEVEL=info
  ENABLE_METRICS=true
  ```

- Volume de Dados Esperado:
  - Usuários: 100-200 membros ativos
  - Eventos: 4-8 por mês (48-96/ano)
  - Doações: 50-100 por mês (600-1200/ano)
  - Storage: 2-5GB (fotos, recibos, documentos)
  - DB Size: ~500MB
  - Traffic: ~1000 requests/dia

## 🚀 Deployment & Scripts

- Script de Deploy:
  ```bash
  #!/bin/bash
  # scripts/deploy.sh

  echo "🚀 Iniciando deploy da CCCP..."

  # Build das imagens
  docker-compose -f docker-compose.yml build --no-cache

  # Parar serviços antigos
  docker-compose down

  # Iniciar novos serviços
  docker-compose up -d

  # Verificar saúde dos serviços
  sleep 30
  bash scripts/health-check.sh

  echo "✅ Deploy concluído!"
  ```
- Health Check:
  ```bash
  #!/bin/bash
  # scripts/health-check.sh

  API_URL="http://localhost:4000"
  FRONTEND_URL="http://localhost:3000"

  # Verificar API
  if curl -f -s "$API_URL/health" > /dev/null; then
      echo "✅ API is healthy"
  else
      echo "❌ API is down"
      exit 1
  fi

  # Verificar Frontend
  if curl -f -s "$FRONTEND_URL" > /dev/null; then
      echo "✅ Frontend is healthy"
  else
      echo "❌ Frontend is down"
      exit 1
  fi

  echo "🎉 All services are running!"
  ```
- Backup Automatizado:
  ```bash
  #!/bin/bash
  # scripts/backup.sh

  BACKUP_DIR="/backups"
  DATE=$(date +"%Y%m%d_%H%M%S")

  # Backup do banco via Supabase
  curl -X POST "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/database/backups" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json"

  # Backup de arquivos do storage
  mkdir -p "$BACKUP_DIR/$DATE"
  # Script customizado para download dos arquivos do Supabase Storage

  echo "📦 Backup realizado: $BACKUP_DIR/$DATE"
  ```

## 📈 Monitoramento Simples

- Logging Strategy:
  ```typescript
  // api/src/utils/logger.ts
  import winston from 'winston';

  export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' }),
      new winston.transports.Console({
        format: winston.format.simple()
      })
    ]
  });

  // Middleware de log de requests
  export const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info({
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    });

    next();
  };
  ```

## ⚡ Otimizações & Performance

- Dockerfiles Otimizados:
  - Frontend Dockerfile:
    ```dockerfile
    # frontend/Dockerfile
    FROM node:18-alpine AS builder

    WORKDIR /app
    COPY package*.json ./
    RUN npm ci --only=production

    COPY . .
    RUN npm run build

    FROM nginx:alpine
    COPY --from=builder /app/dist /usr/share/nginx/html
    COPY nginx.conf /etc/nginx/nginx.conf

    EXPOSE 3000
    CMD ["nginx", "-g", "daemon off;"]
    ```
  - API Dockerfile:
    ```dockerfile
    # api/Dockerfile
    FROM node:18-alpine AS builder

    WORKDIR /app
    COPY package*.json ./
    RUN npm ci --only=production

    COPY . .
    RUN npm run build

    FROM node:18-alpine
    WORKDIR /app

    RUN addgroup -g 1001 -S nodejs
    RUN adduser -S nextjs -u 1001

    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/node_modules ./node_modules
    COPY package*.json ./

    USER nextjs
    EXPOSE 4000

    CMD ["node", "dist/app.js"]
    ```

## 🎯 Roadmap de Implementação

**Fase 1 - Setup Inicial (Semana 1-2)**
1. Reestruturação do projeto para arquitetura monorepo.
2. Criação da API Node.js com estrutura base.
3. Dockerização dos serviços frontend e backend.
4. Configuração do Cloudflare Tunnel para acesso externo.

**Fase 2 - Migração de Funcionalidades (Semana 3-4)**
1. Migração gradual das chamadas diretas do Supabase para API.
2. Implementação de middleware de autenticação e autorização.
3. Adição de validação e sanitização de dados.
4. Sistema de cache com Redis para queries frequentes.

**Fase 3 - Segurança & Estabilidade (Semana 5-6)**
1. Rate limiting e proteção contra ataques.
2. Sistema de logs estruturados.
3. Backup automatizado e recovery procedures.
4. Health checks e monitoring básico.

**Fase 4 - Otimizações & Features (Semana 7-8)**
1. Background jobs para relatórios e manutenção.
2. Compressão de imagens automática.
3. Export de dados em múltiplos formatos.
4. Push notifications via OneSignal.

## 💰 Custos Operacionais

- Supabase: R$ 0 (Free Tier - 500MB DB, 1GB Storage, 2GB Bandwidth)
- Cloudflare Tunnel: R$ 0 (Gratuito)
- Upstash Redis: R$ 0 (Free Tier - 10k commands/day)
- OneSignal: R$ 0 (Free Tier - 10k notifications/month)
- Hospedagem: R$ 0 (assumindo VPS própria ou servidor local)

**TOTAL:** R$ 0/mês 🎉

**Upgrade Path (se necessário):**
- Supabase Pro: $25/mês (~R$ 125) - 8GB DB, 100GB Storage
- Upstash Pro: $10/mês (~R$ 50) - 100k commands/day
- VPS Dedicada: R$ 50-100/mês - Para controle total

**TOTAL Upgrade:** ~R$ 225/mês

## 🔐 Checklist de Segurança Final

**✅ Implementado**
- JWT Authentication via Supabase
- RBAC com roles (admin, leader, member)
- HTTPS obrigatório via Cloudflare
- Variáveis de ambiente protegidas
- Row Level Security no Supabase

**🚀 A Implementar**
- Rate limiting por endpoint
- Sanitização de inputs (DOMPurify)
- Validação com Zod schemas
- File upload security (type validation + compression)
- Request/Response logging
- CORS restritivo para domínios específicos
- Content Security Policy headers
- Backup automatizado semanal

---

**Este plano garante:**
- ✅ Custo Zero mantendo Free Tiers
- ✅ Máxima Segurança com múltiplas camadas
- ✅ Alta Disponibilidade via Docker + Health Checks
- ✅ Escalabilidade fácil quando necessário
- ✅ Manutenibilidade com código organizado e documentado