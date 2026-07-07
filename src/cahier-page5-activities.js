const updatePageFiveActivities = () => {
  const page = document.querySelector('.cahier-preview-zone .homework-cover-page');
  if (!page) return;

  page.classList.add('page5-activities-cover');

  page.querySelectorAll('div, h1, h2, h3, span').forEach((node) => {
    const text = String(node.textContent || '').trim().toUpperCase();

    if (text === 'CAHIER DE TEXTE') {
      node.textContent = 'Education College';
      node.classList.add('page5-education-kicker');
    }

    if (text === '1 AC' || text === '1AC') {
      node.textContent = 'Activites Pedagogiques';
      node.classList.add('page5-activities-main-title');
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
