"use client"

import { motion } from "motion/react"

export function WowLogo() {
  return (
    <motion.div
      className="relative flex items-center"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
    >
      {/* Glow background */}
      <div className="absolute inset-0 rounded-2xl animate-glow-pulse opacity-60 blur-sm" />

      {/* Main logo container */}
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg
          width="96"
          height="44"
          viewBox="0 0 96 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
          aria-label="WOW! logo"
          role="img"
        >
          <defs>
            <linearGradient id="wowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className="gradient-shift-1" style={{ stopColor: "#7C3AED" }} />
              <stop offset="50%" style={{ stopColor: "#A855F7" }} />
              <stop offset="100%" className="gradient-shift-2" style={{ stopColor: "#EC4899" }} />
            </linearGradient>
            <linearGradient id="wowGradientStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: "#A855F7" }} />
              <stop offset="100%" style={{ stopColor: "#EC4899" }} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background pill shape */}
          <rect
            x="1"
            y="1"
            width="94"
            height="42"
            rx="14"
            fill="rgba(124, 58, 237, 0.15)"
            stroke="url(#wowGradientStroke)"
            strokeWidth="1.5"
          />

          {/* WOW! text */}
          <text
            x="48"
            y="32"
            textAnchor="middle"
            fontFamily="Poppins, sans-serif"
            fontWeight="900"
            fontSize="28"
            letterSpacing="1"
            fill="url(#wowGradient)"
            filter="url(#glow)"
          >
            WOW!
          </text>
        </svg>
      </motion.div>

      {/* Animated accent dot */}
      <motion.div
        className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  )
}
