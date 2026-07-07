const resizeClassLabels = () => {
  if (!document.body.classList.contains('cahier-tab-active')) return;

  document.querySelectorAll('.homework-subject > div').forEach((line) => {
    const label = line.querySelector('span:nth-child(2)');
    if (!label) return;

    label.style.removeProperty('width');
    label.style.removeProperty('max-width');
    label.style.setProperty('min-width', '0', 'important');
    label.style.setProperty('font-size', '14px', 'important');
    label.style.setProperty('font-weight', '900', 'important');
    label.style.setProperty('transform', 'none', 'important');
    label.style.setProperty('overflow', 'hidden', 'important');
    label.style.setProperty('contain', 'paint', 'important');
    label.style.setProperty('clip-path', 'inset(0)', 'important');
    label.style.setProperty('text-overflow', 'ellipsis', 'important');
    label.style.setProperty('white-space', 'nowrap', 'important');
  });
};

let classLabelFrame = 0;
const scheduleClassLabelResize = () => {
  cancelAnimationFrame(classLabelFrame);
  classLabelFrame = requestAnimationFrame(() => {
    resizeClassLabels();
    setTimeout(resizeClassLabels, 100);
    setTimeout(resizeClassLabels, 220);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleClassLabelResize, { once: true });
} else {
  scheduleClassLabelResize();
}

document.addEventListener('input', scheduleClassLabelResize, true);
document.addEventListener('focusout', scheduleClassLabelResize, true);
document.addEventListener('drop', scheduleClassLabelResize, true);
document.addEventListener('click', scheduleClassLabelResize, true);
