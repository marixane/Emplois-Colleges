const PDF_BUTTON_ID = 'cahier-pdf-button-stable';
const PDF_PREVIEW_BUTTON_ID = 'cahier-pdf-preview-stable';
const A4_WIDTH = '210mm';
const A4_HEIGHT = '297mm';
const EXIT_TEXT = 'Signature du Procès-verbal de sortie';
const EXIT_DATE = 'SAMEDI 10/07/2027';
const PDF_FILENAME = 'Cahier-de-texte-2026-2027.pdf';
const LEGACY_COVER_SELECTOR = '#cahier-main-cover-page, .cahier-main-cover-page, [data-force-first-page="true"]';
const COMPACT_PDF_HIDDEN_HOUR_START = 4;
const COMPACT_PDF_HIDDEN_HOUR_END = 6;
const PDF_BATCH_SIZE = 12;

const EXPORT_CSS = `
  @page { size: ${A4_WIDTH} ${A4_HEIGHT}; margin: 0; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box !important; }
  html, body { margin: 0 !important; padding: 0 !important; background: white !important; overflow: visible !important; }
  .cahier-preview-zone { display: block !important; width: ${A4_WIDTH} !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; transform: none !important; zoom: 1 !important; }
  .a4-page, .cahier-page {
    display: block !important;
    position: relative !important;
    width: ${A4_WIDTH} !important;
    min-width: ${A4_WIDTH} !important;
    max-width: ${A4_WIDTH} !important;
    height: ${A4_HEIGHT} !important;
    min-height: ${A4_HEIGHT} !important;
    max-height: ${A4_HEIGHT} !important;
    margin: 0 !important;
    transform: none !important;
    scale: 1 !important;
    zoom: 1 !important;
    overflow: hidden !important;
    box-shadow: none !important;
    break-after: page !important;
    page-break-after: always !important;
  }
  .a4-page:last-child, .cahier-page:last-child { break-after: auto !important; page-break-after: auto !important; }
  #${PDF_BUTTON_ID}, #${PDF_PREVIEW_BUTTON_ID}, .app-tabs, .no-print, button { display: none !important; }
  .homework-date { font-size: 28px !important; border-bottom: 2px dotted rgba(63,64,80,.5) !important; padding-bottom: 8px !important; }
  .homework-subject > div { grid-template-columns: 52px 1fr 34px !important; }
  .cahier-session-duration { display: inline-block !important; visibility: visible !important; opacity: 1 !important; color: rgba(55,65,81,.9) !important; font-size: 10px !important; font-weight: 900 !important; text-align: right !important; white-space: nowrap !important; }
`;

const clean = (value) => String(value || '').trim().toUpperCase().replace(/\s+/g, ' ');
const durationText = (span) => `${Math.max(Number(span) || 1, 1)}h`;

const addSchoolYear = (text) => String(text || '').replace(/\b(\d{2})\/(\d{2})(?!\/\d{4})\b/g, (_, day, month) => {
  const year = Number(month) >= 9 ? 2026 : 2027;
  return `${day}/${month}/${year}`;
});

const applyFullYearsForPdf = (zone) => {
  zone.querySelectorAll('.homework-date').forEach((element) => {
    element.textContent = addSchoolYear(element.textContent);
  });

  zone.querySelectorAll('.cahier-exams-list tbody tr').forEach((row) => {
    Array.from(row.cells).slice(0, 2).forEach((cell) => {
      cell.textContent = addSchoolYear(cell.textContent);
    });
  });
};

const getCss = () => Array.from(document.styleSheets).map((sheet) => {
  try { return Array.from(sheet.cssRules || []).map((rule) => rule.cssText).join('\n'); }
  catch { return ''; }
}).filter(Boolean).join('\n');

const getTimetableDurationsForPdf = () => {
  const map = new Map();
  const rows = Array.from(document.querySelectorAll('.timetable-table tbody tr'));

  rows.forEach((row) => {
    const day = clean(row.querySelector('.day-cell textarea')?.value || row.querySelector('.day-cell')?.textContent);
    let hourIndex = 0;

    Array.from(row.children).slice(1).forEach((cell) => {
      const text = clean(cell.querySelector('textarea')?.value || cell.textContent);
      const span = Number(cell.colSpan) || 1;
      if (!text) {
        hourIndex += span;
        return;
      }

      const header = document.querySelector(`.timetable-table thead th:nth-child(${hourIndex + 2}) textarea`);
      const hour = clean((header?.value || header?.textContent || '').split('-')[0]);
      map.set(`${day}|${hour}|${text}`, durationText(span));
      hourIndex += span;
    });
  });

  return map;
};

