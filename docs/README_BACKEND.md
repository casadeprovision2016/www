# CCCP Backend API

Sistema de gerenciamento para Casa de Provisão construído com Node.js, Express, TypeScript e Supabase.

## 🚀 Funcionalidades

- **Autenticación y Autorización**: JWT vía Supabase Auth con RBAC
- **Gestão de Eventos**: CRUD completo com inscrições e estatísticas
- **Gestão de Membros**: Controle de membros com histórico e ministérios
- **Gestão de Doações**: Registro de doações com upload de comprovantes
- **Gestión de Ministerios**: Organización de ministerios y miembros
- **Transmissões ao Vivo**: Controle de streams e gravações
- **Visitas Pastorais**: Agendamento e controle de visitas
- **Relatórios**: Dashboard e relatórios personalizados
- **Cache Redis**: Sistema de cache para alta performance
- **Upload de Arquivos**: Processamento de imagens com Sharp
- **Logs Estruturados**: Sistema de logging com Winston
- **Rate Limiting**: Protección contra abuso de API
- **Health Checks**: Monitoramento de saúde dos serviços

## 📋 Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- Conta no Supabase
- Redis (ou Upstash para cloud)

## 🛠️ Instalación

1. **Clone o repositório**
```bash
git clone <repository-url>
cd cccp/api
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp ../.env.example ../.env
# Edite o arquivo .env com suas configurações
```

4. **Execute em desenvolvimento**
```bash
npm run dev
```

## 🐳 Docker

### Desenvolvimento com Docker
```bash
# Na raiz do projeto
docker-compose up -d
```

### Producción
```bash
# Deploy completo
./scripts/deploy.sh production

# Verificar saúde dos serviços
./scripts/health-check.sh
```

## 📁 Estrutura do Projeto

```
api/
├── src/
│   ├── controllers/         # Controladores de rotas
│   ├── middleware/          # Middlewares (auth, validation, etc.)
│   ├── routes/             # Definições de rotas
│   ├── services/           # Serviços (cache, upload, etc.)
│   ├── utils/              # Utilitários (logger, etc.)
│   ├── types/              # Tipos TypeScript específicos da API
│   └── app.ts              # Aplicación principal
├── logs/                   # Logs de la aplicación
├── Dockerfile              # Imagem Docker para API
├── Dockerfile.worker       # Imagem Docker para workers
└── package.json
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Compila TypeScript
- `npm start` - Executa versão compilada
- `npm run lint` - Executa ESLint
- `npm run typecheck` - Verifica tipos TypeScript
- `npm test` - Executa testes

## 🛡️ Segurança

- **Helmet**: Headers de segurança HTTP
- **CORS**: Configuración restrictiva de CORS
- **Rate Limiting**: Protección contra spam/DDoS
- **Validación de Entrada**: Zod + DOMPurify
- **Sanitización**: Limpieza de datos de entrada
- **JWT**: Tokens seguros via Supabase
- **Upload Seguro**: Validación de tipos y procesamiento

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login do usuário
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/verify` - Verificar token

### Eventos
- `GET /api/events` - Listar eventos
- `POST /api/events` - Criar evento
- `GET /api/events/:id` - Buscar por ID
- `PUT /api/events/:id` - Atualizar evento
- `DELETE /api/events/:id` - Deletar evento
- `GET /api/events/stats` - Estatísticas

### Membros
- `GET /api/members` - Listar membros
- `POST /api/members` - Criar membro
- `GET /api/members/:id` - Buscar por ID
- `PUT /api/members/:id` - Atualizar membro
- `DELETE /api/members/:id` - Deletar membro
- `GET /api/members/stats` - Estatísticas

### Doações
- `GET /api/donations` - Listar doações
- `POST /api/donations` - Crear donación
- `GET /api/donations/:id` - Buscar por ID
- `PUT /api/donations/:id` - Actualizar donación
- `DELETE /api/donations/:id` - Eliminar donación
- `POST /api/donations/:id/receipt` - Upload comprovante
- `GET /api/donations/export` - Exportar dados

### Ministérios
- `GET /api/ministries` - Listar ministérios
- `POST /api/ministries` - Criar ministério
- `GET /api/ministries/:id` - Buscar por ID
- `PUT /api/ministries/:id` - Atualizar ministério
- `DELETE /api/ministries/:id` - Deletar ministério
- `GET /api/ministries/:id/members` - Membros do ministério

### Transmissões
- `GET /api/streams` - Listar streams
- `GET /api/streams/live` - Stream ativa
- `POST /api/streams` - Criar stream
- `PUT /api/streams/:id` - Atualizar stream
- `DELETE /api/streams/:id` - Deletar stream

### Visitas Pastorais
- `GET /api/pastoral-visits` - Listar visitas
- `POST /api/pastoral-visits` - Criar visita
- `PUT /api/pastoral-visits/:id` - Atualizar visita
- `POST /api/pastoral-visits/:id/complete` - Concluir visita

### Relatórios
- `GET /api/reports/dashboard` - Dashboard stats
- `GET /api/reports/monthly` - Relatório mensal
- `GET /api/reports/yearly` - Relatório anual
- `GET /api/reports/custom` - Relatório customizado

## 🔍 Monitoramento

### Health Check
```bash
curl http://localhost:4444/health
```

### Logs
```bash
# Via Docker
docker-compose logs api

# Arquivos de log
tail -f api/logs/combined.log
tail -f api/logs/error.log
```

### Métricas
- Rate limiting status
- Cache hit/miss rates
- Response times
- Error rates

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Executar com watch
npm run test:watch

# Coverage
npm run test:coverage
```

## 🚀 Deploy

### Desenvolvimento
```bash
npm run dev
```

### Staging
```bash
./scripts/deploy.sh staging
```

### Producción
```bash
./scripts/deploy.sh production
```

## 🔧 Configuración del Banco

O sistema utiliza Supabase como backend. As principais tabelas são:

- `users` - Usuários do sistema
- `events` - Eventos da igreja
- `members` - Membros da igreja
- `donations` - Doações e ofertas
- `ministries` - Ministérios
- `live_streams` - Transmissões
- `pastoral_visits` - Visitas pastorais

## 📝 Logs

O sistema gera logs estruturados em JSON:

- `logs/combined.log` - Todos os logs
- `logs/error.log` - Apenas erros
- Console - Em desenvolvimento

## 🤝 Contribución

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.