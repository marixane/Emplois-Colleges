const getEntryDateKey = (entry) => {
  const text = String(entry.querySelector('.homework-date')?.textContent || '');
  const match = text.match(/(\d{2})\/(\d{2})/);
  return match ? `${match[1]}/${match[2]}` : '';
};

const isCahierEventEntry = (entry) => {
  if (entry.classList.contains('cahier-extra-holiday-entry') || entry.classList.contains('cahier-exam-entry')) return true;
  const text = String(entry.querySelector('.homework-text')?.textContent || '');
  return /vacance|vacances|examen|rattrapage|procès-verbal/i.test(text);
};

const cleanCahierEventDays = () => {
  if (!document.body.classList.contains('cahier-tab-active')) return;

  document.querySelectorAll('.homework-page').forEach((page) => {
    const entries = Array.from(page.querySelectorAll('.homework-entry'));
    const eventDates = new Set(entries.filter(isCahierEventEntry).map(getEntryDateKey).filter(Boolean));

    entries.forEach((entry) => {
      if (isCahierEventEntry(entry)) return;
      const key = getEntryDateKey(entry);
      if (eventDates.has(key)) entry.remove();
    });
  });
};

let cahierEventCleanRaf = 0;
const scheduleCahierEventClean = () => {
  if (cahierEventCleanRaf) return;
  cahierEventCleanRaf = window.requestAnimationFrame(() => {
    cahierEventCleanRaf = 0;
    cleanCahierEventDays();
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleCahierEventClean, { once: true });
} else {
  scheduleCahierEventClean();
}

window.setTimeout(scheduleCahierEventClean, 500);
window.setTimeout(scheduleCahierEventClean, 1500);
window.setTimeout(scheduleCahierEventClean, 3000);

document.addEventListener('input', () => window.setTimeout(scheduleCahierEventClean, 180), { passive: true });
document.addEventListener('drop', () => window.setTimeout(scheduleCahierEventClean, 220), { passive: true });
document.addEventListener('mouseup', () => window.setTimeout(scheduleCahierEventClean, 220), { passive: true });
