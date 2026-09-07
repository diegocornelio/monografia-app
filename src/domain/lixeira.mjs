export function analisarRemocao({ alvo, vinculos = [] }) {
  const afetados = alvo.tipo === 'fonte' ? vinculos.filter((v) => v.fonteId === alvo.id) : [];
  return { afetados, exigeDecisao: afetados.length > 0 };
}

export function aplicarRemocao({ alvo, afetados = [], decisao }) {
  if (!decisao) throw new Error('Remocao em cascata exige decisao explicita');

  if (decisao === 'manterOrfas') {
    return {
      alvo,
      afetados: afetados.map((item) =>
        item.tipo === 'ficha' ? { ...item, referenciaPendente: true } : item,
      ),
    };
  }

  return { alvo, afetados, decisao };
}

export function expurgar({ itens, confirmacao }) {
  if (!confirmacao?.textoLido || confirmacao.quantidade !== itens.length) {
    throw new Error('Expurgo exige confirmacao que nomeia o que sera destruido');
  }
  return { destruidos: itens.length };
}
