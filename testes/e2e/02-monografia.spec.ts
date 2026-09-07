// e2e/02-monografia.spec.ts — cofre no Drive, construtor ABNT, layout e apoio
// a escrita. Adaptador falso do Google e usado por padrao; a suite marcada
// @contaReal roda so no job noturno, com conta de teste.
import { test, expect } from '@playwright/test';
import { abrirProjeto, comDriveFalso, medirCaixas } from './apoio';

test.describe('Cofre e integracoes do Google', () => {
  test.fixme('F020 cada arquivo do projeto tem link clicavel para o Drive', async ({ page }) => {
    await comDriveFalso(page, { arquivos: [{ id: 'd1', nome: 'fonte.pdf', webViewLink: 'https://drive/d1' }] });
    await expect(page.getByRole('link', { name: 'fonte.pdf' })).toHaveAttribute('href', 'https://drive/d1');
  });

  test.fixme('F021 compartilhar abre o compartilhamento nativo da pasta, sem ACL propria', async ({ page }) => {
    await comDriveFalso(page, {});
    const popup = await page.getByRole('button', { name: 'Compartilhar' }).click().then(() => page.waitForEvent('popup'));
    expect(popup.url()).toContain('drive.google.com');
    await expect(page.getByText(/permissoes deste app/i)).toHaveCount(0);
  });

  test.fixme('F022 exportar para Google Docs converte a partir do DOCX', async ({ page }) => {
    await comDriveFalso(page, {});
    await page.getByRole('button', { name: 'Exportar Google Docs' }).click();
    await expect(page.getByTestId('ultimo-envio')).toHaveAttribute('data-mime', 'application/vnd.google-apps.document');
  });

  test.fixme('F023 o alerta de reuniao aparece em todas as rotas e destaca abaixo de 30 minutos', async ({ page }) => {
    await comDriveFalso(page, { proximaReuniao: { emMinutos: 25, meet: 'https://meet/abc' } });
    for (const rota of ['/fichas', '/monografia', '/referencias', '/progresso']) {
      await page.goto(rota);
      await expect(page.getByTestId('pilula-reuniao')).toBeVisible();
    }
    await expect(page.getByTestId('pilula-reuniao')).toHaveAttribute('data-urgente', 'true');
    await expect(page.getByRole('link', { name: /entrar na reuniao/i })).toHaveAttribute('href', 'https://meet/abc');
  });

  test.fixme('F079 destaque no leitor de PDF vira ficha de citacao com a pagina certa', async ({ page }) => {
    await abrirProjeto(page, { pdf: 'fonte.pdf', irParaPagina: 43 });
    await page.getByTestId('camada-texto').selectText({ de: 10, ate: 60 });
    await page.getByRole('button', { name: 'Criar ficha de citacao' }).click();
    await expect(page.getByTestId('ficha-nova')).toContainText('p. 43');
  });
});

