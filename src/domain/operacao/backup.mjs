export const CADENCIA_DIAS = 7;
export const JANELA_DE_PERDA = 'ate sete dias';

export function montarBackup({ projeto }) {
  return {
    formato: 'zip',
    conteudo: ['projeto.xml', 'manifest.json', 'recursos'],
    destino: `drive:/Fichario/${projeto.nome}/backups`,
  };
}

export function caminhoDeRestauracao() {
  return 'importarPacote';
}

export function aceitarBackup({ manifestoConfere, anterior }) {
  if (!manifestoConfere) throw new Error('Manifesto nao confere');
  return { aceito: true, anterior };
}

export function rotacionar({ lista = [], novo }) {
  return [...lista, novo].slice(-5);
}
