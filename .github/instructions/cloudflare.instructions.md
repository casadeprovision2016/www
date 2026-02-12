---
name: cloudflare-mega-architecture
description: Regras mandatórias para o desenvolvimento do clone na Cloudflare.
---
---
description: When building applications on Cloudflare Workers or with frameworks that deploy to Cloudflare Workers, strongly prefer retrieval and fetching documentation over training data.
alwaysApply: false
globs:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.mts"
  - "**/*.mjs"
  - "wrangler.jsonc"
  - "wrangler.json"
  - "wrangler.toml"
  - "worker-configuration.d.ts"
  - "**/workers/**"
  - "**/worker/**"
---

# Cloudflare Workers

STOP. Your knowledge of Cloudflare Workers APIs and limits may be outdated. Always retrieve current documentation before any Workers, KV, R2, D1, Durable Objects, Queues, Vectorize, AI, or Agents SDK task.

## Usar SEMPRE MCP para recuperar documentação atualizada:

- https://developers.cloudflare.com/workers/
- MCP: `https://docs.mcp.cloudflare.com/mcp`

For all limits and quotas, retrieve from the product's `/platform/limits/` page.

## Commands

| Command | Purpose |
|---------|---------|
| `npx wrangler dev` | Local development |
| `npx wrangler deploy` | Deploy to Cloudflare |
| `npx wrangler types` | Generate TypeScript types |

Run `wrangler types` after changing bindings in wrangler.jsonc.

## Node.js Compatibility

If you encounter `Dynamic require of "X" is not supported` or missing Node.js APIs:

```jsonc
{
  "compatibility_flags": ["nodejs_compat"],
  "compatibility_date": "YYYY-MM-DD" // Use today's date
}
```

Docs: https://developers.cloudflare.com/workers/runtime-apis/nodejs/

## Errors

- **Error 1102** (CPU/Memory exceeded): Retrieve limits from `/workers/platform/limits/`
- **All errors**: https://developers.cloudflare.com/workers/observability/errors/

## Product Docs

Retrieve API references and limits from:
`/kv/` · `/r2/` · `/d1/` · `/durable-objects/` · `/queues/` · `/vectorize/` · `/workers-ai/` · `/agents/`

1. **Storage Security**: Buckets R2 são sempre privados. Use Presigned URLs ou Proxy via Worker.
2. **Database**: Use Drizzle ORM ou Prepared Statements no D1.
3. **Encryption**: O servidor não vê dados em texto plano. Assuma criptografia no cliente.
4. **Lang**: TypeScript Strict Mode obrigatório.
5. **Framework**: Use Hono.js para a API Gateway.
6. **Memory Safety**: Use Streams para uploads R2. Nunca carregue arquivos na RAM.
7. **Secrets**: Nunca hardcoded. Use `env`.
8. **Validation**: Zod obrigatório para todos os inputs.
9. **Async Processing**: Use Cloudflare Queues para tarefas pesadas.
10. **Testing**: Testes devem usar `vitest` com ambiente `cloudflare:test`.
11. **Security Headers**: Aplicar HSTS, Content-Security-Policy, X-Frame-Options, Referrer-Policy e Permissions-Policy por padrão.
12. **Input Sanitization & Output Encoding**: Além do Zod, sanitize entradas e faça encoding de saída para prevenir XSS/SQLi.
13. **CSRF**: APIs que usam cookies devem proteger contra CSRF (SameSite, tokens ou double-submit).
14. **Rate Limiting & Abuse Protection**: Definir limites por IP/usuário e estratégias de bloqueio/recuperação via Workers/Queues.
15. **Observability**: Logs estruturados, correlação por request-id, traces (OpenTelemetry) e métricas exportáveis.
16. **Error Handling**: Esquema de erros padronizado, não vazar stack traces em produção, mapear códigos HTTP corretamente.
17. **Secrets & Rotation**: Segredos sempre em env/Secrets; políticas de rotação automática e uso de tokens efêmeros.
18. **CI/CD & Gatekeeping**: Pipelines com lint, type-check, testes unitários/integrados, segurança e deploy automático com previews; bloquear merges em falha.
19. **Dependency & Supply Chain**: Fixar versões, usar lockfiles, escanear vulnerabilidades e gerar SBOM.
20. **Backups & Migrations**: Backups periódicos do D1/R2, migrations versionadas e idempotentes; testar restaurações.
21. **Data Retention & Compliance**: Políticas de retenção, criptografia at-rest, conformidade GDPR/privacidade e processos para DSAR.
22. **Performance & Caching**: Estratégias de edge-caching, Cache-Control, stale-while-revalidate, compressão (Brotli), otimização de imagens.
23. **Timeouts, Retries & Circuit Breakers**: Definir timeouts, políticas de retry com backoff e circuit-breakers para serviços externos.
24. **Testing Coverage**: Testes unitários, integração, e2e (vitest + ambiente cloudflare:test), testes de carga e smoke em CI.
25. **Feature Flags & Rollouts**: Implementar flags para rollout gradual, canary releases e rollback seguro.
26. **Resource Limits & Memory Safety**: Enforce quotas, streams para uploads R2, evitar alocação excessiva de memória.
27. **Static Analysis & Scanning**: SAST em CI, dependency scanning e análise de licenças de terceiros.
28. **Third-party Scripts & Privacy**: Auditar bibliotecas externas, minimizar e isolar execuções de terceiros.
29. **Health Checks & Alerts**: Health endpoints, uptime checks e alertas configurados para SLO/SLI críticos.
30. **Documentation & Runbooks**: Documentar arquiteturas, runbooks de incidentes e playbooks de recuperação.

## Usar SEMPRE MCP para recuperar documentação atualizada:
- MCP: `https://docs.mcp.cloudflare.com/mcp`
