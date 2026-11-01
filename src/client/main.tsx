import '@fontsource/bevan/vietnamese-400.css';
import '@fontsource/bevan/latin-400.css';
import '@fontsource/pridi/vietnamese-400.css';
import '@fontsource/pridi/latin-400.css';
import '@fontsource/pridi/vietnamese-600.css';
import '@fontsource/pridi/latin-600.css';
import '@fontsource/be-vietnam-pro/vietnamese-400.css';
import '@fontsource/be-vietnam-pro/vietnamese-600.css';
import '@fontsource/be-vietnam-pro/latin-400.css';
import '@fontsource/be-vietnam-pro/latin-600.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
