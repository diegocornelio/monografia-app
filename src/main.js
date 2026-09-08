import './styles.css';
import { conferir } from './domain/abnt/coerencia.mjs';
import { formatar } from './domain/abnt/referencia.mjs';
import { extrairSiglas } from './domain/abnt/siglas.mjs';
import { verificar } from './domain/abnt/verificador.mjs';
import { avaliar } from './domain/acervo/dedup.mjs';
import { lerBibTeX } from './domain/acervo/importadores.mjs';
import { filtrar } from './domain/busca.mjs';
import { mascarar } from './domain/agente/credencial.mjs';
import { destinoCallbackAuth, destinoNovaSenha, protegerRota } from './domain/acesso/rotas.mjs';
import { apresentar, criarCitacao } from './domain/citacao.mjs';
import { criarFicha } from './domain/ficha.mjs';
import { validarLimite } from './domain/limites.mjs';
import { gerarListaFiguras, gerarListaTabelas, gerarSumario } from './domain/monografia/listas.mjs';
import { contarPalavras, progresso } from './domain/monografia/metas.mjs';
import { criarRastro } from './domain/monografia/rastro.mjs';
import {
  adicionarCitacao,
  adicionarFicha,
  adicionarFigura,
  adicionarSecao,
  adicionarTabela,
  adicionarTag,
  atualizarCitacao,
  atualizarFicha,
  atualizarFigura,
  atualizarTag,
  atualizarTabela,
  atualizarTextoSecao,
  exportarProjeto,
  importarProjeto,
  inserirCitacaoNaSecao,
  moverFicha,
  moverSecao,
  removerCitacao,
  removerFicha,
  removerFigura,
  removerSecao,
  removerTag,
  removerTabela,
} from './domain/projeto.mjs';
import { criarTarefa, moverTarefa, resumoBacklog } from './domain/backlog.mjs';
import { criarTag, linhaDeTags } from './domain/tag.mjs';
import {
  atualizarSenha,
  cadastrarComSenha,
  entrarComGoogle,
  entrarComSenha,
  obterUsuarioAtual,
  recuperarSenha,
  sair,
  supabase,
  supabaseConfigurado,
} from './infrastructure/supabase/cliente.mjs';
import { montar as montarGrafico } from './ui/graficos/GraficoNarrado.mjs';

const CHAVE_ESTADO = 'fichario.estado.v1';
let filtroAtual = '';
let chaveAgenteSessao = null;
let auth = { usuario: null, carregando: true, mensagem: '' };

const estadoInicial = {
  fonte: {
    id: 'f01',
    tipoFonte: 'livro',
    autorSobrenome: 'ECO',
    autorNome: 'Umberto',
    titulo: 'Como se faz uma tese em Ciencias Humanas',
    edicao: 6,
    cidade: 'Lisboa',
    editora: 'Editorial Presenca',
    ano: 1995,
  },
  fichas: [
    { id: 'ficha-1', ...criarFicha({ projetoId: 'p1', fonteId: 'f01', tipo: 'texto', assunto: 'Metodo cientifico', ordemImpressao: 1 }) },
  ],
  citacoes: [{ id: 'cit-1', ...criarCitacao({ fonteId: 'f01', texto: 'Trecho selecionado da obra', pagina: 43 }) }],
  tags: [criarTag({ texto: 'metodologia', corTexto: '#2B2B2B', corFundo: '#EFE6DA' })],
  monografia: {
    blocos: [
      { id: 'b1', nivel: 1, numero: '1', titulo: 'Introducao', tipo: 'textual', pagina: 11, texto: 'A Camara de Comercializacao de Energia Eletrica (CCEE) publica dados.' },
      { id: 'b2', nivel: 2, numero: '1.1', titulo: 'Problema', tipo: 'textual', pagina: 13, texto: 'O ambiente ACL cresce.' },
    ],
    figuras: [{ id: 'fig1', blocoId: 'b1', legenda: 'Fluxo de pesquisa', fonte: 'autor', altText: 'Fluxo de pesquisa', pagina: 12 }],
    tabelas: [{ id: 'tab1', blocoId: 'b2', titulo: 'Casos analisados', fonte: 'autor', pagina: 14 }],
    pretextuais: ['capa', 'folhaRosto', 'folhaAprovacao', 'resumo', 'abstract', 'sumario'],
    preset: { margens: [3, 2, 2, 3], corpo: 12, entrelinha: 1.5 },
    citacoes: [{ id: 'cit-1', fonteId: 'f01', linhas: 1, pagina: 43 }],
    referencias: [{ fonteId: 'f01' }],
  },
};

