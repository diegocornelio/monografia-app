// Gerador do mapa de encadeamento lógico -> Mermaid (pré-teste)
// nós: afirmações/blocos; arestas tipadas: sustenta|deriva|contradiz|salto(detectado)
export function gerarMermaid(mapa){
  const esc=t=>String(t).replace(/["\[\]{}|]/g,' ').slice(0,60);
  const L=['flowchart TD'];
  for(const n of mapa.nos){
    const shape = n.tipo==='premissa' ? `(["${esc(n.rotulo)}"])`
                : n.tipo==='conclusao' ? `[["${esc(n.rotulo)}"]]`
                : `["${esc(n.rotulo)}"]`;
    L.push(`  ${n.id}${shape}`);
  }
  for(const e of mapa.arestas){
    const st = e.tipo==='salto'      ? `-. "salto lógico" .-> `
             : e.tipo==='contradiz'  ? `-- "contradiz" --> `
             : e.tipo==='deriva'     ? `-- "deriva" --> `
             : `--> `;
    L.push(`  ${e.de}${st}${e.para}`);
  }
  L.push('  classDef salto stroke:#A94438,stroke-width:2px;');
  for(const e of mapa.arestas) if(e.tipo==='salto') L.push(`  class ${e.para} salto`);
  return L.join('\n');
}
// versão anterior sempre preservada: snapshot imutável por hash
import {createHash} from 'crypto';
export function snapshot(versoes, mapa){
  const conteudo=JSON.stringify(mapa);
  const hash=createHash('sha256').update(conteudo).digest('hex').slice(0,12);
  if(versoes.at(-1)?.hash===hash) return versoes;      // nada mudou, nada grava
  return [...versoes, {hash, em:new Date().toISOString(), conteudo}]; // append-only
}
