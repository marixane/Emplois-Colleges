import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const PDF_BUTTON_ID = 'cahier-pdf-export-button';
const EXPORT_STAGE_ID = 'cahier-pdf-export-stage';
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PAGE_BATCH_DELAY = 160;

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

const safeSetStyle = (target, prop, value, priority = '') => {
  if (!value) return;
  if (value.includes('color-mix(') || value.includes('oklch(') || value.includes('lab(') || value.includes('var(')) return;
  try {
    target.style.setProperty(prop, value, priority);
  } catch {
    // Ignore styles that cannot be copied by Safari/html2canvas.
  }
};

const simplifyElementForCanvas = (node) => {
  try {
    node.style.animation = 'none';
    node.style.transition = 'none';
    node.style.filter = 'none';
    node.style.backdropFilter = 'none';
    node.style.webkitBackdropFilter = 'none';
    node.style.transformStyle = 'flat';
    node.style.contain = 'none';
    node.style.contentVisibility = 'visible';
  } catch {
    // ignore
  }
};

const copyComputedStyles = (source, target) => {
  const computed = window.getComputedStyle(source);
  for (let i = 0; i < computed.length; i += 1) {
    const prop = computed[i];
    safeSetStyle(target, prop, computed.getPropertyValue(prop), computed.getPropertyPriority(prop));
  }

  simplifyElementForCanvas(target);

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
  stage.style.cssText = 'position:absolute;left:-10000px;top:0;width:900px;min-height:1200px;overflow:visible;opacity:1;pointer-events:none;z-index:-1;background:#ffffff;';
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
  clone.style.background = '#ffffff';
  clone.style.backgroundColor = '#ffffff';
  clone.style.webkitPrintColorAdjust = 'exact';
  clone.style.printColorAdjust = 'exact';

  clone.querySelectorAll(`#${PDF_BUTTON_ID}, script, style, link`).forEach((node) => node.remove());
  clone.querySelectorAll('img').forEach((img) => {
    try {
      img.crossOrigin = 'anonymous';
      if (!img.complete || !img.naturalWidth) img.remove();
    } catch {
      img.remove();
    }
  });

  stage.innerHTML = '';
  stage.style.width = `${width}px`;
  stage.style.height = `${height}px`;
  stage.append(clone);
  return { clone, width, height };
};

const capturePage = async (page, stage, scale = 1.15) => {
  const { clone, width, height } = clonePageForExport(page, stage);
  await nextFrame();
  await wait(PAGE_BATCH_DELAY);

  return html2canvas(clone, {
    backgroundColor: '#ffffff',
    scale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    imageTimeout: 10000,
    removeContainer: true,
    foreignObjectRendering: false,
    width,
    height,
    windowWidth: width,
    windowHeight: height,
    scrollX: 0,
    scrollY: 0,
    ignoreElements: (element) => element.id === PDF_BUTTON_ID || element.tagName === 'SCRIPT' || element.tagName === 'STYLE' || element.tagName === 'LINK'
  });
};

const safeCanvasToImage = (canvas) => {
  try {
    return canvas.toDataURL('image/jpeg', 0.94);
  } catch {
    return canvas.toDataURL('image/png');
  }
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
    await wait(350);

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

    for (let index = 0; index < pages.length; index += 1) {
      const percent = Math.round((index / pages.length) * 100);
      setButtonStatus(button, `Préparation ${percent}%`);
      let canvas;
      try {
        canvas = await capturePage(pages[index], stage, 1.15);
      } catch {
        canvas = await capturePage(pages[index], stage, 0.9);
      }
      const image = safeCanvasToImage(canvas);
      if (index > 0) pdf.addPage('a4', 'portrait');
      pdf.addImage(image, image.startsWith('data:image/png') ? 'PNG' : 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, 'FAST');
      canvas.width = 1;
      canvas.height = 1;
      stage.innerHTML = '';
      await wait(140);
    }

    setButtonStatus(button, 'Téléchargement...');
    await wait(220);
    pdf.save('Cahier-de-texte-2026-2027.pdf');
    setButtonStatus(button, 'PDF téléchargé');
    await wait(700);
  } catch (error) {
    console.error('Erreur export PDF cahier:', error);
    alert(`Erreur PDF : ${error?.message || 'export impossible sur ce navigateur'}`);
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