let estado = carregarEstado();

function desenhar(filtro = filtroAtual) {
  filtroAtual = filtro;
  if (!supabaseConfigurado) {
    desenharConfiguracaoSupabase();
    return;
  }
  if (auth.carregando) {
    desenharCarregandoAuth();
    return;
  }
  if (auth.usuario && ['/entrar', '/cadastrar', '/recuperar-senha', '/auth/callback'].includes(rotaAtual())) {
    navegarPara('/app');
  }
  if (['/entrar', '/cadastrar', '/recuperar-senha'].includes(rotaAtual())) {
    desenharEntrada(modoAuthDaRota());
    return;
  }
  if (rotaAtual() === '/nova-senha') {
    desenharNovaSenha();
    return;
  }
  if (rotaAtual() === '/auth/callback' && !auth.usuario) {
    const erroRetorno = erroAuthDaUrl();
    if (erroRetorno) {
      auth = { usuario: null, carregando: false, mensagem: erroRetorno };
      navegarPara('/entrar');
      desenharEntrada('entrar');
      return;
    }
    desenharCarregandoAuth();
    return;
  }
  const decisaoRota = protegerRota({ rota: rotaAtual(), usuario: auth.usuario });
  if (!decisaoRota.permitido) {
    desenharEntrada(modoAuthDaRota());
    return;
  }

  const acervo = estado.fichas.map((ficha) => ({
    ...ficha,
    autor: estado.fonte.autorSobrenome,
    obra: estado.fonte.titulo,
    tags: estado.tags.map((t) => t.texto),
  }));
  const fichas = filtrar(acervo, filtro ? { palavraChave: filtro } : {});
  const importadas = lerBibTeX('@book{eco1995,\n  author = {Umberto Eco},\n  title = {Como se faz uma tese em Ci{\\^e}ncias Humanas},\n  year = {1995}\n}');
  const duplicata = avaliar([estado.fonte], { doi: '10.1/abc', titulo: estado.fonte.titulo, ano: 1995 });
  const sumario = gerarSumario(estado.monografia);
  const figuras = gerarListaFiguras(estado.monografia);
  const tabelas = gerarListaTabelas(estado.monografia);
  const verificacao = verificar(estado.monografia);
  const siglas = extrairSiglas(estado.monografia.blocos);
  const coerencia = conferir({ citacoesNoTexto: estado.monografia.citacoes, referencias: estado.monografia.referencias });
  const palavras = contarPalavras({ type: 'doc', content: estado.monografia.blocos.map((b) => ({ type: 'paragraph', content: [{ type: 'text', text: b.texto }] })) });
  const meta = progresso({ escritas: palavras, meta: 1000 });
  const tarefa = moverTarefa({
    tarefa: moverTarefa({
      tarefa: criarTarefa({ id: 'T1', blocoId: 'b2', ancora: { transcricao: 'O ambiente ACL cresce.' }, comentario: 'delimitar melhor o problema', autor: 'diego', quando: '2026-09-01T00:00:00Z' }),
      para: 'em_atendimento',
      papel: 'orientado',
      quem: 'diego',
      quando: '2026-09-04T00:00:00Z',
    }),
    para: 'em_revisao',
    papel: 'orientado',
    quem: 'diego',
    quando: '2026-09-05T00:00:00Z',
  });
  const backlog = resumoBacklog([tarefa]);
  const grafico = montarGrafico({ dados: [backlog], afirmacao: `${backlog.realizadas} de ${backlog.total} tarefas realizadas`, destaque: 'pendentes', anotacoes: [] });
  const rastro = criarRastro({ perguntaPesquisa: 'Como registrar decisao?', objetivo: 'Descrever o mecanismo', blocoId: 'b2', evidencias: estado.monografia.citacoes.map((c) => c.id) });

  document.querySelector('#app').innerHTML = `
    <main class="app-shell">
      <section class="toolbar">
        <div>
          <p class="eyebrow">Fichario solo</p>
          <h1>Fichamento editavel</h1>
          <p class="muted">Sessao: ${escapeHtml(auth.usuario.email ?? auth.usuario.id)}</p>
        </div>
        <div class="toolbar-actions">
          <input id="busca" value="${escapeAttr(filtro)}" placeholder="Buscar assunto ou obra" />
          <button type="button" id="exportar">Baixar JSON</button>
          <label class="upload-button">
            Importar JSON
            <input id="importar" type="file" accept="application/json" />
          </label>
          <button type="button" id="recomecar">Recomecar</button>
          <button type="button" id="sair">Sair</button>
        </div>
      </section>

      <section class="grid">
        <article class="panel span-2">
          <h2>Fonte</h2>
          <p>${escapeHtml(formatar(estado.fonte))}</p>
        </article>

        <article class="panel">
          <h2>Nova ficha</h2>
          <form id="form-ficha" class="stack">
            <input name="assunto" placeholder="Assunto da ficha" required />
            <select name="tipo">
              <option value="texto">Texto</option>
              <option value="citacao">Citacao</option>
              <option value="bibliografico">Bibliografico</option>
              <option value="fichao">Fichao</option>
            </select>
            <button type="submit">Criar ficha</button>
          </form>
          <div class="lista">${fichas.map(cardFicha).join('')}</div>
        </article>

        <article class="panel">
          <h2>Nova citacao</h2>
          <form id="form-citacao" class="stack">
            <textarea name="texto" placeholder="Texto da citacao" required></textarea>
            <input name="pagina" placeholder="Pagina" required />
            <button type="submit">Criar citacao</button>
          </form>
          <div class="lista">${estado.citacoes.map(cardCitacao).join('')}</div>
        </article>

        <article class="panel">
          <h2>Tags</h2>
          <form id="form-tag" class="inline-form">
            <input name="texto" placeholder="Nova tag" required />
            <button type="submit">Adicionar</button>
          </form>
          <div class="tags">${linhaDeTags(estado.tags).tags.map(cardTag).join('')}</div>
        </article>

        <article class="panel">
          <h2>Acervo</h2>
          <p>${importadas.length} importacao BibTeX aceita</p>
          <p>${duplicata.duplicada ? 'duplicata sugerida para mescla' : 'sem duplicata'}</p>
        </article>

        <article class="panel span-2">
          <h2>Monografia</h2>
          <form id="form-bloco" class="section-form">
            <input name="titulo" placeholder="Titulo da nova secao" required />
            <textarea name="texto" placeholder="Texto inicial"></textarea>
            <button type="submit">Criar secao</button>
          </form>
          <div class="blocos">${estado.monografia.blocos.map(cardBloco).join('')}</div>
          <p class="muted">Sumario: ${sumario.map((s) => `${s.numero} ${s.titulo}`).join(' · ')}</p>
        </article>

        <article class="panel">
          <h2>Imagem</h2>
          <form id="form-figura" class="stack">
            ${selectBloco('blocoId')}
            <input name="legenda" placeholder="Legenda da figura" required />
            <input name="altText" placeholder="Texto alternativo" required />
            <button type="submit">Inserir imagem</button>
          </form>
          <div class="lista">${figuras.map(cardFigura).join('')}</div>
        </article>

        <article class="panel">
          <h2>Tabela</h2>
          <form id="form-tabela" class="stack">
            ${selectBloco('blocoId')}
            <input name="titulo" placeholder="Titulo da tabela" required />
            <button type="submit">Inserir tabela</button>
          </form>
          <div class="lista">${tabelas.map(cardTabela).join('')}</div>
        </article>

        <article class="panel">
          <h2>Verificador</h2>
          <p>${verificacao.podeExportar && coerencia.podeExportar ? 'exportacao liberada pelo preset do Fichario' : 'ha bloqueios de exportacao'}</p>
          <p>${siglas.map((s) => s.sigla).join(', ') || 'sem siglas novas'}</p>
        </article>

        <article class="panel">
          <h2>Progresso</h2>
          <p>${palavras} palavras · ${meta.percentual}% da meta curta</p>
          <p>${escapeHtml(grafico.alternativaTextual)}</p>
        </article>

        <article class="panel span-2">
          <h2>Orientacao solo</h2>
          <div class="ficha"><strong>Rastro</strong><span>${escapeHtml(rastro.objetivo)}</span><small>${rastro.evidencias.length} evidencia(s)</small></div>
        </article>

        <article class="panel span-2">
          <h2>Agente IA</h2>
          <form id="form-agente" class="section-form">
            <select name="provedor">
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
            </select>
            <input name="chave" type="password" placeholder="Chave da sessao" />
            <button type="submit">Usar nesta sessao</button>
          </form>
          <p>${chaveAgenteSessao ? `Chave ativa: ${escapeHtml(mascarar(chaveAgenteSessao.chave))}` : 'Sem chave ativa nesta sessao'}</p>
          <p class="muted">Fase 4 iniciada: agente pode propor anotacao, nunca aplicar texto sem confirmacao.</p>
        </article>
      </section>
    </main>
  `;

  conectarEventos();
}

