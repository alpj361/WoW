"use client"

import React from "react"

import { Bell, MapPin, Palette, Sparkles, HelpCircle, FileText, Shield, Info, ChevronRight, User, Flag as Flask } from "lucide-react"
import { DigitalCard } from "./digital-card"

interface SettingItemProps {
  icon: React.ElementType
  title: string
  subtitle?: string
  onPress?: () => void
  showArrow?: boolean
  color?: string
}

function SettingItem({
  icon: Icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  color = "#fff",
}: SettingItemProps) {
  return (
    <button
      className="flex items-center w-full p-4 border-b border-[#2A2A2A] last:border-b-0"
      onClick={onPress}
    >
      <div
        className="w-10 h-10 rounded-[10px] flex items-center justify-center mr-3"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1 text-left">
        <span className="text-base font-medium block" style={{ color }}>
          {title}
        </span>
        {subtitle && (
          <span className="text-[13px] text-gray-500 mt-0.5 block">
            {subtitle}
          </span>
        )}
      </div>
      {showArrow && onPress && (
        <ChevronRight className="w-5 h-5 text-gray-600" />
      )}
    </button>
  )
}

interface ProfileScreenProps {
  savedCount?: number
  attendedCount?: number
  ratedCount?: number
  onSeedData?: () => void
}

export function ProfileScreen({
  savedCount = 0,
  attendedCount = 0,
  ratedCount = 0,
  onSeedData,
}: ProfileScreenProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F]">
      {/* Header */}
      <div className="flex flex-col items-center py-6 pt-10">
        {/* Demo Banner */}
        <div className="flex items-center gap-1.5 bg-amber-500/15 px-4 py-2 rounded-full mb-4">
          <Flask className="w-4 h-4 text-amber-500" />
          <span className="text-amber-500 text-xs font-semibold">
            Demo - Version de prueba
          </span>
        </div>

        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
          <User className="w-12 h-12 text-violet-500" />
        </div>

        <h2 className="text-2xl font-bold text-white">Usuario WOW</h2>
        <p className="text-sm text-gray-500 mt-1">
          Explorando eventos increibles
        </p>
      </div>

      {/* Digital Card */}
      <div className="px-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
          Tu Tarjeta Digital
        </h3>
        <DigitalCard userName="Usuario WOW" memberId="WOW-2024-001" />
      </div>

      {/* Stats */}
      <div className="flex bg-[#1F1F1F] mx-5 rounded-2xl p-5 mb-6">
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[28px] font-bold text-white">{savedCount}</span>
          <span className="text-xs text-gray-500 mt-1">Guardados</span>
        </div>
        <div className="w-px bg-[#2A2A2A] my-1" />
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[28px] font-bold text-white">
            {attendedCount}
          </span>
          <span className="text-xs text-gray-500 mt-1">Asistidos</span>
        </div>
        <div className="w-px bg-[#2A2A2A] my-1" />
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[28px] font-bold text-white">{ratedCount}</span>
          <span className="text-xs text-gray-500 mt-1">Calificados</span>
        </div>
      </div>

      {/* Preferencias Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 ml-5 mb-2 uppercase tracking-wider">
          Preferencias
        </h3>
        <div className="bg-[#1F1F1F] mx-5 rounded-2xl overflow-hidden">
          <SettingItem
            icon={Bell}
            title="Notificaciones"
            subtitle="Proximamente"
          />
          <SettingItem
            icon={MapPin}
            title="Ubicacion"
            subtitle="Proximamente"
          />
          <SettingItem
            icon={Palette}
            title="Apariencia"
            subtitle="Tema oscuro"
          />
        </div>
      </div>

      {/* Desarrollo Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 ml-5 mb-2 uppercase tracking-wider">
          Desarrollo
        </h3>
        <div className="bg-[#1F1F1F] mx-5 rounded-2xl overflow-hidden">
          <SettingItem
            icon={Sparkles}
            title="Cargar eventos de ejemplo"
            subtitle="Reinicia con datos de prueba"
            onPress={onSeedData}
            color="#8B5CF6"
          />
        </div>
      </div>

      {/* Informacion Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 ml-5 mb-2 uppercase tracking-wider">
          Informacion
        </h3>
        <div className="bg-[#1F1F1F] mx-5 rounded-2xl overflow-hidden">
          <SettingItem
            icon={HelpCircle}
            title="Ayuda y Soporte"
            subtitle="Preguntas frecuentes"
          />
          <SettingItem icon={FileText} title="Terminos y Condiciones" />
          <SettingItem icon={Shield} title="Privacidad" />
          <SettingItem
            icon={Info}
            title="Version"
            subtitle="0.0.1 MVP"
            showArrow={false}
          />
        </div>
      </div>

      {/* App Info */}
      <div className="flex flex-col items-center py-8">
        <h2 className="text-3xl font-bold text-violet-500 tracking-[6px]">
          WOW
        </h2>
        <p className="text-sm text-gray-500 mt-1">Descubre y Vive Eventos</p>
        <p className="text-xs text-gray-600 text-center mt-4 leading-5 px-8">
          Desarrollado con amor para conectar personas con experiencias
          inolvidables
        </p>
      </div>

      {/* Bottom spacing */}
      <div className="h-10" />
    </div>
  )
}
