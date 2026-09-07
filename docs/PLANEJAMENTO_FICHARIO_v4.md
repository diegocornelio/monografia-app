# PLANEJAMENTO — Fichário (fichamento, monografia ABNT e orientação)

Versão 4.0 CUMULATIVA · 2026-09-07 · substitui a 3.0, que substituiu a 2.0 e a
1.0 e absorveu `FEATURES_FALTANTES.md` · documento para execução à risca por
agente.

Esta versão não descarta nada do que já estava planejado. Sobre a 3.0 ela muda
uma decisão de arquitetura e acrescenta as consequências dela. A decisão: **o
front permanece estático do começo ao fim, e a migração para Next.js sai do
plano**. O Supabase passa a ser consultado direto do navegador, com política de
linha fazendo a segurança, e o único servidor do produto é o próprio Supabase.
Daí decorrem a nova §2.1 com a tabela de stack, a §Fase 5 reescrita, três
features novas de operação no catálogo (§7.5), dois riscos novos (§10) e a
publicação no Cloudflare Pages no lugar do Netlify (§11).

Por que a mudança. A migração para Next.js existia no plano para hospedar
renderização no servidor, e renderização no servidor não é necessária em nenhuma
tela deste produto: o conteúdo é privado por definição, não há SEO a ganhar, e a
segurança que importa é a política de linha no banco, que roda no Postgres e não
no framework. Sem servidor de aplicação, a hospedagem do front continua sendo
ativo estático não medido, e o custo do produto inteiro cai para o custo do
banco.

As três razões pelas quais uma decisão dessas normalmente não se sustenta, e por
que aqui ela se sustenta: não há SEO em jogo porque nada é público; não há
segredo no cliente porque a chave anônima do Supabase é publicável por desenho e
toda autorização vive em política de linha; e o que exige servidor de verdade,
que é o webhook de pagamento, cabe em Edge Function do próprio Supabase.

Artefatos já testados e disponíveis junto deste plano, com saída conferida
nesta sessão:

| Arquivo | O que faz | Estado |
|---|---|---|
| `src/domain/historico.mjs` | janela de 5 versões, restauração, remoção reversível | 7 testes verdes |
| `src/domain/backlog.mjs` | tarefas de orientação, transições por papel, ciclo, resumo | 7 testes verdes |
| `src/domain/sumario.mjs` | numeração até nível 5, movimento de blocos | 6 testes verdes |
| `src/domain/mapaLogico.mjs` | Mermaid do mapa lógico e snapshot append-only | conferido na v2.0 |
| `ficha_abnt.tex` | template de ficha, 2 por A4, indivisível | compilado na v1.0 |

A bateria completa roda com `npm run teste:dominio` e fecha em 20 testes.
Nenhuma fase começa sem que a bateria esteja verde, conforme a regra da casa de
não entregar planejamento crítico sem código funcional testado.

---

## 0. Rastreabilidade dos requisitos desta rodada

Cada exigência da mensagem foi decomposta e recebeu endereço no documento. Quem
executar deve conseguir apontar, para cada linha abaixo, onde a exigência foi
atendida e em que fase ela entra.

| # | Exigência lida | Onde está | Fase |
|---|---|---|---|
| R1 | app construído e armazenado no GitHub para versionamento | §11 | 1 |
| R2 | nenhuma feature de fora | §7 (catálogo com 96 itens rastreados) | 1 a 5 |
| R3 | enriquecer com features do ciclo de vida acadêmico | §7.3 e §7.4 | 2 a 5 |
| R4 | orientador não vê a orquestração de IA | §5.2 e §4.2 | 5 (piloto em 3) |
| R5 | orientador vê documentos, referências e progresso | §5.3 | 5 |
| R6 | orientador comenta direto onde precisa de atenção | §5.4 | 5 |
| R7 | comentário gera backlog de tarefas para o orientando | §5.5 | 3 (solo) e 5 |
| R8 | orientador vê o ciclo de otimização das partes em backlog | §5.6 | 5 |
| R9 | só orientador ou orientando validam e arquivam | §5.7, código testado | 3 e 5 |
| R10 | gráfico de tarefas realizadas e pendentes | §5.8 | 3 |
| R11 | tarefas em listagem descritiva rolável nas duas views | §5.9 | 3 e 5 |
| R12 | planejamento em 5 fases, do zero ao publicável | §8 | — |
| R13 | tudo editável, removível e salvo | §3.1 a §3.4 | 1 |
| R14 | histórico de 5 versões, a sexta sobrescreve a mais antiga | §3.2, código testado | 1 |

---

## 1. Fontes lidas e o que elas encerram

A planilha `Estudo-Acelerado.xlsm` foi aberta e lida nesta sessão. O que ela
define, e que agora entra no modelo de dados sem suposição:

1. Seis abas: `Menu Inicial`, `Fichamento de Texto`, `Fichamento
   Bibliográfico`, `Fichamento de Citação`, `Citações` e `Fichão`.
2. O `Menu Inicial` guarda o assunto do fichamento e os campos da obra em
   separado: nome do autor, sobrenome, título, número da edição, cidade,
   editora e ano. A referência exibida nas demais abas é composta desses
   campos, não digitada à mão.
3. As três abas de fichamento repetem o mesmo cabeçalho (assunto e fonte) e
   diferem apenas no corpo: texto livre no fichamento de texto, tema da obra e
   visão do autor no bibliográfico, citações no de citação.
4. A aba `Citações` instrui a digitar a citação exatamente como está no livro,
   sem aspas, e guarda a página ao lado de cada uma. As aspas são função de
   apresentação, aplicadas na ficha.
5. O `Fichão` é a concatenação das três seções na ordem bibliográfico,
   citação, texto.

Consequências para o app, todas incorporadas ao §6: a referência é montada por
campos estruturados e o texto ABNT é derivado, o que permite trocar a norma de
saída sem redigitar; a citação é armazenada limpa, e aspas, recuo e corpo 10
são decisões do exportador; o fichão é uma visão composta, não um quinto tipo
de armazenamento.

Permanece a pendência **P-A** da v1.0: a mensagem original citava um site de
referência cujo link nunca chegou. Se esse site definir campos além dos que a
planilha define, o modelo de dados precisa ser revisto antes do congelamento do
XML, no fim da Fase 1. Enquanto isso, o que está escrito aqui vale como
especificação, e está marcado como derivado da planilha lida, não do site.

---

## 2. Princípios que não mudam

Os princípios da v2.0 continuam valendo integralmente: clean architecture com
quatro camadas e dependências apontando para dentro; local-first, com o Drive
como cofre do usuário e nunca como requisito para editar; regra ABNT vivendo em
domínio puro e testável; ULID desde a primeira linha; nenhum acesso a dado fora
de repositório; nenhum segredo persistido em claro; comentário de código e
documentação em português.

A esses somam-se dois princípios novos, que o requisito desta rodada torna
estruturais.

**Nada se perde por acidente.** Toda entidade editável do sistema nasce
envelopada em versionamento e em remoção reversível. Não existe caminho de
código que apague conteúdo do usuário sem passar pela lixeira e sem que exista
histórico. Isso é verificado por teste de arquitetura, não por disciplina.

