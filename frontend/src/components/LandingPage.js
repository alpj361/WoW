import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassSphere } from './GlassSphere';
import { ChevronDown } from 'lucide-react';

const PLACES = [
  {
    imageUrl: 'https://images.unsplash.com/photo-1706782804418-a791eb8dc8e1?q=85&w=800&auto=format&fit=crop',
    alt: 'Eiffel Tower reflection',
    placeName: 'Paris',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1583915223588-7d88ebf23414?q=85&w=800&auto=format&fit=crop',
    alt: 'Tokyo skyline at night',
    placeName: 'Tokyo',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1736876134143-213d77cd09a0?q=85&w=800&auto=format&fit=crop',
    alt: 'Tropical beach with palm trees',
    placeName: 'Bali',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1719335033513-99a011ff33bb?q=85&w=800&auto=format&fit=crop',
    alt: 'Stone castle',
    placeName: 'Portugal',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1770234894941-f19b2d8f07e2?q=85&w=800&auto=format&fit=crop',
    alt: 'Empire State Building',
    placeName: 'New York',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1706188553061-1259d37ecd16?q=85&w=800&auto=format&fit=crop',
    alt: 'Snow skiing in mountains',
    placeName: 'Alps',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1619417889956-c701044fed86?q=85&w=800&auto=format&fit=crop',
    alt: 'Traditional temple',
    placeName: 'Kyoto',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1714412192114-61dca8f15f68?q=85&w=800&auto=format&fit=crop',
    alt: 'Beach with palm tree',
    placeName: 'Maldives',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1625361576343-b4798ef29dc3?q=85&w=800&auto=format&fit=crop',
    alt: 'White bridge over river',
    placeName: 'Amsterdam',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1614173326643-1ad17c4fa0b0?q=85&w=800&auto=format&fit=crop',
    alt: 'Night street in Tokyo',
    placeName: 'Shibuya',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1700653964875-630df46b2620?q=85&w=800&auto=format&fit=crop',
    alt: 'Park view city',
    placeName: 'London',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1766133239080-ed4f8f30b320?q=85&w=800&auto=format&fit=crop',
    alt: 'Red tower',
    placeName: 'Istanbul',
  },
];

// Layout config: each bubble has position/size defined for organic masonry feel
const LAYOUT = [
  // Row 1 - two bubbles, right one peeks from edge
  { size: 160, x: -10, y: 0 },
  { size: 140, x: 180, y: 20 },
  // Row 2 - large left, small right peeking
  { size: 180, x: 30, y: 10 },
  { size: 130, x: 240, y: 40 },
  // --- TITLE GOES HERE ---
  // Row 3 - after title
  { size: 150, x: -20, y: 0 },
  { size: 170, x: 190, y: 30 },
  // Row 4
  { size: 130, x: 50, y: 0 },
  { size: 160, x: 220, y: -20 },
  // Row 5
  { size: 175, x: -15, y: 10 },
  { size: 140, x: 210, y: 40 },
  // Row 6
  { size: 155, x: 40, y: 0 },
  { size: 130, x: 250, y: 20 },
];

export default function LandingPage() {
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollHint(window.scrollY <= 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const topBubbles = PLACES.slice(0, 4);
  const bottomBubbles = PLACES.slice(4);

  return (
    <div className="landing-container" data-testid="landing-page">
      {/* Subtitle */}
      <motion.p
        className="subtitle-text"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        data-testid="subtitle"
      >
        Discover the world
      </motion.p>

      {/* Top bubbles - organic layout */}
      <div className="organic-grid" data-testid="bubble-grid-top">
        {topBubbles.map((place, i) => {
          const layout = LAYOUT[i];
          return (
            <div
              key={place.placeName}
              className="organic-cell"
              style={{
                width: layout.size,
                height: layout.size,
                marginLeft: layout.x,
                marginTop: layout.y,
              }}
            >
              <GlassSphere
                imageUrl={place.imageUrl}
                alt={place.alt}
                placeName={place.placeName}
                index={i}
                delay={0.1 + i * 0.12}
              />
            </div>
          );
        })}
      </div>

      {/* Hero Title */}
      <motion.h1
        className="hero-title"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        data-testid="hero-title"
      >
        Soon<br />Places
      </motion.h1>

      {/* Bottom bubbles - organic layout */}
      <div className="organic-grid" data-testid="bubble-grid-bottom">
        {bottomBubbles.map((place, i) => {
          const layout = LAYOUT[i + 4];
          return (
            <div
              key={place.placeName}
              className="organic-cell"
              style={{
                width: layout.size,
                height: layout.size,
                marginLeft: layout.x,
                marginTop: layout.y,
              }}
            >
              <GlassSphere
                imageUrl={place.imageUrl}
                alt={place.alt}
                placeName={place.placeName}
                index={i + 4}
                delay={0.6 + i * 0.08}
              />
            </div>
          );
        })}
      </div>

      {/* Scroll hint */}
      <AnimatePresence>
        {showScrollHint && (
          <motion.div
            className="scroll-hint"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            data-testid="scroll-hint"
          >
            <span>scroll</span>
            <ChevronDown size={14} strokeWidth={1.5} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
