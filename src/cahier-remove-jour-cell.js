const removeJourHeaderCell = () => {
  document.querySelectorAll('.timetable-table thead tr').forEach((row) => {
    const cell = row.children?.[0];
    if (!cell) return;

    cell.textContent = '';
    cell.style.setProperty('background', 'transparent', 'important');
    cell.style.setProperty('background-color', 'transparent', 'important');
    cell.style.setProperty('border', '0', 'important');
    cell.style.setProperty('box-shadow', 'none', 'important');
    cell.style.setProperty('color', 'transparent', 'important');
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', removeJourHeaderCell, { once: true });
} else {
  removeJourHeaderCell();
}

new MutationObserver(removeJourHeaderCell).observe(document.documentElement, {
  childList: true,
  subtree: true,
});
