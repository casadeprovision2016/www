#!/bin/sh
# Script de inicialização do Cloudflare Tunnel
# Arquivo: cloudflare/start-tunnel.sh

set -e

echo "🌩️  Iniciando Cloudflare Tunnel para CCCP..."

# Verificar se o token foi fornecido
if [ -z "$TUNNEL_TOKEN" ]; then
    echo "❌ Erro: TUNNEL_TOKEN não foi definido"
    echo "📋 Para configurar:"
    echo "   1. Acesse https://dash.cloudflare.com"
    echo "   2. Vá para Zero Trust > Access > Tunnels"
    echo "   3. Crie um novo tunnel e copie o token"
    echo "   4. Defina CLOUDFLARE_TUNNEL_TOKEN no .env"
    exit 1
fi

# Verificar conectividade com a internet
echo "🔍 Verificando conectividade..."
if ! ping -c 1 -W 5 cloudflare.com > /dev/null 2>&1; then
    echo "❌ Erro: Sem conectividade com a internet"
    exit 1
fi

# Aguardar serviços dependentes
echo "⏳ Aguardando serviços internos..."
sleep 10

# Verificar se os serviços estão respondendo
echo "🔍 Verificando serviços internos..."

# Verificar frontend
if ! wget --quiet --tries=1 --timeout=5 --spider http://frontend:80/health; then
    echo "⚠️  Aviso: Frontend não está respondendo, continuando..."
fi

# Verificar backend
if ! wget --quiet --tries=1 --timeout=5 --spider http://backend:4000/health; then
    echo "⚠️  Aviso: Backend não está respondendo, continuando..."
fi

echo "✅ Iniciando túnel Cloudflare..."

# Iniciar o túnel com configuração ou token
if [ -f "/etc/cloudflared/config.yml" ]; then
    echo "📁 Usando arquivo de configuração"
    exec cloudflared tunnel --config /etc/cloudflared/config.yml run
else
    echo "🔗 Usando token direto"
    exec cloudflared tunnel --no-autoupdate run --token "$TUNNEL_TOKEN"
fi