test.describe('Construtor de monografia', () => {
  test.fixme('F025 editor aceita texto, imagem com legenda e citacao do catalogo', async ({ page }) => {
    await abrirProjeto(page, { bloco: 'b1' });
    await page.getByRole('button', { name: 'Inserir citacao' }).click();
    await page.getByRole('option', { name: /norma unica/ }).click();
    await expect(page.getByTestId('bloco-b1')).toContainText('(p. 43)');
  });

  test.fixme('F026 tabela entra por CSV colado, por xlsx e por link de planilha', async ({ page }) => {
    await abrirProjeto(page, { bloco: 'b1' });
    await page.getByRole('button', { name: 'Colar CSV' }).click();
    await page.getByRole('textbox', { name: 'CSV' }).fill('a,b\n1,2');
    await page.getByRole('button', { name: 'Inserir' }).click();
    await expect(page.getByRole('table')).toContainText('1');
  });

  test.fixme('F030 aplicar ABNT muda margens, corpo e entrelinha do preview', async ({ page }) => {
    await abrirProjeto(page, {});
    await page.getByRole('button', { name: 'Aplicar ABNT' }).click();
    const pagina = page.getByTestId('pagina-preview').first();
    await expect(pagina).toHaveCSS('margin-left', /113/); // 3cm em px a 96dpi
  });

  test.fixme('F030 o preset ABNT e somente leitura e o usuario deriva o proprio', async ({ page }) => {
    await abrirProjeto(page, {});
    await page.getByRole('button', { name: 'Editar preset' }).click();
    await expect(page.getByText(/preset do Fichario e somente leitura/i)).toBeVisible();
    await page.getByRole('button', { name: 'Derivar preset' }).click();
    await expect(page.getByRole('textbox', { name: 'Nome do preset' })).toBeEditable();
  });

  test.fixme('F031 a pergunta pre-export muda a cor e o sublinhado dos links', async ({ page }) => {
    await abrirProjeto(page, {});
    await page.getByRole('button', { name: 'Exportar PDF' }).click();
    await page.getByRole('radio', { name: 'Impressao fisica' }).check();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByTestId('preview-link').first()).toHaveCSS('text-decoration-line', 'none');
  });

  test.fixme('F032 o preview usa o mesmo motor do PDF e pagina igual ao arquivo', async ({ page }) => {
    await abrirProjeto(page, { paginasEsperadas: 60 });
    await expect(page.getByTestId('contador-paginas')).toHaveText('60');
  });

  test.fixme('F033 os cinco templates criam pre-textuais diferentes', async ({ page }) => {
    for (const [tipo, exigido] of [['Artigo', 'Resumo'], ['Tese', 'Folha de aprovacao']] as const) {
      await page.goto('/novo');
      await page.getByRole('combobox', { name: 'Tipo' }).selectOption(tipo);
      await page.getByRole('button', { name: 'Criar' }).click();
      await expect(page.getByTestId('lista-pretextuais')).toContainText(exigido);
    }
  });

  test.fixme('F028 F083 ficha catalografica, folha de aprovacao e errata existem como pre-textuais', async ({ page }) => {
    await abrirProjeto(page, { tipo: 'Dissertacao' });
    for (const item of ['Ficha catalografica', 'Folha de aprovacao', 'Errata']) {
      await expect(page.getByRole('button', { name: item })).toBeVisible();
    }
  });
});

test.describe('Layout, acesso e produtividade', () => {
  const larguras = [360, 768, 1024, 1440];

  test.fixme('F036 nenhuma sobreposicao de conteudo em quatro larguras', async ({ page }) => {
    for (const largura of larguras) {
      await page.setViewportSize({ width: largura, height: 900 });
      await page.goto('/monografia');
      const caixas = await medirCaixas(page, '[data-conteudo]');
      for (let i = 0; i < caixas.length; i += 1) {
        for (let j = i + 1; j < caixas.length; j += 1) {
          expect(caixas[i].intersecta(caixas[j]), `sobreposicao em ${largura}px`).toBe(false);
        }
      }
    }
  });

  test.fixme('F036 abaixo de 900px o menu vira hamburguer sem perder item', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('navigation').getByRole('link')).toHaveCount(6);
  });

  test.fixme('F086 a paleta de comandos abre por atalho e executa acao', async ({ page }) => {
    await page.goto('/monografia');
    await page.keyboard.press('Control+K');
    await page.getByRole('combobox', { name: 'Comando' }).fill('nova ficha');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Nova ficha' })).toBeVisible();
  });

  test.fixme('F087 o modo foco esconde a interface acessoria e conta a sessao', async ({ page }) => {
    await page.goto('/monografia');
    await page.getByRole('button', { name: 'Modo foco' }).click();
    await expect(page.getByRole('navigation')).toBeHidden();
    await expect(page.getByTestId('cronometro-sessao')).toBeVisible();
  });

  test.fixme('F088 o app instala como PWA e abre sem rede', async ({ page, context }) => {
    await page.goto('/');
    await expect(page.locator('link[rel=manifest]')).toHaveCount(1);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Fichario' })).toBeVisible();
  });

  test.fixme('F092 a linha do tempo mostra qualificacao e defesa com dias restantes', async ({ page }) => {
    await abrirProjeto(page, { marcos: [{ nome: 'Qualificacao', em: '2026-11-10' }] });
    await expect(page.getByTestId('marco-qualificacao')).toContainText('dias');
  });
});
