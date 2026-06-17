# gym-log

![CI](https://github.com/omarcovelho/gym-log/actions/workflows/ci.yml/badge.svg?branch=master)

Aplicação de tracking de treinos e medidas corporais.

## CI/CD

Pull requests e pushes para `develop` e `master` disparam GitHub Actions:

| Check | O que valida |
|-------|----------------|
| `api` | Prisma validate, lint, build, testes unitários, migrations, e2e (Postgres) |
| `front` | lint, build |
| `security-audit` | `npm audit` (high/critical) em api e front |
| `secrets-scan` | Gitleaks — secrets commitados |
| `CodeQL` | Análise estática de segurança no código |
| `dependency-review` | Dependências vulneráveis introduzidas no PR |

**Deploy:** Railway faz auto-deploy apenas na branch `master` (configurado no Railway).

**Branch protection (recomendado):** em `develop` e `master`, exija os checks acima antes do merge. No GitHub: Settings → Branches → Add rule.

**Segurança no repositório (one-time):** ative Secret scanning e Push protection em Settings → Code security.

**Pre-commit:** após `npm install` na raiz, Husky roda lint nos arquivos staged (`api/**/*.ts`, `front/**/*.{ts,tsx}`).

Node.js **24** (ver [`.nvmrc`](.nvmrc)).

## Desenvolvimento local

Pré-requisitos: Node.js 24, Docker (para o Postgres), e `api/.env.local` configurado (copie de `api/.env.example`).

```bash
# Na raiz do repositório — instala o runner (apenas na primeira vez)
npm install

# Sobe Postgres, aplica migrations e inicia API + frontend
npm run dev:all

# Ou, se o banco já estiver rodando e migrado:
npm run dev
```

Na primeira vez (ou com banco novo), `dev:all` roda `prisma migrate deploy` automaticamente. Se preferir migrar manualmente: `npm run dev:migrate` na raiz ou `npm run migrate:deploy` em `api/`.

- **API:** http://localhost:3000/api — Swagger em http://localhost:3000/docs (ambiente local)
- **Frontend:** http://localhost:5173 — proxy `/api` → API local

Para smoke tests com dados de exemplo, rode os seeds em `api/` (ver seção abaixo) e use `test@evolution.com` / `test123`.

## Seeds

O projeto possui scripts de seed para popular o banco de dados com dados de teste. Todos os seeds estão localizados em `api/prisma/`.

### Seed Principal (`seed.ts`)

Cria um usuário administrador e exercícios globais básicos.

**Comando:**
```bash
cd api
npm run seed
```

**O que cria:**
- Usuário administrador (email e senha definidos em `ADMIN_EMAIL` e `ADMIN_PASSWORD` no `.env.local`)
- 30 exercícios globais pré-definidos de diversos grupos musculares

### Seed de Evolução (`seed-evolution.ts`)

Cria dados de teste para visualizar funcionalidades de evolução e progresso (PRs, volume semanal).

**Comando:**
```bash
cd api
npm run seed:evolution
```

**O que cria:**
- Usuário de teste: `test@evolution.com` / `test123`
- 11 exercícios personalizados
- 11 treinos distribuídos nas últimas 4 semanas
- Dados progressivos simulando PRs (Personal Records)
- Sessões com diferentes níveis de fadiga e sentimentos

**Útil para testar:**
- Página de Progress/Evolução
- Visualização de PRs
- Gráficos de volume semanal
- Histórico de treinos

### Seed de Medidas Corporais (`seed-measurements.ts`)

Cria dados de teste para visualizar funcionalidades de medidas corporais e gráficos de evolução.

**Comando:**
```bash
cd api
npm run seed:measurements
```

**O que cria:**
- Medidas corporais para o usuário `test@evolution.com` (requer que o seed-evolution tenha sido executado primeiro)
- ~23 medidas distribuídas nas últimas 8 semanas
- Progressão realista de peso (~0.5% por semana)
- Variações em cintura e braço
- 2-3 medidas por semana em dias diferentes

**Útil para testar:**
- Página de Medidas Corporais
- Gráficos de evolução (Peso, Cintura, Braço)
- Análise de tendências semanais
- Comparação entre semanas completas

### Ordem Recomendada de Execução

Para ter um ambiente completo de teste:

```bash
cd api

# 1. Seed principal (cria admin e exercícios globais)
npm run seed

# 2. Seed de evolução (cria usuário de teste e treinos)
npm run seed:evolution

# 3. Seed de medidas (adiciona medidas ao usuário de teste)
npm run seed:measurements
```

### Notas

- Todos os seeds usam `dotenv -e .env.local` para carregar variáveis de ambiente
- O seed de medidas requer que o seed-evolution tenha sido executado primeiro (usa o mesmo usuário)
- Os seeds podem ser executados múltiplas vezes (usam `upsert` para evitar duplicatas)