const getEntryDayForPdf = (entry) => clean((entry.querySelector('.homework-date')?.textContent || '').split(' ')[0]);

const applySessionDurationsForPdf = (zone) => {
  const durations = getTimetableDurationsForPdf();

  zone.querySelectorAll('.homework-entry:not(.cahier-extra-holiday-entry):not(.cahier-exam-entry)').forEach((entry) => {
    const day = getEntryDayForPdf(entry);

    entry.querySelectorAll('.homework-subject > div').forEach((line) => {
      const spans = line.querySelectorAll('span');
      const hour = clean(spans[0]?.textContent);
      const className = clean(spans[1]?.textContent);
      if (!hour || !className) return;

      let durationNode = line.querySelector('.cahier-session-duration');
      if (!durationNode) {
        durationNode = document.createElement('span');
        durationNode.className = 'cahier-session-duration';
        line.append(durationNode);
      }
      durationNode.textContent = durations.get(`${day}|${hour}|${className}`) || '1h';
    });
  });
};

const firstDateInfo = (text) => {
  const match = String(text || '').match(/(\d{2})\/(\d{2})/);
  return match ? { day: Number(match[1]), month: Number(match[2]) } : null;
};

const isAfterJuly10 = (text) => {
  const date = firstDateInfo(text);
  return date?.month === 7 && date.day > 10;
};

const prepareClone = (clone) => {
  clone.querySelectorAll(`#${PDF_BUTTON_ID}, #${PDF_PREVIEW_BUTTON_ID}, script, style, link`).forEach((node) => node.remove());
  clone.querySelectorAll('textarea').forEach((textarea) => {
    textarea.textContent = textarea.value;
    textarea.setAttribute('value', textarea.value);
  });
  clone.querySelectorAll('input').forEach((input) => input.setAttribute('value', input.value));
  clone.querySelectorAll('.cahier-extra-holiday-entry .homework-text, .cahier-exam-entry .homework-text').forEach((box) => {
    box.style.setProperty('box-sizing', 'border-box', 'important');
    box.style.setProperty('align-self', 'center', 'important');
    box.style.setProperty('width', 'calc(100% - 56px)', 'important');
    box.style.setProperty('height', '88px', 'important');
    box.style.setProperty('min-height', '88px', 'important');
    box.style.setProperty('max-height', '88px', 'important');
    box.style.setProperty('margin', 'auto 28px', 'important');
    box.style.setProperty('border-radius', '12px', 'important');
  });
  clone.style.setProperty('width', A4_WIDTH, 'important');
  clone.style.setProperty('height', A4_HEIGHT, 'important');
  clone.style.setProperty('margin', '0', 'important');
  clone.style.setProperty('transform', 'none', 'important');
  clone.style.setProperty('zoom', '1', 'important');
  clone.style.setProperty('overflow', 'hidden', 'important');
};

const prepareCompactTimetablesForPdf = (zone) => {
  const keepCellPart = (cell, span, startsAfterBreak = false) => {
    cell.colSpan = span;
    if (startsAfterBreak) {
      cell.classList.add('cahier-pdf-after-break');
      cell.style.setProperty('border-left', '4px solid #000', 'important');
    }
  };

  const transformRow = (row) => {
    let logicalHourIndex = 0;

    Array.from(row.cells).slice(1).forEach((cell) => {
      const originalSpan = Math.max(Number(cell.colSpan) || 1, 1);
      const cellEnd = logicalHourIndex + originalSpan;
      const beforeBreakSpan = Math.max(
        0,
        Math.min(cellEnd, COMPACT_PDF_HIDDEN_HOUR_START) - logicalHourIndex,
      );
      const afterBreakSpan = Math.max(
        0,
        cellEnd - Math.max(logicalHourIndex, COMPACT_PDF_HIDDEN_HOUR_END),
      );

      if (beforeBreakSpan > 0 && afterBreakSpan > 0) {
        const afterBreakCell = cell.cloneNode(true);
        keepCellPart(cell, beforeBreakSpan);
        keepCellPart(afterBreakCell, afterBreakSpan, true);
        cell.after(afterBreakCell);
      } else if (beforeBreakSpan > 0) {
        keepCellPart(cell, beforeBreakSpan);
      } else if (afterBreakSpan > 0) {
        keepCellPart(
          cell,
          afterBreakSpan,
          logicalHourIndex <= COMPACT_PDF_HIDDEN_HOUR_END,
        );
      } else {
        cell.remove();
      }

      logicalHourIndex = cellEnd;
    });
  };

  zone.querySelectorAll('.timetable-table.compact-pdf-hours').forEach((table) => {
    table.querySelectorAll('thead tr, tbody tr').forEach(transformRow);
    table.style.setProperty('width', '96%', 'important');
    table.style.setProperty('margin-left', 'auto', 'important');
    table.style.setProperty('margin-right', 'auto', 'important');
    table.style.setProperty('table-layout', 'fixed', 'important');
    table.dataset.cahierPdfCompactNormalized = 'true';
    table.classList.remove('compact-pdf-hours');
  });
};