function conectarEventos() {
  document.querySelector('#busca').addEventListener('input', (evento) => desenhar(evento.target.value));
  document.querySelector('#form-ficha').addEventListener('submit', criarNovaFicha);
  document.querySelector('#form-citacao').addEventListener('submit', criarNovaCitacao);
  document.querySelector('#form-tag').addEventListener('submit', criarNovaTag);
  document.querySelector('#form-bloco').addEventListener('submit', criarNovoBloco);
  document.querySelector('#form-figura').addEventListener('submit', criarNovaFigura);
  document.querySelector('#form-tabela').addEventListener('submit', criarNovaTabela);
  document.querySelector('#form-agente').addEventListener('submit', configurarAgente);
  document.querySelector('#exportar').addEventListener('click', baixarProjeto);
  document.querySelector('#importar').addEventListener('change', importarArquivo);
  document.querySelector('#recomecar').addEventListener('click', recomecarProjeto);
  document.querySelector('#sair').addEventListener('click', encerrarSessao);

  document.querySelectorAll('[data-subir]').forEach((botao) => botao.addEventListener('click', () => moverBloco(botao.dataset.subir, -1)));
  document.querySelectorAll('[data-descer]').forEach((botao) => botao.addEventListener('click', () => moverBloco(botao.dataset.descer, 1)));
  document.querySelectorAll('[data-ficha-subir]').forEach((botao) => botao.addEventListener('click', () => moverFichaNaFila(botao.dataset.fichaSubir, -1)));
  document.querySelectorAll('[data-ficha-descer]').forEach((botao) => botao.addEventListener('click', () => moverFichaNaFila(botao.dataset.fichaDescer, 1)));
  document.querySelectorAll('[data-ficha-remover]').forEach((botao) => botao.addEventListener('click', () => apagarFicha(botao.dataset.fichaRemover)));
  document.querySelectorAll('[data-citacao-remover]').forEach((botao) => botao.addEventListener('click', () => apagarCitacao(botao.dataset.citacaoRemover)));
  document.querySelectorAll('[data-bloco-remover]').forEach((botao) => botao.addEventListener('click', () => apagarBloco(botao.dataset.blocoRemover)));
  document.querySelectorAll('[data-figura-remover]').forEach((botao) => botao.addEventListener('click', () => apagarFigura(botao.dataset.figuraRemover)));
  document.querySelectorAll('[data-tabela-remover]').forEach((botao) => botao.addEventListener('click', () => apagarTabela(botao.dataset.tabelaRemover)));
  document.querySelectorAll('[data-tag-remover]').forEach((botao) => botao.addEventListener('click', () => apagarTag(botao.dataset.tagRemover)));
  document.querySelectorAll('[data-assunto-ficha]').forEach((campo) => {
    campo.addEventListener('change', () => editarFicha(campo.dataset.assuntoFicha, campo.value));
  });
  document.querySelectorAll('[data-texto-citacao]').forEach((campo) => {
    campo.addEventListener('change', () => editarCitacao(campo.dataset.textoCitacao));
  });
  document.querySelectorAll('[data-pagina-citacao]').forEach((campo) => {
    campo.addEventListener('change', () => editarCitacao(campo.dataset.paginaCitacao));
  });
  document.querySelectorAll('[data-legenda-figura], [data-alt-figura]').forEach((campo) => {
    const id = campo.dataset.legendaFigura ?? campo.dataset.altFigura;
    campo.addEventListener('change', () => editarFigura(id));
  });
  document.querySelectorAll('[data-titulo-tabela]').forEach((campo) => {
    campo.addEventListener('change', () => editarTabela(campo.dataset.tituloTabela));
  });
  document.querySelectorAll('[data-texto-tag]').forEach((campo) => {
    campo.addEventListener('change', () => editarTag(campo.dataset.textoTag, campo.value));
  });
  document.querySelectorAll('[data-texto-bloco]').forEach((campo) => {
    campo.addEventListener('change', () => atualizarTextoBloco(campo.dataset.textoBloco, campo.value));
    campo.addEventListener('dragover', (evento) => evento.preventDefault());
    campo.addEventListener('drop', (evento) => soltarCitacao(evento, campo.dataset.textoBloco));
  });
  document.querySelectorAll('[data-citacao]').forEach((cartao) => {
    cartao.addEventListener('dragstart', (evento) => evento.dataTransfer.setData('text/plain', cartao.dataset.citacao));
  });
}