**Nenhuma máquina de estados na interface.** Transição de tarefa, permissão por
papel e janela de versões são funções puras no domínio, testadas fora do React.
A interface pergunta ao domínio o que é possível e desenha os botões a partir
da resposta, o que elimina a classe de bug em que a tela oferece uma ação que o
servidor recusa.

### 2.1 Stack, revisada nesta versão

A tabela de stack da v2.0 fica substituída por esta. As linhas alteradas estão
marcadas.

| Camada | Escolha | Observação |
|---|---|---|
| Front, fases 1 a 5 | Vite + React 18 + TypeScript estrito | **alterado**: sem migração para Next.js em nenhuma fase |
| Estado | Zustand com immer | store única, serializável |
| Persistência local | Dexie sobre IndexedDB | continua sendo o banco do modo local |
| Editor rico | Tiptap | JSON estável para XML e exportadores |
| Arrastar e soltar | dnd-kit | acessível |
| PDF | Paged.js | ABNT por CSS Paged Media |
| DOCX | biblioteca `docx` | estilos nomeados |
| LaTeX | gerador próprio, alvo Overleaf | nunca compilado no navegador |
| Drive | Google Identity Services com PKCE, escopo `drive.file` | direto do navegador |
| Backend, a partir da fase 5 | Supabase consultado do navegador | **alterado**: sem camada de servidor própria; autorização por política de linha |
| Servidor, quando inevitável | Supabase Edge Functions | **alterado**: apenas webhook de cobrança e tarefas agendadas |
| Cobrança | Asaas primário, Stripe atrás da porta | inalterado |
| Agentes | SDKs oficiais e servidor MCP | fase 4, fora do marco de publicação |
| Hospedagem do front | Cloudflare Pages | **alterado**: substitui Netlify e Vercel em todas as fases |
| Ping de atividade | Cron Trigger de Worker na Cloudflare | **novo**: ver §12 |
| Testes | Vitest, Testing Library, Playwright, golden files | inalterado |
| CI/CD | GitHub Actions com publicação no Pages | **alterado** |

Uma consequência que precisa ficar explícita para quem for implementar: sem
servidor de aplicação, **a política de linha é a única barreira entre um usuário
e o dado de outro**. Não existe segunda camada de verificação em um controlador
que você escreveu. Isso torna o teste de acesso cruzado do §Fase 5 obrigatório e
não recomendável, e torna proibida qualquer regra de autorização que exista só
no React.

---

## 3. Editável, removível, salvo, e com cinco versões de volta

### 3.1 O que é versionado

Toda entidade que o usuário edita: `Projeto`, `Fonte`, `Ficha`, `Citacao`,
`Tag`, `Bloco`, `Figura`, `Tabela`, `Pretextual`, `Comentario`, `Tarefa`,
`MapaLogico`, `TemplatePacote`, `SkillEscrita`, `VozUsuario` e `Reuniao`. A
janela de versões é por entidade, e não apenas por projeto, porque a pergunta
real do usuário é "como estava este capítulo antes", e não "como estava tudo".

Além da janela por entidade, o pacote do projeto continua ganhando snapshot
completo no Drive a cada autosave, com a mesma política de cinco: a sexta
gravação descarta a mais antiga da pasta `versoes`. As duas linhas convivem,
com propósitos distintos, e o §3.5 explica a diferença ao usuário dentro da
própria interface, porque essa distinção confunde quando não é dita.

### 3.2 A janela de cinco versões

A regra do requisito é literal: até cinco versões anteriores podem ser
retornadas; a sexta atualização sobrescreve a mais antiga. A implementação já
existe e está testada em `src/domain/historico.mjs`.

```js
export const MAX_VERSOES = 5;

export function registrarEdicao({ versionado, novoEstado, quem, quando }) {
  const entrada = { estado: versionado.atual, quem, quando };
  const acumulado = [...versionado.versoes, entrada];
  const versoes = acumulado.slice(-MAX_VERSOES);
  return { ...versionado, atual: novoEstado, versoes };
}
```

Comportamento conferido pela bateria:

| Teste | O que garante |
|---|---|
| `historico_guarda_no_maximo_cinco_versoes_anteriores` | a janela nunca cresce |
| `sexta_edicao_sobrescreve_a_versao_mais_antiga` | `v0` sai quando `v6` entra, e a ordem `v1..v5` é preservada |
| `restaurar_versao_antiga_devolve_o_estado_e_preserva_o_corrente` | restaurar é reversível, porque o estado corrente desce para o histórico |
| `restaurar_indice_inexistente_falha_em_vez_de_silenciar` | índice inválido lança, não devolve silêncio |
| `remocao_e_reversivel_ate_o_expurgo_explicito` | remover marca, não apaga |
| `listagem_de_versoes_vem_da_mais_recente_para_a_mais_antiga` | ordem de leitura da interface |
| `nenhuma_funcao_de_historico_muta_o_objeto_recebido` | o histórico é imune a mutação acidental do chamador |

Duas decisões merecem registro por não serem óbvias. A primeira: restaurar uma
versão é uma edição, e por isso empurra o estado corrente para dentro da janela.
Sem isso, o usuário que restaura por engano perde o trabalho de hoje, que é
exatamente o acidente que o histórico existe para evitar. A segunda: a janela
guarda estados completos da entidade, não diffs. Diffs economizam espaço e
custam correção; para o tamanho de um bloco de monografia, a economia não paga
a complexidade.

O que a janela de cinco não cobre, e o app diz isso na tela de histórico: uma
sequência de mais de cinco autosaves consecutivos empurra a versão de ontem
para fora. Por isso o autosave por tempo grava versão apenas quando houve
mudança efetiva de conteúdo, comparada por hash, o mesmo recurso já testado no
snapshot do mapa lógico. Salvamento sem alteração não consome janela.

### 3.3 Remoção reversível

Remover marca `removido` e a data, mantendo o registro e o histórico. A lixeira
do projeto lista o que foi removido, com filtro por tipo e data, e permite
restaurar. O expurgo definitivo é ação explícita, individual ou em lote, com
confirmação que nomeia o que será destruído, e só a partir dele o registro sai
do banco e o recurso sai do Drive. Remoção em cascata não existe de forma
silenciosa: remover uma fonte que tem fichas vinculadas mostra a lista das
fichas afetadas e pede decisão entre manter as fichas órfãs, com aviso de
referência pendente, ou levá-las junto para a lixeira.

### 3.4 Salvamento

Três camadas, todas ligadas por padrão. Persistência imediata em IndexedDB a
cada alteração confirmada, com debounce curto, para que fechar a aba nunca
perca o parágrafo. Autosave configurável, padrão de dez minutos, gerando
versão no Drive quando houver mudança de conteúdo. Salvamento explícito pelo
usuário, que grava versão mesmo sem mudança relevante, porque o usuário às
vezes quer marcar um ponto de retorno e essa intenção precisa de botão.

O diálogo de saída da v1.0 continua: fechar com alteração não persistida
pergunta salvar ou descartar, e descartar exige confirmação nomeando o que se
perde.

### 3.5 O que o usuário vê

