# MARCO DE PUBLICAÇÃO v1 — Fichário Solo

Versão 2.0 · 2026-09-07 · companheiro de `PLANEJAMENTO_FICHARIO_v4.md` e
`PLANO_DE_TESTES.md`.

Mudou nesta versão: o segundo repositório também permanece estático, porque a
migração para Next.js saiu do plano; o §6 ganhou o que isso simplifica; e o §8
novo registra o custo dos dois produtos com a operação do §12 do planejamento.

Este documento fixa onde a construção para para ir ao ar, o que entra e o que
fica de fora desse primeiro produto, como o deploy no Cloudflare Pages é feito,
e como o segundo repositório nasce sem perder a história do primeiro.

---

## 1. A linha do corte, e por que ela não é o fim de uma fase

O corte não cai no fim da Fase 3 nem no fim da Fase 4. Ele cai em uma
propriedade técnica: **tudo que roda sem servidor entra; tudo que exige servidor
sai.** O Cloudflare Pages serve arquivos estáticos com banda não medida, e a
partir do momento em que existe uma Function o projeto passa a consumir a cota
de Workers, com 100 mil requisições por dia. O Fichário Solo é desenhado para
não ter nenhuma Function, e é isso que torna a hospedagem gratuita não apenas
possível, mas estável.

Essa linha é feliz por um motivo que já estava no plano desde a v1.0: a
arquitetura é local-first, o IndexedDB é o banco e o Drive do usuário é o cofre.
Um produto assim não precisa de backend para ser útil, e o que sobra do outro
lado da linha é exatamente o que precisa de identidade, política de acesso e
cobrança.

## 2. O que vai ao ar no v1

**Fase 1 inteira.** Fichamento nos quatro tipos, limites por tipo, tags, catálogo
de citações, busca e filtro, fila de impressão por arrastar, exportadores PDF,
DOCX, LaTeX e PNG 4K, XML e zip do projeto, janela de cinco versões, lixeira com
remoção reversível, design warm terra e responsividade.

**Fase 2, na parte que o navegador resolve sozinho.** OAuth PKCE do Google com
escopo `drive.file`, estrutura de pastas no Drive do usuário, autosave por hash,
link clicável para o original, compartilhamento nativo do Drive, exportação para
Google Docs, importação BibTeX e RIS, busca por DOI, deduplicação, estado de
leitura da fonte, backup local pela File System Access API, leitor de PDF com
destaque que vira ficha, agenda de reuniões pelo Calendar em modo leitura.

**Fase 3 inteira.** Construtor de blocos, editor por bloco, tabelas, figura com
legenda indivisível, pré-textuais por formulário, sumário e listas geradas,
referências, preset do Fichário, preview fiel, os cinco templates, contagem e
metas, verificador normativo pré-export, citação órfã e referência não citada,
lista de siglas e glossário, matriz de rastreabilidade, diário de pesquisa, mapa
de encadeamento lógico versionado, linha do tempo do projeto, PWA instalável com
uso offline, paleta de comandos e modo foco.

**Orientação em modo solo.** Notas ancoradas criadas pelo próprio autor, backlog
com a máquina de estados já testada, ciclo de otimização, gráfico narrado de
realizadas contra pendentes e a listagem descritiva rolável. Funciona sem
servidor porque o autor é o único usuário: o que falta no v1 é o convite, não o
mecanismo.

## 3. O que fica para o segundo repositório

**Fase 5 inteira**, por definição: identidade, papéis, convite do orientador,
view do orientador com rotas próprias, política por linha no banco, planos,
cobrança, LGPD operacional, MCP hospedado, templates de instituição, PDF/A, modo
defesa e o pacote de submissão.

**Fase 4, por recomendação e não por impossibilidade.** A aba de agentes roda
tecnicamente no navegador, com a chave do próprio usuário em memória. Três
razões para deixá-la fora do produto publicado: a chave passa a viver no
navegador de quem instalar, o que muda a superfície de risco de um app que até
aqui não guarda segredo nenhum; parte dos provedores exige cabeçalho específico
para aceitar chamada direta do navegador, o que amarra o produto a decisões de
terceiros que mudam sem aviso; e o suporte a custo, modelo e erro de API é
trabalho de produto que não ajuda o objetivo deste marco, que é ter o
fichamento e a monografia funcionando na mão de alguém.

