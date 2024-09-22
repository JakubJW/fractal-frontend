import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './globals.css';
import { Provider } from 'react-redux';
import { store } from './store.ts';
import { router } from './router';
import { ThemeProvider } from './modules/ThemeProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </ThemeProvider>
);