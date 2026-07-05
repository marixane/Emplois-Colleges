const makeDiv = (style = {}, text = '') => {
  const div = document.createElement('div');
  Object.assign(div.style, style);
  if (text) div.textContent = text;
  return div;
};

const makeZellige = (corner) => {
  const div = makeDiv({
    position: 'absolute',
    width: '270px',
    height: '270px',
    backgroundColor: '#f8fafc',
    backgroundImage: 'conic-gradient(from 45deg, #075985 0 12.5%, #f59e0b 0 25%, #f8fafc 0 37.5%, #0f766e 0 50%, #7c2d12 0 62.5%, #f8fafc 0 75%, #1d4ed8 0 87.5%, #d97706 0 100%)',
    backgroundSize: '54px 54px',
    opacity: '0.96',
    boxShadow: '0 0 0 12px rgba(255,255,255,0.7), 0 12px 28px rgba(17,24,39,0.18)'
  });
  if (corner === 'top') {
    div.style.top = '-78px';
    div.style.right = '-60px';
    div.style.borderRadius = '0 0 0 62px';
  } else {
    div.style.bottom = '-78px';
    div.style.left = '-60px';
    div.style.borderRadius = '0 62px 0 0';
  }
  return div;
};

const makeLogo = () => {
  const wrap = makeDiv({ position: 'relative', width: '110px', height: '118px', margin: '3px auto 3px' });
  const crown = makeDiv({ position: 'absolute', top: '0', left: '37px', width: '36px', height: '20px', background: '#d6a11d', clipPath: 'polygon(0 100%, 15% 35%, 32% 100%, 50% 0, 68% 100%, 85% 35%, 100% 100%)', filter: 'drop-shadow(0 1px 0 #7c2d12)' });
  const shield = makeDiv({ position: 'absolute', top: '26px', left: '28px', width: '54px', height: '66px', background: 'linear-gradient(#dc2626,#991b1b)', border: '4px solid #d6a11d', borderRadius: '24px 24px 30px 30px', boxShadow: '0 0 0 2px #7c2d12' });
  const star = makeDiv({ position: 'absolute', left: '10px', top: '12px', width: '34px', height: '34px', background: '#16a34a', clipPath: 'polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' });
  const left = makeDiv({ position: 'absolute', top: '38px', left: '0', width: '30px', height: '52px', border: '5px solid #d6a11d', borderRight: '0', borderRadius: '28px 0 0 28px', transform: 'rotate(-12deg)', boxShadow: 'inset 0 0 0 2px #7c2d12' });
  const right = makeDiv({ position: 'absolute', top: '38px', right: '0', width: '30px', height: '52px', border: '5px solid #d6a11d', borderLeft: '0', borderRadius: '0 28px 28px 0', transform: 'rotate(12deg)', boxShadow: 'inset 0 0 0 2px #7c2d12' });
  const ribbon = makeDiv({ position: 'absolute', left: '18px', right: '18px', bottom: '7px', height: '9px', borderRadius: '99px', background: 'linear-gradient(90deg,#b45309,#fbbf24,#b45309)' });
  shield.append(star);
  wrap.append(crown, left, right, shield, ribbon);
  return wrap;
};

const rebuildCover = () => {
  if (!document.body.classList.contains('cahier-tab-active')) return;
  const page = document.getElementById('cahier-cover-page');
  if (!page || page.dataset.zelligeFixed === 'true') return;
  page.dataset.zelligeFixed = 'true';
  page.innerHTML = '';
  Object.assign(page.style, { background: '#eadccd', position: 'relative', overflow: 'hidden', fontFamily: 'Arial, sans-serif' });
  page.append(makeDiv({ position: 'absolute', inset: '0', backgroundColor: '#eadccd', backgroundImage: 'linear-gradient(30deg, rgba(255,255,255,.22) 12%, transparent 13%, transparent 87%, rgba(255,255,255,.22) 88%), linear-gradient(150deg, rgba(255,255,255,.22) 12%, transparent 13%, transparent 87%, rgba(255,255,255,.22) 88%)', backgroundSize: '64px 112px' }));
  page.append(makeDiv({ position: 'absolute', inset: '26px', opacity: '.08', backgroundImage: 'repeating-conic-gradient(from 45deg,#0f766e 0 8deg,#f59e0b 8deg 16deg,#f8fafc 16deg 24deg,#1d4ed8 24deg 32deg,#7c2d12 32deg 40deg)', backgroundSize: '72px 72px', borderRadius: '26px' }));
  page.append(makeZellige('top'), makeZellige('bottom'));

  const top = makeDiv({ position: 'absolute', top: '34px', left: '0', right: '0', textAlign: 'center', fontSize: '11px', lineHeight: '1.45', fontWeight: '700', color: '#313131' });
  top.append(makeDiv({}, 'Royaume du Maroc'), makeLogo(), makeDiv({}, 'Ministère de l’Éducation Nationale'), makeDiv({}, 'du Préscolaire et des Sports'));
  page.append(top);

  const title = makeDiv({ position: 'absolute', left: '70px', top: '268px' });
  title.innerHTML = '<h1 style="margin:0;font-size:56px;font-weight:900;letter-spacing:-1px;color:#0b0b0b;text-shadow:0 9px 7px rgba(0,0,0,.22)">Cahier de textes</h1><div style="margin-top:22px;font-size:20px;font-weight:700;color:#222">Langue française</div>';
  page.append(title);
  page.append(makeDiv({ position: 'absolute', left: '70px', top: '500px', fontSize: '16px', lineHeight: '1.6', fontWeight: '700', color: '#222' }, 'Enseignement – Apprentissage du'));
  page.append(makeDiv({ position: 'absolute', left: '70px', top: '526px', fontSize: '16px', lineHeight: '1.6', fontWeight: '700', color: '#222' }, 'Français au cycle secondaire'));
  page.append(makeDiv({ position: 'absolute', right: '76px', bottom: '82px', fontSize: '16px', fontWeight: '700', color: '#222' }, 'Année Scolaire : 2025/2026'));
};

const schedule = () => requestAnimationFrame(rebuildCover);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
else schedule();
new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
