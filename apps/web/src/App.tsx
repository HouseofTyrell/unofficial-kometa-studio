import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { IDELayout } from './components/layout/IDELayout';
import { HomePage } from './pages/HomePage';
import { ConfigEditorPage } from './pages/ConfigEditorPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { ImportExportPage } from './pages/ImportExportPage';

export default function App() {
  return (
    <BrowserRouter>
      <IDELayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/config/:configId" element={<ConfigEditorPage />} />
          <Route path="/profiles" element={<ProfilesPage />} />
          <Route path="/import-export" element={<ImportExportPage />} />
        </Routes>
      </IDELayout>
    </BrowserRouter>
  );
}
