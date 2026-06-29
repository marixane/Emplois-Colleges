import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const MAX_PAGES = 6;
const MAX_EX = 6;
const TOTAL = 20;
const H1 = 986;
const HN = 840;
const DURATIONS = ['30 min', '1 h', '1 h 30', '2 h', '2 h 30', '3 h'];
const IND_TITLE = 'Devoir individuel de Mathématique\nN°: 1 Semestre: 1 Lycée El jamai ,Tanger';
const HOME_TITLE = 'Devoir à la maison de Mathématique\nN°: 1 Semestre: 1 Lycée El jamai ,Tanger';

const clamp = (v, a, b) => Math.min(Math.max(Number(v), a), b);
const fmt = (v) => {
  const n = Math.round(Number(v) * 100) / 100;
  return `${Number.isInteger(n) ? n : String(n).replace('.', ',')} ${n === 1 ? 'Point' : 'Points'}`;
};
const pts = (n) => {
  if (!n) return [];
  const base = Math.round((TOTAL / n) / 0.25) * 0.25;
  const arr = Array.from({ length: n }, () => base);
  arr[n - 1] = Math.round((arr[n - 1] + TOTAL - arr.reduce((s, x) => s + x, 0)) * 100) / 100;
  return arr;
};
const ex = (i, p = 5) => ({ id: `${Date.now()}-${i}-${Math.random()}`, points: p, image: null });
const exs = (n) => pts(n).map((p, i) => ex(i, p));
const heights = (n, h) => n ? Array.from({ length: n }, (_, i) => i === n - 1 ? h - Math.floor(h / n) * (n - 1) : Math.floor(h / n)) : [];
const titleSize = (t) => t.length > 115 ? 11 : t.length > 90 ? 12 : t.length > 65 ? 14 : t.length > 42 ? 16 : 18;
const profSize = (t) => t.length > 38 ? 12 : t.length > 26 ? 14 : 16;

