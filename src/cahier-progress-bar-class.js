const tagHomeworkProgressBars = () => {
  document.querySelectorAll('.homework-page').forEach((page) => {
    const header = page.firstElementChild;
    const progressWrap = header?.children?.[1];
    const progressBar = progressWrap?.children?.[0];

    if (header) header.classList.add('cahier-homework-header');
    if (progressWrap) progressWrap.classList.add('cahier-progress-wrap');
    if (progressBar) progressBar.classList.add('cahier-progress-bar');
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tagHomeworkProgressBars, { once: true });
} else {
  tagHomeworkProgressBars();
}

const observer = new MutationObserver(tagHomeworkProgressBars);
observer.observe(document.documentElement, { childList: true, subtree: true });
