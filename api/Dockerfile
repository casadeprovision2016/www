# Multi-stage build para otimizar o tamanho final da imagem
FROM node:20-alpine AS builder

# Instalar dependências necessárias para compilação
RUN apk add --no-cache python3 make g++ vips-dev

WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências incluindo dev dependencies para build
RUN npm ci && npm cache clean --force

# Copiar código fonte
COPY src/ ./src/
COPY shared/ ./shared/

# Compilar TypeScript
RUN npm run build

# Estágio final - imagem de produção
FROM node:20-alpine

# Instalar dependências do sistema necessárias
RUN apk add --no-cache \
    vips \
    curl \
    tini

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S cccp -u 1001 -G nodejs

WORKDIR /app

# Copiar node_modules e código compilado do estágio builder
COPY --from=builder --chown=cccp:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=cccp:nodejs /app/dist ./dist
COPY --from=builder --chown=cccp:nodejs /app/package*.json ./

# Criar diretório de logs
RUN mkdir -p logs && chown -R cccp:nodejs logs

# Definir usuário não-root
USER cccp

# Configurar variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=4444

# Expor porta
EXPOSE 4444

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4444/health || exit 1

# Usar tini como init system para handling de sinais
ENTRYPOINT ["/sbin/tini", "--"]

# Comando para iniciar a aplicação
CMD ["node", "dist/src/app.js"]