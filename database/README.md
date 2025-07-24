# 🏛️ Database Schema - CCCP Casa de Provisión

## 📋 Visão Geral

Este diretório contém a estrutura completa do banco de dados do sistema CCCP (Centro Cristiano Casa de Provisión). O banco é construído em PostgreSQL via Supabase e inclui todas as tabelas, índices, funções, gatilhos e políticas de segurança necessárias.

## 🗃️ Estrutura dos Arquivos

### Ordem de Execução (IMPORTANTE!)

Execute os arquivos SQL na seguinte ordem no SQL Editor do Supabase:

1. **`01_schema_tabelas.sql`** - Tabelas principais
2. **`02_indices_performance.sql`** - Índices de performance  
3. **`03_funcoes_gatilhos.sql`** - Funções e gatilhos
4. **`04_row_level_security.sql`** - Políticas de segurança
5. **`05_dados_exemplo.sql`** - Dados de exemplo

## 📊 Estrutura das Tabelas

### Tabelas Principais

| Tabela | Descrição | Relações |
|--------|-----------|----------|
| **`organization`** | Configurações da igreja | - |
| **`users`** | Dados estendidos dos usuários | `auth.users` |
| **`events`** | Eventos da igreja | `users` (created_by) |
| **`members`** | Status de membership | `users` |
| **`ministries`** | Ministérios da igreja | `users` (lider_id) |
| **`ministry_members`** | Membros dos ministérios | `ministries`, `users` |
| **`donations`** | Doações e ofertas | `users` |
| **`contributions`** | Contribuições para projetos | `users` |
| **`live_streams`** | Transmissões ao vivo | `events`, `users` |
| **`event_registrations`** | Inscrições em eventos | `events`, `users` |
| **`pastoral_visits`** | Visitas pastorais | `users` (visitado, pastor) |
| **`notifications`** | Sistema de notificações | `users` |

## 🔐 Sistema de Roles

### Hierarquia de Permissões

1. **`admin`** - Acesso total ao sistema
2. **`pastor`** - Acesso a todas as funcionalidades ministeriais
3. **`leader`** - Liderança de ministérios específicos
4. **`member`** - Membro da igreja com acesso básico

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado com políticas específicas:

- **Usuários**: Podem ver/editar seus próprios dados
- **Eventos**: Públicos visíveis para todos, privados para membros
- **Doações**: Usuários veem apenas suas doações
- **Ministérios**: Líderes gerenciam seus ministérios
- **Notificações**: Cada usuário vê apenas suas notificações

## 🚀 Funcionalidades Implementadas

### Funções Automatizadas

- **`update_updated_at_column()`** - Atualiza timestamp automaticamente
- **`handle_new_user()`** - Cria registro em `users` após auth signup
- **`validate_event_schedule()`** - Previne conflitos de horário
- **`validate_event_capacity()`** - Controla lotação de eventos
- **`get_donation_stats()`** - Estatísticas de doações
- **`get_upcoming_events()`** - Eventos próximos
- **`create_notification()`** - Criar notificações
- **`cleanup_expired_notifications()`** - Limpeza automática

### Gatilhos Ativos

- **Updated At**: Todas as tabelas atualizam `updated_at` automaticamente
- **Novo Usuário**: Cria registro em `users` após signup
- **Validação de Eventos**: Previne conflitos de horário e lotação
- **Auditoria**: Logs automáticos de mudanças importantes

### Índices de Performance

- **Busca por Texto**: Índices GIN para busca full-text
- **Datas**: Índices em campos de data para relatórios
- **Relacionamentos**: Foreign keys indexadas
- **Consultas Frequentes**: Índices compostos otimizados

## 📈 Dados de Exemplo

O arquivo `05_dados_exemplo.sql` inclui:

- ✅ 1 organização configurada
- ✅ 6 usuários com diferentes roles
- ✅ 10 ministérios ativos
- ✅ 7 eventos variados
- ✅ Doações de exemplo
- ✅ Relacionamentos entre membros e ministérios
- ✅ Transmissões ao vivo
- ✅ Notificações de boas-vindas

## 🛠️ Como Usar

### 1. Preparação no Supabase

```sql
-- 1. Certifique-se de que a extensão pg_trgm está habilitada
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Execute os arquivos na ordem correta
-- (cole cada arquivo no SQL Editor)
```

### 2. Verificação da Instalação

```sql
-- Verificar se todas as tabelas foram criadas
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Verificar dados de exemplo
SELECT 
    (SELECT COUNT(*) FROM public.users) as usuarios,
    (SELECT COUNT(*) FROM public.events) as eventos,
    (SELECT COUNT(*) FROM public.ministries) as ministerios;
```

### 3. Teste de Autenticação

```sql
-- Testar se o usuário pastor existe
SELECT id, email, nome, role 
FROM public.users 
WHERE email = 'pastor@casadeprovision.es';
```

## 🔧 Configurações Necessárias

### Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Autenticação

O usuário administrador deve ser criado via Supabase Auth:

```javascript
// No Supabase Auth
await supabase.auth.signUp({
  email: 'pastor@casadeprovision.es',
  password: 'sua_senha_segura'
})
```

## 📋 Checklist de Instalação

- [ ] Executar `01_schema_tabelas.sql`
- [ ] Executar `02_indices_performance.sql`
- [ ] Executar `03_funcoes_gatilhos.sql`
- [ ] Executar `04_row_level_security.sql`
- [ ] Executar `05_dados_exemplo.sql`
- [ ] Verificar se todas as tabelas existem
- [ ] Testar login com usuário pastor
- [ ] Verificar se RLS está funcionando
- [ ] Testar API endpoints

## 🚨 Troubleshooting

### Problema: RLS bloqueando consultas

```sql
-- Temporariamente desabilitar RLS para debug
ALTER TABLE public.ministries DISABLE ROW LEVEL SECURITY;

-- Reabilitar após testes
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
```

### Problema: Gatilhos não funcionando

```sql
-- Verificar se gatilhos existem
SELECT schemaname, tablename, triggername 
FROM pg_trigger t 
JOIN pg_class c ON t.tgrelid = c.oid 
JOIN pg_namespace n ON c.relnamespace = n.oid;
```

### Problema: Índices faltando

```sql
-- Listar índices
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## 📞 Suporte

Para problemas com o banco de dados:

1. Verifique os logs do Supabase
2. Confirme que todos os arquivos foram executados na ordem
3. Teste as queries diretamente no SQL Editor
4. Verifique as políticas RLS se houver problemas de permissão

---

**Criado para CCCP - Casa de Provisión** 🏛️  
*Sistema de Gerenciamento Eclesiástico Completo*