import { useEffect } from 'react';
import Hero from '../components/sections/Hero.jsx';
import GoldStrip from '../components/sections/GoldStrip.jsx';
import About from '../components/sections/About.jsx';
import Properties from '../components/sections/Properties.jsx';
import Gallery from '../components/sections/Gallery.jsx';
import Lounge from '../components/sections/Lounge.jsx';
import Amenities from '../components/sections/Amenities.jsx';
import Location from '../components/sections/Location.jsx';
import CTASection from '../components/sections/CTASection.jsx';

export default function Home() {
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Hero />
      <GoldStrip />
      <About />
      <Properties />
      <Gallery />
      <Lounge />
      <Amenities />
      <Location />
      <CTASection />
    </>
  );
}
