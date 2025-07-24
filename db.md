# 🏛️ Documentação do Banco de Dados - CCCP Casa de Provisión

## 📋 Visão Geral

Este documento detalha a estrutura completa do banco de dados para o sistema de gerenciamento da igreja CCCP (Centro Cristiano Casa de Provisión). Ele é projetado para ser executado em um ambiente PostgreSQL, como o Supabase.

A documentação abrange:
- **Schema das Tabelas**: Estrutura de todas as tabelas, colunas e seus relacionamentos.
- **Índices**: Otimizações para performance de consultas.
- **Funções e Gatilhos**: Lógica de banco de dados automatizada.
- **Segurança**: Políticas de Row Level Security (RLS) para controle de acesso.
- **Dados de Exemplo**: Informações sobre os dados iniciais para teste e desenvolvimento.

---

## 🗃️ Arquivos SQL e Ordem de Execução

Para configurar o banco de dados do zero, os seguintes arquivos devem ser executados na ordem especificada:

1.  **`database/01_schema_tabelas.sql`**: Cria a estrutura de todas as tabelas principais.
2.  **`database/02_indices_performance.sql`**: Adiciona índices para otimizar as consultas.
3.  **`database/03_funcoes_gatilhos.sql`**: Implementa funções e gatilhos para automações.
4.  **`database/04_row_level_security_PRODUÇAO.sql`**: Ativa e configura as políticas de segurança a nível de linha (RLS).
5.  **`database/05_dados_exemplo.sql`**: Popula o banco de dados com dados de exemplo para facilitar o desenvolvimento e testes.

---

## 📊 Estrutura das Tabelas

A seguir, a descrição detalhada de cada tabela no schema `public`.

### 1. `organization`
Armazena as configurações e informações gerais da igreja.

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `UUID` | Chave primária, identificador único da organização. |
| `nome` | `VARCHAR(200)` | Nome oficial da organização. |
| `descricao` | `TEXT` | Descrição sobre a igreja. |
| `endereco` | `TEXT` | Endereço físico da igreja. |
| `telefone` | `VARCHAR(20)` | Telefone de contato. |
| `email` | `VARCHAR(100)` | E-mail de contato. |
| `website` | `VARCHAR(200)` | Site oficial. |
| `logo_url` | `TEXT` | URL para a imagem do logo. |
| `configuracoes`| `JSONB` | Configurações diversas em formato JSON (horários, etc.). |
| `created_at` | `TIMESTAMPTZ` | Data de criação do registro. |
| `updated_at` | `TIMESTAMPTZ` | Data da última atualização do registro. |

### 2. `users`
Extensão da tabela `auth.users` do Supabase, contendo dados de perfil detalhados.

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `UUID` | Chave primária, referenciando `auth.users(id)`. |
| `email` | `VARCHAR(255)` | E-mail do usuário (único). |
| `nome` | `VARCHAR(200)` | Nome completo do usuário. |
| `telefone` | `VARCHAR(20)` | Telefone de contato. |
| `endereco` | `TEXT` | Endereço do usuário. |
| `data_nascimento`| `DATE` | Data de nascimento. |
| `profissao` | `VARCHAR(100)` | Profissão do usuário. |
| `estado_civil` | `VARCHAR(20)` | Estado civil (`solteiro`, `casado`, etc.). |
| `role` | `VARCHAR(20)` | Papel do usuário no sistema (`admin`, `pastor`, `leader`, `member`). |
| `ativo` | `BOOLEAN` | Indica se o usuário está ativo. |
| `foto_url` | `TEXT` | URL para a foto de perfil. |
| `observacoes` | `TEXT` | Anotações internas sobre o usuário. |

### 3. `events`
Tabela para todos os eventos da igreja, como cultos, conferências e reuniões.

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `UUID` | Chave primária do evento. |
| `titulo` | `VARCHAR(200)` | Título do evento. |
| `descricao` | `TEXT` | Descrição detalhada do evento. |
| `data_inicio` | `TIMESTAMPTZ` | Data e hora de início do evento. |
| `data_fim` | `TIMESTAMPTZ` | Data e hora de término do evento. |
| `local` | `VARCHAR(200)` | Local de realização do evento. |
| `publico` | `BOOLEAN` | Se o evento é visível para todos (`true`) ou apenas para membros (`false`). |
| `created_by` | `UUID` | ID do usuário que criou o evento. |

### 4. `members`
Registra o status de membresia de um usuário na igreja.

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `UUID` | Chave primária. |
| `user_id` | `UUID` | ID do usuário (referencia `users.id`). |
| `tipo_membro` | `VARCHAR(30)` | Categoria do membro (`efetivo`, `congregado`, etc.). |
| `data_ingresso`| `DATE` | Data em que o usuário se tornou membro. |
| `status` | `VARCHAR(20)` | Status da membresia (`ativo`, `inativo`, etc.). |
| `batizado` | `BOOLEAN` | Indica se o membro é batizado. |

### 5. `ministries`
Armazena informações sobre os ministérios da igreja.

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `UUID` | Chave primária do ministério. |
| `nome` | `VARCHAR(100)` | Nome do ministério (único). |
| `descricao` | `TEXT` | Descrição das atividades do ministério. |
| `lider_id` | `UUID` | ID do usuário líder do ministério. |
| `vice_lider_id`| `UUID` | ID do usuário vice-líder. |
| `ativo` | `BOOLEAN` | Indica se o ministério está ativo. |