Em toda entidade, um controle de histórico abre um painel com as cinco versões,
da mais recente para a mais antiga, cada uma com autor, data e prévia do
conteúdo. Comparação lado a lado com destaque de diferença. Restaurar traz a
versão para o corrente e informa, na própria tela, que o estado que estava
valendo passou a ocupar a posição mais recente do histórico. Quando a janela
está cheia, o painel avisa qual versão sairá na próxima gravação, com data, de
modo que o descarte nunca seja surpresa.

---

## 4. Papéis e permissões

Quatro papéis, definidos no domínio e verificados no backend a partir da Fase 5.

| Papel | Quem é | O que pode |
|---|---|---|
| `autor` | o orientando, dono do projeto | tudo no seu projeto, inclusive agentes, exportação e convites |
| `orientador` | convidado pelo autor | ver documentos, referências e progresso; comentar; abrir, validar, arquivar e recusar tarefa; ver ciclo de otimização; baixar exportação |
| `leitor` | banca, coorientador, colega | ver e comentar; não valida, não arquiva, não vê agentes |
| `administrador` | operação do SaaS | suporte e faturamento; nunca lê conteúdo de projeto |

Duas regras negativas valem para todos os papéis convidados, e são o coração do
requisito R4. Nenhum papel além de `autor` acessa a aba de agentes, as chaves de
API, os prompts montados, o custo estimado, o mapa lógico assistido ou qualquer
rota sob `/agente`. Nenhum papel além de `autor` edita conteúdo do documento: o
orientador aponta, o autor escreve. Esta segunda regra é deliberada e vale a
justificativa: revisão que edita direto no texto do orientando dissolve a
autoria e destrói a rastreabilidade que o próprio app existe para produzir.

O teste `leitor_nao_valida_nem_arquiva_tarefa` já cobre a parte de permissão que
vive no domínio, e a Fase 5 acrescenta o espelho disso em política de linha no
banco, provado por teste de acesso cruzado.

---

## 5. Módulo de orientação

### 5.1 O problema que ele resolve

Sem o módulo, a revisão volta por e-mail com comentário solto, o orientando
perde o vínculo entre a observação e o parágrafo, e nenhum dos dois consegue
dizer, três semanas depois, o que já foi atendido. O módulo transforma cada
observação em uma unidade de trabalho ancorada, com estado, história e dono.

### 5.2 A view do orientador, e o que ela esconde

O orientador entra por link de convite e cai em uma página de leitura, não no
ambiente de trabalho do autor. Essa página é servida por rotas próprias, sob
`/orientacao/:projetoId`, e o que nela aparece é montado por consultas que não
tocam nas tabelas de agente. A ocultação da orquestração de IA não é feita por
esconder botão na interface: as rotas de agente não existem para esse papel, e
o backend recusa a consulta. Esconder por CSS seria promessa que o primeiro
inspetor de elementos desmente.

O que o orientador não vê, de forma explícita: aba de agentes, chaves, prompts,
skills de escrita, bloco de voz, estimativas de custo, trilha de auditoria de
geração e sugestões pendentes de aceitação. O que ele vê da assistência, e só
isso, quando o autor optar por publicar a declaração: o documento de declaração
de uso de IA gerado na Fase 4, que é peça acadêmica e não orquestração.

### 5.3 O que a página mostra

Quatro áreas, em uma única página rolável, com navegação lateral fixa.

**Documentos.** O trabalho em preview fiel, o mesmo motor Paged.js do PDF, com
paginação e sumário navegável. Cada bloco é selecionável para comentário. O
orientador pode baixar o PDF da versão corrente, e apenas dela.

**Referências.** A lista de fontes com referência ABNT formatada, estado de
leitura declarado pelo autor, quantidade de fichas por fonte e quantidade de
citações efetivamente usadas no texto. A leitura mais útil dessa tela é a que
mostra fonte sem ficha e ficha sem uso, porque é ali que a fragilidade
bibliográfica aparece antes da banca encontrá-la.

**Progresso.** O gráfico do §5.8, a série de palavras por capítulo contra meta,
a data da última alteração por capítulo e a lista de reuniões registradas.

**Tarefas.** A listagem descritiva rolável do §5.9.

### 5.4 Comentário ancorado

O orientador seleciona um trecho do bloco e escreve. O comentário guarda o
`blocoId` e a âncora, que é o par de deslocamentos de início e fim no conteúdo
do bloco, mais a transcrição do trecho no momento do comentário. Guardar a
transcrição é o que permite reancorar quando o autor edita o parágrafo e os
deslocamentos deixam de bater: o app procura o trecho transcrito no bloco, e,
quando não acha, marca o comentário como flutuante, mostrando-o no topo do
bloco com aviso de que o texto original mudou. Comentário flutuante nunca some
e nunca aponta para o lugar errado em silêncio.

Todo comentário nasce como tarefa. Não existe comentário decorativo: se o
orientador quer registrar elogio ou nota sem cobrança, marca a caixa "sem
tarefa" e o registro fica como nota do bloco, fora do backlog e fora do gráfico.

### 5.5 O backlog do orientando

Cada comentário com tarefa entra no backlog do autor com estado `aberta`,
carregando o texto do comentário, a âncora, o autor da observação e a data. O
backlog é uma lista de trabalho, com filtro por capítulo, por estado, por autor
da observação e por idade. Abrir uma tarefa leva ao bloco, com o trecho
destacado.

A implementação de estados está testada em `src/domain/backlog.mjs`:

```
aberta ─(autor)→ em_atendimento ─(autor)→ em_revisao ─(orientador|autor)→ validada
   │                     │                      │                              │
   └─(orientador|autor)→ recusada ←─────────────┘                    (orientador|autor)
                             │                                                 ↓
                     (orientador)→ aberta                                  arquivada
```

Recusa exige motivo, e o teste `recusa_sem_motivo_e_rejeitada` garante que a
recusa em branco não passa. Reabertura de tarefa recusada é privilégio do
orientador, porque recusar e reabrir pelo próprio autor esvaziaria a função de
controle.

### 5.6 Ciclo de otimização visível

Toda passagem de estado grava uma entrada em `ciclo`, com estado, quem, quando
e nota. O orientador abre qualquer tarefa e lê a história completa: quando foi
aberta, quando o orientando pegou, quando devolveu para revisão, quantas vezes
voltou, com que justificativa, e o que ficou ao final. O teste
`ciclo_de_otimizacao_registra_toda_passagem_de_estado` fixa esse
comportamento.

Ao lado da história de estados, a tarefa mostra a evolução do próprio texto: as
versões do bloco ancorado que foram gravadas entre a abertura e o estado atual,
com diferença destacada. É aqui que a janela de cinco versões do §3.2 encontra o
módulo de orientação, e é o motivo pelo qual a janela é por entidade. O
orientador vê o que mudou no parágrafo que ele apontou, não um diff do projeto
inteiro.

Quando o número de versões do bloco no período excede a janela, o painel diz
isso com as palavras exatas: existem alterações anteriores que não estão mais
no histórico. Prometer histórico completo em uma janela de cinco seria mentir
para quem confia no registro.

### 5.7 Validação e arquivamento

Somente `orientador` e `autor` movem tarefa para `validada` e de `validada`
para `arquivada`. Leitor não move, e a interface do leitor não desenha o botão,
porque pergunta ao domínio quais transições existem para o seu papel e recebe
lista vazia. Os testes `somente_orientador_ou_orientado_arquivam_tarefa_validada`
e `leitor_nao_valida_nem_arquiva_tarefa` cobrem os dois lados.

