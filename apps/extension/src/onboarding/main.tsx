import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Onboarding } from './Onboarding.js';

const el = document.getElementById('root');
if (!el) {
  throw new Error('onboarding root missing');
}

createRoot(el).render(
  <StrictMode>
    <Onboarding />
  </StrictMode>,
);
