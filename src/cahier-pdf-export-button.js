import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const PDF_BUTTON_ID = 'cahier-pdf-export-button';
const EXPORT_STAGE_ID = 'cahier-pdf-export-stage';
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PAGE_BATCH_DELAY = 120;

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
const nextFrame = () => new Promise((resolve) => window.requestAnimationFrame(() => resolve()));

const waitForFonts = async () => {
  if (document.fonts?.ready) {
    try { await document.fonts.ready; } catch { /* ignore */ }
  }
};

const getCahierPages = () => Array.from(document.querySelectorAll('.cahier-preview-zone .a4-page, .cahier-preview-zone .cahier-page'))
  .filter((page, index, pages) => page.offsetParent !== null && pages.indexOf(page) === index);

const setButtonStatus = (button, text) => {
  button.textContent = text;
  button.setAttribute('aria-label', text);
};

const copyComputedStyles = (source, target) => {
  const computed = window.getComputedStyle(source);
  for (let i = 0; i < computed.length; i += 1) {
    const prop = computed[i];
    const value = computed.getPropertyValue(prop);
    if (value && !value.includes('color-mix(') && !value.includes('oklch(') && !value.includes('lab(')) {
      target.style.setProperty(prop, value, computed.getPropertyPriority(prop));
    }
  }

  if (source instanceof HTMLTextAreaElement && target instanceof HTMLTextAreaElement) {
    target.value = source.value;
    target.textContent = source.value;
  }
  if (source instanceof HTMLInputElement && target instanceof HTMLInputElement) target.value = source.value;

  Array.from(source.children).forEach((child, index) => {
    if (target.children[index]) copyComputedStyles(child, target.children[index]);
  });
};

const makeExportStage = () => {
  document.getElementById(EXPORT_STAGE_ID)?.remove();
  const stage = document.createElement('div');
  stage.id = EXPORT_STAGE_ID;
  stage.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1;background:white;';
  document.body.append(stage);
  return stage;
};

const clonePageForExport = (page, stage) => {
  const rect = page.getBoundingClientRect();
  const width = Math.ceil(rect.width || page.offsetWidth || 794);
  const height = Math.ceil(rect.height || page.offsetHeight || 1123);
  const clone = page.cloneNode(true);

  copyComputedStyles(page, clone);
  clone.style.position = 'relative';
  clone.style.left = '0';
  clone.style.top = '0';
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.minWidth = `${width}px`;
  clone.style.minHeight = `${height}px`;
  clone.style.maxWidth = `${width}px`;
  clone.style.maxHeight = `${height}px`;
  clone.style.margin = '0';
  clone.style.transform = 'none';
  clone.style.opacity = '1';
  clone.style.backgroundColor = '#ffffff';
  clone.style.webkitPrintColorAdjust = 'exact';
  clone.style.printColorAdjust = 'exact';

  clone.querySelectorAll(`#${PDF_BUTTON_ID}`).forEach((node) => node.remove());
  stage.innerHTML = '';
  stage.style.width = `${width}px`;
  stage.style.height = `${height}px`;
  stage.append(clone);
  return { clone, width, height };
};

const capturePage = async (page, stage) => {
  const { clone, width, height } = clonePageForExport(page, stage);
  await nextFrame();
  await wait(PAGE_BATCH_DELAY);

  return html2canvas(clone, {
    backgroundColor: '#ffffff',
    scale: 1.35,
    useCORS: true,
    allowTaint: true,
    logging: false,
    imageTimeout: 30000,
    removeContainer: true,
    foreignObjectRendering: false,
    width,
    height,
    windowWidth: width,
    windowHeight: height,
    scrollX: 0,
    scrollY: 0
  });
};

const downloadCahierPdf = async (button) => {
  const pages = getCahierPages();
  if (!pages.length) return;

  const originalText = button.textContent;
  const stage = makeExportStage();

  button.disabled = true;
  document.body.classList.add('cahier-pdf-exporting');

  try {
    setButtonStatus(button, 'Préparation 0%');
    await waitForFonts();
    await nextFrame();
    await wait(300);

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

    for (let index = 0; index < pages.length; index += 1) {
      const percent = Math.round((index / pages.length) * 100);
      setButtonStatus(button, `Préparation ${percent}%`);
      const canvas = await capturePage(pages[index], stage);
      const image = canvas.toDataURL('image/jpeg', 0.96);
      if (index > 0) pdf.addPage('a4', 'portrait');
      pdf.addImage(image, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, 'FAST');
      canvas.width = 1;
      canvas.height = 1;
      stage.innerHTML = '';
      await wait(100);
    }

    setButtonStatus(button, 'Téléchargement...');
    await wait(220);
    pdf.save('Cahier-de-texte-2026-2027.pdf');
    setButtonStatus(button, 'PDF téléchargé');
    await wait(700);
  } catch (error) {
    console.error('Erreur export PDF cahier:', error);
    alert(`Erreur pendant la préparation du PDF : ${error?.message || 'erreur inconnue'}`);
  } finally {
    stage.remove();
    document.body.classList.remove('cahier-pdf-exporting');
    button.disabled = false;
    button.textContent = originalText;
    button.setAttribute('aria-label', 'Télécharger directement les pages A4 en PDF couleur');
  }
};

const ensureCahierPdfButton = () => {
  let button = document.getElementById(PDF_BUTTON_ID);
  if (!button) {
    button = document.createElement('button');
    button.id = PDF_BUTTON_ID;
    button.type = 'button';
    button.className = 'cahier-pdf-export-button';
    button.textContent = 'Télécharger PDF';
    button.title = 'Préparer puis télécharger les pages A4 en PDF couleur';
    button.setAttribute('aria-label', 'Télécharger directement les pages A4 en PDF couleur');
    button.addEventListener('click', () => downloadCahierPdf(button));
    document.body.append(button);
  }
  button.hidden = !document.body.classList.contains('cahier-tab-active');
};

const scheduleCahierPdfButton = () => window.requestAnimationFrame(ensureCahierPdfButton);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleCahierPdfButton, { once: true });
} else {
  scheduleCahierPdfButton();
}

new MutationObserver(scheduleCahierPdfButton).observe(document.body, {
  attributes: true,
  attributeFilter: ['class'],
  childList: true,
  subtree: false
});
