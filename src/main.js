import './styles.css';
import { formatar } from './domain/abnt/referencia.mjs';
import { filtrar } from './domain/busca.mjs';
import { criarCitacao, apresentar } from './domain/citacao.mjs';
import { criarFicha } from './domain/ficha.mjs';
import { validarLimite } from './domain/limites.mjs';
import { criarTag, linhaDeTags } from './domain/tag.mjs';

const estado = {
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
    criarFicha({ projetoId: 'p1', fonteId: 'f01', tipo: 'texto', assunto: 'Metodo cientifico', ordemImpressao: 1 }),
  ],
  citacoes: [criarCitacao({ fonteId: 'f01', texto: '"Trecho selecionado da obra"', pagina: 43 })],
  tags: [criarTag({ texto: 'metodologia', corTexto: '#2B2B2B', corFundo: '#EFE6DA' })],
};

function desenhar(filtro = '') {
  const acervo = estado.fichas.map((ficha) => ({
    ...ficha,
    autor: estado.fonte.autorSobrenome,
    obra: estado.fonte.titulo,
    tags: estado.tags.map((t) => t.texto),
  }));
  const fichas = filtrar(acervo, filtro ? { palavraChave: filtro } : {});

  document.querySelector('#app').innerHTML = `
    <main class="app-shell">
      <section class="toolbar">
        <div>
          <p class="eyebrow">Fichario solo</p>
          <h1>Fichamento local-first</h1>
        </div>
        <input id="busca" value="${escapeHtml(filtro)}" placeholder="Buscar assunto ou obra" />
      </section>

      <section class="grid">
        <article class="panel span-2">
          <h2>Fonte</h2>
          <p>${escapeHtml(formatar(estado.fonte))}</p>
        </article>

        <article class="panel">
          <h2>Ficha</h2>
          ${fichas.map(cardFicha).join('')}
        </article>

        <article class="panel">
          <h2>Citacao</h2>
          <p>${escapeHtml(apresentar(estado.citacoes[0], { linhas: 1 }))}</p>
        </article>

        <article class="panel">
          <h2>Tags</h2>
          <div class="tags">${linhaDeTags(estado.tags).tags.map(cardTag).join('')}</div>
        </article>
      </section>
    </main>
  `;

  document.querySelector('#busca').addEventListener('input', (evento) => desenhar(evento.target.value));
}

function cardFicha(ficha) {
  const limite = validarLimite({ tipo: ficha.tipo, texto: ficha.assunto });
  return `<div class="ficha"><strong>${escapeHtml(ficha.assunto)}</strong><span>ordem ${ficha.ordemImpressao}</span><small>${limite.valido ? 'dentro do limite' : 'excede limite'}</small></div>`;
}

function cardTag(tag) {
  return `<span class="tag" style="color:${tag.corTexto};background:${tag.corFundo}">${escapeHtml(tag.texto)}</span>`;
}

function escapeHtml(valor) {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

desenhar();