function desenharConfiguracaoSupabase() {
  document.querySelector('#app').innerHTML = `
    <main class="auth-shell">
      <section class="auth-panel">
        <p class="eyebrow">Configuracao necessaria</p>
        <h1>Conecte o Supabase</h1>
        <p>Crie um arquivo .env com VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY para liberar entrada, cadastro e rotas protegidas.</p>
      </section>
    </main>
  `;
}

function desenharCarregandoAuth() {
  document.querySelector('#app').innerHTML = `
    <main class="auth-shell">
      <section class="auth-panel">
        <p class="eyebrow">Fichario solo</p>
        <h1>Validando sessao</h1>
        <p>Aguarde enquanto o Supabase confirma sua identidade.</p>
      </section>
    </main>
  `;
}

function desenharEntrada(modo = 'entrar') {
  const cadastro = modo === 'cadastrar';
  const recuperacao = modo === 'recuperar';
  document.querySelector('#app').innerHTML = `
    <main class="auth-shell">
      <section class="auth-panel">
        <p class="eyebrow">${recuperacao ? 'Recuperar acesso' : cadastro ? 'Criar acesso' : 'Acesso protegido'}</p>
        <h1>${recuperacao ? 'Recuperar senha' : cadastro ? 'Cadastrar' : 'Entrar'}</h1>
        <form id="form-auth" class="stack">
          <input name="email" type="email" autocomplete="email" placeholder="Email" required />
          ${
            recuperacao
              ? ''
              : `<input name="senha" type="password" autocomplete="${cadastro ? 'new-password' : 'current-password'}" placeholder="Senha" minlength="6" required />`
          }
          <button type="submit">${recuperacao ? 'Enviar recuperacao' : cadastro ? 'Criar conta' : 'Entrar'}</button>
        </form>
        ${
          recuperacao
            ? ''
            : `<button type="button" class="secondary-button" id="entrar-google">Entrar com Google</button>`
        }
        ${auth.mensagem ? `<p class="notice">${escapeHtml(auth.mensagem)}</p>` : ''}
        <div class="auth-links">
          <button type="button" class="link-button" id="trocar-auth">${cadastro || recuperacao ? 'Ja tenho conta' : 'Criar conta'}</button>
          ${cadastro || recuperacao ? '' : '<button type="button" class="link-button" id="recuperar-auth">Esqueci minha senha</button>'}
        </div>
      </section>
    </main>
  `;
  document.querySelector('#form-auth').addEventListener('submit', (evento) => enviarAuth(evento, modo));
  document.querySelector('#entrar-google')?.addEventListener('click', entrarGoogle);
  document.querySelector('#trocar-auth').addEventListener('click', () => navegarPara(cadastro || recuperacao ? '/entrar' : '/cadastrar'));
  document.querySelector('#recuperar-auth')?.addEventListener('click', () => navegarPara('/recuperar-senha'));
}

