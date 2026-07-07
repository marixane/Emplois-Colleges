const updatePageFiveActivities = () => {
  const page = document.querySelector('.cahier-preview-zone > .cahier-page:nth-child(5), .cahier-preview-zone > .a4-page:nth-child(5)');
  if (!page) return;

  page.querySelectorAll('div, h1, h2, h3, span').forEach((node) => {
    const text = String(node.textContent || '').trim().toUpperCase();

    if (text === 'CAHIER DE TEXTE') {
      node.textContent = 'Activités Pédagogiques';
      node.classList.add('page5-activities-title');
    }

    if (text === 'CLASSES DU GROUPE') {
      node.classList.add('page5-group-heading-hidden');
    }
  });
};

const schedulePageFiveActivitiesUpdate = () => window.requestAnimationFrame(updatePageFiveActivities);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', schedulePageFiveActivitiesUpdate, { once: true });
} else {
  schedulePageFiveActivitiesUpdate();
}

document.addEventListener('click', schedulePageFiveActivitiesUpdate, true);
document.addEventListener('focusout', schedulePageFiveActivitiesUpdate, true);