Se você quiser o contrário, o caminho existe e é barato: manter a Fase 4 atrás
de uma bandeira de compilação desligada por padrão, publicar o v1 sem ela e
ligá-la no segundo repositório. Diga qual dos dois, porque isso muda a ordem de
construção e nada mais.

## 4. Portões para declarar o v1 pronto

Nenhum deles é opinião, todos são comando que roda.

| # | Portão | Comando |
|---|---|---|
| 1 | especificação sem vermelho | `npm run tdd` |
| 2 | especificação das fases 1 a 3 sem pendência | `npm run tdd:fechar-fase` com as suítes do escopo |
| 3 | nenhuma feature do escopo sem teste | `npm run cobertura` |
| 4 | fim a fim sem `fixme` nas suítes 01 e 02 | `npx playwright test testes/e2e/01 testes/e2e/02` |
| 5 | build limpo | `npm run build` |
| 6 | desempenho e acessibilidade | Lighthouse ≥ 90 no domínio publicado |
| 7 | ida e volta real | exportar zip, limpar o navegador, importar, conferir projeto idêntico |
| 8 | offline real | instalar como PWA, desligar a rede, abrir, editar, exportar |

O portão 7 e o portão 8 são os que provam a promessa central do produto, e
nenhum dos dois é automatizável ao ponto de dispensar você fazendo à mão uma
vez, antes de anunciar.

## 5. Deploy no Cloudflare Pages

### 5.1 Configuração do projeto

No painel, criar projeto conectado ao repositório do GitHub, com build
`npm run build`, diretório de saída `dist` e a versão do Node em variável de
ambiente. A partir daí cada push em `main` publica produção e cada pull request
ganha uma prévia própria, sem custo.

O arquivo `wrangler.toml` deste repositório declara o diretório de saída, o que
mantém a configuração versionada em vez de existir apenas no painel.

### 5.2 Os dois arquivos que evitam o erro mais comum

`public/_redirects` devolve `index.html` para qualquer rota, porque uma SPA sem
essa regra funciona na navegação interna e devolve 404 quando alguém recarrega a
página em `/monografia`. `public/_headers` aplica os cabeçalhos de segurança e a
política de cache: hash nos ativos permite cache longo, o HTML nunca é cacheado.

### 5.3 Domínio e OAuth do Google

Aqui está a única armadilha real deste marco. O Google valida os domínios do
cliente OAuth contra o Public Suffix List, e pede verificação de propriedade do
domínio privado de topo usado nas origens JavaScript e nos URIs de redirecionamento.
`pages.dev` está no Public Suffix List, o que faz de `fichario.pages.dev` um
domínio próprio para efeito dessa regra, verificável no Search Console pelo
arquivo servido no próprio site.

Mesmo assim, a recomendação é apontar um domínio seu desde o primeiro deploy, e
registrar a origem OAuth apenas nele. Motivos: o endereço `pages.dev` muda se o
projeto for renomeado, prévias de pull request têm subdomínio diferente a cada
deploy e não servem como origem estável, e o consentimento do Google exibindo o
domínio da Struktur diz ao usuário quem está pedindo acesso ao Drive dele.

Ordem de execução: publicar no `pages.dev`, apontar o domínio, verificar no
Search Console, criar o cliente OAuth com a origem do domínio próprio, e só
então ligar a Fase 2 em produção. Até esse ponto o app funciona em modo local
com aviso persistente, que é o comportamento já especificado.

### 5.4 Tela de consentimento e escopo sensível

`drive.file` é escopo restrito ao que o app cria, e é o que evita a auditoria
cara do escopo amplo. Ainda assim a tela de consentimento pode exibir o aviso de
aplicativo não verificado enquanto a verificação não sair. Para uso próprio e
para os primeiros orientandos isso é aceitável e o aviso é contornável pelo
próprio usuário; para publicar de verdade, a verificação precisa entrar no
backlog do segundo repositório, junto com política de privacidade e termos, que
o Google exige nessa etapa.

## 6. Os dois repositórios

### 6.1 Como o segundo nasce

