#!/usr/bin/env bash
# checagem.sh — roda todos os portoes e grava o relatorio. Nao gasta token:
# quem le o relatorio e o agente, uma vez, em vez de rodar comando a comando.
#
# Uso:  ./scripts/checagem.sh [fase]
# Saida: RELATORIO.md na raiz, e codigo 0 quando todos os portoes passam.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

FASE="${1:-$(cat .fase-atual 2>/dev/null || echo 1)}"
RELATORIO="RELATORIO.md"
FALHAS=0

registrar() { # nome, codigo, saida
  if [ "$2" -eq 0 ]; then
    printf '| %s | ok |\n' "$1" >> "$RELATORIO"
  else
    printf '| %s | FALHOU |\n' "$1" >> "$RELATORIO"
    FALHAS=$((FALHAS + 1))
    printf '\n### %s\n\n```\n%s\n```\n' "$1" "$(printf '%s' "$3" | tail -40)" >> "$DETALHE"
  fi
}

DETALHE="$(mktemp)"
{
  printf '# Relatorio de checagem\n\n'
  printf 'Gerado em %s · fase %s\n\n' "$(date -u +%FT%TZ)" "$FASE"
  printf '| Portao | Estado |\n|---|---|\n'
} > "$RELATORIO"

executar() { # nome, comando...
  local nome="$1"; shift
  local saida; saida="$("$@" 2>&1)"; local codigo=$?
  registrar "$nome" "$codigo" "$saida"
}

executar "testes de dominio" node testes/dominio.test.mjs
executar "especificacao sem vermelho" node testes/tdd.mjs --silencioso
executar "cobertura do catalogo" node testes/cobertura.mjs

if [ -f package-lock.json ] && [ -d node_modules ]; then
  npm run lint --silent >/dev/null 2>&1 && executar "lint" npm run lint --silent
  npm run typecheck --silent >/dev/null 2>&1 && executar "tipos" npm run typecheck --silent
  npm run build --silent >/dev/null 2>&1 && executar "build" npm run build --silent
fi

# Um resumo curto do que falta, para o agente decidir o proximo passo sem
# precisar reler o catalogo inteiro.
{
  printf '\n## Pendencias da especificacao\n\n```\n'
  node testes/tdd.mjs --silencioso 2>/dev/null | sed -n '/Features ainda nao provadas/,$p' | head -40
  printf '```\n'
  printf '\n## Ultimos commits\n\n```\n'
  git log --oneline -5 2>/dev/null || echo "sem repositorio git"
  printf '```\n'
} >> "$RELATORIO"

cat "$DETALHE" >> "$RELATORIO"
rm -f "$DETALHE"

if [ "$FALHAS" -eq 0 ]; then
  printf '\n**Todos os portoes passaram.**\n' >> "$RELATORIO"
  exit 0
fi
printf '\n**%s portao(es) falharam.**\n' "$FALHAS" >> "$RELATORIO"
exit 1
