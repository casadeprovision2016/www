# 📖 Configuración del Microblog con Blogger API

Esta documentación explica cómo configurar y utilizar la integración del microblog con la API de Blogger para las enseñanzas de los martes.

## 🎯 Resumen de la Implementación

La funcionalidad de microblog permite mostrar automáticamente los posts del blog de Blogger en el sitio web de la iglesia, específicamente las "Enseñanzas de los Martes". Los posts se obtienen a través de la API de Blogger v3 y se muestran con el diseño del sitio.

## 🔧 Configuración Inicial

### 1. Configuración de Google Cloud Console

1. **Crear proyecto en Google Cloud Console**:
   - Ir a [Google Cloud Console](https://console.cloud.google.com/)
   - Crear un nuevo proyecto o seleccionar uno existente
   - Nombre sugerido: "CCCP-Blogger-Integration"

2. **Activar la API de Blogger**:
   - En el panel de APIs y servicios
   - Buscar "Blogger API v3"
   - Hacer clic en "Habilitar"

3. **Crear credenciales**:
   - Ir a "Credenciales" > "Crear credenciales" > "Clave de API"
   - Copiar la clave generada
   - **Importante**: Restricciones de seguridad recomendadas:
     - Restricción de aplicación: "Restricciones de IP" (agregar IPs del servidor)
     - Restricción de API: Seleccionar solo "Blogger API v3"

### 2. Configuración del Blog de Blogger

1. **Crear blog en Blogger**:
   - Ir a [blogger.com](https://www.blogger.com)
   - Crear un nuevo blog o usar uno existente
   - Nombre sugerido: "Enseñanzas CCCP"

2. **Obtener el ID del blog**:
   - En la URL del blog: `https://ejemplo.blogspot.com/`
   - O desde la configuración del blog en Blogger
   - El ID es una cadena como: `1234567890123456789`

3. **Configurar etiquetas/labels**:
   - Usar etiquetas consistentes para categorizar posts:
     - `enseñanza-martes` - Para las enseñanzas de los martes
     - `reflexion` - Para reflexiones pastorales
     - `devocional` - Para devocionales
     - `anuncio` - Para anuncios
     - `testimonio` - Para testimonios

## 🔨 Configuración del Sistema

### 1. Variables de Entorno

**Backend** (`/api/.env`):
```env
# Blogger API Configuration
BLOGGER_API_KEY=AIzaSyAGzTT-4vd5AwSm_T34rWF_Q1vqiAiaOHY
```

**Frontend** (`/frontend/.env`):
```env
# Blogger API Configuration
VITE_BLOGGER_ID=YOUR_BLOG_ID_HERE
```

### 2. Instalación de Dependencias

**Backend**:
```bash
cd api
npm install axios
```

**Frontend**: Ya incluido en las dependencias existentes.

## 🚀 Uso del Sistema

### 1. Para el Pastor/Administrador

**Creación de posts en Blogger**:
1. Ir al panel de Blogger
2. Crear nueva entrada
3. **Importante**: Agregar las etiquetas apropiadas:
   - Para enseñanzas de martes: `enseñanza-martes`
   - Para otras categorías: usar las etiquetas definidas
4. Publicar el post

**Gestión desde el panel CCCP**:
- Los líderes y administradores pueden acceder a "Enseñanzas" en el panel
- Ver estadísticas de posts
- Limpiar caché si es necesario
- Filtrar por categorías

### 2. Para los Miembros

**Visualización en el sitio web**:
- Sección "Enseñanzas de los Martes" en la página principal
- Página dedicada en `/enseñanzas-martes`
- Posts mostrados con diseño del sitio
- Enlace directo al post original en Blogger

## 📋 Estructura de la Implementación

### 1. Backend (API)

**Archivos principales**:
- `api/src/services/bloggerService.ts` - Servicio principal para Blogger API
- `api/src/controllers/microblogController.ts` - Controladores de endpoints
- `api/src/routes/microblog.ts` - Rutas de la API

**Endpoints disponibles**:
```
GET /api/microblog/enseñanzas-martes?blogId={ID}&maxResults={N}
GET /api/microblog/posts?blogId={ID}&category={CAT}
GET /api/microblog/posts/{blogId}/{postId}
GET /api/microblog/blog/{blogId}
GET /api/microblog/category/{category}?blogId={ID}
POST /api/microblog/cache/clear
GET /api/microblog/stats
```

### 2. Frontend (React)

**Componentes principales**:
- `EnseñanzasMartesSection.tsx` - Sección para página principal
- `EnseñanzasMartes.tsx` - Componente completo de visualización
- `EnseñanzasMartesPage.tsx` - Página dedicada
- `MicroblogManager.tsx` - Panel de administración

**Hook personalizado**:
- `useMicroblog.ts` - Hook para manejar llamadas a la API

## ⚡ Características Implementadas

### 1. Funcionalidades Principales

- ✅ **Integración automática** con Blogger API v3
- ✅ **Cache inteligente** con Redis (1 hora de TTL)
- ✅ **Filtrado por categorías** usando labels
- ✅ **Visualización segura** del contenido HTML
- ✅ **Responsive design** con Tailwind CSS
- ✅ **Panel de administración** para líderes
- ✅ **Paginación** de posts
- ✅ **Búsqueda** por título y contenido

### 2. Seguridad

- ✅ **Sanitización de HTML** para prevenir XSS
- ✅ **Autenticación requerida** para acceso a posts
- ✅ **Control de permisos** por roles
- ✅ **Rate limiting** en la API
- ✅ **Validación de parámetros** con Zod

### 3. Performance

- ✅ **Cache con Redis** para reducir llamadas a Blogger API
- ✅ **Lazy loading** de componentes
- ✅ **Optimización de imágenes** automática
- ✅ **Compresión de contenido** HTML

## 🔄 Mantenimiento

### 1. Monitoreo

**Logs a revisar**:
- Errores de conexión con Blogger API
- Cache hits/misses
- Tiempo de respuesta de endpoints
- Errores de autenticación

**Comandos útiles**:
```bash
# Ver logs del backend
docker logs cccp-api

# Limpiar cache manualmente
curl -X POST "http://localhost:4444/api/microblog/cache/clear" \
     -H "Authorization: Bearer TOKEN"
```

### 2. Solución de Problemas

**Error 403 - API Key inválida**:
1. Verificar que la API key esté correcta en `.env`
2. Confirmar que Blogger API v3 esté habilitada
3. Revisar restricciones de IP en Google Cloud Console

**Error 404 - Blog no encontrado**:
1. Verificar que el `VITE_BLOGGER_ID` sea correcto
2. Confirmar que el blog sea público o esté configurado correctamente

**Posts no aparecen**:
1. Verificar que los posts tengan las etiquetas correctas
2. Confirmar que los posts estén publicados (no en borrador)
3. Limpiar cache del microblog

### 3. Backup y Recuperación

**Backup automático**:
- Los posts están almacenados en Blogger (Google)
- Cache en Redis se regenera automáticamente
- No requiere backup adicional

**Recuperación**:
- Simplemente limpiar cache para forzar recarga desde Blogger
- Verificar conectividad con la API de Google

## 📊 Métricas y Analytics

### 1. Estadísticas Disponibles

- Número total de posts por categoría
- Posts más recientes
- Estadísticas de visualización (futuro)
- Performance de cache

### 2. Reportes

Los líderes pueden ver en el panel:
- Total de posts por categoría
- Últimos posts publicados
- Estado del cache
- Información del blog

## 🔮 Funcionalidades Futuras

### 1. Mejoras Planificadas

- ✅ **Notificaciones automáticas** cuando se publique nuevo post
- ✅ **RSS feed** generado automáticamente
- ✅ **Compartir en redes sociales** integrado
- ✅ **Comentarios** sincronizados con Blogger
- ✅ **Búsqueda avanzada** por fecha, autor, etc.

### 2. Integraciones Adicionales

- **WhatsApp Bot** para notificar nuevos posts
- **Email marketing** automático
- **Analytics** detallado de lecturas
- **PWA** para notificaciones push

## 🛡️ Consideraciones de Seguridad

### 1. API Keys

- **Nunca** commitear API keys en el repositorio
- Usar variables de entorno en todos los ambientes
- Rotar keys periódicamente
- Configurar restricciones apropiadas en Google Cloud Console

### 2. Contenido

- Todo contenido HTML es sanitizado antes de mostrarse
- Scripts y contenido peligroso son removidos automáticamente
- Enlaces externos se abren en nueva ventana

### 3. Acceso

- Solo usuarios autenticados pueden ver posts
- Líderes y administradores tienen acceso al panel de gestión
- Logs de acceso para auditoría

---

## 📞 Soporte

Para problemas técnicos o configuración:

1. **Revisar logs** del sistema
2. **Verificar conectividad** con APIs de Google
3. **Contactar administrador** del sistema
4. **Consultar documentación** de Blogger API v3

**Enlaces útiles**:
- [Blogger API v3 Documentation](https://developers.google.com/blogger/docs/3.0/getting_started)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Blogger.com](https://www.blogger.com/)

---

**Fecha de actualización**: Enero 2025  
**Versión del sistema**: CCCP v1.0  
**Implementado por**: Claude Code Assistant