export default function App6() {
  const [kind, setKind] = useState('individual');
  const [title, setTitle] = useState(IND_TITLE);
  const [level, setLevel] = useState('2 Bac SPF');
  const [teacher, setTeacher] = useState('Prof : Marwane.R');
  const [duration, setDuration] = useState(3);
  const [pages, setPages] = useState([exs(3), ...Array.from({ length: MAX_PAGES - 1 }, () => [])]);
  const [hs, setHs] = useState([heights(3, H1), ...Array.from({ length: MAX_PAGES - 1 }, () => [])]);
  const [exporting, setExporting] = useState(false);
  const pageRefs = useRef([]);
  const fileRefs = useRef({});

  const active = pages.map((p, i) => ({ p, i })).filter(({ p, i }) => i === 0 || p.length).map(({ i }) => i);
  const all = active.flatMap((i) => pages[i].map((e, j) => ({ e, page: i, index: j })));
  const total = Math.round(all.reduce((s, x) => s + x.e.points, 0) * 100) / 100;
  const startNum = (page) => pages.slice(0, page).reduce((s, p) => s + p.length, 1);

  const balance = (next) => {
    const pos = next.flatMap((p, pi) => p.map((_, ei) => ({ pi, ei })));
    const p = pts(pos.length);
    return next.map((page, pi) => page.map((item, ei) => ({ ...item, points: p[pos.findIndex((x) => x.pi === pi && x.ei === ei)] ?? item.points })));
  };
  const setCount = (page, d) => {
    const min = page === 0 ? 1 : 0;
    const n = clamp(pages[page].length + d, min, MAX_EX);
    setPages((cur) => balance(cur.map((p, i) => {
      if (n === 0 && i > page) return [];
      return i === page ? Array.from({ length: n }, (_, j) => p[j] ?? ex(j)) : p;
    })));
    setHs((cur) => cur.map((p, i) => {
      if (n === 0 && i > page) return [];
      return i === page ? heights(n, i === 0 ? H1 : HN) : p;
    }));
  };
  const pointPeer = (page, index) => {
    const k = all.findIndex((x) => x.page === page && x.index === index);
    if (k < 0 || all.length < 2) return null;
    return k < all.length - 1 ? all[k + 1] : all[k - 1];
  };
  const changePoint = (page, index, d) => {
    const peer = pointPeer(page, index);
    if (!peer) return;
    const a = pages[page][index].points + d * 0.25;
    const b = peer.e.points - d * 0.25;
    if (a < 1 || b < 1 || a > 20 || b > 20) return;
    setPages((cur) => cur.map((p, pi) => p.map((e, ei) => {
      if (pi === page && ei === index) return { ...e, points: Math.round(a * 100) / 100 };
      if (pi === peer.page && ei === peer.index) return { ...e, points: Math.round(b * 100) / 100 };
      return e;
    })));
  };
  const changeImage = (page, id, file) => {
    if (!file) return;
    setPages((cur) => cur.map((p, pi) => pi === page ? p.map((e) => e.id === id ? { ...e, image: URL.createObjectURL(file) } : e) : p));
  };
  const makePdf = async () => {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 120));
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    for (let k = 0; k < active.length; k += 1) {
      const node = pageRefs.current[active[k]];
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#fff' });
      if (k) pdf.addPage('a4', 'portrait');
      pdf.addImage(canvas.toDataURL('image/jpeg', 1), 'JPEG', 0, 0, 210, 297);
    }
    return pdf;
  };
  const preview = async () => { try { const pdf = await makePdf(); window.open(pdf.output('bloburl'), '_blank'); } finally { setExporting(false); } };
  const download = async () => { try { const pdf = await makePdf(); pdf.save('devoir-a4.pdf'); } finally { setExporting(false); } };

  const renderList = (page) => <div className="exercise-list">{pages[page].map((e, i) => <section className={`exam-exercise ex-${i + 1}`} key={e.id} style={{ height: `${hs[page][i]}px` }}>
    <div className="exercise-title exercise-title-controls">{kind === 'homework' ? <span>Exercice {startNum(page) + i}</span> : <><span>Exercice {startNum(page) + i} : </span><span className="points-decoration">* (</span><button onClick={() => changePoint(page, i, -1)}>−</button><strong>{fmt(e.points)}</strong><button onClick={() => changePoint(page, i, 1)}>+</button><span className="points-decoration">) *</span></>}</div>
    <div className="exercise-body clickable-photo-zone" onClick={() => !e.image && fileRefs.current[e.id]?.click()}>{e.image ? <img className="draggable-photo" src={e.image} alt="exercice" /> : <div className="empty-zone">Clique ici pour choisir la photo</div>}</div>
  </section>)}</div>;

  return <main className="app-shell">
    <section className="panel">
      <p className="eyebrow">A4 Exam Maker</p><h1>Créer une feuille A4 avec entête fixe</h1><p className="intro">Choisis le type de devoir, puis le nombre d’exercices par page.</p>
      <div className="form-group"><label>Type de devoir</label><div className="duration-control compact-control assignment-control"><button onClick={() => { setKind('individual'); setTitle(IND_TITLE); }} disabled={kind === 'individual'}>Individuel</button><button onClick={() => { setKind('homework'); setTitle(HOME_TITLE); }} disabled={kind === 'homework'}>À la maison</button></div></div>
      {kind !== 'homework' && <p className="points-total locked">Total général bloqué : {fmt(total)}</p>}
      <section className="exercise-count-section"><h2>Nombre d’exercices</h2><div className="page-count-grid">{pages.map((p, i) => <div className="page-count-card" key={i}><label>Page {i + 1}</label><div className="duration-control compact-control"><button onClick={() => setCount(i, -1)} disabled={p.length === (i === 0 ? 1 : 0)}>−</button><strong>{p.length}</strong><button onClick={() => setCount(i, 1)} disabled={p.length === MAX_EX}>+</button></div></div>)}</div></section>
      {active.flatMap((page) => pages[page].map((e) => <input key={e.id} ref={(n) => { fileRefs.current[e.id] = n; }} className="hidden-file-input" type="file" accept="image/*" onChange={(ev) => changeImage(page, e.id, ev.target.files?.[0])} />))}
      <button onClick={preview} disabled={exporting}>{exporting ? 'Préparation...' : 'Voir PDF'}</button><button className="secondary" onClick={download} disabled={exporting}>{exporting ? 'Export en cours...' : 'Exporter PDF A4'}</button>
    </section>
    <section className="preview-zone">{active.map((page, order) => <div className={`a4-page exam-page ${page === 0 ? '' : 'second-page'} ${exporting ? 'is-exporting' : ''}`} key={page} ref={(n) => { pageRefs.current[page] = n; }}>{page === 0 && <header className="exam-header three-cell-header"><div className="header-cell left-header-cell class-duration-header"><textarea className="inline-class-input" value={level} onChange={(e) => setLevel(e.target.value)} rows="1" /><div className="tiny-duration-control"><button onClick={() => setDuration((d) => clamp(d - 1, 0, DURATIONS.length - 1))}>−</button><strong>{DURATIONS[duration]}</strong><button onClick={() => setDuration((d) => clamp(d + 1, 0, DURATIONS.length - 1))}>+</button></div></div><div className="header-cell middle-header-cell"><textarea className="inline-title-input" value={title} onChange={(e) => setTitle(e.target.value)} rows="2" style={{ fontSize: `${titleSize(title)}px` }} /></div><div className="header-cell right-header-cell"><textarea className="inline-prof-input" value={teacher} onChange={(e) => setTeacher(e.target.value)} rows="2" style={{ fontSize: `${profSize(teacher)}px` }} /></div></header>}{renderList(page)}<div className="page-number">Page {order + 1}/{active.length}</div></div>)}</section>
  </main>;
}
