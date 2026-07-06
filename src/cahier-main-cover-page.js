const COVER_ID = 'cahier-main-cover-page';

const getFilledClasses = () => {
  const values = Array.from(document.querySelectorAll('.timetable-table tbody td:not(.day-cell) textarea'))
    .map((input) => String(input.value || input.textContent || '').trim())
    .filter((value) => value && value.toLowerCase() !== 'classe');
  return [...new Set(values)];
};

const createCoverPage = () => {
  const page = document.createElement('div');
  page.id = COVER_ID;
  page.className = 'a4-page cahier-page cahier-main-cover-page';
  page.innerHTML = `
    <div class="cahier-cover-top-pattern"></div>
    <div class="cahier-cover-ministry">
      <div class="cahier-cover-emblem">★</div>
      <div>
        <div>Royaume du Maroc</div>
        <div>Ministère de l'Éducation Nationale</div>
      </div>
    </div>
    <div class="cahier-cover-fields-top">
      <div>Académie régionale : <span contenteditable="true"></span></div>
      <div>Direction provinciale : <span contenteditable="true"></span></div>
    </div>
    <div class="cahier-cover-map-wrap" aria-hidden="true">
      <svg class="cahier-cover-map" viewBox="0 0 220 300" role="img">
        <path d="M118 8 C98 24 98 45 82 58 C60 76 50 96 58 119 C65 139 50 159 61 184 C68 202 88 207 91 228 C94 249 76 263 87 285 C101 276 109 255 128 242 C150 227 154 207 145 184 C137 163 151 144 142 125 C132 106 149 84 139 63 C132 48 137 24 118 8 Z" />
        <path class="cahier-cover-sahara" d="M91 228 C98 252 88 269 87 285 C105 278 125 268 139 252 C153 235 156 217 145 184 C137 202 116 213 91 228 Z" />
      </svg>
      <div class="cahier-cover-star">★</div>
    </div>
    <div class="cahier-cover-title-block">
      <div class="cahier-cover-small-title">Mon cahier</div>
      <h1>Cahier de textes</h1>
      <div class="cahier-cover-year">Année scolaire 2026 / 2027</div>
    </div>
    <div class="cahier-cover-info-card">
      <div><strong>Nom :</strong><span contenteditable="true"></span></div>
      <div><strong>Établissement :</strong><span contenteditable="true"></span></div>
      <div><strong>Matière :</strong><span contenteditable="true"></span></div>
    </div>
    <div class="cahier-cover-classes-card">
      <div class="cahier-cover-classes-title">Classes remplies dans l'emploi du temps</div>
      <div class="cahier-cover-classes-list"></div>
    </div>
  `;
  return page;
};

const updateCoverClasses = (page) => {
  const list = page.querySelector('.cahier-cover-classes-list');
  if (!list) return;
  const classes = getFilledClasses();
  list.innerHTML = classes.length
    ? classes.map((className) => `<span>${className}</span>`).join('')
    : '<em>Aucune classe remplie</em>';
};

const applyCoverPage = () => {
  const zone = document.querySelector('.cahier-preview-zone');
  if (!zone || !document.body.classList.contains('cahier-tab-active')) return;
  let page = document.getElementById(COVER_ID);
  if (!page) {
    page = createCoverPage();
    zone.prepend(page);
  }
  updateCoverClasses(page);
};

const scheduleCoverPage = () => window.requestAnimationFrame(applyCoverPage);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleCoverPage, { once: true });
} else {
  scheduleCoverPage();
}

document.addEventListener('focusout', scheduleCoverPage, true);
document.addEventListener('drop', scheduleCoverPage, true);
document.addEventListener('click', (event) => {
  if (event.target?.closest?.('.timetable-table, .span-tools, .cahier-tab')) scheduleCoverPage();
}, true);
