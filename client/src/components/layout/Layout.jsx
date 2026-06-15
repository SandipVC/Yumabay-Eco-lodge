import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import CustomCursor from '../ui/CustomCursor.jsx';
import { useRevealAll } from '../ui/useReveal.js';
import CookieConsent from '../ui/CookieConsent.jsx';

export default function Layout() {
  const { pathname } = useLocation();
  // Single scroll-reveal observer for every page rendered through the Outlet.
  // Re-scans on each route change (child effects run before this parent effect,
  // so the new page's .reveal nodes already exist in the DOM).
  useRevealAll([pathname]);

  return (
    <>
      <CustomCursor />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <CookieConsent />
    </>
  );
}
