import {StrictMode, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div className="p-6 text-white bg-zinc-950">Loading workspace...</div>}><App /></Suspense>
  </StrictMode>,
);
