import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ThemeProvider } from './theme/ThemeProvider';

import { applyThemeAttribute } from './theme/applyTheme';

import './styles/theme.css';
import './styles/global.css';
import './styles/site.css';

// Before anything renders. See applyTheme.ts — doing this in an effect leaves a
// frame in which sprites cache the wrong theme's colours.
applyThemeAttribute();

const container = document.getElementById('root');
if (container === null) {
  throw new Error('No #root element found in index.html.');
}

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
