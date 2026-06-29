import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './compact-exercise.css';
import './test-title.css';
import './dark-background.css';
import './photo-controls-opaque.css';
import './page-status.css';
import './extra-pages-full-height.css';
import './header-duration-bigger.css';
import './points-buttons-below.css';
import './mobile-responsive.css';
import './bar-mark-vertical.css';
import './bar-mark-click-guard.js';
import './photo-buttons-below-zoom.css';
import './clear-bar-marks-on-title-points.js';
import './small-toggle-icons.css';
import './live-lines-toggle.css';
import './compact-side-menu.css';
import './homework-hide-ribbon.js';
import './points-buttons-hitbox.css';
import './clear-bar-marks-on-exercise-count.js';
import './narrow-side-menu.css';
import './rounded-header-corners.css';
import './exercise-under-header-spacing.css';
import './exercise-top-border-fix.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
