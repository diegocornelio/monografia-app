// e2e/01-fichamento.spec.ts — Playwright. Entra no CI a partir da Fase 1.
// Cada titulo de teste carrega o identificador da feature do catalogo do §7 do
// planejamento, e o script testes/cobertura.mjs usa esse identificador para
// provar que nenhuma feature ficou sem teste em algum nivel.
//
// Enquanto a tela nao existe, os testes ficam em test.fixme: eles aparecem no
// relatorio como pendentes e nao mascaram ausencia de implementacao.
import { test, expect } from '@playwright/test';
import { criarProjetoDeTeste, fichasAleatorias, extrairRetangulosPorPagina } from './apoio';

test.describe('Fichamento e impressao', () => {
  test.fixme('F010 imprime ficha individual, conjunto selecionado e tudo', async ({ page }) => {
    await criarProjetoDeTeste(page, { fichas: 5 });
    await page.getByRole('button', { name: 'Imprimir ficha' }).first().click();
    await expect(page.getByTestId('previa-impressao')).toContainText('1 ficha');

    await page.getByRole('checkbox', { name: /selecionar/i }).nth(0).check();
    await page.getByRole('checkbox', { name: /selecionar/i }).nth(2).check();
    await page.getByRole('button', { name: 'Imprimir selecionadas' }).click();
    await expect(page.getByTestId('previa-impressao')).toContainText('2 fichas');

    await page.getByRole('button', { name: 'Imprimir tudo' }).click();
    await expect(page.getByTestId('previa-impressao')).toContainText('5 fichas');
  });

  test.fixme('F003 nenhuma ficha e dividida entre paginas em 200 fichas aleatorias', async ({ page }) => {
    await criarProjetoDeTeste(page, { fichas: fichasAleatorias(200) });
    const pdf = await page.getByRole('button', { name: 'Exportar PDF' }).click().then(() => page.waitForEvent('download'));
    const paginas = await extrairRetangulosPorPagina(pdf);
    for (const pagina of paginas) {
      for (const ficha of pagina) {
        expect(ficha.cortadaNoRodape, `ficha ${ficha.id} cortada`).toBe(false);
        expect(ficha.continuaDaPaginaAnterior, `ficha ${ficha.id} continuada`).toBe(false);
      }
    }
    expect(paginas.flat().length).toBe(200);
  });

  test.fixme('F003 duas fichas de meia pagina cabem no mesmo A4', async ({ page }) => {
    await criarProjetoDeTeste(page, { fichas: [{ tipo: 'texto', tamanho: 'meia' }, { tipo: 'texto', tamanho: 'meia' }] });
    const pdf = await page.getByRole('button', { name: 'Exportar PDF' }).click().then(() => page.waitForEvent('download'));
    expect((await extrairRetangulosPorPagina(pdf)).length).toBe(1);
  });

  test.fixme('F011 exporta DOCX, LaTeX e PNG 4K da ficha individual', async ({ page }) => {
    await criarProjetoDeTeste(page, { fichas: 1 });
    for (const formato of ['DOCX', 'LaTeX']) {
      const download = await page.getByRole('button', { name: `Exportar ${formato}` }).click().then(() => page.waitForEvent('download'));
      expect(download.suggestedFilename()).toMatch(formato === 'DOCX' ? /\.docx$/ : /\.tex$/);
    }
    const png = await page.getByRole('button', { name: 'Exportar PNG 4K' }).click().then(() => page.waitForEvent('download'));
    expect(png.suggestedFilename()).toMatch(/\.png$/);
  });

  test.fixme('F013 fechar com alteracao pendente pergunta salvar ou descartar', async ({ page }) => {
    await criarProjetoDeTeste(page, { fichas: 1 });
    await page.getByRole('textbox', { name: 'Resumo' }).fill('alteracao nao salva');
    await page.getByRole('button', { name: 'Fechar projeto' }).click();
    const dialogo = page.getByRole('dialog', { name: /salvar/i });
    await expect(dialogo).toBeVisible();
    await dialogo.getByRole('button', { name: 'Descartar' }).click();
    await expect(page.getByRole('dialog', { name: /tem certeza/i })).toBeVisible();
  });

  test.fixme('F014 link do trecho abre o arquivo original', async ({ page }) => {
    await criarProjetoDeTeste(page, { fichas: 1, comFonteAnexada: true });
    const link = page.getByRole('link', { name: 'Abrir original' });
    await expect(link).toHaveAttribute('href', /https:\/\//);
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test.fixme('F009 fila de impressao aceita reordenar e trocar por arrastar', async ({ page }) => {
    await criarProjetoDeTeste(page, { fichas: 3 });
    await page.getByTestId('ficha-3').dragTo(page.getByTestId('ficha-1'));
    await expect(page.getByTestId('fila')).toHaveText(/3.*1.*2/s);
    await page.getByRole('radio', { name: 'Trocar' }).check();
    await page.getByTestId('ficha-2').dragTo(page.getByTestId('ficha-3'));
    await expect(page.getByTestId('fila')).toHaveText(/2.*1.*3/s);
  });

  test.fixme('F016 backup local grava o zip na pasta escolhida uma unica vez', async ({ page }) => {
    await criarProjetoDeTeste(page, { fichas: 1, pastaLocalConcedida: true });
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByTestId('estado-backup')).toHaveText(/gravado em/i);
  });
});
