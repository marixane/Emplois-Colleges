import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const MAX_PAGES = 6;
const MAX_EX = 6;
const H1 = 990;
const HN = 840;
const MIN_H = 120;
const MIN_H_EXTRA = Number('5');
const DURATIONS = ['30 min', '1 h', '1 h 30', '2 h', '2 h 30', '3 h', '3 h 30', '4 h'];
const BAR_POINTS = ['0,25', '0,75', '1,25', '1,75', '2,25', '2,75', '0,5', '1', '1,5', '2', '2,5', '3'];
const IND_TITLE_TOP = 'Devoir individuel';
const HOME_TITLE_TOP = 'Devoir à la maison';
const TITLE_MIDDLE = 'Mathématique';
const TITLE_BOTTOM = 'N° : 1 Semestre : 1';
const RIGHT_TITLE_TOP = 'Lycée El jamai ,Tanger';
const RIGHT_TITLE_BOTTOM = 'N° : 1 Semestre : 1';

const clamp = (v, a, b) => Math.min(Math.max(Number(v), a), b);
const textWeight = (text) => Array.from(String(text ?? '').trim()).reduce((sum, ch) => {
  if (ch === ' ') return sum + 0.35;
  if (',.;:!|'.includes(ch)) return sum + 0.25;
  if ('mwMW'.includes(ch)) return sum + 1.35;
  if (/[A-ZÀ-Ý]/.test(ch)) return sum + 1.12;
  return sum + 1;
}, 0);
const fitSize = (text, big = 17, min = 7, limit = 14, speed = 0.48) => {
  const w = textWeight(text);
  if (w <= limit) return big;
  const size = big - (w - limit) * speed;
  return Math.round(clamp(size, min, big) * 10) / 10;
};
const classSize = (text) => fitSize(text, 18, 8, 13, 0.5);
const titleTopSize = (text) => fitSize(text, 20, 8, 12, 0.52);
const rightTopSize = (text) => fitSize(text, 21, 8, 12, 0.55);
const fmt = (v) => {
  const n = Math.round(Number(v) * 100) / 100;
  return `${Number.isInteger(n) ? n : String(n).replace('.', ',')} ${n === 1 ? 'Point' : 'Points'}`;
};
const pts = (n, total = 20) => {
  if (!n) return [];
  const base = Math.round((total / n) / 0.25) * 0.25;
  const arr = Array.from({ length: n }, () => base);
  arr[n - 1] = Math.round((arr[n - 1] + total - arr.reduce((s, x) => s + x, 0)) * 100) / 100;
  return arr;
};
const ex = (i, p = 5) => ({ id: `${Date.now()}-${i}-${Math.random()}`, points: p, image: null, zoom: 100, x: 0, y: 0, masks: [], barMarks: [] });
const blankEx = () => ({ ...ex(0, 0), blank: true });
const exs = (n, total = 20) => pts(n, total).map((p, i) => ex(i, p));
const heights = (n, h) => n ? Array.from({ length: n }, (_, i) => i === n - 1 ? h - Math.floor(h / n) * (n - 1) : Math.floor(h / n)) : [];
const visibleCount = (p) => p.filter((e) => !e.blank).length;
const barPointValue = (label) => Number(String(label ?? '').replace('p', '').replace(',', '.')) || 0;
const barMarksTotal = (marks = []) => Math.round(marks.reduce((sum, mark) => sum + barPointValue(mark.label), 0) * 100) / 100;

