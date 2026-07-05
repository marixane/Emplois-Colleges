import { toJpeg, toPng } from './html-to-image-local.js';
import { jsPDF } from 'jspdf';

const PDF_BUTTON_ID = 'cahier-pdf-export-button';
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
const nextFrame = () => new Promise((resolve) => window.requestAnimationFrame(resolve));

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

const filterNode = (node) => {
  if (!node) return true;
  if (node.id === PDF_BUTTON_ID) return false;
  if (['SCRIPT', 'STYLE', 'LINK'].includes(node.tagName)) return false;
  return true;
};

const captureWithHtmlToImage = async (page, pixelRatio = 1.4, png = false) => {
  const rect = page.getBoundingClientRect();
  const options = {
    backgroundColor: '#ffffff',
    pixelRatio,
    cacheBust: true,
    filter: filterNode,
    width: Math.ceil(rect.width || page.offsetWidth),
    height: Math.ceil(rect.height || page.offsetHeight),
    style: {
      transform: 'none',
      margin: '0',
      background: '#ffffff',
      color: '#111827',
      WebkitPrintColorAdjust: 'exact',
      printColorAdjust: 'exact'
    }
  };
  return png ? toPng(page, options) : toJpeg(page, { ...options, quality: 0.96 });
};

const addFailedPage = (pdf, pageNumber, error) => {
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, 'F');
  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(`Page ${pageNumber} non capturée`, 20, 40);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.text('La page a bloqué la capture automatique.', 20, 55);
  pdf.text(String(error?.message || error || 'Erreur inconnue').slice(0, 120), 20, 68);
};

const downloadCahierPdf = async (button) => {
  const pages = getCahierPages();
  if (!pages.length) return;

  const originalText = button.textContent;
  const failedPages = [];
  const originalScrollX = window.scrollX;
  const originalScrollY = window.scrollY;

  button.disabled = true;
  document.body.classList.add('cahier-pdf-exporting');

  try {
    setButtonStatus(button, 'Préparation...');
    await waitForFonts();
    await nextFrame();
    await wait(350);

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      setButtonStatus(button, `Page ${index + 1}/${pages.length}`);
      if (index > 0) pdf.addPage('a4', 'portrait');

      try {
        page.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' });
        await nextFrame();
        await wait(120);
        let image;
        try {
          image = await captureWithHtmlToImage(page, 1.4, false);
        } catch {
          image = await captureWithHtmlToImage(page, 1.0, true);
        }
        pdf.addImage(image, image.startsWith('data:image/png') ? 'PNG' : 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, 'FAST');
      } catch (error) {
        failedPages.push(index + 1);
        console.error(`Erreur export page ${index + 1}:`, error);
        addFailedPage(pdf, index + 1, error);
      }
      await wait(110);
    }

    setButtonStatus(button, 'Téléchargement...');
    await wait(220);
    pdf.save('Cahier-de-texte-2026-2027.pdf');
    if (failedPages.length) alert(`PDF téléchargé, mais ces pages ont bloqué : ${failedPages.join(', ')}`);
    setButtonStatus(button, 'PDF téléchargé');
    await wait(700);
  } catch (error) {
    console.error('Erreur export PDF cahier:', error);
    alert(`Erreur PDF globale : ${error?.message || 'export impossible sur ce navigateur'}`);
  } finally {
    window.scrollTo(originalScrollX, originalScrollY);
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
    button.title = 'Télécharger directement les pages A4 en PDF couleur';
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
