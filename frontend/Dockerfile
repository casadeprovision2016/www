# Multi-stage build para otimizar o tamanho final da imagem
FROM node:18-alpine AS builder

# Instalar dependências necessárias
RUN apk add --no-cache git

WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Instalar dependências
RUN npm ci --legacy-peer-deps

# Copiar código fonte
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY .env ./

# Args para build time
ARG VITE_API_URL=https://api.casadeprovision.es
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set environment variables para o build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

# Construir aplicação
RUN npm run build

# Estágio de produção com nginx
FROM nginx:alpine

# Instalar curl para health check
RUN apk add --no-cache curl

# Copiar configuração personalizada do nginx
COPY <<EOF /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Configuração para SPA (Single Page Application)
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        # Configurar headers de segurança
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # Configuração para arquivos estáticos
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Health check endpoint
        location /health {
            access_log off;
            return 200 'healthy';
            add_header Content-Type text/plain;
        }
        
        # API proxy para evitar CORS em desenvolvimento
        location /api/ {
            proxy_pass http://backend:4000/api/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
        
        # Proxy para health check do backend
        location /api/health {
            proxy_pass http://backend:4000/health;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # Configuração SPA - todas as rotas retornam index.html
        location / {
            try_files \$uri \$uri/ /index.html;
        }
        
        # Configuração para service worker
        location /sw.js {
            add_header Cache-Control "no-cache";
            proxy_cache_bypass \$http_pragma;
            proxy_cache_revalidate on;
            expires off;
            access_log off;
        }
        
        # Configuração para manifest.json
        location /manifest.json {
            add_header Cache-Control "no-cache";
            expires off;
        }
    }
}
EOF

# Copiar arquivos construídos do estágio builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S frontend -u 1001 -G nginx-user

# Ajustar permissões
RUN chown -R frontend:nginx-user /usr/share/nginx/html && \
    chown -R frontend:nginx-user /var/cache/nginx && \
    chown -R frontend:nginx-user /var/log/nginx && \
    chown -R frontend:nginx-user /etc/nginx/conf.d

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]