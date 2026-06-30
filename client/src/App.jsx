import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { EditModeProvider } from './context/EditModeContext.jsx';
import { useAssets } from './hooks/useAssets.js';
import Layout from './components/layout/Layout.jsx';
import Home from './pages/Home.jsx';
import Contact from './pages/Contact.jsx';
import Preloader from './components/ui/Preloader.jsx';
import InlineTextEditor from './components/cms/InlineTextEditor.jsx';

const SiteMap   = lazy(() => import('./pages/SiteMap.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));

function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Keep the favicon in sync with the CMS-managed logo (falls back to the
// bundled /logo-yb.svg set in index.html).
function FaviconSync() {
  const { assets } = useAssets();
  const logo = assets?.branding?.logo;
  useEffect(() => {
    if (!logo) return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = logo;
  }, [logo]);
  return null;
}

export default function App() {
  return (
    <EditModeProvider>
      <LanguageProvider>
        <FaviconSync />
        <Preloader />
        <ScrollReset />
        <Suspense fallback={null}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/sitemap" element={<SiteMap />} />
            </Route>
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Suspense>
        <InlineTextEditor />
      </LanguageProvider>
    </EditModeProvider>
  );
}
