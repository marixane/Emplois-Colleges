import { useEffect, useState } from 'react';
import Tab from './Tab.jsx';

const PAGES = [
  { id: 'primaire', label: 'Emplois Primaires' },
  { id: 'college', label: 'Emplois Collèges' },
  { id: 'lycee', label: 'Emplois Lycées' }
];

export default function App() {
  const [activePage, setActivePage] = useState('primaire');

  useEffect(() => {
    document.body.classList.add('cahier-tab-active');
    document.body.classList.remove('devoir-tab-active');

    return () => {
      document.body.classList.remove('cahier-tab-active');
    };
  }, []);

  return <>
    <nav className="emplois-page-tabs no-print" aria-label="Choisir un emploi du temps">
      {PAGES.map((page) => <button
        key={page.id}
        type="button"
        className={activePage === page.id ? 'active' : ''}
        onClick={() => setActivePage(page.id)}
      >
        {page.label}
      </button>)}
    </nav>

    {PAGES.map((page) => <div
      key={page.id}
      className={`emploi-page-panel ${activePage === page.id ? 'active' : ''}`}
      aria-hidden={activePage !== page.id}
    >
      <Tab />
    </div>)}
  </>;
}