function desenharNovaSenha() {
  document.querySelector('#app').innerHTML = `
    <main class="auth-shell">
      <section class="auth-panel">
        <p class="eyebrow">Nova senha</p>
        <h1>Definir senha</h1>
        <form id="form-nova-senha" class="stack">
          <input name="senha" type="password" autocomplete="new-password" placeholder="Nova senha" minlength="6" required />
          <button type="submit">Salvar senha</button>
        </form>
        ${auth.mensagem ? `<p class="notice">${escapeHtml(auth.mensagem)}</p>` : ''}
      </section>
    </main>
  `;
  document.querySelector('#form-nova-senha').addEventListener('submit', salvarNovaSenha);
}

function criarNovaFicha(evento) {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(evento.target));
  setEstado(adicionarFicha(estado, { tipo: dados.tipo, assunto: dados.assunto }));
}

function criarNovaCitacao(evento) {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(evento.target));
  setEstado(adicionarCitacao(estado, { texto: dados.texto, pagina: dados.pagina }));
}

function criarNovaTag(evento) {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(evento.target));
  setEstado(adicionarTag(estado, { texto: dados.texto }));
}

function criarNovoBloco(evento) {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(evento.target));
  setEstado(adicionarSecao(estado, { titulo: dados.titulo, texto: dados.texto }));
}

