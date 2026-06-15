import Hero from '../components/sections/Hero.jsx';
import About from '../components/sections/About.jsx';
import Properties from '../components/sections/Properties.jsx';
import Lounge from '../components/sections/Lounge.jsx';
import Amenities from '../components/sections/Amenities.jsx';
import Gallery from '../components/sections/Gallery.jsx';
import Location from '../components/sections/Location.jsx';
import CTASection from '../components/sections/CTASection.jsx';

// Section order mirrors the Figma "Home Page 15" flow.
// Scroll-reveal is wired globally in Layout (useRevealAll, keyed on route).
export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Properties />
      <Lounge />
      <Amenities />
      <Gallery />
      <Location />
      <CTASection />
    </>
  );
}
