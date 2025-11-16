#!/bin/bash

# Script para verificar tudo antes de fazer push
# Uso: ./check-before-push.sh

set -e  # Para na primeira falha

echo "🔍 Verificando projeto antes do push..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar comandos
check_command() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
        exit 1
    fi
}

# 1. Verificar TypeScript do Backend
echo "📦 Verificando Backend (TypeScript)..."
cd api
npm run build > /dev/null 2>&1
check_command "Backend TypeScript compilou com sucesso"
cd ..

# 2. Verificar TypeScript do Frontend
echo "📦 Verificando Frontend (TypeScript)..."
cd front
npm run build > /dev/null 2>&1
check_command "Frontend TypeScript compilou com sucesso"
cd ..

# 3. Verificar Linter do Frontend (se houver)
echo "🔍 Verificando Linter do Frontend..."
cd front
npm run lint > /dev/null 2>&1 || echo -e "${YELLOW}⚠${NC} Linter encontrou avisos (não crítico)"
cd ..

echo ""
echo -e "${GREEN}✅ Todas as verificações passaram!${NC}"
echo ""
echo "Você pode fazer push com segurança:"
echo "  git add ."
echo "  git commit -m 'sua mensagem'"
echo "  git push"