function criarNovaFigura(evento) {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(evento.target));
  setEstado(adicionarFigura(estado, { blocoId: dados.blocoId, legenda: dados.legenda, altText: dados.altText }));
}

function criarNovaTabela(evento) {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(evento.target));
  setEstado(adicionarTabela(estado, { blocoId: dados.blocoId, titulo: dados.titulo }));
}

function moverBloco(id, direcao) {
  setEstado(moverSecao(estado, { id, direcao }));
}

function moverFichaNaFila(id, direcao) {
  setEstado(moverFicha(estado, { id, direcao }));
}

function editarFicha(id, assunto) {
  setEstado(atualizarFicha(estado, { id, assunto }));
}

function apagarFicha(id) {
  setEstado(removerFicha(estado, { id }));
}

function editarCitacao(id) {
  const texto = document.querySelector(`[data-texto-citacao="${cssEscape(id)}"]`)?.value;
  const pagina = document.querySelector(`[data-pagina-citacao="${cssEscape(id)}"]`)?.value;
  setEstado(atualizarCitacao(estado, { id, texto, pagina }));
}

function apagarCitacao(id) {
  setEstado(removerCitacao(estado, { id }));
}

function apagarBloco(id) {
  setEstado(removerSecao(estado, { id }));
}

function editarFigura(id) {
  const legenda = document.querySelector(`[data-legenda-figura="${cssEscape(id)}"]`)?.value;
  const altText = document.querySelector(`[data-alt-figura="${cssEscape(id)}"]`)?.value;
  setEstado(atualizarFigura(estado, { id, legenda, altText }));
}

function apagarFigura(id) {
  setEstado(removerFigura(estado, { id }));
}

function editarTabela(id) {
  const titulo = document.querySelector(`[data-titulo-tabela="${cssEscape(id)}"]`)?.value;
  setEstado(atualizarTabela(estado, { id, titulo }));
}

function apagarTabela(id) {
  setEstado(removerTabela(estado, { id }));
}

function editarTag(id, texto) {
  setEstado(atualizarTag(estado, { id, texto }));
}

function apagarTag(id) {
  setEstado(removerTag(estado, { id }));
}

function atualizarTextoBloco(id, texto) {
  setEstado(atualizarTextoSecao(estado, { id, texto }));
}

function soltarCitacao(evento, blocoId) {
  evento.preventDefault();
  const citacaoId = evento.dataTransfer.getData('text/plain');
  setEstado(inserirCitacaoNaSecao(estado, { citacaoId, blocoId }));
}