Arquivar não apaga: a tarefa sai da lista ativa e permanece consultável no
filtro de arquivadas, com o ciclo completo, e continua contando como realizada
no gráfico. O trabalho feito não desaparece do registro quando sai da tela.

### 5.8 Gráfico de realizadas e pendentes

Um gráfico, presente nas duas views, alimentado por `resumoBacklog`, que devolve
pendentes, realizadas, recusadas, total e percentual. Pendentes são as tarefas
em `aberta`, `em_atendimento` e `em_revisao`; realizadas são `validada` e
`arquivada`; recusadas contam à parte, porque somá-las às realizadas inflaria o
progresso com trabalho que não foi feito.

Composição, seguindo as regras de data storytelling do §13 da v2.0, que
continuam valendo: título que é afirmação, do tipo "18 de 27 apontamentos
atendidos, 4 esperando sua revisão", e não "Status das tarefas"; barra empilhada
única para a proporção, com acento terra apenas nas pendentes, que são a
pergunta do usuário; ao lado, série temporal de realizadas por semana, com
anotação nos eventos de reunião e nas entregas, porque a inflexão só significa
alguma coisa quando se sabe o que aconteceu naquela semana; estado vazio digno
quando não há tarefa; alternativa textual sempre presente, que também é a versão
lida por leitor de tela.

O componente é o mesmo `GraficoNarrado` da v2.0, que exige por construção os
props `afirmacao`, `destaque` e `anotacoes`, de modo que o checklist seja
estrutural e não opcional.

### 5.9 Listagem descritiva rolável

Nas duas views, autor e orientador, as tarefas aparecem como lista vertical
rolável, cada item descritivo e autossuficiente, sem quadro kanban e sem
colunas. A ordem vem de `listarParaRolagem`, que põe no topo o que espera
decisão humana, na ordem `em_revisao`, `aberta`, `em_atendimento`, `recusada`,
`validada`, `arquivada`, e desempata pela data de criação. O teste
`listagem_rolavel_traz_o_que_espera_decisao_no_topo` fixa a regra.

Cada item traz, na mesma superfície: capítulo e número do bloco, trecho
ancorado em citação curta, texto do comentário, autor da observação e data,
estado atual com a idade nesse estado, quantidade de idas e voltas no ciclo, e
as ações permitidas para o papel de quem lê. Rolagem virtualizada a partir de
duzentos itens, para que projeto longo não trave, e busca por texto do
comentário no topo da lista.

### 5.10 Convite, revogação e limites

O autor convida por e-mail, escolhendo o papel. O convite tem validade, é
revogável a qualquer momento, e a revogação corta o acesso na hora, inclusive
de sessão aberta. O autor vê quem acessou e quando. Um projeto aceita mais de um
orientador e mais de um leitor, o que cobre coorientação e banca. Nenhum
convidado convida outro.

### 5.11 O que fica de fora, e por quê

Edição simultânea do mesmo bloco por autor e orientador não entra, pelo motivo
já registrado na v1.0: CRDT custa caro e a dor é pequena no fluxo de monografia
individual, além de contrariar a regra de autoria do §4. Chat livre entre autor
e orientador não entra: a conversa vive ancorada na tarefa, que é onde ela
continua tendo sentido daqui a três meses.

---

## 6. Modelo de dados, incrementos da v3

As entidades da v2.0 permanecem. Os incrementos:

```
Versionado<T>  { atual: T, versoes: [{estado, quem, quando}] (máx. 5),
                 removido, removidoEm }

Fonte          + estadoLeitura: primaria|secundaria|identificada
               + doi, isbn, issn, urlArquivada, retratada: bool, verificadoEm
               + campos estruturados da planilha: autorNome, autorSobrenome,
                 titulo, edicao, cidade, editora, ano
Citacao        + textoLimpo (sem aspas, como a planilha instrui), pagina,
                 tipo: direta|indireta, blocosOndeUsada[]
Comentario     { id, projetoId, blocoId, ancora{inicio, fim, transcricao},
                 texto, autorId, papelAutor, criadoEm, flutuante: bool,
                 geraTarefa: bool }
Tarefa         { id, comentarioId, blocoId, ancora, estado, motivoRecusa,
                 criadaEm, atualizadaEm, ciclo[{estado, quem, quando, nota}] }
Convite        { id, projetoId, email, papel, expiraEm, revogadoEm, aceitoEm }
Reuniao        + tarefasVinculadas[], ata, decisoes[]
DiarioPesquisa { id, projetoId, data, texto, decisaoMetodologica: bool,
                 blocosRelacionados[] }
Rastro         { id, projetoId, perguntaPesquisa, objetivo, blocoId,
                 evidencias[] }   // matriz do §7.3
Sigla          { id, projetoId, sigla, significado, primeiraOcorrenciaBlocoId }
TermoGlossario { id, projetoId, termo, definicao, fonteId? }
AuditoriaIA    { id, blocoId, modelo, skillId, vozId, promptHash, geradoEm,
                 editadoPorHumanoEm, trechoGerado, trechoFinal }
```

Toda entidade acima que o usuário edita é armazenada dentro de `Versionado<T>`,
conforme §3.1. O XML de intercâmbio ganha os nós `<comentarios>`, `<tarefas>`,
`<versoes>` e `<auditoria>`, e o atributo de versão do formato sobe para `3.0`,
com importador tolerante às versões `1.0` e `2.0`, migrando por adaptador.

---

## 7. Catálogo completo de features

Todas as features das versões anteriores permanecem, e nenhuma foi removida. As
tabelas abaixo são o inventário fechado, para conferência item a item.

### 7.1 Fichamento e acervo (herdado, integral)

| # | Feature | Fase |
|---|---|---|
| 1 | quatro tipos de ficha: texto, bibliográfico, citação, fichão | 1 |
| 2 | limites de caracteres por tipo, com contador e bloqueio | 1 |
| 3 | ficha como tabela de linhas contínuas, uma ou duas por A4, nunca dividida | 1 |
| 4 | tags coloridas, cor de texto e de fundo editáveis, linha vazia quando não houver | 1 |
| 5 | catálogo de citações com página, texto limpo, aspas na apresentação | 1 |
| 6 | referência montada por campos estruturados, texto ABNT derivado | 1 |
| 7 | capa da obra em png ou jpeg, visualização em lista e em grade | 1 |
| 8 | busca e filtro por tema, palavra-chave, obra, autor e tag | 1 |
| 9 | fila de impressão por arrastar, modos reordenar e trocar | 1 |
| 10 | impressão individual, do conjunto selecionado ou de tudo | 1 |
| 11 | exportação PDF, DOCX, LaTeX para Overleaf e PNG 4K de ficha individual | 1 |
| 12 | export e import do projeto em XML e zip com manifesto e hash | 1 |
| 13 | diálogo de saída perguntando salvar ou descartar | 1 |
| 14 | trechos importantes por fonte, com link clicável ao original | 1 |
| 15 | importação BibTeX, RIS e Zotero, sem duplicar DOI existente | 2 |
| 16 | backup local automático do zip por File System Access API | 2 |

### 7.2 Cofre, monografia, agentes e SaaS (herdado, integral)

