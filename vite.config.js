import { access } from 'node:fs/promises';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import puppeteer from 'puppeteer-core';

const chromeCandidates = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
];

async function findBrowser() {
  for (const path of chromeCandidates) {
    try {
      await access(path);
      return path;
    } catch {
      // Continue vers le navigateur suivant.
    }
  }
  throw new Error('Google Chrome, Chromium ou Microsoft Edge est requis pour générer le PDF.');
}

function normalizeSchoolCalendarPlugin() {
  return {
    name: 'normalize-school-calendar-2026-2027',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/Tab.jsx')) return null;

      const mandatoryEventsPattern = /const MANDATORY_EVENTS = \[[\s\S]*?\n\];/;
      const examListPattern = /\n\s*<section className="cahier-exams-list"[\s\S]*?<\/section>/;
      const normalizedEvents = `const MANDATORY_EVENTS = [
  { start: '18/10', end: '25/10', label: 'Scolaire', text: 'Vacance scolaire : Vacances intermédiaires 1', type: 'holiday' },
  { start: '31/10', end: '31/10', label: 'Nationale', text: 'Fête nationale : Fête de l’Unité', type: 'holiday' },
  { start: '06/11', end: '06/11', label: 'Nationale', text: 'Fête nationale : Marche Verte', type: 'holiday' },
  { start: '18/11', end: '18/11', label: 'Nationale', text: 'Fête nationale : Fête de l’Indépendance', type: 'holiday' },
  { start: '06/12', end: '13/12', label: 'Scolaire', text: 'Vacance scolaire : Vacances intermédiaires 2', type: 'holiday' },
  { start: '01/01', end: '01/01', label: 'Nationale', text: 'Fête nationale : Nouvel An', type: 'holiday' },
  { start: '11/01', end: '11/01', label: 'Nationale', text: 'Fête nationale : Manifeste de l’Indépendance', type: 'holiday' },
  { start: '14/01', end: '14/01', label: 'Nationale', text: 'Fête nationale : Nouvel An Amazigh', type: 'holiday' },
  { start: '24/01', end: '31/01', label: 'Scolaire', text: 'Vacance scolaire : Vacances de mi-année', type: 'holiday' },
  { start: '01/05', end: '01/05', label: 'Nationale', text: 'Fête nationale : Fête du Travail', type: 'holiday' },
  { start: '09/05', end: '16/05', label: 'Scolaire', text: 'Vacance scolaire : Vacances intermédiaires 4', type: 'holiday' },
  { start: '10/07', end: '10/07', label: 'Administration', text: 'Signature procès-verbal', type: 'holiday' }
];`;

      if (!mandatoryEventsPattern.test(code)) {
        throw new Error('Impossible de trouver le calendrier obligatoire dans Tab.jsx');
      }

      let nextCode = code.replace(mandatoryEventsPattern, normalizedEvents);

      const replacements = [
        [
          "const EXAM_EVENTS = MANDATORY_EVENTS.filter((event) => event.type === 'exam');",
          'const EXAM_EVENTS = [];'
        ],
        [
          "const getSchoolStartYear = () => {\n  const today = new Date();\n  return today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;\n};",
          'const getSchoolStartYear = () => 2026;'
        ],
        [
          'return { start: new Date(startYear, 8, 1), end: new Date(startYear + 1, 6, 31) };',
          'return { start: new Date(startYear, 8, 1), end: new Date(startYear + 1, 6, 10) };'
        ],
        [
          'const end = new Date(startYear + 1, 6, 31);',
          'const end = new Date(startYear + 1, 6, 10);'
        ],
        [
          "const getMandatoryEventStart = (monthDate) => MANDATORY_EVENTS.filter((event) => event.start === monthDate);",
          "const getMandatoryEventStart = (monthDate) => MANDATORY_EVENTS.filter((event) => event.type === 'holiday' && event.start === monthDate);"
        ],
        [
          "const isInsideMandatoryEventAfterStart = (monthDate) => MANDATORY_EVENTS.some((event) => {\n  const date = getMonthDateAsSchoolDate(monthDate);",
          "const isInsideMandatoryEventAfterStart = (monthDate) => MANDATORY_EVENTS.some((event) => {\n  if (event.type !== 'holiday') return false;\n  const date = getMonthDateAsSchoolDate(monthDate);"
        ]
      ];

      for (const [search, replacement] of replacements) {
        if (!nextCode.includes(search)) {
          throw new Error('Impossible d’appliquer une correction du calendrier dans Tab.jsx');
        }
        nextCode = nextCode.replace(search, replacement);
      }

      if (!examListPattern.test(nextCode)) {
        throw new Error('Impossible de retirer la liste des examens de Tab.jsx');
      }
      nextCode = nextCode.replace(examListPattern, '');

      return { code: nextCode, map: null };
    }
  };
}