const removeAfterJuly10 = (zone) => {
  zone.querySelectorAll('.homework-entry').forEach((entry) => {
    const dateText = entry.querySelector('.homework-date')?.textContent || entry.textContent;
    if (isAfterJuly10(dateText)) entry.remove();
  });

  zone.querySelectorAll('.homework-page').forEach((page) => {
    if (!page.querySelector('.homework-entry')) page.remove();
  });
};

const getGroupKey = (page) => {
  const color = page.style.getPropertyValue('--group-color').trim();
  const title = page.firstElementChild?.textContent?.trim() || '';
  return color || title;
};

const makeExitPage = (sourcePage) => {
  const color = sourcePage?.style?.getPropertyValue('--group-color')?.trim() || '#fef3c7';
  const page = document.createElement('div');
  page.className = 'a4-page cahier-page homework-page cahier-pdf-exit-page';
  page.style.cssText = `position:relative;padding-top:60px;--group-color:${color};`;

  const header = sourcePage?.firstElementChild?.cloneNode(true) || document.createElement('div');
  if (!header.textContent?.trim()) header.textContent = 'Collège';
  page.append(header);

  const section = document.createElement('section');
  section.className = 'homework-entry cahier-extra-holiday-entry';
  section.dataset.sort = '20270710';
  section.style.setProperty('--homework-color', '#38bdf8');
  section.innerHTML = '<div class="homework-date">' + EXIT_DATE + '</div><div class="homework-content"><div class="homework-subject"><div><span>Collège</span></div></div><div class="homework-text" style="color:#1e3a8a;font-size:21px;font-weight:900;text-align:center;background:linear-gradient(90deg,rgba(191,219,254,.45),rgba(219,234,254,.82));border:1px solid rgba(37,99,235,.28);border-radius:12px;margin:8px 18px;padding:10px 16px">' + EXIT_TEXT + '</div></div>';
  page.append(section);
  return page;
};

const appendExitPageForEachGroup = (zone) => {
  const groups = [];
  Array.from(zone.querySelectorAll('.homework-page:not(.cahier-pdf-exit-page)')).forEach((page) => {
    const key = getGroupKey(page);
    if (!key) return;
    let group = groups.find((item) => item.key === key);
    if (!group) {
      group = { key, pages: [] };
      groups.push(group);
    }
    group.pages.push(page);
  });

  groups.forEach((group) => {
    if (group.pages.some((page) => String(page.textContent || '').includes(EXIT_TEXT))) return;
    const lastPage = group.pages[group.pages.length - 1];
    if (lastPage) lastPage.after(makeExitPage(lastPage));
  });
};

const ensurePdfIncludesJuly10 = (zone) => {
  const text = String(zone.textContent || '');
  if (text.includes(EXIT_DATE) && text.includes(EXIT_TEXT)) return;

  const lastHomeworkPage = Array.from(zone.querySelectorAll('.homework-page')).pop();
  zone.append(makeExitPage(lastHomeworkPage));
};

const keepReferencePagesLast = (zone) => {
  const examsPages = Array.from(zone.querySelectorAll('#cahier-exams-groups-page, .cahier-exams-groups-page'));
  const holidaysPages = Array.from(zone.querySelectorAll('#cahier-holidays-page, .holidays-page'));
  const examsPage = examsPages[examsPages.length - 1];
  const holidaysPage = holidaysPages[holidaysPages.length - 1];

  examsPages.slice(0, -1).forEach((page) => page.remove());
  holidaysPages.slice(0, -1).forEach((page) => page.remove());
  if (examsPage) zone.append(examsPage);
  if (holidaysPage) zone.append(holidaysPage);
};

