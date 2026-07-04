import { useState } from 'react';
import App6 from './App6.jsx';
import Tab from './Tab.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('exam');

  return <>
    <nav className="app-tabs">
      <button
        type="button"
        className={activeTab === 'exam' ? 'active' : ''}
        onClick={() => setActiveTab('exam')}
      >
        Devoir A4
      </button>
      <button
        type="button"
        className={activeTab === 'cahier' ? 'active' : ''}
        onClick={() => setActiveTab('cahier')}
      >
        Cahier de texte
      </button>
    </nav>

    {activeTab === 'exam' ? <App6 /> : <Tab />}
  </>;
}
