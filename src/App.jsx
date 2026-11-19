import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import InvitePage from './pages/InvitePage';
import PanelPage from './pages/PanelPage';
import { DEFAULT_EVENT_SLUG } from './config/events';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InvitePage />} />
        <Route path="/convite/:slug" element={<InvitePage />} />
        <Route path="/painel" element={<PanelPage />} />
        <Route path="/painel/:slug" element={<PanelPage />} />
        {/* Rota curinga redireciona para o convite padrão */}
        <Route
          path="*"
          element={<Navigate to={`/convite/${DEFAULT_EVENT_SLUG}`} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
