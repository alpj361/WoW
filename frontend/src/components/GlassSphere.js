import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export const GlassSphere = ({ imageUrl, alt, placeName, index, delay = 0 }) => {
  const [isBlurring, setIsBlurring] = useState(false);

  const handleClick = useCallback(() => {
    if (isBlurring) return;
    setIsBlurring(true);
    setTimeout(() => setIsBlurring(false), 700);
  }, [isBlurring]);

  return (
    <motion.div
      className="bubble-cell"
      initial={{ opacity: 0, y: 40, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay: delay,
        ease: [0.2, 0.8, 0.2, 1],
      }}
    >
      <div
        className={`glass-sphere ${isBlurring ? 'glass-sphere--blur-active' : ''}`}
        onClick={handleClick}
        data-testid={`glass-sphere-${index}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      >
        <img
          className="glass-sphere__image"
          src={imageUrl}
          alt={alt}
          loading="lazy"
          draggable={false}
        />
        <div className="glass-sphere__overlay" />
        <div className="glass-sphere__rim" />
        <div className="glass-sphere__specular" />
        {placeName && (
          <div className="place-label">
            <span>{placeName}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