function baixarProjeto() {
  const arquivo = new Blob([exportarProjeto(estado)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(arquivo);
  link.download = 'fichario-projeto.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

async function importarArquivo(evento) {
  const arquivo = evento.target.files?.[0];
  if (!arquivo) return;
  setEstado(importarProjeto(await arquivo.text()));
}

function recomecarProjeto() {
  setEstado(structuredClone(estadoInicial));
}

function configurarAgente(evento) {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(evento.target));
  chaveAgenteSessao = dados.chave ? { provedor: dados.provedor, chave: dados.chave } : null;
  desenhar();
}

async function enviarAuth(evento, modo) {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(evento.target));
  auth = { ...auth, mensagem: '' };
  if (modo === 'recuperar') {
    const { error } = await recuperarSenha({
      email: dados.email,
      redirectTo: destinoNovaSenha({ origem: window.location.origin }),
    });
    auth = {
      usuario: null,
      carregando: false,
      mensagem: error ? error.message : 'Enviamos um link de recuperacao para seu email.',
    };
    desenhar();
    return;
  }
  const acao = modo === 'cadastrar' ? cadastrarComSenha : entrarComSenha;
  const { data, error } = await acao({ email: dados.email, senha: dados.senha });
  if (error) {
    auth = { usuario: null, carregando: false, mensagem: error.message };
    desenhar();
    return;
  }
  auth = {
    usuario: data.session?.user ?? null,
    carregando: false,
    mensagem: data.session ? '' : 'Cadastro criado. Confirme o email para entrar.',
  };
  if (auth.usuario) navegarPara('/app');
  desenhar();
}

async function entrarGoogle() {
  auth = { ...auth, mensagem: '' };
  const { error } = await entrarComGoogle({
    redirectTo: destinoCallbackAuth({ origem: window.location.origin }),
  });
  if (error) {
    auth = { usuario: null, carregando: false, mensagem: error.message };
    desenhar();
  }
}

async function salvarNovaSenha(evento) {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(evento.target));
  const { data, error } = await atualizarSenha({ senha: dados.senha });
  auth = {
    usuario: data?.user ?? auth.usuario,
    carregando: false,
    mensagem: error ? error.message : '',
  };
  if (!error) navegarPara('/app');
  desenhar();
}

async function encerrarSessao() {
  const { error } = await sair();
  auth = { usuario: null, carregando: false, mensagem: error ? error.message : '' };
  navegarPara('/entrar');
  desenhar();
}

async function iniciarAutenticacao() {
  if (!supabaseConfigurado) {
    auth = { usuario: null, carregando: false, mensagem: '' };
    desenhar();
    return;
  }
  try {
    auth = { usuario: await obterUsuarioAtual(), carregando: false, mensagem: '' };
  } catch (error) {
    auth = { usuario: null, carregando: false, mensagem: error.message };
  }
  supabase.auth.onAuthStateChange((evento, sessao) => {
    auth = { usuario: sessao?.user ?? null, carregando: false, mensagem: '' };
    if (evento === 'PASSWORD_RECOVERY') {
      navegarPara('/nova-senha');
    } else if (auth.usuario && rotaAtual() !== '/app') {
      navegarPara('/app');
    }
    desenhar();
  });
  desenhar();
}

function navegarPara(rota) {
  window.history.pushState({}, '', rota);
}

function rotaAtual() {
  return window.location.pathname === '/' ? '/app' : window.location.pathname;
}

function modoAuthDaRota() {
  if (rotaAtual() === '/cadastrar') return 'cadastrar';
  if (rotaAtual() === '/recuperar-senha') return 'recuperar';
  return 'entrar';
}

function erroAuthDaUrl() {
  const busca = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return busca.get('error_description') ?? hash.get('error_description') ?? busca.get('error') ?? hash.get('error');
}

function cardFicha(ficha) {
  const limite = validarLimite({ tipo: ficha.tipo, texto: ficha.assunto });
  return `
    <div class="ficha">
      <input data-assunto-ficha="${escapeAttr(ficha.id)}" value="${escapeAttr(ficha.assunto)}" aria-label="Assunto da ficha" />
      <span>${escapeHtml(ficha.tipo)} · ordem ${ficha.ordemImpressao}</span>
      <small>${limite.valido ? 'dentro do limite' : 'excede limite'}</small>
      <div class="mini-actions">
        <button type="button" class="icon-button" data-ficha-subir="${escapeAttr(ficha.id)}" title="Subir ficha">↑</button>
        <button type="button" class="icon-button" data-ficha-descer="${escapeAttr(ficha.id)}" title="Descer ficha">↓</button>
        <button type="button" data-ficha-remover="${escapeAttr(ficha.id)}">Remover</button>
      </div>
    </div>
  `;
}