Não use o botão de fork do GitHub. Fork amarra o repositório novo ao original
para sempre na interface, dificulta torná-lo privado e mistura as duas linhas de
issues. Clone espelhado e empurre para um repositório novo:

```bash
git clone --mirror git@github.com:<usuario>/fichario.git
cd fichario.git
git remote set-url --push origin git@github.com:<usuario>/fichario-saas.git
git push --mirror
```

A história inteira vai junto, e a tag `v1.0.0-solo` marca o ponto exato de
divergência nos dois lados.

### 6.2 O que fazer antes de clonar

Três coisas, e elas custam uma tarde agora contra semanas depois.

Primeiro, criar a tag `v1.0.0-solo` no commit publicado, e publicar a release
com o zip do projeto de exemplo, para que exista um artefato reproduzível.

Segundo, extrair `src/domain` para um pacote versionado, publicado do primeiro
repositório. O domínio é o que os dois produtos compartilham, e é onde correção
de bug precisa valer para os dois. Sem isso, a correção da janela de cinco
versões terá que ser escrita duas vezes, e na terceira vez uma das duas ficará
para trás.

Terceiro, congelar a versão do formato XML em `3.0` e escrever o adaptador de
leitura no segundo repositório antes de qualquer mudança de esquema. O usuário
que exportar do Solo precisa conseguir importar no SaaS, e essa é a promessa que
transforma o primeiro produto em porta de entrada do segundo em vez de
concorrente dele.

### 6.3 Como a correção flui depois

Bug de domínio corrige no primeiro repositório, sobe versão do pacote, o segundo
atualiza a dependência. Bug de interface do Solo corrige no primeiro. Qualquer
coisa que envolva servidor vive apenas no segundo. A direção é sempre do Solo
para o SaaS, nunca o contrário, e quando alguma feature do SaaS quiser voltar,
ela volta pelo pacote de domínio ou não volta.

### 6.3.1 O que a arquitetura da v4.0 simplifica aqui

Com o front permanecendo estático nos dois repositórios, a divergência entre
eles deixa de ser de framework e passa a ser de dependência: o segundo
acrescenta o cliente do Supabase e as telas que dependem de conta, e nada mais.
Isso torna o pacote de domínio compartilhado do §6.2 mais fácil de manter, e
torna possível o caminho inverso quando fizer sentido, que é trazer para o Solo
uma tela nascida no SaaS, desde que ela não dependa de conta.

### 6.4 O primeiro repositório continua vivo

Ele não vira arquivo morto. Ele é o produto gratuito, o que roda offline, o que
o orientando instala sem criar conta, e o que sustenta a hipótese de que o
segundo produto tem demanda. Manter os dois é trabalho, e vale dizer isso com
todas as letras: se em algum momento a manutenção do Solo passar a atrasar o
SaaS, a decisão de congelar um deles precisa ser tomada de propósito, e não por
abandono silencioso.

## 7. Custo, nos dois estágios

| Estágio | Front | Banco | Custo mensal |
|---|---|---|---|
| Fichário Solo publicado | Cloudflare Pages | nenhum | zero, mais o domínio |
| SaaS com você e orientandos | Cloudflare Pages | Supabase gratuito com ping, backup próprio e monitor | zero, mais o domínio |
| SaaS com terceiros dependendo | Cloudflare Pages | Supabase pago | 25 dólares |

A passagem do segundo para o terceiro estágio não é decisão de orçamento, é
decisão de responsabilidade: o plano gratuito pausa por inatividade e não tem
backup baixável, e os paliativos do §12 do planejamento cobrem uso próprio, não
compromisso com terceiro.

## 8. O que este marco não entrega, dito na primeira pessoa do plural

Não entregamos o módulo de orientação com o orientador de verdade. O que vai ao
ar é o mecanismo inteiro operando com um usuário só, e a diferença entre isso e
o produto descrito no §5 do planejamento é o convite, o papel e a recusa do
backend, que sem servidor não existem.

Não entregamos conformidade ABNT verificada, pelo motivo já registrado no §9 do
planejamento: as normas não foram lidas em fonte primária. O preset se chama
preset do Fichário na tela, e continua assim até que sejam.

Não entregamos escrita assistida, pela decisão do §3 acima.
