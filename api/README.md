# GymLog API

API backend para aplicação de tracking de treinos e medidas corporais.

## Seeds

O projeto possui scripts de seed para popular o banco de dados com dados de teste. Todos os seeds estão localizados em `prisma/`.

### Seed Principal (`seed.ts`)

Cria um usuário administrador e exercícios globais básicos.

**Comando:**
```bash
npm run seed
```

**O que cria:**
- Usuário administrador (email e senha definidos em `ADMIN_EMAIL` e `ADMIN_PASSWORD` no `.env.local`)
- 30 exercícios globais pré-definidos de diversos grupos musculares

**Variáveis de ambiente necessárias:**
- `ADMIN_EMAIL`: Email do usuário administrador
- `ADMIN_PASSWORD`: Senha do usuário administrador

### Seed de Evolução (`seed-evolution.ts`)

Cria dados de teste para visualizar funcionalidades de evolução e progresso (PRs, volume semanal).

**Comando:**
```bash
npm run seed:evolution
```

**O que cria:**
- Usuário de teste: `test@evolution.com` / `test123`
- 11 exercícios personalizados com diferentes grupos musculares
- 11 treinos distribuídos nas últimas 4 semanas
- Dados progressivos simulando PRs (Personal Records)
- Sessões com diferentes níveis de fadiga e sentimentos
- Exercícios com cargas progressivas ao longo do tempo

**Útil para testar:**
- Página de Progress/Evolução
- Visualização de PRs (Personal Records)
- Gráficos de volume semanal (total e por grupo muscular)
- Histórico de treinos
- Análise de tendências de treino

### Seed de Medidas Corporais (`seed-measurements.ts`)

Cria dados de teste para visualizar funcionalidades de medidas corporais e gráficos de evolução.

**Comando:**
```bash
npm run seed:measurements
```

**O que cria:**
- Medidas corporais para o usuário `test@evolution.com` (requer que o seed-evolution tenha sido executado primeiro)
- ~23 medidas distribuídas nas últimas 8 semanas
- Progressão realista de peso (~0.5% por semana)
- Variações em cintura e braço
- 2-3 medidas por semana em dias diferentes
- Algumas medidas com notas ocasionais

**Útil para testar:**
- Página de Medidas Corporais
- Gráficos de evolução (Peso, Cintura, Braço)
- Análise de tendências semanais
- Comparação entre semanas completas
- Visualização de valor atual vs histórico

### Ordem Recomendada de Execução

Para ter um ambiente completo de teste:

```bash
# 1. Seed principal (cria admin e exercícios globais)
npm run seed

# 2. Seed de evolução (cria usuário de teste e treinos)
npm run seed:evolution

# 3. Seed de medidas (adiciona medidas ao usuário de teste)
npm run seed:measurements
```

### Notas Importantes

- Todos os seeds usam `dotenv -e .env.local` para carregar variáveis de ambiente
- O seed de medidas **requer** que o seed-evolution tenha sido executado primeiro (usa o mesmo usuário `test@evolution.com`)
- Os seeds podem ser executados múltiplas vezes (usam `upsert` para evitar duplicatas)
- O seed de medidas limpa medidas existentes do usuário antes de criar novas
- Todos os seeds são seguros para desenvolvimento e não afetam dados de produção

### Estrutura dos Seeds

```
prisma/
├── seed.ts                 # Seed principal (admin + exercícios globais)
├── seed-evolution.ts       # Seed de evolução (treinos e PRs)
└── seed-measurements.ts    # Seed de medidas corporais
```

### Scripts Disponíveis

- `npm run seed` - Executa seed principal
- `npm run seed:evolution` - Executa seed de evolução
- `npm run seed:measurements` - Executa seed de medidas
- `npm run seed:prod` - Executa seed principal em produção
