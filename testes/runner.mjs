// runner.mjs — harness minimo de TDD, sem dependencia externa.
//
// Regra do harness: teste que falha por assercao e VERMELHO (regressao ou
// implementacao incorreta). Teste cujo modulo ainda nao existe e PENDENTE
// (ainda nao construido). A distincao existe porque em TDD as duas situacoes
// exigem acoes opostas: pendente pede implementacao, vermelho pede correcao.

const suites = [];
let suiteAtual = null;

export function suite(nome, { modulo = null, feature = [] } = {}, fn) {
  suiteAtual = { nome, modulo, feature, casos: [], erroImport: null };
  suites.push(suiteAtual);
  fn();
  suiteAtual = null;
}

export function caso(nome, features, fn) {
  suiteAtual.casos.push({ nome, features, fn });
}

// Importa o modulo sob teste. Ausencia vira pendencia declarada, nao excecao.
export async function moduloSobTeste(carregar) {
  try {
    const mod = typeof carregar === 'function' ? await carregar() : await import(carregar);
    return { ok: true, mod };
  } catch (erro) {
    const ausente =
      erro.code === 'ERR_MODULE_NOT_FOUND' || /Cannot find module/.test(erro.message);
    return { ok: false, ausente, erro };
  }
}

const CORES = { verde: '\u001b[32m', vermelho: '\u001b[31m', amarelo: '\u001b[33m', off: '\u001b[0m' };
const pinta = (cor, txt) => `${CORES[cor]}${txt}${CORES.off}`;

export async function executar({ silencioso = false } = {}) {
  const resultado = { verde: 0, vermelho: 0, pendente: 0, porFeature: new Map(), falhas: [] };

  const registra = (features, estado) => {
    for (const f of features) {
      const atual = resultado.porFeature.get(f) ?? { verde: 0, vermelho: 0, pendente: 0 };
      atual[estado] += 1;
      resultado.porFeature.set(f, atual);
    }
  };

  for (const s of suites) {
    if (!silencioso) console.log(`\n# ${s.nome}`);
    let contexto = null;
    if (s.modulo) {
      const r = await moduloSobTeste(s.modulo);
      if (!r.ok && r.ausente) {
        for (const c of s.casos) {
          resultado.pendente += 1;
          registra(c.features.length ? c.features : s.feature, 'pendente');
          if (!silencioso) console.log(`  ${pinta('amarelo', 'pendente')} ${c.nome}`);
        }
        if (!silencioso) console.log(`  (modulo ainda nao existe)`);
        continue;
      }
      if (!r.ok) {
        for (const c of s.casos) {
          resultado.vermelho += 1;
          registra(c.features.length ? c.features : s.feature, 'vermelho');
        }
        resultado.falhas.push({ suite: s.nome, caso: '(carga do modulo)', erro: r.erro });
        if (!silencioso) console.log(`  ${pinta('vermelho', 'ERRO DE CARGA')} ${r.erro.message}`);
        continue;
      }
      contexto = r.mod;
    }

    for (const c of s.casos) {
      const features = c.features.length ? c.features : s.feature;
      try {
        await c.fn(contexto);
        resultado.verde += 1;
        registra(features, 'verde');
        if (!silencioso) console.log(`  ${pinta('verde', 'ok      ')} ${c.nome}`);
      } catch (erro) {
        if (erro && erro.pendente === true) {
          resultado.pendente += 1;
          registra(features, 'pendente');
          if (!silencioso) console.log(`  ${pinta('amarelo', 'pendente')} ${c.nome}`);
          continue;
        }
        resultado.vermelho += 1;
        registra(features, 'vermelho');
        resultado.falhas.push({ suite: s.nome, caso: c.nome, erro });
        if (!silencioso) console.log(`  ${pinta('vermelho', 'FALHA   ')} ${c.nome}: ${erro.message}`);
      }
    }
  }

  return resultado;
}

// Marca explicita para caso que depende de infraestrutura ainda inexistente.
export function pendente(motivo) {
  const e = new Error(motivo);
  e.pendente = true;
  throw e;
}

export function relatorio(resultado) {
  const total = resultado.verde + resultado.vermelho + resultado.pendente;
  console.log('\n' + '='.repeat(64));
  console.log(
    `TOTAL ${total} | ${pinta('verde', `verde ${resultado.verde}`)} | ` +
      `${pinta('vermelho', `vermelho ${resultado.vermelho}`)} | ` +
      `${pinta('amarelo', `pendente ${resultado.pendente}`)}`,
  );

  const features = [...resultado.porFeature.keys()].sort();
  const construidas = features.filter((f) => {
    const r = resultado.porFeature.get(f);
    return r.verde > 0 && r.vermelho === 0 && r.pendente === 0;
  });
  console.log(
    `Features do catalogo cobertas por teste: ${features.length}. ` +
      `Construidas e provadas: ${construidas.length}.`,
  );
  console.log(`Cobertas: ${features.join(' ')}`);
  console.log('='.repeat(64));

  const naoConstruidas = features.filter((f) => !construidas.includes(f));
  if (naoConstruidas.length > 0) {
    console.log('\nFeatures ainda nao provadas:');
    for (const f of naoConstruidas) {
      const r = resultado.porFeature.get(f);
      const marca = r.vermelho > 0 ? pinta('vermelho', 'vermelho') : pinta('amarelo', 'pendente');
      console.log(`  ${f}  ${marca}  (verde ${r.verde}, vermelho ${r.vermelho}, pendente ${r.pendente})`);
    }
  }

  if (resultado.falhas.length > 0) {
    console.log('\nDetalhe das falhas:');
    for (const f of resultado.falhas) {
      console.log(`  [${f.suite}] ${f.caso}`);
      console.log(`    ${f.erro.message}`);
    }
  }
  return resultado.vermelho === 0;
}
