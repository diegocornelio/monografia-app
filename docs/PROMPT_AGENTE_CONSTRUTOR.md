# PROMPT — agente construtor do Fichário

Copie o conteúdo abaixo da linha de corte e cole na primeira mensagem da sessão
do agente, com o repositório aberto. Ele foi escrito para ser executado sem
supervisão contínua, parando apenas onde é impossível seguir sem você.

---8<--- CORTE ---8<---

Você vai construir o Fichário de ponta a ponta, sem interrupção, seguindo os
documentos que já estão neste repositório. Leia-os uma vez, na ordem, e não
volte a relê-los inteiros depois:

1. `docs/PLANEJAMENTO_FICHARIO_v4.md` — o que construir, em cinco fases, com o
   catálogo de 99 features numeradas.
2. `docs/PLANO_DE_TESTES.md` — a especificação executável e os portões de fase.
3. `docs/MARCO_PUBLICACAO_V2.md` — onde a construção para para ir ao ar.

## Regra de prioridade, quando houver conflito

**Funcionalidade primeiro.** O caminho mais curto e mais barato é sempre
preferível, mas apenas entre caminhos que entregam a funcionalidade
especificada. Não simplifique cortando comportamento. Se o caminho barato não
entrega o que o teste exige, use o caro e registre por quê em uma linha no
commit. Se você se pegar reescrevendo um teste para que ele passe, pare: ou o
teste está errado, e a mudança é decisão de projeto que vai documentada com data
e motivo dentro do próprio arquivo, ou o código está errado e é ele que muda.

## Método: o teste é a especificação

O repositório já tem 252 casos escritos antes da implementação, 39 verdes e 213
pendentes. Pendente significa que o módulo ainda não existe. Sua tarefa é fazer
os pendentes ficarem verdes, na ordem das fases, sem alterar o que eles afirmam.

Ciclo por feature, e não invente outro:

1. `node testes/tdd.mjs` e escolha a próxima feature pendente da fase corrente.
2. Leia apenas os casos daquela feature. Não releia o catálogo inteiro.
3. Implemente o módulo mínimo que faz os casos passarem.
4. `./scripts/checagem.sh` (ou `scripts\checagem.ps1` no Windows) e leia
   `RELATORIO.md`.
5. Commit em português, imperativo, primeira linha até 72 caracteres, sem
   rodapé de ferramenta. O hook em `.githooks/commit-msg` recusa o que fugir
   disso; ative com `git config core.hooksPath .githooks`.

Nunca prossiga para a fase seguinte com portão vermelho.

## Economia de token, que é regra e não sugestão

Toda verificação repetitiva vira script, executado no terminal, e não raciocínio
seu. Especificamente:

- Rode `./scripts/checagem.sh` em vez de executar comando por comando e ler
  saída por saída. Ele consolida tudo em `RELATORIO.md`.
- Nunca cole arquivo inteiro no contexto para inspecionar. Use `grep -n`,
  `sed -n 'X,Yp'`, `rg`. Leia trechos.
- Mudança mecânica repetida em muitos arquivos vira codemod ou `sed`, não
  edição manual arquivo a arquivo.
- Não repita no chat o conteúdo do que acabou de escrever. Escreva, teste,
  siga.
- Antes de gerar qualquer coisa longa, pergunte-se se um script gera. Se gera, o
  script é a resposta.

## Conferência automática por agendamento

Na primeira ação da sessão, instale a conferência automática:

```bash
./scripts/instalar-cron.sh
```

