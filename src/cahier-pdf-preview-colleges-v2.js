const COLLEGE_PREVIEW_BUTTON_ID = 'college-cahier-pdf-preview-button';
const COLLEGE_DOWNLOAD_BUTTON_ID = 'cahier-pdf-button-stable';

const writePreviewLoadingPage = (previewWindow) => {
  previewWindow.document.open();
  previewWindow.document.write(`<!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Génération PDF…</title>
      </head>
      <body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a">
        <div style="text-align:center;padding:32px">
          <h2 style="margin:0 0 10px">Génération du PDF en cours…</h2>
          <p style="margin:0">Veuillez patienter.</p>
        </div>
      </body>
    </html>`);
  previewWindow.document.close();
};

const submitCollegePreview = (payload, previewWindow) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/api/cahier-pdf?preview=1';
  form.target = previewWindow.name;
  form.enctype = 'application/x-www-form-urlencoded';
  form.acceptCharset = 'UTF-8';
  form.style.display = 'none';

  const htmlField = document.createElement('textarea');
  htmlField.name = 'html';
  htmlField.value = payload.html;
  form.append(htmlField);

  const baseUrlField = document.createElement('input');
  baseUrlField.type = 'hidden';
  baseUrlField.name = 'baseUrl';
  baseUrlField.value = payload.baseUrl || window.location.origin;
  form.append(baseUrlField);

  document.body.append(form);
  form.submit();
  form.remove();
};

const captureCollegePdfPayload = (downloadButton) => new Promise((resolve, reject) => {
  const originalFetch = window.fetch.bind(window);
  const originalAnchorClick = HTMLAnchorElement.prototype.click;
  let finished = false;

  const restore = () => {
    window.fetch = originalFetch;
    HTMLAnchorElement.prototype.click = originalAnchorClick;
  };

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : String(input?.url || '');
    if (!url.includes('/api/cahier-pdf')) return originalFetch(input, init);

    try {
      const payload = typeof init.body === 'string' ? JSON.parse(init.body) : null;
      if (!payload?.html) throw new Error('Document PDF introuvable');
      finished = true;
      resolve(payload);

      return new Response(new Blob(['%PDF-1.4\n'], { type: 'application/pdf' }), {
        status: 200,
        headers: { 'Content-Type': 'application/pdf' }
      });
    } catch (error) {
      reject(error);
      throw error;
    } finally {
      window.setTimeout(restore, 100);
    }
  };

  HTMLAnchorElement.prototype.click = function suppressPreviewDownload() {
    if (String(this.download || '').toLowerCase().endsWith('.pdf')) return;
    return originalAnchorClick.call(this);
  };

  downloadButton.click();

  window.setTimeout(() => {
    if (finished) return;
    restore();
    reject(new Error('La génération PDF n’a pas démarré'));
  }, 15000);
});

const openCollegePdfPreview = async (button) => {
  const downloadButton = document.getElementById(COLLEGE_DOWNLOAD_BUTTON_ID);
  if (!downloadButton) {
    alert('Le bouton Télécharger PDF est introuvable.');
    return;
  }
  if (downloadButton.disabled || button.disabled) return;

  const previewWindow = window.open('about:blank', `college-pdf-${Date.now()}`);
  if (!previewWindow) {
    alert('Autorisez les fenêtres surgissantes pour voir le PDF.');
    return;
  }

  writePreviewLoadingPage(previewWindow);

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Génération PDF...';

  try {
    const payload = await captureCollegePdfPayload(downloadButton);
    submitCollegePreview(payload, previewWindow);
    button.textContent = 'Ouverture PDF...';
  } catch (error) {
    if (!previewWindow.closed) previewWindow.close();
    alert(`Erreur PDF : ${error?.message || 'aperçu impossible'}`);
  } finally {
    window.setTimeout(() => {
      button.disabled = false;
      button.textContent = originalText;
    }, 1200);
  }
};

const mountCollegePdfPreviewButton = () => {
  let button = document.getElementById(COLLEGE_PREVIEW_BUTTON_ID);

  if (!button) {
    button = document.createElement('button');
    button.id = COLLEGE_PREVIEW_BUTTON_ID;
    button.type = 'button';
    button.textContent = 'Voir le PDF';
    button.addEventListener('click', () => openCollegePdfPreview(button));
    document.body.append(button);
  }

  button.hidden = false;
  button.title = 'Générer et afficher le PDF complet du cahier de texte';
  button.style.cssText = 'position:fixed!important;left:22px!important;right:auto!important;bottom:22px!important;z-index:2147483647!important;display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;background:#111827!important;color:#fff!important;border:0!important;border-radius:14px!important;padding:13px 18px!important;font:900 14px Arial,sans-serif!important;box-shadow:0 8px 25px rgba(0,0,0,.35)!important;cursor:pointer!important;';
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountCollegePdfPreviewButton, { once: true });
} else {
  mountCollegePdfPreviewButton();
}

window.setTimeout(mountCollegePdfPreviewButton, 100);
window.setTimeout(mountCollegePdfPreviewButton, 500);
window.setInterval(mountCollegePdfPreviewButton, 1500);
