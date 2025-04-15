import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes/RouterApp';


// Creación del router con las rutas definidas
const router = createBrowserRouter(routes);

// Seleccionar el elemento root donde se monta la aplicación
const rootElement = document.getElementById('root');

// Validar si el elemento root existe y montar la aplicación
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
} else {
  console.error("No se encontró el elemento con id 'root'.");
}