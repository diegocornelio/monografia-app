# PLANO DE TESTES — Fichário

Versão 2.0 · 2026-09-07 · companheiro de `PLANEJAMENTO_FICHARIO_v4.md`.

Mudou nesta versão: entrou a suíte `10-operacao.spec.mjs`, com os itens 97 a 99
do catálogo e com as consequências de não existir servidor de aplicação; o
catálogo passou de 96 para 99 features; e o portão da Fase 5 ganhou o teste que
substitui a camada de servidor que deixou de existir, descrito no §6.

Este documento descreve a bateria que decide se o Fichário foi construído como
especificado. A bateria não é acessório do planejamento: ela é a forma
executável dele. Onde os dois divergirem, o teste é o que vale, porque é o teste
que roda.

---

## 1. Como esta bateria é usada, e por que ela é TDD

Os testes das seções abaixo foram escritos antes da implementação da maior
parte do sistema. Cada arquivo de especificação descreve o comportamento
esperado de um módulo que ainda não existe, e a construção do software consiste
em fazer esses testes passarem, um a um, sem alterar o que eles afirmam. Alterar
uma afirmação é permitido, e acontece, mas é decisão de projeto e vai registrada
no próprio arquivo, com data e motivo. Foi o que aconteceu com a recusa de
tarefa já entregue, registrada em `07-orientacao.spec.mjs`.

O ciclo, por feature: ler o item do catálogo do §7 do planejamento; ler os casos
correspondentes na especificação; implementar o módulo até que passem; rodar a
bateria inteira; abrir o pull request com a bateria verde.

## 2. Três estados, e a diferença entre eles

O harness distingue três estados, e a distinção é o que torna o relatório útil.

**Verde.** O comportamento existe e está correto.

**Vermelho.** O módulo existe e o comportamento diverge do especificado. É
regressão ou implementação incorreta, e reprova o CI sempre.

**Pendente.** O módulo ainda não existe, ou o caso depende de infraestrutura que
ainda não foi montada. Não reprova o CI do dia a dia, porque em TDD "ainda não
construído" é estado normal do trabalho, e reprovar por isso faria a equipe
desligar o portão logo na primeira semana. Pendência reprova no fechamento de
fase, com `npm run tdd:fechar-fase`.

Sem essa separação, toda a bateria ficaria vermelha desde o primeiro dia, e uma
bateria sempre vermelha não informa nada.

## 3. Estado atual

```
npm run tdd
TOTAL 252 casos | verde 39 | vermelho 0 | pendente 213
```

Os 39 verdes cobrem o que já foi implementado e entregue: janela de cinco
versões e remoção reversível, máquina de estados do backlog com permissão por
papel, resumo e ordenação da listagem, numeração e movimento de blocos, e o
mapa de encadeamento lógico com snapshot append-only. Os 188 pendentes são a
especificação do que falta construir.

```
npm run cobertura
Features do catalogo: 99 | Com teste em algum nivel: 99 | Sem teste: 0
```

Uma observação sobre a contagem de features provadas no relatório: uma feature
só é dada como provada quando todos os seus casos estão verdes em todos os
níveis. Feature com um caso verde no domínio e outro pendente na interface
continua pendente, e é assim que deve ser, porque metade construída é não
construída.

## 4. Níveis

| Nível | Onde | Roda com | O que prova |
|---|---|---|---|
| Unidade | `testes/dominio.test.mjs` | `npm run teste:dominio` | regressão dos módulos já implementados |
| Especificação | `testes/especificacao/*.spec.mjs` | `npm run tdd` | o contrato de domínio e aplicação, feature a feature |
| Fim a fim | `testes/e2e/*.spec.ts` | Playwright, a partir da Fase 1 | o que só a tela e o arquivo gerado provam |
| Cobertura | `testes/cobertura.mjs` | `npm run cobertura` | que nenhuma feature do catálogo ficou sem teste |
| Integração | Fase 5, contra instância de teste | job próprio | isolamento por linha no banco e ciclo de cobrança |

