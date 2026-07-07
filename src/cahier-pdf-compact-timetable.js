const STORAGE_KEY = 'cahierCompactTimetablePdf';

const applyCompactTimetableState = (enabled) => {
  document.body.classList.toggle('compact-timetable-pdf', enabled);
  document.querySelectorAll('.timetable-table').forEach((table) => {
    table.classList.toggle('compact-pdf-hours', enabled);
  });
};

const arrangeTimetableControls = () => {
  const table = document.querySelector('.timetable-table');
  const total = document.querySelector('.total-hours-control');
  if (!table || !total) return null;

  const page = table.closest('.cahier-page');
  if (!page) return null;

  page.style.setProperty('position', 'relative', 'important');

  if (table.nextElementSibling !== total) {
    table.insertAdjacentElement('afterend', total);
  }

  total.style.setProperty('display', 'flex', 'important');
  total.style.setProperty('align-items', 'center', 'important');
  total.style.setProperty('justify-content', 'center', 'important');
  total.style.setProperty('width', 'fit-content', 'important');
  total.style.setProperty('min-width', '240px', 'important');
  total.style.setProperty('margin', '24px auto 0', 'important');
  total.style.setProperty('padding', '14px 28px', 'important');
  total.style.setProperty('border', '2px solid rgba(30,64,175,.22)', 'important');
  total.style.setProperty('border-radius', '16px', 'important');
  total.style.setProperty('background', 'linear-gradient(135deg,#eff6ff 0%,#ecfdf5 100%)', 'important');
  total.style.setProperty('box-shadow', '0 10px 24px rgba(15,23,42,.10)', 'important');
  total.style.setProperty('font-size', '20px', 'important');
  total.style.setProperty('font-weight', '800', 'important');
  total.style.setProperty('color', '#0f172a', 'important');
  total.style.setProperty('transform', 'none', 'important');

  return page;
};

const installCompactTimetableToggle = () => {
  const page = arrangeTimetableControls();
  if (!page) return;

  let wrapper = document.getElementById('compact-timetable-pdf-toggle');
  if (!wrapper) {
    wrapper = document.createElement('label');
    wrapper.id = 'compact-timetable-pdf-toggle';
    wrapper.className = 'compact-timetable-pdf-toggle no-print';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = localStorage.getItem(STORAGE_KEY) === '1';

    const text = document.createElement('span');
    text.textContent = 'PDF sans 12h–14h';

    checkbox.addEventListener('change', () => {
      const enabled = checkbox.checked;
      localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
      applyCompactTimetableState(enabled);
    });

    wrapper.append(checkbox, text);
  }

  if (wrapper.parentElement !== page) {
    page.prepend(wrapper);
  }

  wrapper.style.setProperty('position', 'absolute', 'important');
  wrapper.style.setProperty('top', '22px', 'important');
  wrapper.style.setProperty('left', '28px', 'important');
  wrapper.style.setProperty('z-index', '30', 'important');
  wrapper.style.setProperty('margin', '0', 'important');
  wrapper.style.setProperty('padding', '9px 14px', 'important');

  const checkbox = wrapper.querySelector('input');
  applyCompactTimetableState(Boolean(checkbox?.checked));
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installCompactTimetableToggle, { once: true });
} else {
  installCompactTimetableToggle();
}

new MutationObserver(installCompactTimetableToggle).observe(document.documentElement, {
  childList: true,
  subtree: true,
});