| # | Feature | Fase |
|---|---|---|
| 17 | OAuth PKCE Google, escopo `drive.file`, degradação para modo local | 2 |
| 18 | estrutura de pastas no Drive do usuário, versões imutáveis | 2 |
| 19 | autosave configurável, padrão dez minutos | 2 |
| 20 | link clicável para o arquivo original no Drive | 2 |
| 21 | compartilhamento nativo do Drive da pasta do projeto | 2 |
| 22 | exportação para Google Docs por conversão do DOCX | 2 |
| 23 | agenda e monitor de reuniões com Google Meet, alerta global | 2 |
| 24 | blocos por arrastar, cinco níveis, numeração automática | 3 |
| 25 | editor rico por bloco, imagens com legenda, citação inline | 3 |
| 26 | tabelas por CSV, xlsx e link de Google Sheets | 3 |
| 27 | figura e legenda indivisíveis, com auto-ajuste que não reduz legenda | 3 |
| 28 | pré-textuais por formulário | 3 |
| 29 | sumário, lista de figuras, lista de tabelas e referências gerados | 3 |
| 30 | botão aplicar ABNT com preset versionado e preset derivado do usuário | 3 |
| 31 | pergunta pré-export entre distribuição digital e impressão física | 3 |
| 32 | preview fiel scrollável no mesmo motor do PDF | 3 |
| 33 | templates de TCC, monografia, dissertação, tese e artigo | 3 |
| 34 | contagem e metas de escrita com série histórica | 3 |
| 35 | alt-text obrigatório em figura | 3 |
| 36 | painel de progresso com gráficos narrados | 3 |
| 37 | mapa de encadeamento lógico versionado, com export Mermaid e drawio | 3 e 4 |
| 38 | aba de agentes com chave por sessão, nunca persistida em claro | 4 |
| 39 | guardrails fixos injetados em todo prompt, verificados no CI | 4 |
| 40 | formulário de voz do usuário, injetado em toda produção textual | 4 |
| 41 | skill de escrita selecionável, que substitui só a camada de estilo | 4 |
| 42 | correção, encadeamento lógico e detecção de salto, como anotação ancorada | 4 |
| 43 | recomendação de modelo por tarefa e estimativa de custo | 4 |
| 44 | alternativa de gerar script local em vez de gastar token | 4 |
| 45 | verificador de coincidência textual local por shingling | 4 |
| 46 | trilha de auditoria da escrita assistida e declaração de uso de IA | 4 |
| 47 | servidor MCP com oito ferramentas, `propor_edicao_bloco` sem gravar | 4 |
| 48 | front estático mantido, sem migração de framework, domínio intacto | 5 |
| 49 | Supabase com auth, RLS por usuário e storage, consultado do navegador | 5 |
| 50 | planos, cobrança por Asaas com Stripe atrás da porta, webhooks idempotentes | 5 |
| 51 | LGPD: consentimento, exclusão de conta, exportação de dados, DPA modelo | 5 |
| 52 | MCP hospedado com OAuth por usuário e limite por plano | 5 |
| 53 | telemetria sem conteúdo do usuário | 5 |
| 54 | templates de universidade e periódico como pacote versionado | 5 |
| 55 | extrator de template por exemplos, com conferência humana campo a campo | 5 |
| 56 | pesquisa de normas de periódico, com transcrição e link, sem analogia | 5 |
| 57 | modo defesa, deck a partir dos blocos marcados | 5 |
| 58 | conformidade PDF/A e PDF acessível | 5 |

### 7.3 Novo nesta versão: orientação e ciclo de trabalho

| # | Feature | Fase |
|---|---|---|
| 59 | versionamento universal com janela de cinco e restauração | 1 |
| 60 | lixeira com remoção reversível e expurgo explícito | 1 |
| 61 | painel de histórico por entidade, com comparação lado a lado | 1 |
| 62 | aviso de qual versão sairá da janela na próxima gravação | 1 |
| 63 | notas ancoradas e backlog em modo solo, criados pelo próprio autor | 3 |
| 64 | gráfico de realizadas e pendentes, narrado | 3 |
| 65 | listagem descritiva rolável ordenada por espera de decisão | 3 |
| 66 | convite de orientador e leitor, com revogação imediata | 5 |
| 67 | view do orientador sem qualquer rota de agente | 5 |
| 68 | comentário ancorado com transcrição e reancoragem, marcado flutuante quando o texto muda | 5 |
| 69 | ciclo de otimização por tarefa, com histórico de estados e de versões do bloco | 5 |
| 70 | validação e arquivamento restritos a orientador e autor | 5 |
| 71 | relatório de progresso em PDF para reunião de orientação | 5 |
| 72 | ata de reunião vinculada a tarefas e decisões | 5 |
| 73 | registro de acesso do convidado, visível ao autor | 5 |

### 7.4 Novo nesta versão: ciclo de vida acadêmico

| # | Feature | Por que importa | Fase |
|---|---|---|---|
| 74 | busca de referência por DOI, ISBN e OpenAlex, preenchendo campos | redigitar referência é o primeiro motivo de abandono | 2 |
| 75 | deduplicação de fontes por DOI e título normalizado | acervo importado sempre duplica | 2 |
| 76 | verificação de link morto e arquivamento em Wayback | URL citada que morreu é erro de banca | 2 |
| 77 | estado de leitura por fonte: primária, secundária, identificada | separa o que sustenta afirmação do que só foi visto | 2 |
| 78 | alerta de retratação por consulta ao Crossref | citar artigo retratado é falha grave e evitável | 2 |
| 79 | leitor de PDF embutido, destaque vira ficha de citação com página | fecha o ciclo ler, marcar, fichar sem sair do app | 2 |
| 80 | matriz de rastreabilidade pergunta, objetivo, capítulo, evidência | é a tabela que a banca pede e ninguém tem pronta | 3 |
| 81 | diário de pesquisa com marcação de decisão metodológica | metodologia se escreve do diário, não da memória | 3 |
| 82 | lista de siglas e glossário gerados do texto, com primeira ocorrência | exigidos por muitos regulamentos e sempre feitos à mão | 3 |
| 83 | ficha catalográfica, folha de aprovação e errata como pré-textuais | faltavam no inventário e são exigidos no depósito | 3 |
| 84 | verificador ABNT pré-export, com lista clicável de violações | erro de norma achado na véspera custa caro | 3 |
| 85 | referência não citada e citação órfã, os dois sentidos | a lista de referências precisa fechar dos dois lados | 3 |
| 86 | paleta de comandos e atalhos de teclado | escrita longa exige mão no teclado | 3 |
| 87 | modo foco, com contagem de sessão e sem interface acessória | retenção e produtividade real | 3 |
| 88 | PWA instalável com uso offline completo | local-first só é verdade se instalar e abrir sem rede | 3 |
| 89 | checklist de submissão por instituição ou periódico | cada destino tem lista própria e ela vira tarefa | 5 |
| 90 | carta de submissão e metadados Dublin Core para repositório | último passo do ciclo, hoje feito no escuro | 5 |
| 91 | exportação do pacote de dados de pesquisa com README | ciência aberta passou a ser exigência de financiador | 5 |
| 92 | linha do tempo do projeto com marcos de qualificação e defesa | o calendário acadêmico governa o trabalho | 3 |
| 93 | comparador de versões do documento inteiro entre dois pontos | o orientador pergunta o que mudou desde a última reunião | 5 |
| 94 | exportação da lista de tarefas em PDF para a reunião | reunião de orientação funciona com papel na mesa | 3 |
| 95 | modelo de resposta ao parecer da banca, com tarefas geradas do parecer | a defesa gera backlog e ele hoje se perde | 5 |
| 96 | cronômetro de apresentação e notas de defesa no modo defesa | complementa o item 57 sem custo relevante | 5 |

