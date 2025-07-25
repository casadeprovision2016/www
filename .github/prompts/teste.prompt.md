---
mode: ask
---
## Instruções para Criação de Testes Unitários Progressivos e Abrangentes para Endpoints de API

### Objetivo
Orientar a criação de testes unitários progressivos, rigorosos e completos para os endpoints das APIs dos recursos: Eventos, Transmisiones, Donaciones, Miembros, Visitantes, Visitas Pastorales e Ministerios, utilizando o GitHub Copilot. Os testes devem ser baseados nas tabelas e colunas descritas em `@database/`, simulando cenários realistas e garantindo robustez e cobertura total.

---

### 1. Preparação Inicial
- Analise as tabelas e colunas em `@database/` para entender a estrutura e os relacionamentos dos dados.
- Utilize os dados de exemplo presentes em `@database/05_dados_exemplo.sql` para criar cenários de teste realistas.
- Certifique-se de que o ambiente de testes (`api/tests/`) está configurado para isolar e limpar dados entre execuções.

### 2. Estrutura Progressiva dos Testes
Para cada recurso, siga a ordem abaixo, validando todos os endpoints antes de avançar para o próximo:
1. **Eventos**
2. **Transmisiones**
3. **Donaciones**
4. **Miembros**
5. **Visitantes**
6. **Visitas Pastorales**
7. **Ministerios**

#### Para cada recurso:
1. **Mapeie todos os endpoints REST disponíveis** (GET, POST, PUT/PATCH, DELETE, etc.).
2. **Para cada endpoint, crie testes que validem:**
   - Respostas de sucesso com dados válidos (usando exemplos reais do banco).
   - Respostas para dados inválidos ou ausentes (validação de erros).
   - Restrições de autenticação/autorização, se aplicável.
   - Comportamento em cenários de borda (ex: registros inexistentes, duplicados, etc.).
   - Integridade dos dados persistidos e retornados.
3. **Garanta que todos os campos relevantes das tabelas estejam cobertos nos testes.**
4. **Utilize mocks/stubs apenas quando necessário para dependências externas.**

### 3. Execução e Documentação dos Testes
- Execute os testes sequencialmente para cada recurso, garantindo que todos os endpoints estejam validados antes de prosseguir.
- Documente detalhadamente os resultados de cada etapa em arquivos Markdown dentro de `api/tests/` (ex: `TEST_SUMMARY.md`):
  - Liste endpoints testados, cenários cobertos e dados utilizados.
  - Registre o status de cada teste (sucesso/falha).
  - Descreva eventuais erros, inconsistências ou comportamentos inesperados encontrados.
  - Inclua sugestões de correção ou pontos de atenção identificados.

### 4. Reporte de Erros e Manutenção
- Para cada erro ou inconsistência encontrada, crie um relatório sucinto em `api/tests/` detalhando:
  - Endpoint afetado, payload, resposta recebida e esperada.
  - Passos para reproduzir o problema.
  - Logs relevantes, se aplicável.
- Atualize os testes sempre que houver mudanças nas tabelas, endpoints ou regras de negócio.

### 5. Boas Práticas com Copilot
- Utilize o Copilot para sugerir cenários de teste, validações e mocks, sempre revisando e adaptando para o contexto do projeto.
- Prefira testes pequenos, focados e de fácil manutenção.
- Comente cada teste explicando o objetivo e o cenário simulado.
- Reavalie periodicamente a cobertura dos testes e ajuste conforme novas funcionalidades ou alterações no banco/API.

---

**Critérios de Sucesso:**
- Todos os endpoints dos recursos listados possuem testes unitários cobrindo casos de sucesso, erro e borda.
- Os testes utilizam dados realistas e refletem a estrutura do banco.
- Resultados e erros são documentados de forma clara e acessível em `api/tests/`.
- O processo de criação e manutenção dos testes é eficiente e sustentável com o auxílio do Copilot.