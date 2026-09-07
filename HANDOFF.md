# HANDOFF

Estado da construcao. Atualizado pelo agente sempre que a sessao for
interrompida ou o contexto encher. Um paragrafo por item, sem narrativa.

## Fase corrente
Fase 3, dominio solo implementado ate onde os testes nao entram em Fase 4 ou Fase 5.

## Ultima feature concluida
F081, rastreabilidade e diario, concluida no commit `d944d7c`. Depois disso a
tela Vite foi ampliada no commit `d6918ea` para mostrar os modulos verdes:
fichamento, acervo, monografia, verificador e orientacao solo.

## Proxima feature
As proximas pendencias do relatorio sao Fase 4 ou Fase 5: F037 cruzada com
anotacao assistida, F038 a F053 de agentes, F066, F067, F070 restante e F073 de
multiusuario, e F097 a F099 de operacao. F012 resta pendente apenas por dois
casos de backup proprio em F098.

## Estado dos portoes
RELATORIO.md de 2026-09-07 16:51:50Z: testes de dominio ok, especificacao sem
vermelho ok, cobertura do catalogo ok, lint ok, tipos ok, build ok. TDD: 172
verdes, 0 vermelhos, 80 pendentes.

## Decisoes de projeto tomadas nesta construcao
Nenhum teste foi alterado. O item de listagem de orientacao exibe `recusada`
como acao disponivel na view, mas a maquina de estados continua recusando a
transicao final em `em_revisao`, conforme decisao de projeto ja registrada no
teste.

## Pendencias que dependem do Diego
Bloco 2 solicitado: enviar apenas o `client_id` publico do OAuth web do Google,
com origem JavaScript `http://localhost:5173`, para gravar em `.env` como
`VITE_GOOGLE_CLIENT_ID`. Bloco 3 de Cloudflare fica para antes de publicar.