### 6. `ministry_members`
Tabela de associação que conecta usuários aos ministérios.

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `UUID` | Chave primária. |
| `ministry_id` | `UUID` | ID do ministério. |
| `user_id` | `UUID` | ID do usuário membro. |
| `cargo` | `VARCHAR(50)` | Cargo do membro no ministério. |
| `ativo` | `BOOLEAN` | Indica se a participação está ativa. |

### 7. `donations`
Registro de todas as doações financeiras (dízimos, ofertas, etc.).

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `UUID` | Chave primária da doação. |
| `user_id` | `UUID` | ID do doador (pode ser nulo para doações anônimas). |
| `valor` | `DECIMAL(10,2)`| Valor da doação. |
| `tipo` | `VARCHAR(30)` | Tipo de doação (`dizimo`, `oferta`, `missoes`, etc.). |
| `data_doacao` | `DATE` | Data em que a doação foi realizada. |
| `anonima` | `BOOLEAN` | Se a doação deve ser registrada como anônima. |

### 8. `event_registrations`
Gerencia as inscrições dos usuários nos eventos.

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `UUID` | Chave primária da inscrição. |
| `event_id` | `UUID` | ID do evento. |
| `user_id` | `UUID` | ID do usuário inscrito. |
| `status` | `VARCHAR(20)` | Status da inscrição (`inscrito`, `confirmado`, `cancelado`). |

### 9. `notifications`
Armazena notificações destinadas aos usuários.

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `UUID` | Chave primária. |
| `user_id` | `UUID` | ID do usuário que receberá a notificação. |
| `titulo` | `VARCHAR(200)` | Título da notificação. |
| `mensagem` | `TEXT` | Conteúdo da notificação. |
| `lida` | `BOOLEAN` | Indica se o usuário já leu a notificação. |
| `url_acao` | `TEXT` | URL para onde o usuário é redirecionado ao clicar. |

---

## 🔐 Segurança (Row Level Security - RLS)

O arquivo `04_row_level_security_PRODUÇAO.sql` implementa uma camada de segurança robusta para garantir que os usuários acessem apenas os dados que lhes são permitidos.

### Principais Políticas:
- **`users`**:
  - Usuários só podem ver e editar seu próprio perfil.
  - `admin` e `pastor` podem ver todos os usuários.
  - `leader` pode ver os membros dos seus ministérios.
- **`events`**:
  - Eventos marcados como `publico = true` são visíveis para qualquer usuário autenticado.
  - Membros da igreja (`member`, `leader`, `pastor`, `admin`) podem ver todos os eventos.
- **`donations`**:
  - Usuários podem ver apenas suas próprias doações.
  - `admin` e `pastor` podem visualizar todas as doações para fins de relatório.
- **`ministries`**:
  - `leader` pode gerenciar os membros e informações do seu próprio ministério.
  - `admin` e `pastor` têm acesso para gerenciar todos os ministérios.
- **`notifications`**:
  - Um usuário pode ver apenas as notificações destinadas a ele.

---

## ⚙️ Funções e Gatilhos

O arquivo `03_funcoes_gatilhos.sql` adiciona automação e lógica de negócios diretamente no banco de dados.

### Funções Notáveis:
- **`handle_new_user()`**: Cria automaticamente um registro na tabela `public.users` quando um novo usuário se cadastra no `auth.users`.
- **`validate_event_schedule()`**: Previne que dois eventos sejam agendados no mesmo local e horário, evitando conflitos.
- **`validate_event_capacity()`**: Impede novas inscrições em eventos que já atingiram a capacidade máxima.
- **`get_donation_stats()`**: Função para gerar relatórios e estatísticas sobre doações em um determinado período.
- **`get_upcoming_events()`**: Retorna uma lista de eventos futuros para exibição no frontend.

### Gatilhos:
- **`update_updated_at_column()`**: Um gatilho é aplicado a todas as tabelas para atualizar automaticamente o campo `updated_at` em qualquer modificação.
- **Validação de Eventos**: Gatilhos que disparam as funções `validate_event_schedule` e `validate_event_capacity` durante inserções ou atualizações.

---

## 🚀 Índices de Performance

O arquivo `02_indices_performance.sql` cria índices para acelerar as consultas mais comuns.

- **Índices de Chave Estrangeira**: Em colunas como `user_id`, `event_id`, `ministry_id`, etc.
- **Índices em Datas**: Em campos como `data_inicio` (eventos) e `data_doacao` (doações) para otimizar filtros por período.
- **Índices de Texto (GIN/TRGM)**: Em campos como `nome` e `titulo` para permitir buscas por similaridade de texto de forma eficiente.
- **Índices Compostos**: Para consultas complexas que filtram por múltiplos campos simultaneamente (ex: `status` e `tipo` de membro).

---

## 🧪 Dados de Exemplo

O arquivo `05_dados_exemplo.sql` (atualmente vazio) é o local designado para inserir dados de teste, como:
- Usuários com diferentes perfis (`admin`, `pastor`, `leader`, `member`).
- Ministérios e eventos de exemplo.
- Doações e inscrições para popular relatórios e painéis.