function cardCitacao(citacao) {
  return `
    <div class="citacao" draggable="true" data-citacao="${escapeAttr(citacao.id)}">
      <textarea data-texto-citacao="${escapeAttr(citacao.id)}" aria-label="Texto da citacao">${escapeHtml(citacao.textoLimpo)}</textarea>
      <input data-pagina-citacao="${escapeAttr(citacao.id)}" value="${escapeAttr(citacao.pagina)}" aria-label="Pagina da citacao" />
      <small>${escapeHtml(apresentar(citacao, { linhas: 1 }))}</small>
      <button type="button" data-citacao-remover="${escapeAttr(citacao.id)}">Remover citacao</button>
    </div>
  `;
}

function cardBloco(bloco, indice) {
  return `
    <section class="bloco">
      <div class="bloco-topo">
        <strong>${escapeHtml(bloco.numero)} ${escapeHtml(bloco.titulo)}</strong>
        <span>
          <button type="button" class="icon-button" data-subir="${escapeAttr(bloco.id)}" title="Subir secao">↑</button>
          <button type="button" class="icon-button" data-descer="${escapeAttr(bloco.id)}" title="Descer secao">↓</button>
          <button type="button" data-bloco-remover="${escapeAttr(bloco.id)}">Remover</button>
        </span>
      </div>
      <textarea data-texto-bloco="${escapeAttr(bloco.id)}" aria-label="Texto da secao ${indice + 1}">${escapeHtml(bloco.texto)}</textarea>
    </section>
  `;
}

function cardFigura(figura) {
  return `
    <div class="item-editavel">
      <input data-legenda-figura="${escapeAttr(figura.id)}" value="${escapeAttr(figura.legenda)}" aria-label="Legenda da figura" />
      <input data-alt-figura="${escapeAttr(figura.id)}" value="${escapeAttr(figura.altText)}" aria-label="Texto alternativo da figura" />
      <small>${escapeHtml(figura.rotulo)}</small>
      <button type="button" data-figura-remover="${escapeAttr(figura.id)}">Remover imagem</button>
    </div>
  `;
}

function cardTabela(tabela) {
  return `
    <div class="item-editavel">
      <input data-titulo-tabela="${escapeAttr(tabela.id)}" value="${escapeAttr(tabela.titulo)}" aria-label="Titulo da tabela" />
      <small>${escapeHtml(tabela.rotulo)}</small>
      <button type="button" data-tabela-remover="${escapeAttr(tabela.id)}">Remover tabela</button>
    </div>
  `;
}

function cardTag(tag) {
  return `
    <span class="tag-editavel">
      <input data-texto-tag="${escapeAttr(tag.id)}" value="${escapeAttr(tag.texto)}" aria-label="Texto da tag" style="color:${tag.corTexto};background:${tag.corFundo}" />
      <button type="button" data-tag-remover="${escapeAttr(tag.id)}">Remover</button>
    </span>
  `;
}

function selectBloco(nome) {
  return `
    <select name="${nome}">
      ${estado.monografia.blocos.map((bloco) => `<option value="${escapeAttr(bloco.id)}">${escapeHtml(`${bloco.numero} ${bloco.titulo}`)}</option>`).join('')}
    </select>
  `;
}

function carregarEstado() {
  const salvo = localStorage.getItem(CHAVE_ESTADO);
  if (!salvo) return structuredClone(estadoInicial);
  return normalizarEstado(JSON.parse(salvo));
}

function normalizarEstado(valor) {
  valor.fichas = valor.fichas.map((ficha, indice) => ({ id: ficha.id ?? uid('ficha'), ordemImpressao: indice + 1, ...ficha }));
  valor.citacoes = valor.citacoes.map((citacao) => ({ id: citacao.id ?? uid('cit'), ...citacao }));
  return valor;
}

function setEstado(proximoEstado) {
  estado = proximoEstado;
  persistir();
}

function persistir() {
  localStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado));
  desenhar();
}

function uid(prefixo) {
  return `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function escapeHtml(valor) {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeAttr(valor) {
  return escapeHtml(valor).replaceAll("'", '&#39;');
}

function cssEscape(valor) {
  return String(valor).replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

window.addEventListener('popstate', () => desenhar());
desenhar();
iniciarAutenticacao();
