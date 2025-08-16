# 🐳 Setup Docker para Microblog - Enseñanzas de los Martes

Esta guía explica cómo configurar y ejecutar la funcionalidad de microblog integrada con Blogger API en el ambiente Docker del sistema CCCP.

## 📋 Requisitos Previos

- Docker y Docker Compose instalados
- API Key de Google Blogger configurada
- ID del blog de Blogger
- Acceso a la configuración del proyecto CCCP

## 🔧 Configuración del Ambiente

### 1. Variables de Entorno

**Archivo: `/api/.env`**
```env
# Configuración existente...
NODE_ENV=production
PORT=4444
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
REDIS_URL=redis://default:password@redis:6379
JWT_SECRET=your-jwt-secret

# Nueva configuración para Blogger API
BLOGGER_API_KEY=AIzaSyAGzTT-4vd5AwSm_T34rWF_Q1vqiAiaOHY
```

**Archivo: `/frontend/.env`**
```env
# Configuración existente...
VITE_API_URL=http://api:4444
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Nueva configuración para Blogger
VITE_BLOGGER_ID=YOUR_BLOG_ID_HERE
```

### 2. Actualización del Docker Compose

El `docker-compose.yml` ya está configurado para soportar las nuevas funcionalidades. Asegúrate de que las variables de entorno estén disponibles:

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
      - VITE_API_URL=http://api:4444
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
      - VITE_BLOGGER_ID=${VITE_BLOGGER_ID}  # Nueva variable
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
      - "4444:4444"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - SUPABASE_URL=${VITE_SUPABASE_URL}
      - SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - BLOGGER_API_KEY=${BLOGGER_API_KEY}  # Nueva variable
    depends_on:
      - cron-jobs
    networks:
      - cccp-network

  # Resto de la configuración...
```

## 🚀 Instalación y Ejecución

### 1. Preparar el Ambiente

```bash
# Clonar o actualizar el repositorio
cd /path/to/cccp

# Verificar que todas las dependencias estén actualizadas
cd api
npm install axios  # Asegurar que axios esté instalado
cd ../frontend
npm install  # Verificar dependencias del frontend
cd ..
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivos de ejemplo (si existen)
cp api/.env.example api/.env
cp frontend/.env.example frontend/.env

# Editar los archivos .env con los valores correctos
nano api/.env
nano frontend/.env
```

### 3. Construir y Ejecutar

```bash
# Construir las imágenes
docker-compose build --no-cache

# Ejecutar todos los servicios
docker-compose up -d

# Verificar que los servicios estén ejecutándose
docker-compose ps
```

### 4. Verificar la Instalación

```bash
# Verificar logs del API
docker-compose logs api

# Verificar logs del frontend
docker-compose logs frontend

# Probar endpoints del microblog
curl "http://localhost:4444/api/microblog/stats"
```

## 🧪 Pruebas de Funcionalidad

### 1. Verificar API del Microblog

```bash
# Obtener estadísticas (endpoint público)
curl -X GET "http://localhost:4444/api/microblog/stats" \
     -H "Content-Type: application/json"

