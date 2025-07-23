#!/bin/bash

# Script de Health Check - CCCP API
# Uso: ./scripts/health-check.sh

API_URL="${API_URL:-http://localhost:4000}"
REDIS_CONTAINER="${REDIS_CONTAINER:-cccp_redis_1}"

echo "🔍 Verificando saúde dos serviços CCCP..."

# Função para colorir output
red() { echo -e "\033[31m$1\033[0m"; }
green() { echo -e "\033[32m$1\033[0m"; }
yellow() { echo -e "\033[33m$1\033[0m"; }

# Função para testar API
check_api() {
    echo -n "🔍 Testando API... "
    
    if response=$(curl -f -s -w "%{http_code}" "$API_URL/health" -o /tmp/health_response); then
        if [ "$response" = "200" ]; then
            green "✅ API está saudável"
            
            # Mostrar detalhes da resposta
            echo "   Detalhes:"
            cat /tmp/health_response | jq '.' 2>/dev/null || cat /tmp/health_response
            echo
            return 0
        else
            red "❌ API retornou código $response"
            return 1
        fi
    else
        red "❌ API não está respondendo"
        return 1
    fi
}

# Função para testar Redis
check_redis() {
    echo -n "🔍 Testando Redis... "
    
    if docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
        green "✅ Redis está saudável"
        
        # Mostrar informações do Redis
        echo "   Detalhes:"
        docker-compose exec -T redis redis-cli info server | grep "redis_version\|uptime_in_seconds" | sed 's/^/   /'
        return 0
    else
        red "❌ Redis não está respondendo"
        return 1
    fi
}

# Função para verificar containers Docker
check_containers() {
    echo "🔍 Verificando containers Docker..."
    
    containers=$(docker-compose ps --format "table {{.Name}}\t{{.State}}\t{{.Status}}")
    echo "$containers"
    
    # Verificar se todos os containers estão rodando
    if docker-compose ps | grep -q "Exit"; then
        red "❌ Alguns containers não estão rodando"
        return 1
    else
        green "✅ Todos os containers estão rodando"
        return 0
    fi
}

# Função para verificar recursos do sistema
check_system_resources() {
    echo "🔍 Verificando recursos do sistema..."
    
    # Verificar uso de memória
    memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    echo "   Uso de memória: ${memory_usage}%"
    
    if (( $(echo "$memory_usage > 90" | bc -l) )); then
        yellow "⚠️  Alto uso de memória"
    fi
    
    # Verificar uso de disco
    disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    echo "   Uso de disco: ${disk_usage}%"
    
    if [ "$disk_usage" -gt 90 ]; then
        yellow "⚠️  Alto uso de disco"
    fi
    
    # Verificar carga do sistema
    load_avg=$(uptime | awk -F'load average:' '{print $2}' | cut -d, -f1 | xargs)
    echo "   Carga média: $load_avg"
}

# Função para verificar logs recentes
check_recent_logs() {
    echo "🔍 Verificando logs recentes de erros..."
    
    # Procurar por erros nos últimos 5 minutos
    if docker-compose logs --since="5m" | grep -i "error\|exception\|fatal" >/dev/null 2>&1; then
        yellow "⚠️  Erros encontrados nos logs recentes:"
        docker-compose logs --since="5m" | grep -i "error\|exception\|fatal" | tail -5 | sed 's/^/   /'
    else
        green "✅ Nenhum erro recente encontrado nos logs"
    fi
}

# Função para testar endpoints principais
test_endpoints() {
    echo "🔍 Testando endpoints principais..."
    
    endpoints=(
        "/health"
        "/api/events/stats"
        "/api/members/stats"
        "/api/donations/stats"
    )
    
    for endpoint in "${endpoints[@]}"; do
        echo -n "   Testando $endpoint... "
        
        if curl -f -s "$API_URL$endpoint" > /dev/null; then
            green "✅"
        else
            red "❌"
        fi
    done
}

# Função principal
main() {
    echo "========================================="
    echo "      CCCP API Health Check"
    echo "========================================="
    echo
    
    # Contador de falhas
    failures=0
    
    # Executar verificações
    check_containers || ((failures++))
    echo
    
    check_api || ((failures++))
    echo
    
    check_redis || ((failures++))
    echo
    
    test_endpoints || ((failures++))
    echo
    
    check_system_resources
    echo
    
    check_recent_logs
    echo
    
    # Resultado final
    echo "========================================="
    if [ $failures -eq 0 ]; then
        green "🎉 Todos os serviços estão saudáveis!"
        echo "   Timestamp: $(date)"
        echo "   Uptime: $(uptime | awk -F'up ' '{print $2}' | awk -F',' '{print $1}')"
        exit 0
    else
        red "❌ $failures verificações falharam"
        echo "   Verifique os logs para mais detalhes:"
        echo "   docker-compose logs --tail=50"
        exit 1
    fi
}

# Executar função principal
main