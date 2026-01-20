"use client"

import React from "react"

import { useState } from "react"

interface DigitalCardProps {
  userName?: string
  memberId?: string
}

export function DigitalCard({ userName = "Usuario", memberId = "WOW-2024-001" }: DigitalCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setMousePosition({ x, y })
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setMousePosition({ x: 0, y: 0 })
  }

  return (
    <div
      className="relative w-full cursor-pointer"
      style={{ perspective: "1000px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Card container with 3D transform */}
      <div
        className="relative transition-transform duration-300 ease-out"
        style={{
          transform: isHovered
            ? `rotateY(${mousePosition.x * 8}deg) rotateX(${-mousePosition.y * 8}deg) scale(1.02)`
            : "rotateY(0deg) rotateX(0deg) scale(1)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Glow effect on hover */}
        <div
          className="absolute -inset-3 rounded-2xl transition-opacity duration-300 blur-2xl"
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #f97316 50%, #3b82f6 100%)",
            opacity: isHovered ? 0.4 : 0,
          }}
        />

        {/* Card with image - maintains aspect ratio */}
        <div className="relative rounded-lg overflow-hidden shadow-2xl">
          <img
            src="/images/wow-card.png"
            alt="WOW Digital Card"
            className="w-full h-auto block"
            style={{
              filter: isHovered
                ? "brightness(1.05)"
                : "brightness(1)",
              transition: "filter 0.3s ease",
            }}
          />

          {/* Gradient overlay at bottom for text readability */}
          <div
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)",
            }}
          />

          {/* Card info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-gray-300 uppercase tracking-wider font-medium">Miembro</p>
                <p className="text-sm font-bold text-white drop-shadow-lg">{userName}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-300 uppercase tracking-wider font-medium">ID</p>
                <p className="text-xs font-mono text-violet-300 font-semibold drop-shadow-lg">{memberId}</p>
              </div>
            </div>
          </div>

          {/* Shine effect on hover */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
            style={{
              background: `linear-gradient(
                ${105 + mousePosition.x * 30}deg,
                transparent 40%,
                rgba(255,255,255,0.1) 45%,
                rgba(255,255,255,0.2) 50%,
                rgba(255,255,255,0.1) 55%,
                transparent 60%
              )`,
              opacity: isHovered ? 1 : 0,
            }}
          />

          {/* Border glow */}
          <div
            className="absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-300"
            style={{
              boxShadow: isHovered
                ? "inset 0 0 0 1px rgba(139, 92, 246, 0.5), 0 0 30px rgba(139, 92, 246, 0.3)"
                : "inset 0 0 0 1px rgba(255,255,255,0.1)",
            }}
          />
        </div>
      </div>

      {/* Reflection effect */}
      <div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-10 rounded-full blur-2xl transition-opacity duration-300"
        style={{
          background: "linear-gradient(90deg, #8b5cf6, #f97316, #3b82f6)",
          opacity: isHovered ? 0.25 : 0.1,
        }}
      />
    </div>
  )
}