const buildExportHtml = () => {
  const pages = Array.from(document.querySelectorAll('.cahier-preview-zone .a4-page, .cahier-preview-zone .cahier-page')).filter((page) => {
    if (page.matches(LEGACY_COVER_SELECTOR)) return false;
    const rect = page.getBoundingClientRect();
    const style = window.getComputedStyle(page);
    return rect.width > 50 && rect.height > 50 && style.display !== 'none' && style.visibility !== 'hidden';
  });

  if (!pages.length) throw new Error('Aucune page A4 trouvée');

  const zone = document.createElement('div');
  zone.className = 'cahier-preview-zone';
  zone.style.setProperty('width', A4_WIDTH, 'important');
  zone.style.setProperty('display', 'block', 'important');
  zone.style.setProperty('margin', '0', 'important');
  zone.style.setProperty('padding', '0', 'important');

  pages.forEach((page) => {
    const clone = page.cloneNode(true);
    prepareClone(clone);
    zone.append(clone);
  });

  prepareCompactTimetablesForPdf(zone);
  applySessionDurationsForPdf(zone);
  removeAfterJuly10(zone);
  // Projet Collèges : aucune entrée bleue administrative ajoutée automatiquement.
  applyFullYearsForPdf(zone);
  keepReferencePagesLast(zone);

  return `<style>${getCss()}\n${EXPORT_CSS}</style>${zone.outerHTML}`;
};

const nextPaint = () => new Promise((resolve) => window.requestAnimationFrame(() => resolve()));

const getOrderedExportPages = () => {
  const pages = Array.from(document.querySelectorAll('.cahier-preview-zone .a4-page, .cahier-preview-zone .cahier-page')).filter((page) => {
    if (page.matches(LEGACY_COVER_SELECTOR)) return false;
    const rect = page.getBoundingClientRect();
    const style = window.getComputedStyle(page);
    return rect.width > 50 && rect.height > 50 && style.display !== 'none' && style.visibility !== 'hidden';
  });

  if (!pages.length) throw new Error('Aucune page A4 trouvée');

  const isExamsPage = (page) => page.matches('#cahier-exams-groups-page, .cahier-exams-groups-page');
  const isHolidaysPage = (page) => page.matches('#cahier-holidays-page, .holidays-page');
  const regularPages = pages.filter((page) => !isExamsPage(page) && !isHolidaysPage(page));
  const examsPage = pages.filter(isExamsPage).pop();
  const holidaysPage = pages.filter(isHolidaysPage).pop();
  return [...regularPages, ...(examsPage ? [examsPage] : []), ...(holidaysPage ? [holidaysPage] : [])];
};

const buildExportChunkHtml = async (sourcePages, css, onClone) => {
  const zone = document.createElement('div');
  zone.className = 'cahier-preview-zone';
  zone.style.setProperty('width', A4_WIDTH, 'important');
  zone.style.setProperty('display', 'block', 'important');
  zone.style.setProperty('margin', '0', 'important');
  zone.style.setProperty('padding', '0', 'important');

  for (const page of sourcePages) {
    const clone = page.cloneNode(true);
    prepareClone(clone);
    zone.append(clone);
    onClone();
    await nextPaint();
  }

  prepareCompactTimetablesForPdf(zone);
  applySessionDurationsForPdf(zone);
  removeAfterJuly10(zone);
  applyFullYearsForPdf(zone);
  if (!zone.querySelector('.a4-page, .cahier-page')) return '';
  return `<style>${css}\n${EXPORT_CSS}</style>${zone.outerHTML}`;
};

const requestPdfChunk = async (html) => {
  const response = await fetch('/api/cahier-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, baseUrl: window.location.origin })
  });

  if (!response.ok) {
    let message = 'Erreur génération PDF';
    try { message = (await response.json()).error || message; } catch { /* ignore */ }
    throw new Error(message);
  }
  return response.arrayBuffer();
};

const buildProgressivePdf = async (onProgress) => {
  const { PDFDocument } = await import('pdf-lib');
  const pages = getOrderedExportPages();
  const css = getCss();
  const mergedPdf = await PDFDocument.create();
  let preparedPages = 0;

  for (let start = 0; start < pages.length; start += PDF_BATCH_SIZE) {
    const batch = pages.slice(start, start + PDF_BATCH_SIZE);
    const html = await buildExportChunkHtml(batch, css, () => {
      preparedPages += 1;
      onProgress(preparedPages, pages.length, 'Préparation');
    });
    if (!html) continue;

    onProgress(Math.min(start + batch.length, pages.length), pages.length, 'Génération');
    const chunkBytes = await requestPdfChunk(html);
    const chunkPdf = await PDFDocument.load(chunkBytes);
    const copiedPages = await mergedPdf.copyPages(chunkPdf, chunkPdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
    await nextPaint();
  }

  onProgress(pages.length, pages.length, 'Finalisation');
  const bytes = await mergedPdf.save({ useObjectStreams: true });
  return new Blob([bytes], { type: 'application/pdf' });
};

const downloadPdf = (pdfBlob) => {
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = PDF_FILENAME;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
};

const showPreviewLoading = (previewWindow) => {
  previewWindow.document.open();
  previewWindow.document.write('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Génération PDF…</title></head><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a"><div style="text-align:center"><h2>Génération du PDF en cours…</h2><p>Veuillez patienter.</p></div></body></html>');
  previewWindow.document.close();
};

const submitPreviewForm = (html, previewWindow) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/api/cahier-pdf?preview=1';
  form.target = previewWindow.name;
  form.enctype = 'application/x-www-form-urlencoded';
  form.acceptCharset = 'UTF-8';
  form.style.display = 'none';

  const htmlField = document.createElement('textarea');
  htmlField.name = 'html';
  htmlField.value = html;
  form.append(htmlField);

  const baseUrlField = document.createElement('input');
  baseUrlField.type = 'hidden';
  baseUrlField.name = 'baseUrl';
  baseUrlField.value = window.location.origin;
  form.append(baseUrlField);

  document.body.append(form);
  form.submit();
  form.remove();
};