No Windows:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\instalar-tarefa.ps1
```

Ela roda a primeira conferência 20 minutos depois da instalação e repete a cada
20 minutos até você removê-la. Cada execução regrava `RELATORIO.md` e acrescenta
a `registro-checagem.log`.

Como usar o resultado: a cada retomada de contexto, leia `RELATORIO.md` antes de
qualquer outra coisa. Ele diz em uma tabela curta o que está de pé, o que
quebrou e quais features seguem pendentes, e isso substitui reconstruir o estado
lendo o repositório. Se um portão aparecer vermelho, corrija antes de escrever
qualquer linha nova.

Ao terminar a construção e publicar, remova o agendamento:

```bash
./scripts/instalar-cron.sh remover
```

## Ordem de construção

Fases 1 a 3 e o marco de publicação, nesta ordem, sem pular:

1. **Fase 1** — domínio em TypeScript (porte os quatro módulos já testados sem
   mudar comportamento), Dexie com migração numerada, `Versionado<T>`, lixeira,
   CRUD de fonte, ficha, tag e citação, busca, fila de impressão, exportadores,
   XML e zip, diálogo de saída, design warm terra, responsividade.
2. **Fase 2** — Drive com PKCE e escopo `drive.file`, autosave por hash,
   Google Docs, BibTeX e RIS, DOI, deduplicação, estado de leitura, link morto,
   retratação, backup local, leitor de PDF, agenda de reuniões.
3. **Fase 3** — construtor de blocos, editor, tabelas, figura com legenda,
   pré-textuais, sumário e listas, referências, preset, preview, templates,
   metas, verificador normativo, coerência de citação, siglas e glossário,
   matriz de rastreabilidade, diário, mapa lógico, linha do tempo, PWA, paleta
   de comandos, modo foco, e a orientação em modo solo com backlog, ciclo,
   gráfico e listagem rolável.
4. **Marco de publicação** — pare aqui, aplique os oito portões do §4 do
   `MARCO_PUBLICACAO_V2.md`, publique no Cloudflare Pages e crie a tag
   `v1.0.0-solo`.

A Fase 4 e a Fase 5 não entram nesta sessão. Elas seguem no segundo
repositório, conforme o §6 do marco.

## Quando parar e me pedir alguma coisa

Você não tem, e não deve tentar obter, credencial de nenhum serviço. Quando
chegar em um ponto que exige conta, **pare, peça, e enquanto espera continue por
outro caminho que não dependa daquilo**. Nunca invente chave, nunca crie conta
em meu nome, nunca contorne uma tela de autenticação.

Peça em blocos, e não um item por vez, para não me interromper toda hora. São
quatro momentos, nesta ordem:

**Bloco 1, no começo da Fase 1.** Repositório no GitHub: preciso que eu crie o
repositório vazio e informe a URL, e que eu configure `git config user.name` e
`user.email`. Diga exatamente os comandos que devo rodar.

**Bloco 2, no começo da Fase 2.** Google Cloud: projeto criado, API do Drive e
do Calendar habilitadas, tela de consentimento configurada em modo externo, e um
cliente OAuth do tipo aplicação web com as origens JavaScript que você vai
indicar. Peça o `client_id`, que é público e vai em `.env` com prefixo `VITE_`.
Nunca peça o `client_secret`: o fluxo é PKCE e não usa segredo. Liste as
origens exatas de que precisa, incluindo `http://localhost:5173` para
desenvolvimento.

**Bloco 3, antes de publicar.** Cloudflare: conta, e um projeto no Pages
conectado ao repositório, com build `npm run build` e saída `dist`. Se for
publicar pelo GitHub Actions em vez do painel, peça os segredos
`CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` e me diga com qual escopo
mínimo criar o token. Peça também o domínio que vou apontar, e me lembre de que
a origem OAuth do bloco 2 precisa ser atualizada para esse domínio.

**Bloco 4, depois de publicar.** Verificação de propriedade do domínio no Search
Console, para a tela de consentimento do Google. Diga o que devo colar onde.

Ao pedir, escreva um bloco curto, numerado, com o que devo fazer e onde, sem
teoria. Depois espere. Não fique conjecturando enquanto espera: siga
implementando o que não depende daquele acesso.

## O que nunca fazer

- Nunca ligar a Fase 4 ou a Fase 5 nesta sessão.
- Nunca escrever chave, token ou segredo em arquivo versionado. Só `.env` com
  prefixo `VITE_` e valores públicos, mais `.env.example` documentado.
- Nunca criar Cloudflare Function neste repositório: o produto é estático, e é
  isso que mantém a hospedagem sem medidor.
- Nunca marcar como pronto algo cujo teste não passa. Se não deu tempo,
  escreva no `HANDOFF.md` o que falta, e não maquie o relatório.
- Nunca apagar teste para fechar fase.
- Nunca reproduzir texto de norma ABNT: o preset se chama preset do Fichário na
  tela, porque as NBR não foram lidas em fonte primária. Não escreva
  "conformidade ABNT" em lugar nenhum da interface.

## Handoff

Sempre que a sessão for interrompida ou o contexto encher, atualize
`HANDOFF.md` com: fase corrente, última feature concluída, próxima feature,
estado dos portões copiado do `RELATORIO.md`, decisões de projeto tomadas e
pendências que dependem de mim. Um parágrafo por item, sem narrativa.

Comece agora: instale a conferência automática, rode a checagem para registrar o
ponto de partida, e peça o bloco 1.

---8<--- FIM ---8<---

## Notas para o Diego, fora do prompt

O agendamento é deliberadamente burro: um script que roda os mesmos portões a
cada 20 minutos e grava um relatório curto. O valor não está na inteligência
dele, está em o agente poder reconstruir o estado lendo uma tabela de dez linhas
em vez de reprocessar o repositório, que é onde o token some.

A primeira conferência em 20 minutos tem um efeito colateral útil: se o agente
travou, dispersou ou começou a inventar arquivo fora do plano, o relatório
mostra isso cedo, enquanto o retrabalho ainda é pequeno.

Os quatro blocos de credencial foram desenhados para caber em quatro
interrupções suas, e não em quinze. Se preferir, o bloco 2 e o bloco 3 podem ser
resolvidos de uma vez, antes de começar, e aí o agente roda do início ao fim sem
parar nenhuma vez.
