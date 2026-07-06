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

// Fixed CSS font-family names for CMS-uploaded custom fonts. Must match
// CUSTOM_HEADING_FAMILY / CUSTOM_BODY_FAMILY in server/routes/cms.js.
const CUSTOM_HEADING_FAMILY = 'CMSHeadingFont';
const CUSTOM_BODY_FAMILY    = 'CMSBodyFont';

// Keep the site-wide heading/body fonts in sync with the CMS selection.
// Sets CSS custom properties on <html>, which global.css reads via
// var(--font-heading)/var(--font-body) — so a CMS save reflects instantly
// without a page reload, on both the public site and the dashboard.
// If the admin uploaded a custom font file, also inject an @font-face rule
// pointing at it (uploaded fonts aren't known ahead of time, so they can't
// live in the static global.css).
function FontSync() {
  const { assets } = useAssets();
  const headingFont     = assets?.fonts?.headingFont;
  const bodyFont        = assets?.fonts?.bodyFont;
  const headingFontFile = assets?.fonts?.headingFontFile;
  const bodyFontFile    = assets?.fonts?.bodyFontFile;

  useEffect(() => {
    const root = document.documentElement;
    if (headingFont) root.style.setProperty('--font-heading', headingFont);
    if (bodyFont)    root.style.setProperty('--font-body', bodyFont);
  }, [headingFont, bodyFont]);

  useEffect(() => {
    let style = document.getElementById('cms-custom-fonts');
    if (!headingFontFile && !bodyFontFile) {
      if (style) style.remove();
      return;
    }
    if (!style) {
      style = document.createElement('style');
      style.id = 'cms-custom-fonts';
      document.head.appendChild(style);
    }
    let css = '';
    if (headingFontFile) {
      css += `@font-face { font-family: '${CUSTOM_HEADING_FAMILY}'; src: url('${headingFontFile}'); font-display: swap; }\n`;
    }
    if (bodyFontFile) {
      css += `@font-face { font-family: '${CUSTOM_BODY_FAMILY}'; src: url('${bodyFontFile}'); font-display: swap; }\n`;
    }
    style.textContent = css;
  }, [headingFontFile, bodyFontFile]);

  return null;
}

export default function App() {
  return (
    <EditModeProvider>
      <LanguageProvider>
        <FaviconSync />
        <FontSync />
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
