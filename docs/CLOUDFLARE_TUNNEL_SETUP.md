# Configuração do Cloudflare Tunnel

Este documento explica como o Cloudflare Tunnel está configurado no projeto CCCP.

## Domínios Configurados

### Produção
- **casadeprovision.es** → Frontend (frontend:80)
- **www.casadeprovision.es** → Frontend (frontend:80)
- **api.casadeprovision.es** → Backend (backend:4000)

## Configuração Docker

### Serviços
- `frontend`: React app rodando na porta 80 (internamente)
- `backend`: API Node.js rodando na porta 4000 (internamente)
- `cloudflare-tunnel`: Túnel Cloudflare conectando os domínios aos serviços

### Variáveis de Ambiente Necessárias

```bash
# Cloudflare Tunnel Token
CLOUDFLARE_TUNNEL_TOKEN=seu_token_aqui

# URLs dos serviços
FRONTEND_URL=https://casadeprovision.es
VITE_API_URL=https://api.casadeprovision.es
```

## Como Executar

### Desenvolvimento Local
```bash
# Executar apenas os serviços principais
docker-compose up frontend backend redis

# Frontend: http://localhost:3001
# Backend: http://localhost:4000
```

### Produção com Cloudflare Tunnel
```bash
# Executar com o perfil de produção
docker-compose --profile production up -d

# Verificar logs do túnel
docker-compose logs -f cloudflare-tunnel
```

## Verificação de Status

### Health Checks
- Frontend: `curl http://frontend:80/health`
- Backend: `curl http://backend:4000/health`
- Cloudflare Metrics: `http://localhost:8080/metrics`

### Logs
```bash
# Ver logs do túnel
docker-compose logs cloudflare-tunnel

# Ver todos os logs
docker-compose logs -f
```

## Configuração do Túnel no Cloudflare

1. Acesse o [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá para **Zero Trust** > **Access** > **Tunnels**
3. Crie um novo túnel ou edite o existente
4. Configure as rotas:
   - `casadeprovision.es` → `http://frontend:80`
   - `www.casadeprovision.es` → `http://frontend:80`
   - `api.casadeprovision.es` → `http://backend:4000`

## Arquivos de Configuração

### `cloudflare/config.yml`
Configuração das rotas do túnel

### `cloudflare/start-tunnel.sh`
Script de inicialização com verificações de saúde

### `docker-compose.yml`
Definição dos serviços e dependências

## Troubleshooting

### Túnel não conecta
1. Verifique se o token está correto
2. Verifique conectividade com a internet
3. Veja os logs: `docker-compose logs cloudflare-tunnel`

### Frontend não carrega
1. Verifique se o serviço frontend está rodando
2. Verifique as variáveis de ambiente
3. Teste localmente: `curl http://localhost:3001`

### API não responde
1. Verifique se o backend está rodando
2. Teste o health check: `curl http://localhost:4000/health`
3. Verifique configuração CORS no backend

### CORS errors
- O backend está configurado para aceitar requisições dos domínios configurados
- Verifique se `FRONTEND_URL` está definido corretamente