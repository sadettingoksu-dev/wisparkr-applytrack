'use client'

import { useEffect, useState } from 'react'
import { MessageSquareText, FileSearch, LayoutDashboard, Star } from 'lucide-react'

const STEPS = [
  {
    label: 'Başvurularını kanban board ile takip et',
    cursor: { x: 62, y: 48 },
    screen: 'kanban',
  },
  {
    label: "CV'ni yükle, AI analiz etsin",
    cursor: { x: 50, y: 60 },
    screen: 'cv',
  },
  {
    label: 'İlana uyum skorunu anında gör',
    cursor: { x: 72, y: 52 },
    screen: 'score',
  },
  {
    label: 'Kariyer koçunla mülakata hazırlan',
    cursor: { x: 55, y: 65 },
    screen: 'coach',
  },
]

const STEP_DURATION = 2800

function KanbanScreen() {
  const cols = [
    { label: 'Beklemede', color: 'bg-yellow-500/20 border-yellow-500/30', cards: ['Google — Frontend Dev', 'Meta — React Eng.'] },
    { label: 'Mülakat', color: 'bg-blue-500/20 border-blue-500/30', cards: ['Spotify — UI Dev'] },
    { label: 'Teklif', color: 'bg-green-500/20 border-green-500/30', cards: ['Figma — Product Eng.'] },
  ]
  return (
    <div className="flex gap-2 p-3 h-full">
      {cols.map((col) => (
        <div key={col.label} className="flex-1 flex flex-col gap-1.5">
          <div className={`rounded-md border px-2 py-1 text-[9px] font-bold text-white/70 ${col.color}`}>
            {col.label}
          </div>
          {col.cards.map((c) => (
            <div key={c} className="rounded-md bg-white/10 border border-white/10 px-2 py-1.5 text-[8px] text-white/80">
              {c}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function CvScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
      <div className="w-full rounded-xl border-2 border-dashed border-purple-500/40 bg-purple-500/5 p-4 flex flex-col items-center gap-2">
        <FileSearch className="h-8 w-8 text-purple-400" />
        <p className="text-[9px] text-white/60 text-center">CV&apos;ni buraya sürükle veya seç</p>
        <div className="rounded-lg bg-purple-600 px-3 py-1 text-[8px] font-bold text-white">Dosya Seç</div>
      </div>
      <div className="w-full rounded-lg bg-white/5 border border-white/10 p-2">
        <p className="text-[8px] text-white/40">cv_2024.pdf</p>
        <div className="mt-1 h-1 w-full rounded-full bg-white/10">
          <div className="h-1 w-3/4 rounded-full bg-purple-500 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

function ScoreScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <svg className="absolute inset-0" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15" fill="none"
            stroke="url(#grad)" strokeWidth="3"
            strokeDasharray="78 94"
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
          />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
        <div className="flex flex-col items-center">
          <span className="text-xl font-black text-white">83</span>
          <span className="text-[7px] text-white/40">/ 100</span>
        </div>
      </div>
      <p className="text-[8px] font-bold text-purple-300">Yüksek Uyum</p>
      <div className="w-full space-y-1.5">
        {[['Python', 90], ['React', 75], ['AWS', 60]].map(([skill, val]) => (
          <div key={skill} className="flex items-center gap-2">
            <span className="w-10 text-[7px] text-white/50">{skill}</span>
            <div className="flex-1 h-1 rounded-full bg-white/10">
              <div className="h-1 rounded-full bg-purple-500" style={{ width: `${val}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CoachScreen() {
  return (
    <div className="flex flex-col h-full p-3 gap-2">
      <div className="flex items-center gap-1.5 border-b border-white/10 pb-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600">
          <Star className="h-2.5 w-2.5 text-yellow-300" />
        </div>
        <span className="text-[9px] font-bold text-white">Kariyer Koçu</span>
      </div>
      <div className="flex flex-col gap-2 flex-1 overflow-hidden">
        <div className="self-start rounded-xl rounded-tl-none bg-white/10 px-2.5 py-1.5 text-[8px] text-white/80 max-w-[80%]">
          Merhaba! Mülakat için nasıl yardımcı olabilirim?
        </div>
        <div className="self-end rounded-xl rounded-tr-none bg-purple-600 px-2.5 py-1.5 text-[8px] text-white max-w-[80%]">
          Google mülakatı için hazırlanıyorum
        </div>
        <div className="self-start rounded-xl rounded-tl-none bg-white/10 px-2.5 py-1.5 text-[8px] text-white/80 max-w-[80%]">
          Harika! Sistem tasarımı ve algoritma sorularına odaklanalım...
        </div>
      </div>
      <div className="flex gap-1.5 items-center border-t border-white/10 pt-2">
        <div className="flex-1 rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-[7px] text-white/30">
          Soru sor...
        </div>
        <div className="rounded-lg bg-purple-600 px-2 py-1 text-[7px] text-white font-bold">↑</div>
      </div>
    </div>
  )
}

const SCREEN_MAP = {
  kanban: KanbanScreen,
  cv: CvScreen,
  score: ScoreScreen,
  coach: CoachScreen,
}

const NAV_ICONS = [
  { icon: LayoutDashboard, screen: 'kanban' },
  { icon: FileSearch, screen: 'cv' },
  { icon: Star, screen: 'score' },
  { icon: MessageSquareText, screen: 'coach' },
]

export function AppDemo() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setStep((s) => (s + 1) % STEPS.length)
        setVisible(true)
      }, 300)
    }, STEP_DURATION)
    return () => clearInterval(interval)
  }, [])

  const current = STEPS[step]
  const ScreenComponent = SCREEN_MAP[current.screen as keyof typeof SCREEN_MAP]

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Açıklama yazısı */}
      <div
        className="text-center text-lg font-bold text-white transition-opacity duration-300 min-h-[28px]"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {current.label}
      </div>

      {/* Mock ekran */}
      <div className="relative w-72 rounded-2xl border border-white/15 bg-[#1a1730] shadow-2xl shadow-purple-900/30 overflow-hidden"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s' }}
      >
        {/* Tarayıcı üst bar */}
        <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/5 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-red-500/60" />
          <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
          <div className="h-2 w-2 rounded-full bg-green-500/60" />
          <div className="ml-2 flex-1 rounded bg-white/5 px-2 py-0.5 text-[8px] text-white/30">
            wisparkr.com
          </div>
        </div>

        {/* App içi layout */}
        <div className="flex" style={{ height: 200 }}>
          {/* Sol nav */}
          <div className="flex flex-col items-center gap-3 border-r border-white/10 bg-white/3 px-2 py-3">
            {NAV_ICONS.map(({ icon: Icon, screen }) => (
              <div
                key={screen}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  current.screen === screen ? 'bg-purple-600 text-white' : 'text-white/30'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
            ))}
          </div>

          {/* İçerik */}
          <div className="flex-1 relative">
            <ScreenComponent />

            {/* Fare imleci */}
            <div
              className="pointer-events-none absolute transition-all duration-700"
              style={{ left: `${current.cursor.x}%`, top: `${current.cursor.y}%` }}
            >
              <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                <path d="M0 0L0 14L4 10L6.5 16L8.5 15L6 9L11 9Z" fill="white" stroke="#6b21a8" strokeWidth="1" />
              </svg>
            </div>
          </div>
        </div>

        {/* Alt adım göstergesi */}
        <div className="flex justify-center gap-1.5 py-2 border-t border-white/10">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === step ? 'w-4 bg-purple-400' : 'w-1 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