### 7.5 Novo na v4: operação da arquitetura sem servidor

| # | Feature | Por que existe | Fase |
|---|---|---|---|
| 97 | ping de atividade agendado contra o banco, para impedir a pausa por inatividade do plano gratuito | projeto gratuito sem requisição por sete dias é pausado e só volta manualmente; ver §12 | 5 |
| 98 | exportação periódica do índice do banco para o Drive do autor, servindo de backup próprio | o plano gratuito não tem backup baixável nem recuperação a ponto no tempo | 5 |
| 99 | monitor de cota e de estado do projeto, com alerta antes do teto e ao detectar pausa | os tetos do gratuito falham desligando o serviço, e falha silenciosa é a pior espécie | 5 |

---

## 8. As cinco fases

A alocação segue uma regra: o que depende de identidade multiusuário vai para a
Fase 5, e o que pode ser provado sem identidade vem antes. O módulo de
orientação obedece a isso sem perder cedo o que importa, porque as suas partes
difíceis, que são a máquina de estados, o ciclo e o gráfico, já estão testadas e
entram na Fase 3 em modo solo, com o próprio autor criando apontamentos para si.
A Fase 5 acrescenta o convite, o papel e a política de acesso, que é a parte que
exige backend.

### Fase 1 — Fundação, versionamento e fichamento local-first (4 a 5 semanas)

Ordem de implementação:

1. Repositório no GitHub, proteção de `main`, hook de commit, CI com a bateria
   de domínio já verde no primeiro push (§11).
2. Domínio: entidades, limites, validadores, formatador NBR 6023, e os quatro
   módulos já testados portados para TypeScript sem mudança de comportamento,
   com os mesmos testes convertidos para Vitest.
3. `Versionado<T>`, lixeira e repositórios Dexie, com migração numerada.
4. CRUD completo de fonte, ficha nos quatro tipos, tag e citação, cada um com
   histórico, remoção reversível e restauração.
5. Busca, filtro, lista e grade.
6. Fila de impressão por arrastar, nos dois modos.
7. Exportadores PDF, DOCX, LaTeX e PNG 4K.
8. XML e zip do projeto, com manifesto e hash.
9. Diálogo de saída, design system warm terra, responsividade sem sobreposição.

Definition of Done: importar o zip exportado reproduz o projeto com XML
idêntico; nenhuma ficha dividida em duzentas fichas de tamanho aleatório,
verificado por contagem de retângulos por página no PDF gerado; toda entidade
tem histórico funcional, com a sexta edição descartando a mais antiga, provado
em teste de integração sobre o banco e não apenas em memória; nada some da
lixeira sem expurgo explícito; Lighthouse igual ou acima de 90 em desempenho e
acessibilidade.

Bateria: os 20 testes de domínio já existentes, convertidos e mantidos; golden
de doze referências NBR 6023; round-trip de XML; property test de movimento de
blocos com fast-check; E2E de criar fonte, ficha, tag, filtrar, ordenar e
exportar; teste de arquitetura que reprova import de Dexie dentro de `ui/`.

### Fase 2 — Cofre, acervo e ingestão (3 a 4 semanas)

Escopo: itens 15 a 23 e 74 a 79 do catálogo. OAuth e Drive; autosave com
comparação por hash, para não gastar janela de versão à toa; importação
BibTeX, RIS e Zotero; busca por DOI, ISBN e OpenAlex; deduplicação; verificação
de link e arquivamento; estado de leitura; alerta de retratação; leitor de PDF
com destaque que vira ficha; backup local; agenda e monitor de reuniões.

Definition of Done: revogar o token no painel do Google e reabrir degrada para
local sem perda; duas máquinas com o mesmo Drive convergem por última escrita,
com aviso de conflito listando as duas versões e nunca sobrescrita silenciosa;
importar um `.bib` de cinquenta entradas cria cinquenta fontes sem duplicar DOI
existente; destaque no leitor de PDF gera ficha com a página correta em bateria
de dez documentos; recusar o escopo de calendário não degrada nenhuma outra
função.

### Fase 3 — Construtor ABNT, progresso e orientação em modo solo (6 a 7 semanas)

Escopo: itens 24 a 37, 63 a 65, 80 a 88, 92 e 94.

A ordem interna importa. Primeiro o construtor de blocos e o preview, porque
tudo depende deles. Depois pré-textuais, sumário, listas e referências. Depois o
verificador ABNT e os dois sentidos da checagem de citação, porque eles definem
o que bloqueia export. Só então o painel de progresso, as notas ancoradas, o
backlog em modo solo, o gráfico e a listagem rolável, que já usam código
testado. Por último a matriz de rastreabilidade, o diário, o glossário e as
listas de siglas, que são derivações do que já existe.

Definition of Done: projeto de sessenta páginas com doze figuras, oito tabelas e
quarenta citações exporta PDF e DOCX com sumário, listas e referências
consistentes entre si; nenhuma figura separada da legenda; numeração sobrevive
a cinquenta movimentos aleatórios; figura sem alt-text bloqueia export com lista
clicável; citação órfã e referência não citada bloqueiam export com lista
clicável; o gráfico de tarefas passa no checklist de storytelling verificado por
teste de componente; a listagem rolável mantém sessenta quadros por segundo com
quinhentas tarefas.

### Fase 4 — Escrita assistida, integridade e MCP (4 a 5 semanas)

Escopo: itens 38 a 47 e a metade assistida do 37.

Definition of Done: nenhuma chamada de agente sem guardrails, verificado por
teste que intercepta e valida o prompt montado, e por job dedicado no CI;
`propor_edicao_bloco` jamais grava sem confirmação humana; trocar a skill de
escrita muda o texto gerado nos testes de snapshot; o verificador de
coincidência acha todas as colagens plantadas no corpus de teste e não acusa
paráfrase legítima do mesmo corpus; toda geração assistida deixa linha na trilha
de auditoria, provado por teste de completude; a declaração de uso de IA é
gerada a partir da trilha, sem digitação.

### Fase 5 — Multiusuário, orientação completa e publicação (7 a 9 semanas)

Escopo: itens 48 a 58, 66 a 73, 89 a 91, 93, 95, 96 e os três novos, 97 a 99.

A fase encolheu uma semana em relação à v3.0 porque a migração de framework
saiu do escopo. O que entrou no lugar é menor: a operação da arquitetura sem
servidor, descrita na §12.

Ordem de implementação:

1. Projeto Supabase, esquema e **política de linha antes de qualquer tela**. A
   ordem não é negociável: sem servidor de aplicação, escrever tela antes de
   política significa rodar um período com o banco aberto.
2. Autenticação por e-mail e Google, consultada do navegador. A chave anônima
   vai no bundle, o que é o desenho previsto do Supabase, e por isso nenhuma
   linha do sistema pode depender de a chave ser secreta.
