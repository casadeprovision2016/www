Com certeza! Este é um esquema de banco de dados bem estruturado, aparentemente para um sistema de gerenciamento de igreja ou organização religiosa, construído com Supabase. Abaixo, descrevo cada uma das tabelas e como elas se relacionam.

### Visão Geral do Esquema

O esquema é centrado na tabela `users`, que armazena as informações de todos os indivíduos no sistema. As outras tabelas se conectam a `users` para gerenciar diferentes aspectos da organização, como eventos, membros, ministérios, doações e comunicação.

### Descrição das Tabelas

Aqui está um detalhamento de cada tabela, seus campos e suas conexões:

**1. `users` (Usuários)**
Esta é a tabela principal que contém os dados de cada usuário do sistema.
*   **`id`**: Identificador único para cada usuário.
*   **`email`**: O endereço de e-mail do usuário.
*   **`sen...`**: Provavelmente `senha`, para armazenar a senha do usuário.
*   **`name`**: O nome do usuário.
*   **`telefone`**: O número de telefone do usuário.
*   **`role`**: Define o nível de permissão do usuário (ex: administrador, membro, visitante).
*   **`created_at` / `updated_at`**: Datas de criação e última atualização do registro.
*   **Relacionamentos**: Esta tabela é o núcleo do sistema, conectando-se a quase todas as outras tabelas, como `members`, `donations`, `event_registrations`, `ministry_members`, `pastoral_visits` e `notifications`.

**2. `organization` (Organização)**
Armazena informações sobre a organização ou igreja principal.
*   **`id`**: Identificador único da organização.
*   **`name`**: Nome da organização.
*   **`descricao`**: Uma descrição textual da organização.
*   **`logo`**: Provavelmente armazena a URL ou o arquivo do logotipo.
*   **`configuracoes`**: Configurações gerais da organização, possivelmente em formato JSON.

**3. `events` (Eventos)**
Usada para gerenciar os eventos da organização.
*   **`id`**: Identificador único do evento.
*   **`titulo`**: O título ou nome do evento.
*   **`descricao`**: Descrição detalhada do evento.
*   **`data_inicio` / `data_fim`**: Datas de início e término do evento.
*   **`local`**: O local onde o evento ocorrerá.
*   **`max_participantes`**: Número máximo de pessoas que podem se inscrever.
*   **`created_by`**: O `id` do usuário que criou o evento.
*   **Relacionamentos**: Conecta-se à tabela `event_registrations` para gerenciar os participantes.

**4. `event_registrations` (Inscrições em Eventos)**
Tabela de junção que conecta usuários a eventos nos quais eles se inscreveram.
*   **`event_id`**: Chave estrangeira que se refere ao `id` da tabela `events`.
*   **`user_id`**: Chave estrangeira que se refere ao `id` da tabela `users`.
*   **`status`**: O status da inscrição (ex: confirmada, pendente, cancelada).
*   **`registered_at`**: Data e hora em que a inscrição foi feita.
*   **`observacoes`**: Campo de texto para anotações.

**5. `members` (Membros)**
Contém informações sobre os membros da organização.
*   **`id`**: Identificador único do membro.
*   **`user_id`**: Chave estrangeira que conecta esta entrada a um usuário na tabela `users`.
*   **`membership_type`**: Tipo de membro (ex: efetivo, em experiência).
*   **`status`**: Status atual do membro (ativo, inativo).
*   **`join_date` / `end_date`**: Datas de início e fim da membresia.
*   **`observacoes`**: Anotações sobre o membro.

**6. `donations` (Doações)**
Registra as doações feitas pelos usuários.
*   **`id`**: Identificador único da doação.
*   **`user_id`**: Chave estrangeira para o usuário que fez a doação.
*   **`valor`**: O valor monetário da doação.
*   **`tipo`**: O tipo de doação (ex: dízimo, oferta).
*   **`descricao`**: Descrição da doação.
*   **`data_doacao`**: A data em que a doação foi realizada.
*   **`comprovante`**: Link para o comprovante da doação.

**7. `live_streams` (Transmissões ao Vivo)**
Gerencia as informações das transmissões ao vivo de cultos ou eventos.
*   **`id`**: Identificador único da transmissão.
*   **`titulo`**: Título da transmissão.
*   **`descricao`**: Descrição do que está sendo transmitido.
*   **`url_stream`**: O link para a transmissão (ex: YouTube, Vimeo).
*   **`data_inicio` / `data_fim`**: Datas de início e término da transmissão.
*   **`ativa`**: Um valor booleano (verdadeiro/falso) que indica se a transmissão está ativa.
*   **`created_by`**: O usuário que agendou a transmissão.

**8. `pastoral_visits` (Visitas Pastorais)**
Agenda e registra as visitas pastorais.
*   **`id`**: Identificador único da visita.
*   **`visitado_id`**: O `id` do usuário que está recebendo a visita.
*   **`pastor_id`**: O `id` do usuário (pastor) que está realizando a visita.
*   **`data_visita`**: A data agendada para a visita.
*   **`motivo`**: O motivo da visita.
*   **`observacoes`**: Anotações sobre a visita.
*   **`status`**: O status da visita (ex: agendada, concluída, cancelada).
*   **Relacionamentos**: Possui duas conexões com a tabela `users` para identificar tanto o visitante quanto o visitado.

**9. `ministries` (Ministérios)**
Cadastra os diferentes ministérios da organização.
*   **`id`**: Identificador único do ministério.
*   **`name`**: Nome do ministério (ex: Louvor, Ação Social).
*   **`descricao`**: Descrição das atividades do ministério.
*   **`lider_id`**: O `id` do usuário que é o líder do ministério.
*   **`ativo`**: Indica se o ministério está ativo.
*   **Relacionamentos**: Conecta-se à tabela `ministry_members` para listar seus participantes.

**10. `ministry_members` (Membros de Ministérios)**
Tabela de junção que associa usuários a ministérios.
*   **`id`**: Identificador único da associação.
*   **`ministry_id`**: Chave estrangeira para a tabela `ministries`.
*   **`user_id`**: Chave estrangeira para a tabela `users`.
*   **`cargo`**: O cargo ou função do membro dentro do ministério.
*   **`ativo`**: Indica se a participação do membro no ministério está ativa.
*   **`joined_at`**: Data em que o membro ingressou no ministério.

**11. `notifications` (Notificações)**
Armazena notificações a serem enviadas aos usuários.
*   **`id`**: Identificador único da notificação.
*   **`user_id`**: O `id` do usuário que receberá a notificação.
*   **`titulo`**: Título da notificação.
*   **`mensagem`**: O conteúdo da notificação.
*   **`tipo`**: Tipo de notificação (ex: aviso, lembrete).
*   **`lida`**: Indica se o usuário já leu a notificação.

**12. `contributions` (Contribuições)**
Embora parcialmente visível, esta tabela provavelmente registra as contribuições financeiras dos membros, de forma semelhante à tabela `donations`, mas talvez com um propósito diferente (ex: mensalidades).
*   **`id`**: Identificador único da contribuição.
*   **`user_id`**: Chave estrangeira para o usuário contribuinte.

Espero que esta descrição detalhada ajude a entender a estrutura e o propósito do seu esquema de banco de dados Supabase