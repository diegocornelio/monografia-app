#!/usr/bin/env bash
# instalar-cron.sh — agenda a conferencia automatica. A primeira roda 20 minutos
# depois da instalacao; as seguintes a cada 20 minutos, ate a construcao
# terminar. O objetivo e nao gastar token com o agente vigiando o proprio
# trabalho: o cron roda, grava o relatorio e so chama atencao quando falha.
#
# Uso:  ./scripts/instalar-cron.sh          instala
#       ./scripts/instalar-cron.sh remover  desinstala
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
MARCA="# fichario-checagem"
LINHA="*/20 * * * * cd $RAIZ && ./scripts/checagem.sh >> registro-checagem.log 2>&1 $MARCA"

remover() {
  crontab -l 2>/dev/null | grep -v "$MARCA" | crontab - || true
  echo "conferencia automatica removida"
}

if [ "${1:-instalar}" = "remover" ]; then remover; exit 0; fi

remover >/dev/null 2>&1 || true
( crontab -l 2>/dev/null; echo "$LINHA" ) | crontab -
date -u +%FT%TZ > "$RAIZ/.checagem-instalada-em"

# A primeira conferencia nao espera o proximo slot de 20 minutos do relogio:
# ela e agendada exatamente 20 minutos a frente, em segundo plano.
( sleep 1200; cd "$RAIZ" && ./scripts/checagem.sh >> registro-checagem.log 2>&1 ) &
echo "conferencia agendada: primeira em 20 minutos, depois a cada 20"
echo "relatorio em $RAIZ/RELATORIO.md, historico em $RAIZ/registro-checagem.log"
echo "para encerrar ao fim da construcao: ./scripts/instalar-cron.sh remover"