function pdfApiPlugin() {
  return {
    name: 'local-cahier-pdf-api',
    configureServer(server) {
      server.middlewares.use('/api/cahier-pdf', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Méthode non autorisée' }));
          return;
        }

        try {
          let body = '';
          for await (const chunk of req) body += chunk;
          const { html = '', baseUrl = '' } = JSON.parse(body || '{}');
          if (!html) throw new Error('Contenu PDF vide');

          const executablePath = await findBrowser();
          const browser = await puppeteer.launch({
            executablePath,
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });

          try {
            const page = await browser.newPage();
            await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
            await page.setContent(`<!doctype html><html><head><base href="${baseUrl}/"></head><body>${html}</body></html>`, {
              waitUntil: 'networkidle0',
              timeout: 120000
            });
            await page.emulateMediaType('print');
            await page.addStyleTag({
              content: `
                @page { size: 210mm 297mm; margin: 0; }
                html, body { width: 210mm !important; margin: 0 !important; padding: 0 !important; }
                .cahier-preview-zone { width: 210mm !important; margin: 0 !important; padding: 0 !important; transform: none !important; zoom: 1 !important; }
                .cahier-preview-zone > .a4-page,
                .cahier-preview-zone > .cahier-page,
                .a4-page.cahier-page {
                  width: 210mm !important;
                  min-width: 210mm !important;
                  max-width: 210mm !important;
                  height: 297mm !important;
                  min-height: 297mm !important;
                  max-height: 297mm !important;
                  margin: 0 !important;
                  transform: none !important;
                  scale: 1 !important;
                  zoom: 1 !important;
                  break-after: page !important;
                  page-break-after: always !important;
                }
                .homework-page {
                  padding-left: 14mm !important;
                  padding-right: 8mm !important;
                  padding-bottom: 8mm !important;
                  display: flex !important;
                  flex-direction: column !important;
                  box-sizing: border-box !important;
                }
                .homework-page > *,
                .homework-page .homework-entry,
                .homework-page .homework-content,
                .homework-page .homework-text,
                .homework-page .homework-subject {
                  width: 100% !important;
                  max-width: none !important;
                  box-sizing: border-box !important;
                }
                .homework-page .homework-entry {
                  margin-left: 0 !important;
                  margin-right: 0 !important;
                  flex: 1 1 0 !important;
                  min-height: 0 !important;
                  display: flex !important;
                  flex-direction: column !important;
                }
                .homework-page .homework-content {
                  grid-template-columns: 40% 60% !important;
                  flex: 1 1 auto !important;
                  min-height: 0 !important;
                }
                .homework-page .homework-text {
                  padding-right: 0 !important;
                  margin-right: 0 !important;
                }
                .homework-page > .homework-entry:last-child {
                  border-bottom: 1px solid rgba(63,64,80,.18) !important;
                }
                .a4-page:last-child, .cahier-page:last-child { break-after: auto !important; page-break-after: auto !important; }
              `
            });

            const pdf = await page.pdf({
              width: '210mm',
              height: '297mm',
              scale: 1,
              printBackground: true,
              preferCSSPageSize: true,
              margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
            });

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="Cahier-de-texte-2026-2027.pdf"');
            res.end(Buffer.from(pdf));
          } finally {
            await browser.close();
          }
        } catch (error) {
          console.error('PDF generation error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error?.message || 'Erreur génération PDF' }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [normalizeSchoolCalendarPlugin(), react(), pdfApiPlugin()],
  build: {
    target: 'es2017',
    cssTarget: 'safari13'
  },
  esbuild: {
    target: 'es2017'
  }
});