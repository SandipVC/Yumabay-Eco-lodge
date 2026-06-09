import Hero from '../components/sections/Hero.jsx';
import GoldStrip from '../components/sections/GoldStrip.jsx';
import About from '../components/sections/About.jsx';
import Properties from '../components/sections/Properties.jsx';
import Gallery from '../components/sections/Gallery.jsx';
import Lounge from '../components/sections/Lounge.jsx';
import Amenities from '../components/sections/Amenities.jsx';
import Location from '../components/sections/Location.jsx';
import CTASection from '../components/sections/CTASection.jsx';

// Scroll-reveal is wired globally in Layout (useRevealAll, keyed on route).
export default function Home() {
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