const exportPdf = async (button, mode = 'download') => {
  const original = button.textContent;
  let previewWindow = null;

  if (mode === 'preview') {
    const targetName = `cahier-pdf-preview-${Date.now()}`;
    previewWindow = window.open('about:blank', targetName);
    if (!previewWindow) {
      alert('Autorisez les fenêtres surgissantes pour voir le PDF.');
      return;
    }
    showPreviewLoading(previewWindow);
  }

  button.disabled = true;
  button.textContent = 'Préparation PDF...';

  try {
    if (document.fonts?.ready) await document.fonts.ready;

    /* L'aperçu conserve le chemin serveur existant afin de rester compatible
       avec Safari et d'éviter les pages blanches liées aux URL blob. */
    if (mode === 'preview') {
      const html = buildExportHtml();
      submitPreviewForm(html, previewWindow);
      button.textContent = 'PDF en cours...';
      window.setTimeout(() => {
        button.textContent = original;
        button.disabled = false;
      }, 1500);
      return;
    }

    const blob = await buildProgressivePdf((done, total, stage) => {
      button.textContent = `${stage} ${done}/${total}`;
    });

    button.textContent = 'Téléchargement...';
    downloadPdf(blob);
    button.textContent = 'PDF téléchargé';
    window.setTimeout(() => { button.textContent = original; }, 900);
  } catch (error) {
    if (previewWindow && !previewWindow.closed) previewWindow.close();
    alert(`Erreur PDF : ${error?.message || 'export impossible'}`);
    button.textContent = original;
  } finally {
    if (mode !== 'preview') button.disabled = false;
  }
};

const styleButton = (button, side) => {
  button.hidden = false;
  const bottomPosition = side === 'left' ? 146 : 82;
  button.style.cssText = `position:fixed!important;left:8px!important;right:auto!important;bottom:${bottomPosition}px!important;z-index:2147483647!important;display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;box-sizing:border-box!important;border:1px solid #15803d!important;border-bottom:2px solid #14532d!important;border-radius:10px!important;padding:7px 12px!important;width:334px!important;height:50px!important;max-width:calc(100vw - 24px)!important;min-width:0!important;background:linear-gradient(180deg,#4ade80 0%,#16a34a 52%,#15803d 100%)!important;color:white!important;font:900 21px Arial,sans-serif!important;text-shadow:0 1px 1px rgba(0,0,0,.38)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 4px 0 #14532d,0 7px 13px rgba(0,0,0,.3)!important;transform:translateY(-2px)!important;cursor:pointer!important;transition:transform .12s ease,box-shadow .12s ease!important;`;
};

const freshButton = (id) => {
  const existing = document.getElementById(id);
  const button = document.createElement('button');
  button.id = id;
  button.type = 'button';
  if (existing) existing.replaceWith(button);
  else document.body.append(button);
  return button;
};

const createButtons = () => {
  const downloadButton = freshButton(PDF_BUTTON_ID);
  downloadButton.textContent = 'Télécharger PDF';
  downloadButton.title = 'Télécharger toutes les pages A4 en PDF';
  styleButton(downloadButton, 'right');
  downloadButton.addEventListener('click', () => exportPdf(downloadButton, 'download'));

  const previewButton = freshButton(PDF_PREVIEW_BUTTON_ID);
  previewButton.textContent = 'Voir PDF';
  previewButton.title = 'Générer et ouvrir toutes les pages A4 dans un nouvel onglet';
  styleButton(previewButton, 'left');
  previewButton.addEventListener('click', () => exportPdf(previewButton, 'preview'));
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createButtons, { once: true });
} else {
  createButtons();
}
