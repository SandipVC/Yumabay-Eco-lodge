import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { LanguageProvider } from './context/LanguageContext.jsx';
import Layout from './components/layout/Layout.jsx';
import Home from './pages/Home.jsx';
import Contact from './pages/Contact.jsx';

const SiteMap   = lazy(() => import('./pages/SiteMap.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));

function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <LanguageProvider>
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
    </LanguageProvider>
  );
}
