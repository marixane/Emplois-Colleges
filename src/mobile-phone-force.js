function applyMobilePhoneForce() {
  var existing = document.getElementById('mobile-phone-force-style');
  if (existing) existing.remove();

  var style = document.createElement('style');
  style.id = 'mobile-phone-force-style';
  style.textContent = `
    @media (max-width: 1200px) {
      html,
      body,
      #root {
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }

      body .education-top-navbar {
        display: none !important;
      }

      body .app-shell {
        width: 100vw !important;
        height: 100vh !important;
        min-width: 100vw !important;
        max-width: 100vw !important;
        min-height: 100vh !important;
        max-height: 100vh !important;
        display: grid !important;
        grid-template-columns: 10vw 90vw !important;
        grid-template-rows: 100vh !important;
        gap: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: hidden !important;
        flex-direction: initial !important;
        flex-wrap: initial !important;
        align-items: stretch !important;
      }

      body .panel {
        grid-column: 1 !important;
        width: 10vw !important;
        min-width: 10vw !important;
        max-width: 10vw !important;
        flex: 0 0 10vw !important;
        flex-basis: 10vw !important;
        height: 100vh !important;
        min-height: 100vh !important;
        max-height: 100vh !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 5px !important;
        padding: 6px 3px !important;
        margin: 0 !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        box-sizing: border-box !important;
        border-radius: 0 !important;
        border-right: 1px solid #cbd5e1 !important;
        background: #ffffff !important;
        box-shadow: none !important;
        position: relative !important;
        left: auto !important;
        top: auto !important;
        transform: none !important;
        scale: 1 !important;
      }

      body .panel::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
      }

      body .page-date-control,
      body .page-date-picker,
      body .page-date-title,
      body .page-date-input,
      body .page-date-toggle,
      body .page-date-toggle-button,
      body .panel .eyebrow,
      body .panel h1,
      body .panel .intro,
      body .panel .form-group > label,
      body .exercise-count-section h2,
      body .note-scale-title,
      body .note-scale-counter,
      body .page-count-card label {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }

      body .panel .form-group,
      body .assignment-control,
      body .note-scale-control,
      body .note-scale-buttons,
      body .exercise-count-section,
      body .page-count-grid,
      body .page-count-card,
      body .page-count-card .compact-control {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 5px !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        box-sizing: border-box !important;
      }

      body .panel button,
      body .assignment-control button,
      body .note-scale-button,
      body .pdf-lines-toggle,
      body .bar-ribbon-toggle,
      body .panel > button:not(.pdf-lines-toggle):not(.bar-ribbon-toggle),
      body .page-count-card .compact-control button {
        width: 30px !important;
        min-width: 30px !important;
        max-width: 30px !important;
        height: 30px !important;
        min-height: 30px !important;
        padding: 0 !important;
        margin: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 9px !important;
        font-size: 0 !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
      }

      body .panel button::before,
      body .assignment-control button::before,
      body .note-scale-button::before,
      body .pdf-lines-toggle::before,
      body .bar-ribbon-toggle::before,
      body .page-count-card .compact-control button::before {
        position: static !important;
        width: auto !important;
        height: auto !important;
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        font-size: 14px !important;
        font-weight: 900 !important;
        color: currentColor !important;
      }

      body .assignment-control button:nth-child(1)::before { content: 'I' !important; }
      body .assignment-control button:nth-child(2)::before { content: 'M' !important; }
      body .note-scale-button:nth-child(1)::before { content: '10' !important; font-size: 12px !important; }
      body .note-scale-button:nth-child(2)::before { content: '20' !important; font-size: 12px !important; }
      body .pdf-lines-toggle::before { content: 'L' !important; }
      body .bar-ribbon-toggle::before { content: 'Pts' !important; font-size: 10px !important; }
      body .pdf-lines-toggle::after,
      body .bar-ribbon-toggle::after { content: '' !important; display: none !important; }

      body .page-count-card .compact-control strong {
        width: 30px !important;
        min-width: 30px !important;
        max-width: 30px !important;
        height: 22px !important;
        line-height: 22px !important;
        padding: 0 !important;
        border-radius: 7px !important;
        font-size: 11px !important;
      }

      body .page-count-card .compact-control strong::after { content: '' !important; display: none !important; }
      body .page-count-card .compact-control button:first-child::before { content: '-' !important; }
      body .page-count-card .compact-control button:last-child::before { content: '+' !important; }
      body .panel > button.secondary::before { content: 'PDF' !important; font-size: 9px !important; }

      body .preview-zone {
        grid-column: 2 !important;
        width: 90vw !important;
        min-width: 90vw !important;
        max-width: 90vw !important;
        flex: 0 0 90vw !important;
        flex-shrink: 1 !important;
        height: 100vh !important;
        min-height: 100vh !important;
        max-height: 100vh !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        justify-content: flex-start !important;
        justify-items: start !important;
        gap: 18px !important;
        padding: 8px 0 40px 6px !important;
        margin: 0 !important;
        overflow: auto !important;
        box-sizing: border-box !important;
        background: #e8edf4 !important;
        border-left: 0 !important;
        transform: none !important;
      }

      body .preview-zone .a4-page,
      body .a4-page {
        transform: scale(0.52) !important;
        transform-origin: top left !important;
        margin: 0 0 -375px 0 !important;
        flex: 0 0 auto !important;
        translate: 0 0 !important;
      }
    }

    @media (max-width: 430px) {
      body .preview-zone .a4-page,
      body .a4-page {
        transform: scale(0.50) !important;
        margin-bottom: -400px !important;
      }
    }
  `;
  document.head.appendChild(style);
}

applyMobilePhoneForce();
setTimeout(applyMobilePhoneForce, 100);
setTimeout(applyMobilePhoneForce, 500);
setTimeout(applyMobilePhoneForce, 1000);