A escolha de nível não é estética. Regra usada aqui: se o comportamento pode ser
provado por função pura, ele é provado por função pura, porque teste de domínio
roda em milissegundos e não descama quando o botão muda de nome. Fica para o
fim a fim apenas o que depende de renderização, de paginação real, de arrastar
com o mouse, de sessão, ou do arquivo binário produzido.

## 5. Mapa das suítes

| Arquivo | Cobre | Fase |
|---|---|---|
| `01-fichamento.spec.mjs` | limites por tipo, quatro tipos de ficha, citação limpa e sua apresentação, tags e contraste, busca e filtro | 1 |
| `02-versionamento.spec.mjs` | janela de cinco, restauração, aviso de descarte, lixeira e cascata, autosave por hash | 1 |
| `03-abnt.spec.mjs` | referência por campos estruturados, verificador normativo, citação órfã e referência não citada, siglas e glossário | 1 e 3 |
| `04-intercambio.spec.mjs` | XML determinístico, migração de formatos, manifesto do pacote | 1 |
| `05-acervo.spec.mjs` | BibTeX e RIS, deduplicação, DOI, estado de leitura, link morto, retratação, porta do cofre e conflito | 2 |
| `06-monografia.spec.mjs` | numeração, listas geradas, paginação indivisível, figura com legenda, metas, rastreabilidade, mapa lógico | 3 |
| `07-orientacao.spec.mjs` | comentário ancorado e reancoragem, backlog, ciclo, validação, gráfico narrado, listagem rolável | 3 e 5 |
| `08-agentes.spec.mjs` | camadas do prompt, chave que não persiste, anotação sem reescrita, coincidência textual, auditoria, MCP, custo | 4 |
| `09-multiusuario.spec.mjs` | papéis, isolamento das rotas de agente, convite e revogação, política por linha, cobrança | 5 |
| `10-operacao.spec.mjs` | ping de atividade, monitor de cota, backup próprio, chave anônima sem privilégio, paridade entre regra de interface e política de banco | 5 |
| `e2e/01-fichamento.spec.ts` | impressão, ficha nunca dividida, exportadores, diálogo de saída, arrastar, backup local | 1 e 2 |
| `e2e/02-monografia.spec.ts` | Drive, Google Docs, agenda, editor, preset, preview, layout sem sobreposição, PWA | 2 e 3 |
| `e2e/03-orientacao-publicacao.spec.ts` | view do orientador, comentário fim a fim, gráfico, listagem com 500 itens, submissão e defesa | 3 e 5 |

## 6. Os testes que decidem o requisito desta rodada

Cinco casos concentram o que foi pedido, e a construção não é aceita sem eles.

1. `sexta_edicao_sobrescreve_a_versao_mais_antiga`, em `02-versionamento`.
   Cinco versões de volta, e a sexta gravação descarta a mais antiga, com a
   ordem das demais preservada.
2. `nenhuma rota de agente e resolvida para orientador ou leitor`, em
   `09-multiusuario`, mais `F067 nenhuma palavra da orquestracao aparece no HTML
   servido ao orientador`, no fim a fim. O primeiro prova a regra, o segundo
   prova que ela não foi implementada escondendo botão.
3. `o leitor nao valida nem arquiva, e nao recebe transicao alguma`, em
   `07-orientacao`, junto com `somente orientador ou autor` nas capacidades.
4. `recusadas contam a parte e nao inflam o progresso`, em `07-orientacao`, que
   é o que impede o gráfico de mentir sobre o andamento.
5. `a ordem completa segue revisao, aberta, atendimento, recusada, validada,
   arquivada`, também em `07-orientacao`, que fixa a listagem descritiva rolável
   nas duas views.

## 6.1 O teste que substitui o servidor que não existe

A v4.0 do planejamento retirou a migração para Next.js, e com ela a camada de
servidor onde normalmente se escreveria uma segunda verificação de autorização.
Sem ela, a política de linha no Postgres é a barreira única, e a bateria muda de
forma para acompanhar.

