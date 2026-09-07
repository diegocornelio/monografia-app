# Fichário

Aplicativo de fichamento e construção de monografia em ABNT, local-first, com
cofre no Google Drive do usuário, escrita assistida sob guardrails e módulo de
orientação acadêmica.

O planejamento executável está em `docs/PLANEJAMENTO_FICHARIO_v4.md`. Este
repositório começa pelo domínio puro já testado, e a interface entra sobre ele.

## Estado atual

Domínio implementado e testado em Node, sem dependência de framework:

| Módulo | Responsabilidade |
|---|---|
| `src/domain/historico.mjs` | janela de 5 versões por entidade, restauração e remoção reversível |
| `src/domain/backlog.mjs` | tarefas do orientador, transições por papel, ciclo e resumo |
| `src/domain/sumario.mjs` | numeração até nível 5 e movimento de blocos |
| `src/domain/mapaLogico.mjs` | mapa de encadeamento em Mermaid e snapshot append-only |

Rodar as baterias:

```bash
npm run teste:dominio   # regressao do que ja existe
npm run tdd             # especificacao executavel das 96 features
npm run cobertura       # prova que nenhuma feature ficou sem teste
```

Estado hoje: 252 casos de especificacao, 39 verdes, 0 vermelhos, 213 pendentes
de implementacao. Cobertura do catalogo: 99 de 99 features com teste em algum
nivel. A arquitetura e front estatico do inicio ao fim, com Supabase consultado
do navegador a partir da Fase 5 e nenhum servidor de aplicacao proprio. A politica de estados e os portoes por fase estao em
`docs/PLANO_DE_TESTES.md`.

## Arranque do repositório

```bash
git init
git config user.name "Diego Cornelio"
git config user.email "<email>"
git config core.hooksPath .githooks
git checkout -b main
git add .
git commit -m "inicia o dominio do fichario com bateria de testes"
git remote add origin git@github.com:<usuario>/fichario.git
git push -u origin main
git checkout -b dev && git push -u origin dev
```

Proteger `main` no GitHub exigindo pull request e CI verde. Trabalho diário em
`feat/*` a partir de `dev`.

## Convenção de commit

Mensagem em português, imperativo, primeira linha até 72 caracteres, sem
rodapé de ferramenta. O hook `.githooks/commit-msg` recusa o que fugir disso.

```
adiciona exportador docx com estilos abnt
corrige quebra de figura separada da legenda no paged.js
```
