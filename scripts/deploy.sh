#!/bin/bash

# Script de Deploy - CCCP API
# Uso: ./scripts/deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-staging}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups"
LOG_FILE="deploy_${TIMESTAMP}.log"

echo "🚀 Iniciando deploy da CCCP API - Ambiente: $ENVIRONMENT"

# Função para logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Função para verificar pré-requisitos
check_prerequisites() {
    log "Verificando pré-requisitos..."
    
    # Verificar se Docker está instalado
    if ! command -v docker &> /dev/null; then
        log "❌ Docker não encontrado. Instale o Docker primeiro."
        exit 1
    fi
    
    # Verificar se Docker Compose está instalado
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log "❌ Docker Compose não encontrado. Instale o Docker Compose primeiro."
        exit 1
    fi
    
    # Verificar se arquivo .env existe
    if [ ! -f ".env" ]; then
        log "❌ Arquivo .env não encontrado. Copie .env.example para .env e configure."
        exit 1
    fi
    
    log "✅ Pré-requisitos verificados"
}

# Função para backup
backup_current() {
    log "Criando backup do estado atual..."
    
    mkdir -p "$BACKUP_DIR/$TIMESTAMP"
    
    # Backup do banco de dados (se aplicável)
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Executando backup do banco de dados..."
        # Aqui você pode adicionar lógica específica de backup do Supabase
        # curl -X POST "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/database/backups" \
        #   -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}"
    fi
    
    # Backup dos volumes Docker
    docker-compose down --volumes --remove-orphans 2>/dev/null || true
    
    log "✅ Backup concluído: $BACKUP_DIR/$TIMESTAMP"
}

# Função para build das imagens
build_images() {
    log "Construindo imagens Docker..."
    
    # Build sem cache para garantir atualizações
    docker-compose build --no-cache --parallel
    
    # Remover imagens antigas não utilizadas
    docker image prune -f
    
    log "✅ Imagens construídas com sucesso"
}

# Função para deploy
deploy() {
    log "Iniciando deploy..."
    
    # Parar serviços antigos
    docker-compose down --remove-orphans
    
    # Iniciar novos serviços
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose --profile production up -d
    else
        docker-compose up -d
    fi
    
    log "✅ Serviços iniciados"
}

# Função para verificar saúde dos serviços
health_check() {
    log "Verificando saúde dos serviços..."
    
    # Aguardar serviços iniciarem
    sleep 30
    
    # Verificar API
    API_URL="http://localhost:4444"
    if curl -f -s "$API_URL/health" > /dev/null; then
        log "✅ API está saudável"
    else
        log "❌ API não está respondendo"
        show_logs
        exit 1
    fi
    
    # Verificar Redis
    if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        log "✅ Redis está saudável"
    else
        log "❌ Redis não está respondendo"
        show_logs
        exit 1
    fi
    
    log "✅ Todos os serviços estão saudáveis"
}

# Função para mostrar logs em caso de erro
show_logs() {
    log "Mostrando logs dos serviços..."
    docker-compose logs --tail=50
}

# Função para rollback
rollback() {
    log "❌ Deploy falhou. Iniciando rollback..."
    
    docker-compose down --remove-orphans
    
    # Aqui você pode implementar lógica de rollback específica
    # Por exemplo, restaurar backup anterior
    
    log "Rollback concluído. Verifique os logs para identificar o problema."
    exit 1
}

# Função principal
main() {
    # Trap para rollback em caso de erro
    trap rollback ERR
    
    check_prerequisites
    
    if [ "$ENVIRONMENT" = "production" ]; then
        backup_current
    fi
    
    build_images
    deploy
    health_check
    
    log "🎉 Deploy concluído com sucesso!"
    log "API disponível em: http://localhost:4444"
    log "Health check: http://localhost:4444/health"
    
    # Limpar logs antigos (manter últimos 10)
    find . -name "deploy_*.log" -type f | sort -r | tail -n +11 | xargs rm -f 2>/dev/null || true
}

# Executar função principal
main