3. Sincronização: o repositório Dexie ganha um irmão em Supabase, atrás da mesma
   porta de armazenamento. O modo local continua funcionando para quem não criar
   conta, e é isso que preserva o Fichário Solo dentro do produto maior.
4. Convite, papéis e revogação.
5. View do orientador com rotas próprias, e a recusa vindo da política de linha
   somada ao roteador, nunca de ocultação visual.
6. Comentário ancorado com reancoragem, ciclo, validação e arquivamento.
7. Relatório de progresso, ata de reunião e registro de acesso.
8. Ping de atividade, backup próprio e monitor de cota, itens 97 a 99.
9. Planos e cobrança: Edge Function recebendo o webhook do Asaas, com tabela de
   eventos para idempotência. É o único código do produto que roda em servidor.
10. LGPD operacional, exclusão de conta e revogação de token.
11. Templates de instituição, extrator por exemplos, PDF/A, modo defesa e o
    pacote de submissão.

Definition of Done: teste de acesso cruzado contra instância real prova que o
usuário A jamais lê linha de B, e que o papel `orientador` recebe negativa do
banco, e não apenas ausência de botão; um cliente HTTP falando direto com a API
do Supabase, com a chave anônima e sem passar pela interface, não consegue ler
nem escrever nada além do que a política permite, e este teste é o que substitui
a camada de servidor que deixou de existir; revogar convite corta sessão aberta
em menos de um minuto; ciclo completo no ambiente de teste do Asaas, incluindo
assinar, falhar pagamento, reativar e cancelar, com webhook repetido não
aplicando duas vezes; o ping mantém o projeto ativo por trinta dias sem acesso
humano, verificado em execução real e não em teste unitário; o backup próprio
restaura um projeto em instância limpa; restauração de conta a partir apenas do
Drive do usuário; extrator de template reproduz margens de PDF de referência com
erro máximo de um milímetro em cinco documentos medidos à mão; template
comunitário não publica sem confirmação humana item a item; PDF/A validado por
verificador externo.

---

## 9. Conformidade ABNT e exportadores

Tudo o que a v2.0 estabeleceu continua: Paged.js como motor de PDF, com folha
`abnt.css`, margens de três, dois, dois e três centímetros, numeração a partir
do primeiro textual e `break-inside: avoid` em ficha, figura e tabela; DOCX com
estilos nomeados e campos de sumário nativos; LaTeX como fonte para Overleaf, e
nunca compilado no navegador; PNG apenas de ficha individual.

Acrescenta-se o verificador normativo pré-export, item 84, que roda sobre o
domínio e devolve lista clicável. Regras da primeira versão do verificador:
margem e corpo divergentes do preset; citação com mais de três linhas fora do
recuo de quatro centímetros e do corpo 10; citação sem página; figura sem
legenda, sem fonte ou sem alt-text; tabela sem título ou sem fonte; sumário
divergente da estrutura; referência não citada; citação órfã; sigla usada sem
constar da lista; pré-textual obrigatório ausente para o tipo de trabalho.

Sobre o estado normativo, e isto precisa ficar dito com precisão: as regras
acima estão implementadas a partir do que já era prática consolidada no projeto
e do preset versionado `abnt-2026.1.json`, e **não a partir de leitura em fonte
primária das NBR 14724, 10520, 6023, 6024, 6027, 6028 e 6034 nesta sessão**.
Antes de rotular o preset com o ano da norma, alguém precisa ler os textos
vigentes e conferir item a item. Enquanto isso não acontecer, o preset se chama
`abnt-2026.1` por convenção interna do projeto e a tela diz que é preset do
Fichário, não certificação de conformidade. Vender conformidade não verificada é
o tipo de promessa que a primeira banca desmente.

---

## 10. Riscos e decisões pendentes

| # | Risco ou decisão | Efeito | Dono |
|---|---|---|---|
| 1 | site do fichamento nunca linkado, pendência P-A | pode mudar campos antes do congelamento do XML no fim da Fase 1 | Diego |
| 2 | escopo `drive.file` | anexar PDF já existente no Drive exige o seletor do Google | decidido |
| 3 | obrigatoriedade do Drive antes de usar | adiada para a Fase 5; em teste, modo local com aviso | decidido |
| 4 | preset ABNT sem leitura primária das normas | §9; bloqueia rotular o preset com o ano da norma | Diego |
| 5 | limites de caracteres por geometria, não por fonte | valida antes da Fase 1 | Diego |
| 6 | janela de cinco versões pode engolir o estado de ontem | mitigado por gravar só com mudança de hash e por salvamento explícito; se for insuficiente, a alternativa é janela por dia, decisão de produto | Diego |
| 7 | resumo de reunião gerado por agente é conteúdo derivado | exige marca de gerado, sob a regra da trilha de auditoria | decidido |
| 8 | escopo de calendário amplia a superfície de consentimento LGPD | entra na revisão da Fase 5 | decidido |
| 9 | orientador sem permissão de edição | decisão de produto deliberada, §4; se a orientação real exigir edição, muda o modelo de autoria e precisa ser reavaliada antes da Fase 5 | Diego |
| 10 | reancoragem de comentário por transcrição | funciona bem em edição parcial e falha em reescrita total do bloco, caso em que o comentário fica flutuante por construção | decidido |
| 11 | pausa do projeto gratuito do Supabase por sete dias sem requisição | mitigada por ping agendado, item 97, que é paliativo declarado e não solução; o dia em que houver terceiro dependendo do sistema, o plano pago deixa de ser opcional | Diego |
| 12 | plano gratuito sem backup baixável nem recuperação a ponto no tempo | mitigado pelo backup próprio, item 98, que cobre o índice e não o instante exato da falha; monografia de mestrado sem backup do banco é risco que não se corre por 25 dólares | Diego |
| 13 | política de linha como barreira única, sem servidor de aplicação | eleva o teste de acesso cruzado a obrigatório e proíbe regra de autorização que exista só no React | decidido |

---

## 11. GitHub: repositório, fluxo e automação

### 11.1 Estrutura de pastas

```
fichario/
  .github/
    workflows/ci.yml
    ISSUE_TEMPLATE/{feature.md,defeito.md}
    pull_request_template.md
    CODEOWNERS
  .githooks/commit-msg
  docs/
    PLANEJAMENTO_FICHARIO_v3.md
    decisoes/ADR-0001-versionamento-cinco.md
  src/
    domain/          # puro, sem framework, testável em node
    application/     # casos de uso e portas
    infrastructure/  # dexie, drive, exportadores, agentes, pagamento
    ui/              # react, sem regra de negócio
  supabase/migrations/   # a partir da fase 5
  testes/
    dominio.test.mjs
    unit/ integracao/ e2e/ golden/
  guardrails.md
  package.json
```

### 11.2 Branches e proteção

`main` protegida, recebendo apenas por pull request com CI verde e uma
aprovação. `dev` como integração. `feat/<assunto>` para trabalho, `fix/<assunto>`
para correção, `docs/<assunto>` para documento. Rebase antes de abrir o pull
request, merge por squash, branch apagada depois.

### 11.3 Commits

