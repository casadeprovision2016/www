# 🌩️ Configuración del Cloudflare Tunnel - CCCP

## 📋 Pré-requisitos

1. **Conta Cloudflare**: Tenha uma conta ativa no [Cloudflare](https://cloudflare.com)
2. **Domínio**: Domínio gerenciado pelo Cloudflare (pode ser gratuito)
3. **Zero Trust**: Acesso ao painel Zero Trust do Cloudflare

## 🚀 Configuración Paso a Paso

### 1. Criar o Tunnel no Cloudflare

1. Acesse o [painel Cloudflare](https://dash.cloudflare.com)
2. Vá para **Zero Trust** > **Access** > **Tunnels**
3. Clique em **"Create a tunnel"**
4. Selecione **"Cloudflared"** como conector
5. Dê um nome ao túnel: `cccp-tunnel`
6. **Copie o token gerado** (será usado no próximo passo)

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.production` baseado no `.env.cloudflare`:

```bash
# Copiar template
cp .env.cloudflare .env.production

# Editar com suas configurações
nano .env.production
```

Configure as seguintes variáveis:

```env
# Token obtido no passo anterior
CLOUDFLARE_TUNNEL_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Seu domínio (substitua example.com)
CLOUDFLARE_DOMAIN=cccp.suaempresa.com
CLOUDFLARE_API_DOMAIN=api.cccp.suaempresa.com
```

### 3. Configurar DNS no Cloudflare

No painel do Cloudflare, vá para **DNS** > **Records** e adicione:

| Tipo  | Nome | Destino | Status |
|-------|------|---------|--------|
| CNAME | cccp | [tunnel-id].cfargotunnel.com | Proxy ✅ |
| CNAME | api.cccp | [tunnel-id].cfargotunnel.com | Proxy ✅ |

> **Nota**: O `[tunnel-id]` será fornecido pelo Cloudflare ao criar o túnel

### 4. Configurar Rotas no Tunnel

No painel do túnel criado, configure as rotas:

#### Rota Principal (Frontend)
- **Hostname**: `cccp.suaempresa.com`
- **Service**: `http://frontend:80`
- **Path**: `/`

#### Rota API (Opcional)
- **Hostname**: `api.cccp.suaempresa.com`  
- **Service**: `http://api:4000`
- **Path**: `/`

### 5. Iniciar o Sistema com Cloudflare

```bash
# Cargar variables de producción
export $(cat .env.production | xargs)

# Iniciar todos os serviços incluindo Cloudflare
docker compose --profile production up -d

# Verificar status
docker compose ps
```

## 🔍 Verificación y Pruebas

### Verificar Status do Tunnel

```bash
# Ver logs do túnel
docker compose logs cloudflare-tunnel -f

# Verificar métricas
curl http://localhost:8080/metrics
```

### Testar Conectividade Externa

```bash
# Testar frontend público
curl -I https://cccp.suaempresa.com

# Testar API pública (se configurada)
curl https://api.cccp.suaempresa.com/health
```

## 📊 Monitoramento

O túnel Cloudflare expõe métricas na porta `8080`:

- **Métricas**: `http://localhost:8080/metrics`
- **Health Check**: Automático via Docker
- **Logs**: Estructurados con rotación automática

## 🔧 Configurações Avançadas

### Personalizar Configuración del Tunnel

Edite o arquivo `cloudflare/config.yml` para:

- Adicionar mais rotas
- Configurar autenticación
- Ajustar timeouts
- Personalizar headers

### Ejemplo de Configuración Personalizada

```yaml
ingress:
  # Ruta con autenticación
  - hostname: admin.cccp.suaempresa.com
    service: http://frontend:80
    originRequest:
      httpHostHeader: admin.cccp.suaempresa.com
      access:
        required: true
        teamName: sua-equipe

  # Rota com headers customizados
  - hostname: cccp.suaempresa.com
    service: http://frontend:80
    originRequest:
      httpHostHeader: cccp.suaempresa.com
      originServerName: cccp.suaempresa.com
      caPool: /etc/ssl/certs/ca-certificates.crt
```

## 🛡️ Segurança

### Headers de Segurança Automáticos

O Cloudflare adiciona automaticamente:

- **DDoS Protection**: Protección contra ataques
- **WAF**: Web Application Firewall
- **SSL/TLS**: Certificados automáticos
- **Rate Limiting**: Limitación de tasa

### Configurações Recomendadas

No painel Cloudflare, configure:

1. **SSL/TLS**: Full (strict)
2. **Security Level**: Medium
3. **DDoS Protection**: Enabled
4. **WAF**: Enabled com regras customizadas

## 🚨 Troubleshooting

### Problemas Comuns

1. **Tunnel não conecta**:
   ```bash
   # Verificar token
   echo $CLOUDFLARE_TUNNEL_TOKEN
   
   # Verificar logs
   docker compose logs cloudflare-tunnel
   ```

2. **DNS não resolve**:
   - Verificar configuración CNAME
   - Esperar propagación DNS (hasta 48h)

3. **Serviços internos não respondem**:
   ```bash
   # Verificar saúde dos serviços
   docker compose ps
   
   # Testar conectividade interna
   docker exec cccp-cloudflare-tunnel wget -qO- http://frontend:80/health
   ```

### Logs Úteis

```bash
# Logs completos do túnel
docker compose logs cloudflare-tunnel --tail=100 -f

# Logs de todos os serviços
docker compose logs -f

# Status detalhado
docker compose ps -a
```

## 📞 Suporte

Para problemas específicos:

1. **Documentación Cloudflare**: [developers.cloudflare.com](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
2. **Logs do Sistema**: `docker compose logs`
3. **Issues do GitHub**: Abra uma issue no repositório

---

**✅ Sistema CCCP agora acessível globalmente via Cloudflare Tunnel!** 🌍