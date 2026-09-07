export function paraXml(projeto) {
  const dados = escapeXml(JSON.stringify(projeto));
  return `<fichario versao="${escapeXml(projeto.versao)}"><dados>${dados}</dados><comentarios></comentarios><tarefas></tarefas><versoes></versoes><auditoria></auditoria></fichario>`;
}

export function deXml(xml) {
  if (!/^<fichario[\s>]/.test(xml) || !xml.endsWith('</fichario>')) {
    throw new Error('XML malformado na linha 1');
  }

  const dados = xml.match(/<dados>([\s\S]*)<\/dados>/)?.[1];
  if (!dados) throw new Error('XML malformado na linha 1');

  try {
    return JSON.parse(unescapeXml(dados));
  } catch {
    throw new Error('XML malformado na linha 1');
  }
}

function escapeXml(valor) {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function unescapeXml(valor) {
  return valor
    .replaceAll('&quot;', '"')
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<')
    .replaceAll('&amp;', '&');
}