Autor `Diego Cornelio`, mensagem em português no imperativo, primeira linha até
72 caracteres, corpo explicando o porquê quando a mudança não for óbvia. Nenhum
rodapé de ferramenta, nenhum `Co-authored-by`, nenhuma menção a geração
automática. O hook `.githooks/commit-msg` já entregue recusa o que fugir disso,
e é ativado com `git config core.hooksPath .githooks` logo no arranque.

### 11.4 Integração contínua

O arquivo `.github/workflows/ci.yml` já vem com três trabalhos. O primeiro roda
a bateria de domínio em Node puro, sem instalar dependência de aplicação, e é o
portão mais rápido. O segundo roda lint, checagem de tipos, testes unitários e
build. O terceiro verifica que `guardrails.md` existe e que nenhum prompt é
montado sem ele. A partir da Fase 3 entra o trabalho de Playwright nas pull
requests, com os testes visuais de quebra de página e de ausência de
sobreposição em 360, 768, 1024 e 1440 pixels. A partir da Fase 5, entra o job de
migração do Supabase, manual e com aprovação.

A publicação é feita no **Cloudflare Pages**, e não mais no Netlify ou no
Vercel. O motivo está registrado em `docs/MARCO_PUBLICACAO_V1.md`: requisição a
ativo estático não é medida ali, o Hobby do Vercel proíbe uso comercial, e o
plano gratuito do Netlify passou a operar com um pote único de créditos que se
esgota em poucas dezenas de publicações por mês. O fluxo de publicação, os
portões que precedem cada deploy e a configuração versionada em `wrangler.toml`,
`public/_redirects` e `public/_headers` estão no mesmo documento.

### 11.5 Releases e versão

Tag `vMAJOR.MINOR.PATCH` no repositório, com changelog gerado dos títulos de
pull request. Essa linha é independente do versionamento de conteúdo do projeto
do usuário, descrito na v2.0, e a documentação diz isso em uma frase para não
confundir quem lê o changelog procurando a versão da monografia.

### 11.6 Quadro de trabalho

Um projeto do GitHub com as cinco fases como marcos, e cada item do catálogo do
§7 como issue, com o número do catálogo no título, o que torna a rastreabilidade
verificável: nenhuma feature do inventário pode ficar sem issue, e a conferência
é uma consulta, não uma leitura.

### 11.7 Segredos

Nada de chave no repositório. Variáveis públicas com prefixo `VITE_` em
`.env.example`, documentadas. Chaves de agente nunca são persistidas, e a
partir da Fase 5, quando houver servidor, as credenciais ficam em segredo do
GitHub e do provedor de hospedagem, com rotação registrada.

### 11.8 Primeiro commit

O kit entregue junto deste documento já contém domínio testado, workflow, hook,
guardrails e este planejamento. O primeiro commit é ele, e o repositório nasce
com a bateria verde, o que atende a regra de não iniciar projeto crítico sem
código funcional testado na entrega.

---

## 12. Operação da arquitetura sem servidor

Três mecanismos sustentam o produto rodando no plano gratuito. Os três são
paliativos, e este documento os chama assim de propósito: paliativo bem
declarado é engenharia, paliativo esquecido vira incidente.

### 12.1 Ping de atividade, item 97

**O problema.** Projeto no plano gratuito do Supabase que fica sete dias sem
requisição ao banco é pausado, e volta apenas quando alguém entra no painel e
restaura manualmente. O dado sobrevive, o serviço não. Para um produto que um
orientador pode abrir em uma terça-feira qualquer, depois de duas semanas de
silêncio, isso é queda.

**O mecanismo.** Um Cron Trigger de Worker na Cloudflare, agendado a cada três
dias, faz uma requisição mínima contra uma tabela `saude` que existe só para
isso: uma linha, atualizada com o instante do ping. Três dias e não seis, porque
uma execução perdida não pode consumir a margem inteira; com três dias, duas
falhas seguidas ainda deixam o projeto de pé.

**O que ele não faz, e precisa estar escrito na tela de operação.** Não é
backup. Não impede o teto de egresso nem o de armazenamento, que falham de outra
forma. E ele mesmo falha em silêncio se a chave usada pelo Worker for revogada
ou se o Cron parar, que é justamente por que o item 99 existe: o monitor
verifica o instante do último ping e alerta quando ele envelhece além de quatro
dias.

**Quando aposentar.** No dia em que existir alguém que não é você dependendo do
sistema. O plano pago remove a pausa, traz backup e sai por 25 dólares por mês.
Manter a gambiarra além desse ponto é economizar no lugar errado.

### 12.2 Backup próprio, item 98

**O problema.** O plano gratuito não inclui backup baixável nem recuperação a
ponto no tempo. O conteúdo do usuário está no Drive dele, o que já é uma boa
posição, mas o índice, os comentários, as tarefas e o ciclo de orientação vivem
só no Postgres.

**O mecanismo.** Uma Edge Function agendada semanalmente monta, por usuário, o
mesmo pacote zip que o app já exporta, com `projeto.xml`, recursos e manifesto
com hash, e grava na pasta do projeto no Drive do próprio usuário. Nada de
formato novo: o backup é o artefato de intercâmbio que já existe e que já tem
importador testado, o que significa que restaurar é o caminho de importação
normal, exercitado toda semana em vez de exercitado no dia do desastre.

**O limite honesto.** A janela de perda é de até uma semana, e não do instante
da falha. Para orientação acadêmica isso é aceitável; para dado transacional não
seria.

### 12.3 Monitor de cota e de estado, item 99

Um painel de operação, visível só para o papel administrador, lendo os
contadores de uso e o instante do último ping. Ele alerta em dois momentos: aos
80 por cento de qualquer cota, e quando o ping envelhece além de quatro dias.
O motivo de existir é o modo de falha do plano gratuito, que não é lentidão nem
fatura, e sim desligamento. Falha que desliga precisa de aviso antes, porque
depois não há degradação para perceber.

### 12.4 Custo declarado

| Cenário | Front | Banco | Custo mensal |
|---|---|---|---|
| Fichário Solo, fases 1 a 4 | Cloudflare Pages | nenhum | zero, mais o domínio |
| Completo, uso próprio e orientandos | Cloudflare Pages | Supabase gratuito com os itens 97 a 99 | zero, mais o domínio |
| Completo, com terceiros dependendo | Cloudflare Pages | Supabase pago | 25 dólares |

Os números do plano gratuito, conferidos em 07/09/2026, são 500 MB de banco por
projeto, 50 mil usuários ativos por mês, 5 GB de egresso não cacheado mais 5 GB
cacheado, 1 GB de armazenamento e 500 mil invocações de Edge Function, com dois
projetos ativos e pausa após sete dias sem requisição. Plano gratuito muda sem
aviso, e a conferência antes de arquitetar em cima dos tetos é parte do trabalho
da Fase 5.

---

## 13. Como conferir esta entrega

1. `npm run teste:dominio` deve fechar em 20 testes verdes.
2. Cada linha do §0 deve ser localizável na seção indicada.
3. Cada item do catálogo do §7 deve virar issue antes do início da fase
   correspondente.
4. As pendências do §10 que têm o Diego como dono precisam de resposta antes do
   congelamento do XML, no fim da Fase 1, com exceção do item 9, que pode
   esperar até o início da Fase 5.