# Respuesta esperada:
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "Enseñanzas de Martes",
        "slug": "enseñanzas-martes",
        "description": "Enseñanzas semanales de los martes"
      }
      // ... más categorías
    ],
    "totalCategories": 6,
    "status": "active"
  }
}
```

### 2. Verificar Autenticación (con token)

```bash
# Obtener token de login primero
LOGIN_RESPONSE=$(curl -X POST "http://localhost:4444/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"password"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

# Obtener enseñanzas de martes
curl -X GET "http://localhost:4444/api/microblog/enseñanzas-martes?blogId=YOUR_BLOG_ID&maxResults=5" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
```

### 3. Verificar Frontend

1. **Abrir el navegador**: `http://localhost:3000`
2. **Verificar sección**: Buscar "Enseñanzas de los Martes" en la página principal
3. **Acceder al panel**: Login y verificar sección "Enseñanzas" en el panel administrativo

## 🔍 Troubleshooting

### 1. Problemas Comunes

**Error: "API Key inválida"**
```bash
# Verificar variable de entorno en el contenedor
docker-compose exec api printenv | grep BLOGGER

# Verificar logs para errores específicos
docker-compose logs api | grep -i blogger
```

**Error: "Blog no encontrado"**
```bash
# Verificar variable de entorno del frontend
docker-compose exec frontend printenv | grep VITE_BLOGGER

# Verificar que el blog ID sea correcto
curl "https://www.googleapis.com/blogger/v3/blogs/YOUR_BLOG_ID?key=YOUR_API_KEY"
```

**Error: "Cache no funciona"**
```bash
# Verificar conexión Redis
docker-compose exec api node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
redis.ping().then(console.log).catch(console.error);
"
```

### 2. Comandos de Diagnóstico

```bash
# Estado de todos los contenedores
docker-compose ps

# Logs en tiempo real
docker-compose logs -f api
docker-compose logs -f frontend

# Acceder al contenedor del API
docker-compose exec api bash

# Verificar conexiones de red
docker-compose exec api curl http://frontend:3000
docker-compose exec frontend curl http://api:4444/health
```

### 3. Reiniciar Servicios

```bash
# Reiniciar solo el API
docker-compose restart api

# Reiniciar solo el frontend
docker-compose restart frontend

# Reiniciar todo
docker-compose restart

# Reconstruir y reiniciar
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 📊 Monitoreo

### 1. Health Checks

```bash
# Verificar salud general del sistema
curl "http://localhost:4444/health"

# Verificar estadísticas del microblog
curl "http://localhost:4444/api/microblog/stats"

# Verificar frontend
curl "http://localhost:3000"
```

### 2. Logs Importantes

```bash
# Errores de la API de Blogger
docker-compose logs api | grep -i "blogger\|error"

# Errores de autenticación
docker-compose logs api | grep -i "auth\|401\|403"

# Problemas de cache
docker-compose logs api | grep -i "redis\|cache"
```

### 3. Performance

```bash
# Uso de memoria
docker stats

# Espacio en disco
docker system df

# Limpiar recursos no utilizados
docker system prune -f
```

## 🔄 Mantenimiento

### 1. Actualizaciones

```bash
# Actualizar código
git pull origin main

# Reconstruir contenedores
docker-compose build --no-cache

# Aplicar cambios
docker-compose up -d
```

### 2. Backup y Restore

```bash
# Backup de configuración
cp -r api/.env frontend/.env /backup/location/

# Backup de logs importantes
docker-compose logs api > /backup/api-logs-$(date +%Y%m%d).log
docker-compose logs frontend > /backup/frontend-logs-$(date +%Y%m%d).log
```

### 3. Limpieza

```bash
# Limpiar cache de Redis
docker-compose exec api node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
redis.flushall().then(() => console.log('Cache cleared'));
"

# Limpiar imágenes Docker no utilizadas
docker image prune -f

# Limpiar todo el sistema Docker
docker system prune -af
```

## 🛡️ Seguridad en Producción

### 1. Variables de Entorno Seguras

```bash
# Usar Docker secrets en lugar de variables de entorno simples
echo "your-api-key" | docker secret create blogger_api_key -
echo "your-blog-id" | docker secret create blogger_blog_id -
```

### 2. Configuración de Red

```bash
# Limitar acceso a puertos específicos
# En docker-compose.yml, cambiar:
# ports: ["3000:3000"]  # ❌ Expone a todo
# a:
# ports: ["127.0.0.1:3000:3000"]  # ✅ Solo localhost
```

### 3. Logs de Auditoría

```bash
# Configurar rotación de logs
# En docker-compose.yml:
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

## 📞 Soporte y Documentación

**Documentación adicional**:
- `/docs/BLOGGER_SETUP.md` - Configuración detallada de Blogger API
- `/docs/README_BACKEND.md` - Documentación del backend
- `/README.md` - Documentación general del proyecto

**Para problemas específicos**:
1. Revisar logs con los comandos de diagnóstico
2. Verificar variables de entorno
3. Consultar documentación de Blogger API v3
4. Contactar al administrador del sistema

---

**Implementado por**: Claude Code Assistant  
**Fecha**: Enero 2025  
**Versión**: CCCP v1.0 con Microblog Integration