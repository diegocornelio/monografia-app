import { createHash } from 'crypto';

export function montar({ guardrails, skill, voz, tarefa, tipoTarefa = 'producaoTextual' }) {
  if (!guardrails) throw new Error('Guardrails obrigatorios');
  if (tipoTarefa === 'producaoTextual' && !voz) throw new Error('Bloco de voz obrigatorio');
  return [
    `# Guardrails\n${guardrails}`,
    skill ? `# Skill ${skill.nome}\n${skill.conteudo}` : '',
    voz ? `# Voz\n${voz.blocoVozGerado}` : '',
    `# Tarefa\n${tarefa}`,
  ].filter(Boolean).join('\n\n');
}

export function hashDoPrompt(prompt) {
  return createHash('sha256').update(prompt).digest('hex');
}