Três casos concentram isso. Em `10-operacao`, `nenhuma chave de servico pode
aparecer no bundle do front` e `regra de autorizacao declarada apenas na
interface e recusada`, que impedem, no primeiro caso, o erro que vaza tudo de
uma vez, e no segundo o erro que parece funcionar até alguém abrir o console. O
terceiro é de integração e está declarado pendente: um cliente HTTP falando
direto com a API do banco, com a chave anônima e sem passar pela interface,
precisa receber exatamente o que a política permite e nada mais. Enquanto esse
caso não rodar contra instância real, a Fase 5 não fecha.

## 7. Portões por fase

Cada fase fecha com uma tag `fase-N`, e a tag dispara o job que exige a
especificação daquela fase inteira verde. O que entra em cada portão:

| Fase | Exige verde | Além disso |
|---|---|---|
| 1 | `01`, `02`, `03` (referência), `04` | `e2e/01` sem `fixme`, Lighthouse ≥ 90 |
| 2 | `05` | `e2e/02` na parte de Drive e agenda, com adaptador falso |
| 3 | `03` inteiro, `06`, parte de orientação solo de `07` | `e2e/02` inteiro, teste visual de quebra de página |
| 4 | `08` | job de guardrails, corpus de coincidência textual |
| 5 | `09`, `10`, `07` inteiro | integração contra instância de teste, `e2e/03` inteiro, cliente HTTP direto contra a política, ping mantendo o projeto ativo por trinta dias sem acesso humano, restauração real a partir do backup próprio |

## 8. O que esta bateria não prova, e convém saber

Ela não prova conformidade com a ABNT. Os casos golden de referência e do
verificador expressam o preset interno do projeto, e não leitura em fonte
primária das NBR 6023, 6024, 6027, 6028, 6034, 10520 e 14724, que não foram
consultadas nesta sessão. Cada caso golden é o lugar onde a correção entra
quando a leitura for feita, e até lá o rótulo do preset não deve carregar o ano
da norma.

Ela não prova, hoje, nada que dependa de renderização: todos os casos de fim a
fim estão marcados como `fixme` porque a interface ainda não existe. Eles são
especificação, não verificação, e trocar essa marca por execução real é parte do
trabalho de cada fase.

Ela não prova isolamento real no banco. Os dois casos de acesso cruzado em
`09-multiusuario` estão declarados como pendentes de integração, porque
política de linha só se prova contra o banco de verdade. Teste de política
escrito em memória dá falsa segurança e é pior que nenhum.

Ela não prova que o ping funciona. Os casos de `10-operacao` provam a decisão de
quando pingar e o alerta quando o ping envelhece, que é lógica pura. Que o Cron
Trigger realmente executou, que a chave do Worker continua válida e que o
Supabase aceitou a requisição, isso só a execução real por trinta dias mostra, e
está no portão da Fase 5 por isso. Paliativo testado só em unidade é paliativo
que falha em silêncio, que é exatamente o que ele existe para evitar.

Ela não mede desempenho além de dois limites grosseiros, a rolagem de
quinhentas tarefas e o tempo de rerrenderização do mapa. Carga real, se o SaaS
crescer, pede instrumentação, e isso não estava no escopo do planejamento.

Ela não substitui leitura humana do texto produzido. Nenhum teste automatizado
sabe se um parágrafo tem salto lógico; o que os testes garantem é que a
detecção assistida devolva anotação ancorada em vez de reescrever em silêncio, e
que toda geração deixe rastro.

## 9. Como rodar

```bash
npm run teste:dominio     # regressão dos módulos já implementados
npm run tdd               # especificação executável, com detalhe caso a caso
npm run tdd:relatorio     # só o relatório e a lista do que falta
npm run tdd:fechar-fase   # reprova se houver qualquer pendência
npm run cobertura         # prova que nenhuma feature ficou sem teste
```
