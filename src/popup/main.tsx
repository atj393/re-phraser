import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PopupApp } from './PopupApp';
import '@/styles/common.css';
import './popup.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Popup root container missing');
}
createRoot(container).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>,
);