export default function App6() {
  const [kind, setKind] = useState('individual');
  const [titleTop, setTitleTop] = useState(IND_TITLE_TOP);
  const [titleMiddle, setTitleMiddle] = useState(TITLE_MIDDLE);
  const [titleBottom, setTitleBottom] = useState(TITLE_BOTTOM);
  const [rightTop, setRightTop] = useState(RIGHT_TITLE_TOP);
  const [rightBottom, setRightBottom] = useState(RIGHT_TITLE_BOTTOM);
  const [level, setLevel] = useState('Classe : 2 Bac SPF');
  const [duration, setDuration] = useState(3);
  const [noteTotal, setNoteTotal] = useState(20);
  const [pages, setPages] = useState([exs(2, 20), ...Array.from({ length: MAX_PAGES - 1 }, () => [])]);
  const [hs, setHs] = useState([heights(2, H1), ...Array.from({ length: MAX_PAGES - 1 }, () => [])]);
  const [pdfLines, setPdfLines] = useState(true);
  const [barRibbon, setBarRibbon] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [drag, setDrag] = useState(null);
  const [resize, setResize] = useState(null);
  const pageRefs = useRef([]);
  const fileRefs = useRef({});

  const active = pages.map((p, i) => ({ p, i })).filter(({ p, i }) => i === 0 || p.length).map(({ i }) => i);
  const countPages = pages.map((p, i) => ({ p, i })).filter(({ i }) => i <= 1 || visibleCount(pages[i - 1]) > 0);
  const all = active.flatMap((i) => pages[i].filter((e) => !e.blank).map((e, j) => ({ e, page: i, index: pages[i].findIndex((item) => item.id === e.id), realIndex: j })));
  const total = Math.round(all.reduce((s, x) => s + x.e.points, 0) * 100) / 100;
  const startNum = (page) => pages.slice(0, page).reduce((s, p) => s + visibleCount(p), 1);
  const canAddBarPoint = (e, label) => Math.round((barMarksTotal(e.barMarks) + barPointValue(label)) * 100) / 100 <= Number(e.points) + 0.001;

  const updateEx = (page, id, updates) => {
    setPages((cur) => cur.map((p, pi) => pi === page ? p.map((e) => e.id === id ? { ...e, ...updates } : e) : p));
  };
  const updateMask = (page, exId, maskId, updates) => {
    setPages((cur) => cur.map((p, pi) => pi === page ? p.map((e) => e.id === exId ? {
      ...e,
      masks: (e.masks ?? []).map((m) => m.id === maskId ? {
        ...m,
        ...updates,
        x: clamp(updates.x ?? m.x, 0, 720),
        y: clamp(updates.y ?? m.y, 0, 980),
        width: clamp(updates.width ?? m.width, 24, 720),
        height: clamp(updates.height ?? m.height, 18, 980),
      } : m),
    } : e) : p));
  };
  const balance = (next, targetTotal = noteTotal) => {
    if (!targetTotal) return next;
    const pos = next.flatMap((p, pi) => p.map((item, ei) => item.blank ? null : { pi, ei }).filter(Boolean));
    const p = pts(pos.length, targetTotal);
    return next.map((page, pi) => page.map((item, ei) => {
      if (item.blank) return item;
      return { ...item, masks: item.masks ?? [], barMarks: [], points: p[pos.findIndex((x) => x.pi === pi && x.ei === ei)] ?? item.points };
    }));
  };
  const changeNoteTotal = (targetTotal) => {
    const nextTotal = noteTotal === targetTotal ? null : targetTotal;
    setNoteTotal(nextTotal);
    if (nextTotal) setPages((cur) => balance(cur, nextTotal));
  };
  const setCount = (page, d) => {
    if (page > 0 && d > 0 && visibleCount(pages[0]) === 0) return;
    const current = visibleCount(pages[page]);
    const n = clamp(current + d, 0, MAX_EX);
    setPages((cur) => {
      const next = cur.map((p, i) => {
        if (n === 0 && i > page) return [];
        if (i !== page) return p;
        if (n === 0 && page === 0) return p.length === 1 && p[0]?.blank ? p : [blankEx()];
        const real = p.filter((item) => !item.blank);
        return Array.from({ length: n }, (_, j) => real[j] ? { ...real[j], masks: real[j].masks ?? [], barMarks: [] } : ex(j));
      });
      return noteTotal ? balance(next, noteTotal) : next;
    });
    setHs((cur) => cur.map((p, i) => {
      if (n === 0 && i > page) return [];
      if (i !== page) return p;
      if (n === 0 && page === 0) return [H1];
      return heights(n, i === 0 ? H1 : HN);
    }));
  };
  const pointPeer = (page, index) => {
    const k = all.findIndex((x) => x.page === page && x.index === index);
    if (k < 0 || all.length < 2) return null;
    return k < all.length - 1 ? all[k + 1] : all[k - 1];
  };
  const canChangePoint = (page, index, d) => {
    const current = pages[page][index];
    if (!current || current.blank) return false;
    const next = Math.round((current.points + d * 0.25) * 100) / 100;
    if (!noteTotal) return next >= 0.25 && next <= 20;
    const peer = pointPeer(page, index);
    if (!peer) return false;
    const peerNext = Math.round((peer.e.points - d * 0.25) * 100) / 100;
    return next >= 0.25 && next <= noteTotal && peerNext >= 0.25 && peerNext <= noteTotal;
  };
  const changePoint = (page, index, d) => {
    if (!canChangePoint(page, index, d)) return;
    if (!noteTotal) {
      setPages((cur) => cur.map((p, pi) => p.map((e, ei) => pi === page && ei === index ? { ...e, barMarks: [], points: Math.round((e.points + d * 0.25) * 100) / 100 } : e)));
      return;
    }
    const peer = pointPeer(page, index);
    if (!peer) return;
    const a = pages[page][index].points + d * 0.25;
    const b = peer.e.points - d * 0.25;
    setPages((cur) => cur.map((p, pi) => p.map((e, ei) => {
      if (pi === page && ei === index) return { ...e, barMarks: [], points: Math.round(a * 100) / 100 };
      if (pi === peer.page && ei === peer.index) return { ...e, barMarks: [], points: Math.round(b * 100) / 100 };
      return e;
    })));
  };
  const changeImage = (page, id, file) => {
    if (!file) return;
    updateEx(page, id, { image: { name: file.name, url: URL.createObjectURL(file) }, zoom: 100, x: 0, y: 0, masks: [] });
  };
  const clearImage = (page, id) => updateEx(page, id, { image: null, zoom: 100, x: 0, y: 0, masks: [] });
  const addMask = (page, id) => {
    const e = pages[page].find((item) => item.id === id);
    if (!e) return;
    updateEx(page, id, { masks: [...(e.masks ?? []), { id: `mask-${Date.now()}`, x: 120, y: 90, width: 160, height: 60 }] });
  };
  const deleteMask = (page, exId, maskId) => {
    const e = pages[page].find((item) => item.id === exId);
    if (!e) return;
    updateEx(page, exId, { masks: (e.masks ?? []).filter((m) => m.id !== maskId) });
  };
  const addBarMark = (page, id, label) => {
    const e = pages[page].find((item) => item.id === id);
    if (!e || !canAddBarPoint(e, label)) return;
    const index = e.barMarks?.length ?? 0;
    updateEx(page, id, { barMarks: [...(e.barMarks ?? []), { id: `bar-${Date.now()}-${Math.random()}`, label, x: 0, y: 34 + index * 26 }] });
  };
  const deleteBarMark = (page, exId, markId) => {
    const e = pages[page].find((item) => item.id === exId);
    if (!e) return;
    updateEx(page, exId, { barMarks: (e.barMarks ?? []).filter((m) => m.id !== markId) });
  };
  const updateBarMark = (page, exId, markId, updates) => {
    const h = hs[page]?.[pages[page].findIndex((item) => item.id === exId)] ?? 600;
    setPages((cur) => cur.map((p, pi) => pi === page ? p.map((e) => e.id === exId ? {
      ...e,
      barMarks: (e.barMarks ?? []).map((m) => m.id === markId ? { ...m, x: clamp(updates.x ?? m.x, -4, 705), y: clamp(updates.y ?? m.y, 0, Math.max(0, h - 42)) } : m),
    } : e) : p));
  };
  const startPhotoDrag = (ev, page, e) => {
    ev.preventDefault();
    ev.stopPropagation();
    setResize(null);
    setDrag({ type: 'photo', page, id: e.id, sx: ev.clientX, sy: ev.clientY, x: e.x ?? 0, y: e.y ?? 0 });
  };
  const startMaskDrag = (ev, page, exId, mask) => {
    ev.preventDefault();
    ev.stopPropagation();
    setResize(null);
    setDrag({ type: 'mask-move', page, exId, maskId: mask.id, sx: ev.clientX, sy: ev.clientY, x: mask.x, y: mask.y });
  };
  const startMaskResize = (ev, page, exId, mask) => {
    ev.preventDefault();
    ev.stopPropagation();
    setResize(null);
    setDrag({ type: 'mask-resize', page, exId, maskId: mask.id, sx: ev.clientX, sy: ev.clientY, width: mask.width, height: mask.height });
  };
  const startBarDrag = (ev, page, exId, mark) => {
    ev.preventDefault();
    ev.stopPropagation();
    setResize(null);
    setDrag({ type: 'bar-mark', page, exId, markId: mark.id, sx: ev.clientX, sy: ev.clientY, x: mark.x ?? 0, y: mark.y ?? 34 });
  };
  const moveDrag = (ev) => {
    if (!drag) return;
    const dx = ev.clientX - drag.sx;
    const dy = ev.clientY - drag.sy;
    if (drag.type === 'photo') updateEx(drag.page, drag.id, { x: clamp(drag.x + dx, -250, 250), y: clamp(drag.y + dy, -250, 250) });
    if (drag.type === 'mask-move') updateMask(drag.page, drag.exId, drag.maskId, { x: drag.x + dx, y: drag.y + dy });
    if (drag.type === 'mask-resize') updateMask(drag.page, drag.exId, drag.maskId, { width: drag.width + dx, height: drag.height + dy });
    if (drag.type === 'bar-mark') updateBarMark(drag.page, drag.exId, drag.markId, { x: drag.x + dx, y: drag.y + dy });
  };
  const startResize = (ev, page, lower) => {
    ev.preventDefault();
    ev.stopPropagation();
    setDrag(null);
    setResize({ page, upper: lower - 1, lower, sy: ev.clientY, start: hs[page] });
  };
  const moveResize = (ev) => {
    if (!resize) return;
    const dy = ev.clientY - resize.sy;
    const limit = resize.page === 0 ? MIN_H : MIN_H_EXTRA;
    const max = resize.start[resize.lower] - limit;
    const min = limit - resize.start[resize.upper];
    const safe = clamp(dy, min, max);
    const next = resize.start.map((h, i) => i === resize.upper ? Math.round(h + safe) : i === resize.lower ? Math.round(h - safe) : h);
    setHs((cur) => cur.map((p, i) => i === resize.page ? next : p));
  };
  const stopMove = () => {
    setDrag(null);
    setResize(null);
  };
  const makePdf = async () => {
    setExporting(true);
    stopMove();
    await new Promise((r) => setTimeout(r, 120));
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    for (let k = 0; k < active.length; k += 1) {
      const node = pageRefs.current[active[k]];
      node.querySelectorAll('textarea').forEach((field) => field.blur());
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#fff', ignoreElements: (el) => el.classList?.contains('photo-overlay-tools') || el.classList?.contains('mask-delete-button') || el.classList?.contains('mask-resize-handle') || el.classList?.contains('bar-buttons') });
      if (k) pdf.addPage('a4', 'portrait');
      pdf.addImage(canvas.toDataURL('image/jpeg', 1), 'JPEG', 0, 0, 210, 297);
    }
    return pdf;
  };
  const preview = async () => { try { const pdf = await makePdf(); window.open(pdf.output('bloburl'), '_blank'); } finally { setExporting(false); } };
  const download = async () => { try { const pdf = await makePdf(); pdf.save('devoir-a4.pdf'); } finally { setExporting(false); } };

  const renderList = (page) => <div className="exercise-list">{pages[page].map((e, i) => <section className={`exam-exercise ex-${i + 1} ${e.blank ? 'blank-exercise' : ''}`} key={e.id} style={{ height: `${hs[page][i]}px` }}>
    {!e.blank && i > 0 && <button type="button" className="resize-handle" onMouseDown={(ev) => startResize(ev, page, i)} aria-label="Modifier la hauteur" />}
    {!e.blank && <div className="exercise-title exercise-title-controls">{kind === 'homework' ? <span>Exercice {startNum(page) + visibleCount(pages[page].slice(0, i))}</span> : <><span>Exercice {startNum(page) + visibleCount(pages[page].slice(0, i))} : </span><span className="points-decoration">* (</span><button onClick={() => changePoint(page, i, -1)} disabled={!canChangePoint(page, i, -1)}>−</button><strong>{fmt(e.points)}</strong><button onClick={() => changePoint(page, i, 1)} disabled={!canChangePoint(page, i, 1)}>+</button><span className="points-decoration">) *</span></>}</div>}
    <div className="exercise-body clickable-photo-zone" onClick={() => !e.image && fileRefs.current[e.id]?.click()}>
      {!e.blank && barRibbon && <div className="bar-buttons" onClick={(ev) => ev.stopPropagation()}>{BAR_POINTS.map((label) => <button key={label} type="button" disabled={!canAddBarPoint(e, label)} onClick={() => addBarMark(page, e.id, label)}>{label}</button>)}</div>}
      {!e.blank && barRibbon && (e.barMarks ?? []).map((m) => <span className="bar-mark" key={m.id} onMouseDown={(ev) => startBarDrag(ev, page, e.id, m)} onDoubleClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); deleteBarMark(page, e.id, m.id); }} style={{ left: `${m.x ?? 0}px`, top: `${m.y ?? 34}px` }}>{m.label}</span>)}
      {e.image && <div className="photo-overlay-tools" onClick={(ev) => ev.stopPropagation()}><button type="button" className="photo-tool-button" onClick={() => fileRefs.current[e.id]?.click()}>Changer photo</button><button type="button" className="photo-tool-button" onClick={() => addMask(page, e.id)}>Rectangle blanc</button><button type="button" className="photo-tool-button danger" onClick={() => clearImage(page, e.id)}>Supprimer</button><label className="photo-zoom-control">Zoom <input type="range" min="60" max="220" value={e.zoom ?? 100} onChange={(ev) => updateEx(page, e.id, { zoom: clamp(ev.target.value, 60, 220) })} /><span>{e.zoom ?? 100}%</span></label></div>}
      {e.image ? <><img className="draggable-photo" src={e.image.url ?? e.image} alt={e.image.name ?? 'exercice'} draggable="false" onMouseDown={(ev) => startPhotoDrag(ev, page, e)} style={{ transform: `translate(${e.x ?? 0}px, ${e.y ?? 0}px) scale(${(e.zoom ?? 100) / 100})` }} />{(e.masks ?? []).map((m) => <div className="white-mask" key={m.id} onMouseDown={(ev) => startMaskDrag(ev, page, e.id, m)} style={{ left: `${m.x}px`, top: `${m.y}px`, width: `${m.width}px`, height: `${m.height}px` }}><button type="button" className="mask-delete-button" onMouseDown={(ev) => ev.stopPropagation()} onClick={(ev) => { ev.stopPropagation(); deleteMask(page, e.id, m.id); }}>×</button><span className="mask-resize-handle" onMouseDown={(ev) => startMaskResize(ev, page, e.id, m)} /></div>)}</> : <div className="empty-zone">Clique ici pour choisir la photo</div>}
    </div>
  </section>)}</div>;

  return <main className={`app-shell ${resize ? 'is-resizing' : ''}`} onMouseMove={(ev) => { moveDrag(ev); moveResize(ev); }} onMouseUp={stopMove} onMouseLeave={stopMove}>
    <section className="panel">
      <p className="eyebrow">A4 Exam Maker</p><h1>Créer une feuille A4 avec entête fixe</h1><p className="intro">Choisis le type de devoir, puis le nombre d’exercices par page.</p>
      <div className="form-group"><label>Type de devoir</label><div className="duration-control compact-control assignment-control"><button onClick={() => { setKind('individual'); setTitleTop(IND_TITLE_TOP); }} disabled={kind === 'individual'}>Individuel</button><button onClick={() => { setKind('homework'); setTitleTop(HOME_TITLE_TOP); }} disabled={kind === 'homework'}>À la maison</button></div></div>
      {kind !== 'homework' && <div className="note-scale-control"><div className="note-scale-title">Notes :</div><div className="note-scale-buttons"><button type="button" className={`note-scale-button ${noteTotal === 10 ? 'active' : ''}`} onClick={() => changeNoteTotal(10)}>Sur 10</button><button type="button" className={`note-scale-button ${noteTotal === 20 ? 'active' : ''}`} onClick={() => changeNoteTotal(20)}>Sur 20</button></div><div className="note-scale-counter">Total : {fmt(total)} {noteTotal ? `/ ${noteTotal}` : '/ libre'}</div></div>}
      <button type="button" className={`pdf-lines-toggle ${pdfLines ? 'on' : 'off'}`} onClick={() => setPdfLines((v) => !v)}>{pdfLines ? 'Lignes visibles dans le PDF' : 'Lignes masquées dans le PDF'}</button>
      <button type="button" className={`bar-ribbon-toggle ${barRibbon ? 'on' : 'off'}`} onClick={() => setBarRibbon((v) => !v)}>{barRibbon ? 'Ruban de barème visible' : 'Ruban de barème masqué'}</button>
      <section className="exercise-count-section"><h2>Nombre d’exercices</h2><div className="page-count-grid">{countPages.map(({ p, i }) => <div className="page-count-card" key={i}><label>Page {i + 1}</label><div className="duration-control compact-control"><button onClick={() => setCount(i, -1)} disabled={visibleCount(p) === 0}>−</button><strong>{visibleCount(p)}</strong><button onClick={() => setCount(i, 1)} disabled={visibleCount(p) === MAX_EX || (i > 0 && visibleCount(pages[0]) === 0)}>+</button></div></div>)}</div></section>
      {active.flatMap((page) => pages[page].map((e) => <input key={e.id} ref={(n) => { fileRefs.current[e.id] = n; }} className="hidden-file-input" type="file" accept="image/*" onChange={(ev) => changeImage(page, e.id, ev.target.files?.[0])} />))}
      <button onClick={preview} disabled={exporting}>{exporting ? 'Préparation...' : 'Voir PDF'}</button><button className="secondary" onClick={download} disabled={exporting}>{exporting ? 'Export en cours...' : 'Exporter PDF A4'}</button>
    </section>
    <section className="preview-zone">{active.map((page, order) => <div className={`a4-page exam-page ${page === 0 ? '' : 'second-page'} ${barRibbon ? 'has-bar-ribbon' : ''} ${exporting ? 'is-exporting' : ''} ${exporting && !pdfLines ? 'no-pdf-lines' : ''}`} key={page} ref={(n) => { pageRefs.current[page] = n; }}>{page === 0 && <header className="exam-header three-cell-header"><div className="header-cell left-header-cell class-duration-header"><textarea className="inline-class-input" value={level} onChange={(e) => setLevel(e.target.value)} rows="1" style={{ fontSize: `${classSize(level)}px` }} /><div className="tiny-duration-control"><button onClick={() => setDuration((d) => clamp(d - 1, 0, DURATIONS.length - 1))}>−</button><strong>{DURATIONS[duration]}</strong><button onClick={() => setDuration((d) => clamp(d + 1, 0, DURATIONS.length - 1))}>+</button></div></div><div className="header-cell middle-header-cell split-title-cell"><textarea className="inline-title-input title-line title-line-top" value={titleTop} onChange={(e) => setTitleTop(e.target.value)} rows="1" style={{ fontSize: `${titleTopSize(titleTop)}px` }} /><textarea className="inline-title-input title-line title-line-middle" value={titleMiddle} onChange={(e) => setTitleMiddle(e.target.value)} rows="1" style={{ fontSize: `${fitSize(titleMiddle)}px` }} /><textarea className="inline-title-input title-line title-line-bottom" value={titleBottom} onChange={(e) => setTitleBottom(e.target.value)} rows="1" /></div><div className="header-cell right-header-cell split-right-cell"><textarea className="inline-prof-input right-line right-line-top" value={rightTop} onChange={(e) => setRightTop(e.target.value)} rows="1" style={{ fontSize: `${rightTopSize(rightTop)}px` }} /><textarea className="inline-prof-input right-line right-line-bottom" value={rightBottom} onChange={(e) => setRightBottom(e.target.value)} rows="1" style={{ fontSize: `${fitSize(rightBottom)}px` }} /></div></header>}{renderList(page)}<div className="page-number">Page {order + 1}/{active.length}</div></div>)}</section>
  </main>;
}
