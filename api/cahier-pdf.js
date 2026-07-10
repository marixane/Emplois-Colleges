import { existsSync } from 'node:fs';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const config = {
  maxDuration: 120,
  api: {
    bodyParser: {
      sizeLimit: '20mb'
    },
    responseLimit: false
  }
};

const MAX_HTML_SIZE = 18 * 1024 * 1024;
const LONG_TIMEOUT = 120000;
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const A4_WIDTH_CSS = '210mm';
const A4_HEIGHT_CSS = '297mm';

const LOCAL_CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
];

const isLocalDev = () => !process.env.VERCEL && process.env.NODE_ENV !== 'production';

const getLocalChromePath = () => LOCAL_CHROME_PATHS.find((path) => existsSync(path));

const getExecutablePath = async () => {
  const localPath = getLocalChromePath();
  if (isLocalDev() && localPath) return localPath;
  return chromium.executablePath();
};

const getLaunchArgs = () => {
  const args = isLocalDev() ? ['--no-sandbox', '--disable-setuid-sandbox'] : chromium.args;
  return args;
};

const cleanBaseUrl = (url) => String(url || 'https://a4exam.com').replace(/["<>]/g, '').replace(/\/$/, '');

const errorMessage = (error) => String(error?.message || error || 'Erreur génération PDF');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { html, baseUrl } = req.body || {};
  if (!html || typeof html !== 'string') {
    return res.status(400).json({ error: 'HTML manquant' });
  }

  if (html.length > MAX_HTML_SIZE) {
    return res.status(413).json({ error: 'Document trop grand pour générer le PDF' });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      args: getLaunchArgs(),
      defaultViewport: { width: A4_WIDTH, height: A4_HEIGHT, deviceScaleFactor: 1 },
      executablePath: await getExecutablePath(),
      headless: true,
      protocolTimeout: LONG_TIMEOUT
    });

    const page = await browser.newPage();
    await page.setViewport({ width: A4_WIDTH, height: A4_HEIGHT, deviceScaleFactor: 1 });
    page.setDefaultTimeout(LONG_TIMEOUT);
    page.setDefaultNavigationTimeout(LONG_TIMEOUT);

    const safeBase = cleanBaseUrl(baseUrl);
    const documentHtml = `<!doctype html>
<html>
<head>
  <base href="${safeBase}/">
  <meta charset="utf-8">
  <style>
    @page { size: ${A4_WIDTH_CSS} ${A4_HEIGHT_CSS}; margin: 0; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
    html, body {
      width: ${A4_WIDTH_CSS} !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      overflow: visible !important;
    }
    body { min-height: ${A4_HEIGHT_CSS} !important; }
    .cahier-pdf-export-button, .app-tabs, .tab-button, button { display: none !important; }
    .cahier-preview-zone, .preview-zone {
      width: ${A4_WIDTH_CSS} !important;
      min-width: ${A4_WIDTH_CSS} !important;
      max-width: ${A4_WIDTH_CSS} !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      height: auto !important;
      max-height: none !important;
      background: white !important;
      display: block !important;
      transform: none !important;
      scale: 1 !important;
      translate: 0 0 !important;
      zoom: 1 !important;
      container-type: normal !important;
    }
    .cahier-preview-zone .a4-page,
    .cahier-preview-zone .cahier-page,
    .preview-zone .a4-page,
    .preview-zone .cahier-page,
    .a4-page,
    .cahier-page {
      width: ${A4_WIDTH_CSS} !important;
      min-width: ${A4_WIDTH_CSS} !important;
      max-width: ${A4_WIDTH_CSS} !important;
      height: ${A4_HEIGHT_CSS} !important;
      min-height: ${A4_HEIGHT_CSS} !important;
      max-height: ${A4_HEIGHT_CSS} !important;
      margin: 0 !important;
      transform: none !important;
      scale: 1 !important;
      translate: 0 0 !important;
      zoom: 1 !important;
      overflow: hidden !important;
      break-after: page !important;
      page-break-after: always !important;
      box-shadow: none !important;
      display: block !important;
      position: relative !important;
      flex: none !important;
    }
    .cahier-preview-zone .a4-page::before,
    .preview-zone .a4-page::before {
      display: none !important;
      content: none !important;
    }
    .cahier-group-cover-page {
      width: ${A4_WIDTH_CSS} !important;
      height: ${A4_HEIGHT_CSS} !important;
    }
    .a4-page:last-child, .cahier-page:last-child { break-after: auto !important; page-break-after: auto !important; }
  </style>
</head>
<body class="cahier-tab-active">
  ${html}
</body>
</html>`;

    await page.setContent(documentHtml, { waitUntil: 'domcontentloaded', timeout: LONG_TIMEOUT });
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready.catch(() => {});
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1000);

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      scale: 1,
      timeout: LONG_TIMEOUT
    });

    const preview = String(req.query?.preview || '') === '1';
    const disposition = preview ? 'inline' : 'attachment';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="Cahier-de-texte-2026-2027.pdf"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(pdf);
  } catch (error) {
    console.error('PDF_EXPORT_ERROR', error);
    return res.status(500).json({ error: errorMessage(error) });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
