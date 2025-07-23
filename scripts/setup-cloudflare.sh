#!/bin/bash
# Script de configuração do Cloudflare Tunnel para CCCP
# Arquivo: scripts/setup-cloudflare.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BLUE}"
    echo "🌩️  =========================================="
    echo "   Configuração Cloudflare Tunnel - CCCP"
    echo "==========================================${NC}"
    echo
}

# Verificar pré-requisitos
check_prerequisites() {
    print_status "Verificando pré-requisitos..."
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker não está instalado"
        exit 1
    fi
    
    # Verificar Docker Compose
    if ! command -v docker compose &> /dev/null; then
        print_error "Docker Compose não está instalado"
        exit 1
    fi
    
    # Verificar se estamos no diretório correto
    if [ ! -f "docker-compose.yml" ]; then
        print_error "Execute este script na raiz do projeto CCCP"
        exit 1
    fi
    
    print_success "Pré-requisitos verificados"
}

# Configurar variáveis de ambiente
setup_environment() {
    print_status "Configurando variáveis de ambiente..."
    
    # Verificar se .env.production já existe
    if [ -f ".env.production" ]; then
        print_warning ".env.production já existe"
        read -p "Deseja sobrescrever? [y/N]: " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Mantendo configuração atual"
            return
        fi
    fi
    
    # Copiar template
    if [ -f ".env.cloudflare" ]; then
        cp .env.cloudflare .env.production
        print_success "Template copiado para .env.production"
    else
        print_error "Template .env.cloudflare não encontrado"
        exit 1
    fi
    
    # Solicitar token do usuário
    echo
    print_status "Configure o token do Cloudflare Tunnel:"
    echo "1. Acesse: https://dash.cloudflare.com"
    echo "2. Vá para: Zero Trust > Access > Tunnels"
    echo "3. Crie um novo tunnel e copie o token"
    echo
    
    read -p "Cole o token do Cloudflare Tunnel: " tunnel_token
    
    if [ -z "$tunnel_token" ]; then
        print_error "Token não pode estar vazio"
        exit 1
    fi
    
    # Solicitar domínio
    read -p "Digite seu domínio (ex: cccp.suaempresa.com): " domain
    
    if [ -z "$domain" ]; then
        print_error "Domínio não pode estar vazio"
        exit 1
    fi
    
    # Atualizar arquivo .env.production
    sed -i "s/your_tunnel_token_here/$tunnel_token/" .env.production
    sed -i "s/cccp.example.com/$domain/" .env.production
    sed -i "s/api.cccp.example.com/api.$domain/" .env.production
    
    print_success "Variáveis configuradas em .env.production"
}

# Verificar configuração do DNS
check_dns() {
    print_status "Verificando configuração DNS..."
    
    # Carregar domínio do arquivo .env.production
    if [ -f ".env.production" ]; then
        source .env.production
        domain=$CLOUDFLARE_DOMAIN
    else
        print_error ".env.production não encontrado"
        return 1
    fi
    
    if [ -z "$domain" ]; then
        print_warning "Domínio não configurado, pulando verificação DNS"
        return
    fi
    
    print_status "Verificando DNS para: $domain"
    
    # Verificar se o domínio resolve
    if nslookup "$domain" &> /dev/null; then
        print_success "DNS configurado para $domain"
    else
        print_warning "DNS ainda não propagado para $domain"
        print_status "Configure os registros CNAME no Cloudflare:"
        echo "  $domain -> [tunnel-id].cfargotunnel.com"
        echo "  api.$domain -> [tunnel-id].cfargotunnel.com"
    fi
}

# Iniciar serviços
start_services() {
    print_status "Iniciando serviços..."
    
    # Verificar se os serviços básicos estão rodando
    if ! docker compose ps | grep -q "Up.*healthy"; then
        print_status "Iniciando serviços básicos..."
        docker compose up -d
        
        print_status "Aguardando serviços ficarem saudáveis..."
        sleep 30
    fi
    
    # Carregar variáveis de produção
    if [ -f ".env.production" ]; then
        export $(cat .env.production | grep -v '^#' | xargs)
    fi
    
    # Iniciar com perfil de produção
    print_status "Iniciando túnel Cloudflare..."
    docker compose --profile production up -d
    
    print_success "Serviços iniciados"
}

# Verificar status dos serviços
check_status() {
    print_status "Verificando status dos serviços..."
    
    echo
    docker compose ps
    echo
    
    # Verificar logs do túnel
    print_status "Logs recentes do túnel Cloudflare:"
    docker compose logs cloudflare-tunnel --tail=10
}

# Testar conectividade
test_connectivity() {
    print_status "Testando conectividade..."
    
    # Testar serviços locais
    echo
    print_status "Testando serviços locais:"
    
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health | grep -q "200"; then
        print_success "Frontend local: OK"
    else
        print_error "Frontend local: FALHA"
    fi
    
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health | grep -q "200"; then
        print_success "API local: OK"
    else
        print_error "API local: FALHA"
    fi
    
    # Testar túnel (se domínio estiver configurado)
    if [ -f ".env.production" ]; then
        source .env.production
        if [ ! -z "$CLOUDFLARE_DOMAIN" ]; then
            echo
            print_status "Testando acesso público:"
            
            if curl -s -o /dev/null -w "%{http_code}" "https://$CLOUDFLARE_DOMAIN" | grep -q "200"; then
                print_success "Acesso público: https://$CLOUDFLARE_DOMAIN"
            else
                print_warning "Acesso público ainda não disponível"
                print_status "Verifique:"
                print_status "1. Configuração DNS no Cloudflare"
                print_status "2. Logs do túnel: docker compose logs cloudflare-tunnel"
            fi
        fi
    fi
}

# Menu principal
show_menu() {
    echo
    print_status "Escolha uma opção:"
    echo "1. Configuração completa (recomendado)"
    echo "2. Apenas configurar variáveis"
    echo "3. Apenas iniciar serviços"
    echo "4. Verificar status"
    echo "5. Testar conectividade"
    echo "6. Ver logs do túnel"
    echo "7. Parar serviços"
    echo "0. Sair"
    echo
    read -p "Digite sua opção [0-7]: " choice
}

# Função principal
main() {
    print_header
    
    check_prerequisites
    
    if [ $# -eq 0 ]; then
        # Modo interativo
        while true; do
            show_menu
            case $choice in
                1)
                    setup_environment
                    check_dns
                    start_services
                    check_status
                    test_connectivity
                    ;;
                2)
                    setup_environment
                    ;;
                3)
                    start_services
                    ;;
                4)
                    check_status
                    ;;
                5)
                    test_connectivity
                    ;;
                6)
                    docker compose logs cloudflare-tunnel -f
                    ;;
                7)
                    docker compose --profile production down
                    print_success "Serviços parados"
                    ;;
                0)
                    print_success "Saindo..."
                    exit 0
                    ;;
                *)
                    print_error "Opção inválida"
                    ;;
            esac
            echo
            read -p "Pressione Enter para continuar..."
        done
    else
        # Modo automatizado com argumentos
        case $1 in
            "setup")
                setup_environment
                check_dns
                start_services
                check_status
                test_connectivity
                ;;
            "start")
                start_services
                ;;
            "status")
                check_status
                ;;
            "test")
                test_connectivity
                ;;
            "stop")
                docker compose --profile production down
                ;;
            *)
                echo "Uso: $0 [setup|start|status|test|stop]"
                exit 1
                ;;
        esac
    fi
}

# Executar função principal
main "$@"