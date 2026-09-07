// e2e/03-orientacao-publicacao.spec.ts — o que so a tela prova no modulo de
// orientacao, e o fechamento do ciclo ate a publicacao.
import { test, expect } from '@playwright/test';
import { abrirProjeto, entrarComoPapel, semearTarefas } from './apoio';

test.describe('View do orientador', () => {
  test.fixme('F067 o orientador nao alcanca nenhuma rota de agente, nem pela URL', async ({ page }) => {
    await entrarComoPapel(page, 'orientador');
    for (const rota of ['/agente', '/agente/chaves', '/agente/prompts', '/agente/custos']) {
      const resposta = await page.goto(rota);
      expect(resposta?.status(), `rota ${rota}`).toBe(403);
    }
  });

  test.fixme('F067 nenhuma palavra da orquestracao aparece no HTML servido ao orientador', async ({ page }) => {
    await entrarComoPapel(page, 'orientador');
    const html = await page.content();
    for (const termo of ['api key', 'sk-', 'prompt', 'guardrails', 'skill de escrita', 'bloco de voz']) {
      expect(html.toLowerCase(), `vazou ${termo}`).not.toContain(termo);
    }
  });

  test.fixme('F067 R5 a pagina do orientador mostra documentos, referencias, progresso e tarefas', async ({ page }) => {
    await entrarComoPapel(page, 'orientador');
    for (const secao of ['Documentos', 'Referencias', 'Progresso', 'Tarefas']) {
      await expect(page.getByRole('heading', { name: secao })).toBeVisible();
    }
  });

  test.fixme('F068 comentar em trecho selecionado cria tarefa ancorada visivel ao orientando', async ({ page, browser }) => {
    await entrarComoPapel(page, 'orientador');
    await page.getByTestId('bloco-b3').selectText({ de: 10, ate: 42 });
    await page.getByRole('button', { name: 'Comentar' }).click();
    await page.getByRole('textbox', { name: 'Comentario' }).fill('delimitar a hipotese');
    await page.getByRole('button', { name: 'Enviar' }).click();

    const outra = await browser.newPage();
    await entrarComoPapel(outra, 'autor');
    await expect(outra.getByTestId('backlog')).toContainText('delimitar a hipotese');
    await outra.getByText('delimitar a hipotese').click();
    await expect(outra.getByTestId('bloco-b3')).toHaveAttribute('data-trecho-destacado', 'true');
  });

  test.fixme('F068 comentario marcado sem tarefa nao entra no backlog nem no grafico', async ({ page }) => {
    await entrarComoPapel(page, 'orientador');
    await page.getByTestId('bloco-b1').selectText({ de: 0, ate: 20 });
    await page.getByRole('button', { name: 'Comentar' }).click();
    await page.getByRole('checkbox', { name: 'Sem tarefa' }).check();
    await page.getByRole('textbox', { name: 'Comentario' }).fill('bom paragrafo');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.getByTestId('backlog')).not.toContainText('bom paragrafo');
  });

  test.fixme('F063 o autor cria apontamento para si mesmo, em modo solo', async ({ page }) => {
    await entrarComoPapel(page, 'autor');
    await page.getByTestId('bloco-b2').selectText({ de: 0, ate: 15 });
    await page.getByRole('button', { name: 'Anotar' }).click();
    await page.getByRole('textbox', { name: 'Comentario' }).fill('rever esta transicao');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.getByTestId('backlog')).toContainText('rever esta transicao');
  });

  test.fixme('F069 o ciclo da tarefa mostra estados e versoes do bloco desde a abertura', async ({ page }) => {
    await entrarComoPapel(page, 'orientador');
    await page.getByTestId('tarefa-T1').click();
    await expect(page.getByTestId('ciclo')).toContainText('aberta');
    await expect(page.getByTestId('ciclo')).toContainText('em revisao');
    await expect(page.getByTestId('versoes-do-bloco')).toContainText('diferenca');
  });

  test.fixme('F070 o botao validar nao existe para o leitor', async ({ page }) => {
    await entrarComoPapel(page, 'leitor');
    await page.getByTestId('tarefa-T1').click();
    await expect(page.getByRole('button', { name: 'Validar' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Arquivar' })).toHaveCount(0);
  });

  test.fixme('F064 o grafico traz afirmacao no titulo e alternativa textual', async ({ page }) => {
    await semearTarefas(page, { pendentes: 9, realizadas: 18 });
    await entrarComoPapel(page, 'orientador');
    await expect(page.getByTestId('grafico-backlog')).toContainText('18 de 27');
    await expect(page.getByTestId('grafico-backlog-alternativa')).not.toBeEmpty();
  });

  test.fixme('F065 a listagem rolavel sustenta 500 tarefas sem travar', async ({ page }) => {
    await semearTarefas(page, { pendentes: 250, realizadas: 250 });
    await entrarComoPapel(page, 'orientador');
    const inicio = Date.now();
    await page.getByTestId('lista-tarefas').evaluate((el) => el.scrollTo(0, el.scrollHeight));
    expect(Date.now() - inicio).toBeLessThan(1000);
    await expect(page.getByTestId('lista-tarefas').getByRole('listitem').first()).toBeVisible();
  });

  test.fixme('F066 revogar convite corta a sessao aberta do orientador', async ({ page, browser }) => {
    const autor = await browser.newPage();
    await entrarComoPapel(page, 'orientador');
    await entrarComoPapel(autor, 'autor');
    await autor.getByRole('button', { name: 'Revogar acesso' }).click();
    await page.reload();
    await expect(page.getByText(/acesso revogado/i)).toBeVisible();
  });

  test.fixme('F071 F094 relatorio de progresso e lista de tarefas saem em PDF para a reuniao', async ({ page }) => {
    await entrarComoPapel(page, 'autor');
    for (const botao of ['Relatorio de progresso', 'Exportar tarefas']) {
      const download = await page.getByRole('button', { name: botao }).click().then(() => page.waitForEvent('download'));
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    }
  });

  test.fixme('F072 a ata da reuniao vincula decisoes a tarefas existentes', async ({ page }) => {
    await entrarComoPapel(page, 'autor');
    await page.getByTestId('reuniao-2026-09-10').click();
    await page.getByRole('button', { name: 'Vincular tarefa' }).click();
    await page.getByRole('option', { name: /delimitar a hipotese/ }).click();
    await expect(page.getByTestId('ata')).toContainText('delimitar a hipotese');
  });

  test.fixme('F073 o autor ve quem acessou o projeto e quando', async ({ page }) => {
    await entrarComoPapel(page, 'autor');
    await page.getByRole('link', { name: 'Acessos' }).click();
    await expect(page.getByRole('table')).toContainText('orientador');
  });
});

test.describe('Publicacao e fechamento do ciclo', () => {
  test.fixme('F084 export bloqueado lista as violacoes com link para o ponto', async ({ page }) => {
    await abrirProjeto(page, { figuraSemAltText: true });
    await page.getByRole('button', { name: 'Exportar PDF' }).click();
    await expect(page.getByRole('dialog', { name: /nao e possivel exportar/i })).toBeVisible();
    await page.getByRole('link', { name: /Figura 1/ }).click();
    await expect(page.getByTestId('campo-alt-text')).toBeFocused();
  });

  test.fixme('F058 o PDF exportado passa em verificador PDF/A externo', async ({ page }) => {
    await abrirProjeto(page, { conforme: true });
    const download = await page.getByRole('button', { name: 'Exportar PDF/A' }).click().then(() => page.waitForEvent('download'));
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    // conferencia por veraPDF no job de CI, ver testes/e2e/apoio.ts
  });

  test.fixme('F055 F056 extrator de template exige conferencia campo a campo', async ({ page }) => {
    await abrirProjeto(page, {});
    await page.getByRole('button', { name: 'Extrair template de exemplo' }).click();
    await page.getByTestId('upload-exemplos').setInputFiles(['fixtures/tese-aprovada.pdf']);
    await expect(page.getByRole('dialog', { name: /conferencia/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Salvar template' })).toBeDisabled();
    for (const campo of await page.getByRole('checkbox', { name: /confirmar/i }).all()) await campo.check();
    await expect(page.getByRole('button', { name: 'Salvar template' })).toBeEnabled();
  });

  test.fixme('F056 norma de periodico nao encontrada e declarada, e nao preenchida por analogia', async ({ page }) => {
    await abrirProjeto(page, { periodico: 'Revista Inexistente' });
    await page.getByRole('button', { name: 'Buscar normas' }).click();
    await expect(page.getByText(/nao encontramos as normas/i)).toBeVisible();
    await expect(page.getByTestId('campos-preenchidos')).toBeEmpty();
  });

  test.fixme('F057 F096 modo defesa gera deck dos blocos marcados, com notas e cronometro', async ({ page }) => {
    await abrirProjeto(page, { blocosMarcados: 8 });
    await page.getByRole('button', { name: 'Modo defesa' }).click();
    await expect(page.getByTestId('slides')).toHaveCount(8);
    await expect(page.getByTestId('cronometro')).toBeVisible();
  });

  test.fixme('F089 F090 checklist de submissao e carta saem prontos para o destino', async ({ page }) => {
    await abrirProjeto(page, { destino: 'Repositorio institucional' });
    await page.getByRole('button', { name: 'Preparar submissao' }).click();
    await expect(page.getByTestId('checklist')).toContainText('Ficha catalografica');
    await expect(page.getByTestId('metadados-dublin-core')).toContainText('dc.title');
  });

  test.fixme('F091 o pacote de dados de pesquisa sai com README', async ({ page }) => {
    await abrirProjeto(page, {});
    const download = await page.getByRole('button', { name: 'Exportar dados de pesquisa' }).click().then(() => page.waitForEvent('download'));
    expect(download.suggestedFilename()).toMatch(/\.zip$/);
  });

  test.fixme('F093 comparador mostra o que mudou entre duas datas', async ({ page }) => {
    await abrirProjeto(page, {});
    await page.getByRole('button', { name: 'Comparar versoes' }).click();
    await page.getByRole('combobox', { name: 'De' }).selectOption({ index: 1 });
    await expect(page.getByTestId('diferencas')).toContainText('capitulo');
  });

  test.fixme('F095 parecer da banca vira backlog de tarefas', async ({ page }) => {
    await abrirProjeto(page, {});
    await page.getByRole('button', { name: 'Importar parecer' }).click();
    await page.getByRole('textbox', { name: 'Parecer' }).fill('1. Ampliar a discussao\n2. Corrigir a tabela 3');
    await page.getByRole('button', { name: 'Gerar tarefas' }).click();
    await expect(page.getByTestId('backlog')).toContainText('Ampliar a discussao');
    await expect(page.getByTestId('backlog')).toContainText('Corrigir a tabela 3');
  });

  test.fixme('F048 F052 apos a migracao, rota do app e MCP hospedado respondem autenticados', async ({ page }) => {
    await entrarComoPapel(page, 'autor');
    await expect(page).toHaveURL(/\/projetos/);
    const resposta = await page.request.get('/api/mcp/ferramentas');
    expect(resposta.status()).toBe(200);
  });
});
