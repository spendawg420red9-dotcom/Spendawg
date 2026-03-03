
import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { GameStatus, PlayerStats, PowerUpType, ScoreEntry, HUDSettings, KeybindSettings, GamepadSettings, GameSettings, WeaponCamo, Achievement, Progression, PlayerScore, WeaponAttachment, ZombieType, GameMode } from './types';
import { Joystick } from './components/Joystick';
import { Scene } from './components/Scene';
import { useTexture } from '@react-three/drei';
import { getRoundLore } from './services/geminiService';
import { soundService } from './services/soundService';
import { MAPS } from './maps';
import { io, Socket } from 'socket.io-client';
import { Skull, Target, Database, RefreshCw, Activity, ShoppingCart, Zap, Gauge, Heart, Shield, Box as BoxIcon, Crosshair, TrendingUp, Pause, Play, LogOut, PlusCircle, UserX, Wind, RotateCcw, AlertCircle, Timer, Swords, Bomb, Sun, Crosshair as HeadshotIcon, Zap as PapIcon, Trophy, User, ChevronLeft, Trash2, ArrowUp, Zap as SlideIcon, Snowflake, Flame, Scissors, Hourglass, Map as MapIcon, Gamepad, Bluetooth, Keyboard, Eye, X, Gem, Egg, Wrench, Star, Medal, Award, Crown, ChevronUp, ChevronDown, CheckCircle2, Droplet, CircleDot, Search, Hand, Layers, VolumeX, Lock, UserPlus, Users } from 'lucide-react';

const WEAPONS: Record<string, { clip: number, max: number, damage: number, rate: number, color: string, speed: number, reload: number, description?: string, unlockLevel?: number }> = {
  'M1911': { clip: 8, max: 80, damage: 65, rate: 200, color: '#999', speed: 0.1, reload: 1500, unlockLevel: 1 },
  'MP5': { clip: 30, max: 120, damage: 55, rate: 100, color: '#333', speed: 0.1, reload: 2000, unlockLevel: 6 },
  'GALIL': { clip: 35, max: 175, damage: 85, rate: 120, color: '#554433', speed: 0.09, reload: 2500, unlockLevel: 26 },
  'REMINGTON': { clip: 8, max: 40, damage: 280, rate: 800, color: '#222', speed: 0.08, reload: 3000, unlockLevel: 32 },
  'HAMR': { clip: 125, max: 375, damage: 75, rate: 130, color: '#4a4a4a', speed: 0.07, reload: 4000, unlockLevel: 40 },
  'RPD': { clip: 100, max: 400, damage: 70, rate: 125, color: '#2a2a2a', speed: 0.07, reload: 4500, unlockLevel: 36 },
  'DSR-50': { clip: 5, max: 50, damage: 800, rate: 1500, color: '#1a1a1a', speed: 0.06, reload: 3500, unlockLevel: 48 },
  'RAY GUN': { clip: 20, max: 160, damage: 1000, rate: 180, color: '#ff0000', speed: 0.09, reload: 2000, unlockLevel: 50 },
  'AK-47': { clip: 30, max: 150, damage: 95, rate: 110, color: '#4b3621', speed: 0.09, reload: 2200, unlockLevel: 10 },
  'SCAR-H': { clip: 20, max: 140, damage: 110, rate: 130, color: '#c2b280', speed: 0.08, reload: 2400, unlockLevel: 24 },
  'STRIKER': { clip: 12, max: 60, damage: 220, rate: 400, color: '#333333', speed: 0.09, reload: 2800, unlockLevel: 30 },
  'VECTOR': { clip: 40, max: 200, damage: 45, rate: 60, color: '#1a1a1a', speed: 0.11, reload: 1800, unlockLevel: 22 },
  'WUNDERWAFFE DG-2': { clip: 3, max: 15, damage: 5000, rate: 1000, color: '#00ffff', speed: 0.08, reload: 5000, unlockLevel: 52 },
  'THUNDERGUN': { clip: 2, max: 12, damage: 10000, rate: 1200, color: '#888888', speed: 0.08, reload: 6000, unlockLevel: 55 },
  'M14': { clip: 10, max: 80, damage: 120, rate: 300, color: '#5c4033', speed: 0.09, reload: 2000, unlockLevel: 4 },
  'OLYMPIA': { clip: 2, max: 40, damage: 350, rate: 500, color: '#3d2b1f', speed: 0.1, reload: 2200, unlockLevel: 2 },
  'PYTHON': { clip: 6, max: 60, damage: 250, rate: 400, color: '#71706e', speed: 0.1, reload: 2500, unlockLevel: 28 },
  'FAMAS': { clip: 30, max: 150, damage: 70, rate: 80, color: '#4a5d23', speed: 0.09, reload: 2300, unlockLevel: 20 },
  'PPSH-41': { clip: 71, max: 355, damage: 50, rate: 60, color: '#2b2b2b', speed: 0.09, reload: 2800, unlockLevel: 18 },
  'THOMPSON': { clip: 50, max: 250, damage: 60, rate: 120, color: '#3d2b1f', speed: 0.09, reload: 2500, unlockLevel: 16 },
  'MP40': { clip: 32, max: 192, damage: 65, rate: 110, color: '#2b2b2b', speed: 0.09, reload: 2400, unlockLevel: 12 },
  'STG-44': { clip: 30, max: 180, damage: 75, rate: 100, color: '#4b3621', speed: 0.08, reload: 2600, unlockLevel: 14 },
  'BROWNING M1919': { clip: 100, max: 400, damage: 80, rate: 120, color: '#333', speed: 0.06, reload: 5000, unlockLevel: 44 },
  'TYPE 100': { clip: 30, max: 180, damage: 50, rate: 130, color: '#554433', speed: 0.1, reload: 2200, unlockLevel: 8 },
  
  // Pack-A-Punched variants
  'MUSTANG & SALLY': { clip: 1212, max: 240, damage: 2200, rate: 150, color: '#ff00ff', speed: 0.1, reload: 1200, description: 'Twin Grenade Launchers' },
  'MP115 KOLLIDER': { clip: 40, max: 200, damage: 110, rate: 80, color: '#00ffff', speed: 0.1, reload: 1500 },
  'LAMENTATION': { clip: 50, max: 300, damage: 180, rate: 100, color: '#00ff00', speed: 0.09, reload: 2000 },
  'PUNISHMENT': { clip: 12, max: 80, damage: 600, rate: 600, color: '#ff8800', speed: 0.08, reload: 2500 },
  'HAMR DOWN': { clip: 150, max: 600, damage: 160, rate: 110, color: '#ffffff', speed: 0.07, reload: 3500 },
  'RELATIVISTIC PUNISHER': { clip: 120, max: 600, damage: 150, rate: 100, color: '#ff0000', speed: 0.07, reload: 4000 },
  'DEAD SPECIMEN REACTOR': { clip: 10, max: 100, damage: 2000, rate: 1200, color: '#000000', speed: 0.06, reload: 3000 },
  'PORTER\'S X2 RAY GUN': { clip: 40, max: 200, damage: 2500, rate: 150, color: '#ff0000', speed: 0.09, reload: 1500 },
  'REZNOV\'S REVENGE': { clip: 45, max: 300, damage: 180, rate: 100, color: '#8b0000', speed: 0.09, reload: 1800 },
  'AGAMEMNON': { clip: 30, max: 240, damage: 220, rate: 120, color: '#ffd700', speed: 0.08, reload: 2000 },
  'STRIKE-OUT': { clip: 24, max: 120, damage: 450, rate: 350, color: '#ff4500', speed: 0.09, reload: 2200 },
  'KINETIC CONVERTER': { clip: 60, max: 400, damage: 90, rate: 50, color: '#adff2f', speed: 0.11, reload: 1400 },
  'WUNDERWAFFE DG-3 JZ': { clip: 6, max: 30, damage: 10000, rate: 800, color: '#ffffff', speed: 0.08, reload: 4000 },
  'ZEUS CANNON': { clip: 4, max: 24, damage: 20000, rate: 1000, color: '#ffffff', speed: 0.08, reload: 5000 },
  'M118': { clip: 20, max: 160, damage: 250, rate: 250, color: '#a0522d', speed: 0.09, reload: 1600 },
  'HADES': { clip: 2, max: 80, damage: 800, rate: 400, color: '#8b4513', speed: 0.1, reload: 1800 },
  'COBRA': { clip: 6, max: 120, damage: 600, rate: 300, color: '#c0c0c0', speed: 0.1, reload: 2000 },
  'G116': { clip: 45, max: 225, damage: 140, rate: 70, color: '#556b2f', speed: 0.09, reload: 1900 },
  'THE REAPER': { clip: 115, max: 700, damage: 90, rate: 50, color: '#333333', speed: 0.09, reload: 2400 },
  'GIBS-O-MATIC': { clip: 70, max: 400, damage: 100, rate: 100, color: '#3d2b1f', speed: 0.09, reload: 2000 },
  'THE AFTERBURNER': { clip: 64, max: 320, damage: 110, rate: 90, color: '#2b2b2b', speed: 0.09, reload: 1800 },
  'SPATZ-447 +': { clip: 60, max: 360, damage: 130, rate: 90, color: '#4b3621', speed: 0.08, reload: 2000 },
  'B115 ACCELERATOR': { clip: 150, max: 750, damage: 140, rate: 100, color: '#333', speed: 0.07, reload: 4000 },
  '1001 SAMURAIS': { clip: 60, max: 360, damage: 90, rate: 110, color: '#554433', speed: 0.1, reload: 1800 },
  'Bowie Knife': { clip: 0, max: 0, damage: 2000, rate: 0, color: '#ffffff', speed: 0.1, reload: 0 },
  'DEATH_MACHINE': { clip: 999, max: 999, damage: 150, rate: 50, color: '#333333', speed: 0.05, reload: 0 },
};

const PAP_MAPPING: Record<string, string> = {
  'M1911': 'MUSTANG & SALLY',
  'MP5': 'MP115 KOLLIDER',
  'GALIL': 'LAMENTATION',
  'REMINGTON': 'PUNISHMENT',
  'HAMR': 'HAMR DOWN',
  'RPD': 'RELATIVISTIC PUNISHER',
  'DSR-50': 'DEAD SPECIMEN REACTOR',
  'RAY GUN': 'PORTER\'S X2 RAY GUN',
  'AK-47': 'REZNOV\'S REVENGE',
  'SCAR-H': 'AGAMEMNON',
  'STRIKER': 'STRIKE-OUT',
  'VECTOR': 'KINETIC CONVERTER',
  'WUNDERWAFFE DG-2': 'WUNDERWAFFE DG-3 JZ',
  'THUNDERGUN': 'ZEUS CANNON',
  'M14': 'M118',
  'OLYMPIA': 'HADES',
  'PYTHON': 'COBRA',
  'FAMAS': 'G116',
  'PPSH-41': 'THE REAPER',
  'THOMPSON': 'GIBS-O-MATIC',
  'MP40': 'THE AFTERBURNER',
  'STG-44': 'SPATZ-447 +',
  'BROWNING M1919': 'B115 ACCELERATOR',
  'TYPE 100': '1001 SAMURAIS'
};

const isPapWeapon = (name: string) => Object.values(PAP_MAPPING).includes(name);
const isWonderWeapon = (name: string) => name.includes('RAY') || name.includes('WUNDER') || name.includes('THUNDER');

const getBaseWeaponName = (name: string) => {
  const entry = Object.entries(PAP_MAPPING).find(([base, pap]) => pap === name);
  return entry ? entry[0] : name;
};

const getActiveAttachments = (weaponName: string, playerLevel: number, attachments: Record<string, WeaponAttachment[]>) => {
  const baseWeapon = getBaseWeaponName(weaponName);
  const reqLevel = WEAPONS[baseWeapon]?.unlockLevel || 1;
  if (playerLevel < reqLevel) return [];
  return attachments[baseWeapon] || [];
};

const SORTED_WEAPONS = Object.entries(WEAPONS).sort((a, b) => {
  const isPapA = isPapWeapon(a[0]);
  const isPapB = isPapWeapon(b[0]);
  if (isPapA !== isPapB) return isPapA ? 1 : -1;
  return b[1].damage - a[1].damage;
});

const getPrestigeIcon = (prestige: number, size: number = 20) => {
  switch (prestige) {
    case 1: return <Star size={size} className="text-amber-600 fill-amber-600/20" />;
    case 2: return <Shield size={size} className="text-orange-500 fill-orange-500/20" />;
    case 3: return <Zap size={size} className="text-blue-500 fill-blue-500/20" />;
    case 4: return <Flame size={size} className="text-red-500 fill-red-500/20" />;
    case 5: return <Crown size={size} className="text-purple-500 fill-purple-500/20" />;
    case 6: return <Gem size={size} className="text-cyan-500 fill-cyan-500/20" />;
    case 7: return <Award size={size} className="text-pink-500 fill-pink-500/20" />;
    case 8: return <Medal size={size} className="text-emerald-500 fill-emerald-500/20" />;
    case 9: return <Trophy size={size} className="text-yellow-400 fill-yellow-400/20" />;
    case 10: return <Skull size={size} className="text-red-600 fill-red-600/20" />;
    default: return <Star size={size} className="text-yellow-500 fill-yellow-500/20" />;
  }
};

const getPrestigeColor = (prestige: number) => {
  switch (prestige) {
    case 1: return "text-amber-600";
    case 2: return "text-orange-500";
    case 3: return "text-blue-500";
    case 4: return "text-red-500";
    case 5: return "text-purple-500";
    case 6: return "text-cyan-500";
    case 7: return "text-pink-500";
    case 8: return "text-emerald-500";
    case 9: return "text-yellow-400";
    case 10: return "text-red-600";
    default: return "text-yellow-500";
  }
};

const getWeaponIcon = (name: string, size: number = 20) => {
  const upperName = name.toUpperCase();
  if (upperName.includes('RAY') || upperName.includes('WUNDER') || upperName.includes('THUNDER') || upperName.includes('MUSTANG')) return <Zap size={size} className="text-cyan-400" />;
  if (upperName.includes('KNIFE')) return <Swords size={size} className="text-slate-400" />;
  if (upperName.includes('DSR') || upperName.includes('SNIPER')) return <Eye size={size} className="text-blue-400" />;
  if (upperName.includes('HAMR') || upperName.includes('RPD') || upperName.includes('BROWNING') || upperName.includes('LMG')) return <Database size={size} className="text-orange-400" />;
  if (upperName.includes('REMINGTON') || upperName.includes('STRIKER') || upperName.includes('OLYMPIA') || upperName.includes('SHOTGUN')) return <Swords size={size} className="text-red-400" />;
  if (upperName.includes('MP5') || upperName.includes('PPSH') || upperName.includes('THOMPSON') || upperName.includes('MP40') || upperName.includes('VECTOR') || upperName.includes('TYPE 100') || upperName.includes('SMG')) return <Zap size={size} className="text-yellow-400" />;
  if (upperName.includes('M1911') || upperName.includes('PYTHON') || upperName.includes('PISTOL')) return <Crosshair size={size} className="text-slate-300" />;
  return <Target size={size} className="text-emerald-400" />;
};

const getAttachmentIcon = (att: WeaponAttachment, size: number = 14) => {
  switch (att) {
    case 'red_dot': return <CircleDot size={size} />;
    case 'acog': return <Search size={size} />;
    case 'foregrip': return <Hand size={size} />;
    case 'extended_mag': return <Layers size={size} />;
    case 'laser_sight': return <Zap size={size} />;
    case 'suppressor': return <VolumeX size={size} />;
    default: return <PlusCircle size={size} />;
  }
};

const getInitialStats = (level: number, prestige: number, activeMapId: string = 'town', selectedCamo: WeaponCamo = 'none', weaponAttachments: Record<string, WeaponAttachment[]> = {}): PlayerStats => ({
  hp: 100 + (level - 1) * 1 + prestige * 10,
  maxHp: 100 + (level - 1) * 1 + prestige * 10,
  points: 500 + (level - 1) * 10 + prestige * 500,
  totalPoints: 500 + (level - 1) * 10 + prestige * 500,
  kills: 0,
  headshots: 0,
  knifeKills: 0,
  equipmentKills: 0,
  round: 1,
  zombiesRemaining: 0,
  ammo: 8,
  maxAmmo: 80,
  secondaryAmmo: 0,
  secondaryMaxAmmo: 0,
  tertiaryAmmo: 0,
  tertiaryMaxAmmo: 0,
  perks: [],
  weaponTier: 1,
  secondaryWeaponTier: 1,
  tertiaryWeaponTier: 1,
  weaponName: 'M1911',
  secondaryWeaponName: null,
  tertiaryWeaponName: null,
  attachments: weaponAttachments['M1911'] || [],
  secondaryAttachments: [],
  tertiaryAttachments: [],
  activeSlot: 0,
  healthRefillsBought: 0,
  grenades: 2,
  flashbangs: 1,
  monkeyBombs: 0,
  time: 0,
  activeMapId,
  selectedCamo,
  hasBowie: false,
  isDowned: false,
  downedTimer: 0,
  downs: 0,
  revives: 0,
  isReviving: false,
  variant: Math.floor(Math.random() * 1000)
});

const INITIAL_HUD_SETTINGS: HUDSettings = {
  buttonScale: 1,
  hudScale: 1,
  statsPos: { x: 24, y: 24 },
  healthBarPos: { x: 24, y: 160 },
  weaponPos: { x: 24, y: 96 },
  pausePos: { x: 24, y: 24 },
  joystickPos: { x: 40, y: 24 },
  grenadePos: { x: 40, y: 176 },
  flashbangPos: { x: 120, y: 176 },
  jumpPos: { x: 360, y: 112 },
  switchPos: { x: 264, y: 112 },
  knifePos: { x: 168, y: 112 },
  shootPos: { x: 40, y: 112 },
  reloadPos: { x: 40, y: 24 },
  ammoPos: { x: 40, y: 248 },
  monkeyBombPos: { x: 200, y: 176 },
};

const INITIAL_GAME_SETTINGS: GameSettings = {
  sfxVolume: 1.0,
  musicVolume: 1.0,
  weatherType: 'dynamic',
  musicEnabled: true,
  customMusicUrl: 'https://domestic-cyan-sy1ltsnxrw.edgeone.app/01%20-%20Damned.mp3',
  customPlaylist: [
    { name: 'Damned', url: 'https://domestic-cyan-sy1ltsnxrw.edgeone.app/01%20-%20Damned.mp3' }
  ],
};

const INITIAL_GAMEPAD_SETTINGS: GamepadSettings = {
  jump: 0, // A
  sprint: 10, // L3
  interact: 2, // X
  reload: 2, // X
  switchWeapon: 3, // Y
  knife: 11, // R3
  grenade: 5, // RB
  flashbang: 4, // LB
  monkeyBomb: 1, // B
  slide: 1, // B
  select: 0, // A
  pause: 9, // Start
  shoot: 7, // RT
  aim: 6, // LT
  sensitivityX: 1.0,
  sensitivityY: 1.0,
};

const INITIAL_KEYBIND_SETTINGS: KeybindSettings = {
  moveForward: 'w',
  moveBackward: 's',
  moveLeft: 'a',
  moveRight: 'd',
  lookUp: 'arrowup',
  lookDown: 'arrowdown',
  lookLeft: 'arrowleft',
  lookRight: 'arrowright',
  jump: ' ',
  sprint: 'shift',
  interact: 'f',
  reload: 'r',
  switchWeapon: 'q',
  knife: 'v',
  grenade: 'g',
  flashbang: 'h',
  monkeyBomb: 'b',
  slide: 'c',
  select: 'enter',
  scrollUp: 'arrowup',
  scrollDown: 'arrowdown',
  scrollLeft: 'arrowleft',
  scrollRight: 'arrowright',
  pause: 'escape',
  shoot: 'mouse0',
  aim: 'mouse1',
};

const GunModel = ({ color, isPap, name }: { color: string, isPap: boolean, name: string }) => {
  const isPistol = name.includes('M1911') || name.includes('MUSTANG') || name.includes('PYTHON') || name.includes('COBRA');
  const isShotgun = name.includes('REMINGTON') || name.includes('PUNISHMENT') || name.includes('STRIKER') || name.includes('STRIKE-OUT') || name.includes('OLYMPIA') || name.includes('HADES');
  const isSniper = name.includes('DSR-50') || name.includes('REACTOR');
  const isWonder = name.includes('RAY') || name.includes('WUNDER') || name.includes('THUNDER') || name.includes('PORTER') || name.includes('JZ') || name.includes('ZEUS');
  const isMelee = name.includes('Bowie');
  
  // Pack-a-Punch visual enhancements
  const papGlow = isPap ? 'drop-shadow(0 0 8px rgba(0, 255, 255, 0.8)) drop-shadow(0 0 15px rgba(255, 0, 255, 0.5))' : 'drop-shadow(0 5px 5px rgba(0,0,0,0.5))';
  const papColor = isPap ? '#ff00ff' : color; // Metallic/Neon base for PaP
  const papAccent = isPap ? '#00ffff' : '#222'; // Cyan accents for PaP
  
  return (
    <div className="w-full h-full flex items-center justify-center relative group-hover:scale-110 transition-transform duration-500">
      <div className="relative" style={{ 
        width: isPistol ? '70px' : isSniper ? '150px' : isShotgun ? '120px' : isMelee ? '80px' : '110px', 
        height: '50px',
        filter: papGlow
      }}>
        {isPap && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 via-purple-500/30 to-cyan-400/30 blur-md rounded-full animate-pulse" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-50 mix-blend-overlay pointer-events-none" />
          </>
        )}
        
        {isMelee ? (
          <>
            {/* Handle */}
            <div className="absolute top-5 left-2 w-8 h-4 rounded-sm transform rotate-12" style={{ backgroundColor: '#333', border: `1px solid ${papAccent}` }} />
            {/* Guard */}
            <div className="absolute top-3 left-9 w-3 h-8 rounded-sm transform rotate-12" style={{ backgroundColor: '#555', border: `1px solid ${papAccent}` }} />
            {/* Blade */}
            <div className="absolute top-2 left-11 w-20 h-5 rounded-r-full transform rotate-12 overflow-hidden" style={{ backgroundColor: isPap ? '#00ffff' : '#ccc', clipPath: 'polygon(0% 0%, 100% 40%, 80% 100%, 0% 100%)' }}>
              {isPap && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2s_infinite]" />}
            </div>
            {/* Blood groove */}
            <div className="absolute top-3 left-12 w-12 h-1 rounded-full transform rotate-12" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />
          </>
        ) : isPistol ? (
          name === 'MUSTANG & SALLY' ? (
            <div className="relative w-full h-full">
              {/* Left Pistol */}
              <div className="absolute top-0 left-0 transform -rotate-12 scale-75">
                <div className="absolute top-2 left-4 w-14 h-4 rounded-sm overflow-hidden" style={{ backgroundColor: papColor }}>
                  {isPap && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite]" />}
                </div>
                <div className="absolute top-2 left-14 w-2 h-4" style={{ backgroundColor: papAccent }} />
                <div className="absolute top-5 left-4 w-5 h-7 rounded-b-sm transform -rotate-12" style={{ backgroundColor: color, filter: 'brightness(0.6)', border: `1px solid ${papAccent}` }} />
                <div className="absolute top-5 left-8 w-3 h-4 rounded-b-sm" style={{ backgroundColor: '#111' }} /> {/* Trigger guard */}
              </div>
              {/* Right Pistol */}
              <div className="absolute top-4 left-10 transform rotate-12 scale-75">
                <div className="absolute top-2 left-4 w-14 h-4 rounded-sm overflow-hidden" style={{ backgroundColor: papColor }}>
                  {isPap && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite_0.5s]" />}
                </div>
                <div className="absolute top-2 left-14 w-2 h-4" style={{ backgroundColor: papAccent }} />
                <div className="absolute top-5 left-4 w-5 h-7 rounded-b-sm transform -rotate-12" style={{ backgroundColor: color, filter: 'brightness(0.6)', border: `1px solid ${papAccent}` }} />
                <div className="absolute top-5 left-8 w-3 h-4 rounded-b-sm" style={{ backgroundColor: '#111' }} />
              </div>
            </div>
          ) : (
            <>
              {/* Barrel/Slide */}
              <div className="absolute top-3 left-4 w-14 h-4 rounded-sm overflow-hidden" style={{ backgroundColor: papColor, borderBottom: `1px solid ${papAccent}` }}>
                {isPap && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />}
              </div>
              {/* Muzzle */}
              <div className="absolute top-3 left-17 w-2 h-4 rounded-r-sm" style={{ backgroundColor: papAccent }} />
              {/* Grip */}
              <div className="absolute top-6 left-4 w-5 h-7 rounded-b-sm transform -rotate-12" style={{ backgroundColor: color, filter: 'brightness(0.6)', border: isPap ? `1px solid ${papAccent}` : 'none' }}>
                <div className="absolute top-1 left-1 w-3 h-5 rounded-sm" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />
              </div>
              {/* Trigger guard */}
              <div className="absolute top-6 left-8 w-4 h-3 rounded-b-full border-2 border-b-0" style={{ borderColor: '#333' }} />
            </>
          )
        ) : isShotgun ? (
          <>
            {/* Barrel */}
            <div className="absolute top-3 left-6 w-24 h-3 rounded-r-sm overflow-hidden" style={{ backgroundColor: papColor }}>
              {isPap && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />}
            </div>
            {/* Underbarrel/Pump */}
            <div className="absolute top-6 left-10 w-16 h-2 rounded-sm" style={{ backgroundColor: papAccent }} />
            <div className="absolute top-5 left-12 w-8 h-4 rounded-sm" style={{ backgroundColor: '#444' }} />
            {/* Receiver */}
            <div className="absolute top-2 left-2 w-10 h-6 rounded-sm" style={{ backgroundColor: color, filter: 'brightness(0.8)', border: isPap ? `1px solid ${papAccent}` : 'none' }} />
            {/* Grip/Stock */}
            <div className="absolute top-6 left-2 w-5 h-7 rounded-b-sm transform -rotate-12" style={{ backgroundColor: color, filter: 'brightness(0.6)' }} />
            <div className="absolute top-3 left-0 w-4 h-5 rounded-l-sm" style={{ backgroundColor: color, filter: 'brightness(0.5)' }} />
            {/* Trigger guard */}
            <div className="absolute top-7 left-6 w-3 h-3 rounded-b-full border-2 border-b-0" style={{ borderColor: '#333' }} />
          </>
        ) : isSniper ? (
          <>
            {/* Barrel */}
            <div className="absolute top-4 left-10 w-28 h-2 rounded-r-sm overflow-hidden" style={{ backgroundColor: papColor }}>
              {isPap && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />}
            </div>
            {/* Scope */}
            <div className="absolute top-0 left-12 w-16 h-2 rounded-sm" style={{ backgroundColor: papAccent }} />
            <div className="absolute top-1 left-14 w-2 h-3" style={{ backgroundColor: '#222' }} />
            <div className="absolute top-1 left-24 w-2 h-3" style={{ backgroundColor: '#222' }} />
            <div className="absolute top-0 left-12 w-3 h-3 rounded-l-sm" style={{ backgroundColor: '#111' }} />
            <div className="absolute top-0 left-25 w-3 h-3 rounded-r-sm" style={{ backgroundColor: '#111' }} />
            {/* Receiver */}
            <div className="absolute top-3 left-4 w-14 h-5 rounded-sm" style={{ backgroundColor: color, filter: 'brightness(0.8)', border: isPap ? `1px solid ${papAccent}` : 'none' }} />
            {/* Grip */}
            <div className="absolute top-7 left-4 w-5 h-7 rounded-b-sm transform -rotate-12" style={{ backgroundColor: color, filter: 'brightness(0.6)' }} />
            {/* Stock */}
            <div className="absolute top-3 left-0 w-8 h-5 rounded-l-sm" style={{ backgroundColor: color, filter: 'brightness(0.5)' }} />
            <div className="absolute top-3 left-0 w-2 h-6 rounded-l-sm" style={{ backgroundColor: '#222' }} /> {/* Buttpad */}
            {/* Bipod/Underbarrel */}
            <div className="absolute top-6 left-20 w-8 h-1" style={{ backgroundColor: '#333' }} />
          </>
        ) : isWonder ? (
          <>
            {/* Main Body */}
            <div className="absolute top-2 left-6 w-20 h-6 rounded-full overflow-hidden" style={{ backgroundColor: papColor, boxShadow: `inset 0 0 10px ${papAccent}` }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_1s_infinite]" />
            </div>
            {/* Energy Core */}
            <div className="absolute top-3 left-10 w-12 h-4 rounded-full animate-pulse" style={{ backgroundColor: papAccent, filter: 'blur(1px)', boxShadow: `0 0 10px ${papAccent}` }} />
            {/* Receiver */}
            <div className="absolute top-3 left-4 w-10 h-7 rounded-sm" style={{ backgroundColor: color, filter: 'brightness(0.8)', border: `2px solid ${papAccent}` }} />
            {/* Grip */}
            <div className="absolute top-8 left-4 w-5 h-7 rounded-b-sm transform -rotate-12" style={{ backgroundColor: color, filter: 'brightness(0.6)' }} />
            {/* Rings/Coils */}
            <div className="absolute top-1 left-12 w-3 h-8 rounded-sm" style={{ backgroundColor: '#222', border: `1px solid ${papAccent}` }} />
            <div className="absolute top-1 left-18 w-3 h-8 rounded-sm" style={{ backgroundColor: '#222', border: `1px solid ${papAccent}` }} />
            {/* Muzzle */}
            <div className="absolute top-3 left-25 w-4 h-4 rounded-full" style={{ backgroundColor: papAccent, filter: 'blur(1px)' }} />
          </>
        ) : (
          // Assault Rifles / SMGs
          <>
            {/* Barrel */}
            <div className="absolute top-3 left-8 w-20 h-3 rounded-r-sm overflow-hidden" style={{ backgroundColor: papColor }}>
              {isPap && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />}
            </div>
            {/* Handguard */}
            <div className="absolute top-2 left-10 w-12 h-5 rounded-sm" style={{ backgroundColor: '#333', borderBottom: `2px solid ${papAccent}` }} />
            {/* Receiver */}
            <div className="absolute top-2 left-4 w-12 h-6 rounded-sm" style={{ backgroundColor: color, filter: 'brightness(0.8)', border: isPap ? `1px solid ${papAccent}` : 'none' }} />
            {/* Magazine */}
            <div className="absolute top-7 left-10 w-4 h-6 rounded-b-sm transform rotate-12" style={{ backgroundColor: '#222' }} />
            {/* Grip */}
            <div className="absolute top-7 left-4 w-5 h-7 rounded-b-sm transform -rotate-12" style={{ backgroundColor: color, filter: 'brightness(0.6)' }} />
            {/* Stock */}
            <div className="absolute top-2 left-0 w-8 h-5 rounded-l-sm" style={{ backgroundColor: color, filter: 'brightness(0.5)' }} />
            {/* Sights */}
            <div className="absolute top-1 left-6 w-2 h-2" style={{ backgroundColor: '#222' }} />
            <div className="absolute top-1 left-18 w-2 h-2" style={{ backgroundColor: '#222' }} />
          </>
        )}
      </div>
    </div>
  );
};

const ZombieModel = ({ variant }: { variant: 'normal' | 'runner' | 'tank' | 'inferno' | 'parasite' | 'crawler' | 'brute' }) => {
  const color = variant === 'tank' ? '#4a5d23' : variant === 'runner' ? '#6b4c35' : variant === 'inferno' ? '#ff4500' : variant === 'parasite' ? '#800080' : variant === 'crawler' ? '#556b2f' : variant === 'brute' ? '#000000' : '#5c6bc0';
  const scale = variant === 'tank' ? 1.2 : variant === 'runner' ? 0.9 : variant === 'brute' ? 1.5 : variant === 'parasite' ? 0.6 : variant === 'crawler' ? 0.7 : 1;
  
  return (
    <div className="w-full h-full flex items-center justify-center relative group-hover:scale-110 transition-transform duration-500" style={{ transform: `scale(${scale})` }}>
      <div className="relative w-16 h-24">
        {/* Head */}
        <div className="absolute top-0 left-4 w-8 h-8 rounded-md z-10" style={{ backgroundColor: color }}>
          <div className="absolute top-2 left-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <div className="absolute top-2 left-5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <div className="absolute top-5 left-2 w-4 h-1 bg-black/50 rounded-sm" />
        </div>
        {/* Body */}
        <div className="absolute top-8 left-2 w-12 h-10 rounded-sm" style={{ backgroundColor: color, filter: 'brightness(0.8)' }}>
          {(variant === 'tank' || variant === 'brute') && <div className="absolute inset-0 border-2 border-black/30 rounded-sm" />}
        </div>
        {/* Arms */}
        <div className="absolute top-8 -left-2 w-4 h-10 rounded-sm transform -rotate-12 origin-top" style={{ backgroundColor: color, filter: 'brightness(0.9)' }} />
        <div className="absolute top-8 right-2 w-10 h-4 rounded-sm transform -rotate-12 origin-left" style={{ backgroundColor: color, filter: 'brightness(0.9)' }} />
        {/* Legs */}
        <div className="absolute top-18 left-2 w-4 h-10 rounded-sm" style={{ backgroundColor: '#222' }} />
        <div className="absolute top-18 left-8 w-4 h-10 rounded-sm" style={{ backgroundColor: '#222' }} />
        
        {/* Special Effects */}
        {variant === 'inferno' && <div className="absolute inset-0 bg-orange-500/30 blur-md rounded-full animate-pulse" />}
        {variant === 'parasite' && <div className="absolute -top-4 left-0 w-16 h-4 bg-purple-500/50 blur-sm rounded-full" />}
      </div>
    </div>
  );
};

const DragonModel = () => {
  return (
    <div className="w-full h-full flex items-center justify-center relative group-hover:scale-110 transition-transform duration-500">
      <div className="relative w-32 h-24">
        {/* Wings */}
        <div className="absolute top-0 left-0 w-12 h-16 bg-red-900 transform -rotate-12 rounded-tl-3xl opacity-80 animate-pulse" />
        <div className="absolute top-0 right-0 w-12 h-16 bg-red-900 transform rotate-12 rounded-tr-3xl opacity-80 animate-pulse" />
        
        {/* Body */}
        <div className="absolute top-8 left-8 w-16 h-12 bg-red-700 rounded-full" />
        
        {/* Neck & Head */}
        <div className="absolute top-4 left-12 w-8 h-12 bg-red-700 rounded-full transform -rotate-12" />
        <div className="absolute top-0 left-10 w-10 h-8 bg-red-600 rounded-md">
          <div className="absolute top-2 left-2 w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_5px_yellow]" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_5px_yellow]" />
          {/* Fire Breath */}
          <div className="absolute top-8 left-2 w-6 h-12 bg-gradient-to-b from-orange-500 to-transparent opacity-60 blur-sm animate-pulse" />
        </div>
        
        {/* Tail */}
        <div className="absolute top-14 left-12 w-8 h-16 bg-red-700 rounded-full transform rotate-12" />
      </div>
    </div>
  );
};

const MAX_LEVEL = 55;

const ACHIEVEMENTS: Achievement[] = [
  { id: 'town_hero', name: 'Town Hero', description: 'Reach round 20 on Town', icon: '🏆', mapId: 'town', category: 'map' },
  { id: 'town_perkaholic', name: 'Perk-a-Holic (Town)', description: 'Obtain all perks on Town', icon: '🍺', mapId: 'town', category: 'map' },
  { id: 'town_pap', name: 'Pack-a-Puncher', description: 'Pack-a-Punch a weapon on Town', icon: '🔫', mapId: 'town', category: 'map' },
  { id: 'farm_hand', name: 'Farm Hand', description: 'Reach round 20 on Farm', icon: '🚜', mapId: 'farm', category: 'map' },
  { id: 'farm_perkaholic', name: 'Perk-a-Holic (Farm)', description: 'Obtain all perks on Farm', icon: '🍺', mapId: 'farm', category: 'map' },
  { id: 'nuke_survivor', name: 'Nuclear Survivor', description: 'Reach round 25 on Nuketown', icon: '☢️', mapId: 'nuketown', category: 'map' },
  { id: 'nuke_perkaholic', name: 'Perk-a-Holic (Nuketown)', description: 'Obtain all perks on Nuketown', icon: '🍺', mapId: 'nuketown', category: 'map' },
  { id: 'headshot_machine', name: 'Headshot Machine', description: 'Get 100 headshots in a single game', icon: '🎯', category: 'combat' },
  { id: 'knife_only', name: 'Knife Only', description: 'Reach round 5 using only the knife', icon: '🔪', category: 'combat' },
  { id: 'prestige_master', name: 'Prestige Master', description: 'Reach Prestige 10', icon: '🌟', category: 'progression' },
  { id: 'star_collector', name: 'Star Collector', description: 'Obtain your first Prestige Master Star', icon: '⭐', category: 'progression' },
  { id: 'red9_blessing', name: 'Red9 Blessing', description: 'Complete the Red9 Quest', icon: '💎', category: 'easter_egg' },
  { id: 'boss_slayer', name: 'Boss Slayer', description: 'Defeat the Map Boss', icon: '👹', category: 'combat' },
  { id: 'round_50', name: 'Halfway There', description: 'Reach round 50', icon: '🔥', category: 'progression' },
  { id: 'round_100', name: 'Centurion', description: 'Reach round 100', icon: '💯', category: 'progression' },
  { id: 'millionaire', name: 'Millionaire', description: 'Earn 1,000,000 points in a single game', icon: '💰', category: 'progression' },
  { id: 'zombie_slayer', name: 'Zombie Slayer', description: 'Kill 10,000 zombies total', icon: '💀', category: 'combat' },
  { id: 'revive_master', name: 'Guardian Angel', description: 'Revive 50 players/bots total', icon: '👼', category: 'combat' },
  { id: 'headshot_king', name: 'Headshot King', description: 'Get 1,000 headshots in a single game', icon: '👑', category: 'combat' },
  { id: 'knife_master', name: 'Knife Master', description: 'Get 500 knife kills in a single game', icon: '⚔️', category: 'combat' }
];

const getLevelData = (totalXp: number) => {
  let level = 1;
  let xpForNext = 1000;
  let xpRemaining = totalXp;
  
  while (xpRemaining >= xpForNext && level < MAX_LEVEL) {
    xpRemaining -= xpForNext;
    level++;
    xpForNext = Math.floor(1000 * Math.pow(1.1, level - 1));
  }
  
  return {
    level,
    currentLevelXp: xpRemaining,
    xpForNext: level === MAX_LEVEL ? 0 : xpForNext,
    isMaxLevel: level === MAX_LEVEL
  };
};

const CamoPreloader = () => {
  const textures = [
    'https://picsum.photos/seed/diamond/256/256',
    'https://picsum.photos/seed/nebula/256/256',
    'https://picsum.photos/seed/cherry/256/256',
    'https://picsum.photos/seed/dragon/256/256',
    'https://picsum.photos/seed/lava/256/256',
    'https://picsum.photos/seed/space/256/256'
  ];
  useTexture(textures);
  return null;
};

const getWeaponLevel = (xp: number) => {
  const level = Math.floor(xp / 500) + 1;
  return Math.min(level, 30);
};

const getWeaponProgress = (xp: number) => {
  const level = getWeaponLevel(xp);
  if (level >= 30) return 100;
  const currentLevelXp = (level - 1) * 500;
  const nextLevelXp = level * 500;
  const progress = (xp - currentLevelXp) / (nextLevelXp - currentLevelXp);
  return progress * 100;
};

const isAttachmentUnlocked = (weaponLevel: number, attachment: WeaponAttachment) => {
  const unlockLevels: Record<WeaponAttachment, number> = {
    'none': 0,
    'red_dot': 5,
    'foregrip': 10,
    'extended_mag': 15,
    'acog': 20,
    'laser_sight': 25,
    'suppressor': 30
  };
  return weaponLevel >= unlockLevels[attachment];
};

const getWeaponStatsWithAttachments = (baseStats: any, attachments: WeaponAttachment[]) => {
  let stats = { ...baseStats };
  
  if (attachments.includes('extended_mag')) {
    stats.clip = Math.floor(stats.clip * 1.5);
    stats.max = Math.floor(stats.max * 1.5);
  }
  if (attachments.includes('suppressor')) {
    stats.damage = Math.floor(stats.damage * 1.1); // Buff damage slightly for gameplay feel or keep same? User asked for "new weapon details". Let's buff it.
  }
  if (attachments.includes('foregrip')) {
     // No visible stat change in current UI for recoil
  }
  
  return stats;
};

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [myRoomId] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [room, setRoom] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [leaderboardTab, setLeaderboardTab] = useState<'personal' | 'friends' | 'world'>('personal');
  const [worldLeaderboard, setWorldLeaderboard] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [syncedZombies, setSyncedZombies] = useState<any[] | null>(null);
  const [customGameConfig, setCustomGameConfig] = useState({
    mapId: 'town',
    bots: 0,
    startingWeapon: 'M1911',
    startingPoints: 500,
    startingRound: 1,
    godMode: false,
    playerName: 'Player',
    botNames: ['Bot 1', 'Bot 2', 'Bot 3', 'Bot 4'],
    gameMode: 'standard' as GameMode,
  });
  const [activeBots, setActiveBots] = useState(0);
  const [progression, setProgression] = useState<Progression>(() => {
    const saved = localStorage.getItem('ztown_progression');
    const p = saved ? JSON.parse(saved) : { xp: 0, prestige: 0, stars: 0, achievements: [], weaponAttachments: {}, totalKills: 0, totalRevives: 0 };
    return { 
      ...p, 
      stars: p.stars || 0, 
      achievements: p.achievements || [], 
      weaponAttachments: p.weaponAttachments || {},
      totalKills: p.totalKills || 0,
      totalRevives: p.totalRevives || 0
    };
  });
  const [isCustomGameSession, setIsCustomGameSession] = useState(false);

  const getXpForLevel = useCallback((targetLevel: number) => {
    let totalXp = 0;
    for (let l = 1; l < targetLevel; l++) {
      totalXp += Math.floor(1000 * Math.pow(1.1, l - 1));
    }
    return totalXp;
  }, []);

  const handleLevelUp = useCallback(() => {
    const currentData = getLevelData(progression.xp);
    if (currentData.level < MAX_LEVEL) {
      const nextLevelXp = getXpForLevel(currentData.level + 1);
      setProgression(prev => {
        const newP = { ...prev, xp: nextLevelXp };
        localStorage.setItem('ztown_progression', JSON.stringify(newP));
        return newP;
      });
    } else if (progression.prestige < 10) {
      setProgression(prev => {
        const newP = { ...prev, xp: 0, prestige: prev.prestige + 1 };
        if (newP.prestige === 10) unlockAchievement('prestige_master');
        localStorage.setItem('ztown_progression', JSON.stringify(newP));
        return newP;
      });
    } else if (progression.prestige === 10 && currentData.level === MAX_LEVEL) {
      // Prestige Master Reset
      setProgression(prev => {
        const newP = { ...prev, xp: 0, stars: (prev.stars || 0) + 1 };
        if (newP.stars === 1) unlockAchievement('star_collector');
        localStorage.setItem('ztown_progression', JSON.stringify(newP));
        return newP;
      });
    }
  }, [progression, getXpForLevel]);

  const unlockAchievement = useCallback((id: string) => {
    if (isCustomGameSession) return;
    setProgression(prev => {
      if (prev.achievements.includes(id)) return prev;
      const newP = { ...prev, achievements: [...prev.achievements, id] };
      localStorage.setItem('ztown_progression', JSON.stringify(newP));
      
      const achievement = ACHIEVEMENTS.find(a => a.id === id);
      if (achievement) {
        setAchievementNotif({ name: achievement.name, icon: achievement.icon, show: true });
        soundService.playPowerUpPickup();
        setTimeout(() => setAchievementNotif(prev => ({ ...prev, show: false })), 5000);
      }
      
      return newP;
    });
  }, [isCustomGameSession]);

  const handleLevelDown = useCallback(() => {
    const currentData = getLevelData(progression.xp);
    if (currentData.level > 1) {
      const prevLevelXp = getXpForLevel(currentData.level - 1);
      setProgression(prev => {
        const newP = { ...prev, xp: prevLevelXp };
        localStorage.setItem('ztown_progression', JSON.stringify(newP));
        return newP;
      });
    } else if (progression.prestige > 0) {
      const maxLevelXp = getXpForLevel(MAX_LEVEL);
      setProgression(prev => {
        const newP = { ...prev, xp: maxLevelXp, prestige: prev.prestige - 1 };
        localStorage.setItem('ztown_progression', JSON.stringify(newP));
        return newP;
      });
    } else if (progression.stars > 0 && currentData.level === 1) {
      // Revert star
      const maxLevelXp = getXpForLevel(MAX_LEVEL);
      setProgression(prev => {
        const newP = { ...prev, xp: maxLevelXp, stars: prev.stars - 1 };
        localStorage.setItem('ztown_progression', JSON.stringify(newP));
        return newP;
      });
    }
  }, [progression, getXpForLevel]);
  const [stats, setStats] = useState<PlayerStats>(() => {
    const saved = localStorage.getItem('ztown_progression');
    const p = saved ? JSON.parse(saved) : { xp: 0, prestige: 0, stars: 0, achievements: [] };
    const level = getLevelData(p.xp).level;
    return getInitialStats(level, p.prestige);
  });

  const handleMaxWeaponLevel = useCallback(() => {
    const weaponName = stats.weaponName;
    if (!weaponName) return;
    const baseWeapon = getBaseWeaponName(weaponName);
    
    setProgression(prev => {
      const maxXp = 20000; // Enough for level 30
      const newP = {
        ...prev,
        weaponXp: {
          ...prev.weaponXp,
          [baseWeapon]: maxXp
        }
      };
      localStorage.setItem('ztown_progression', JSON.stringify(newP));
      return newP;
    });
    soundService.playPowerUpPickup();
  }, [stats.weaponName]);

  const handleResetWeaponLevel = useCallback(() => {
    const weaponName = stats.weaponName;
    if (!weaponName) return;
    const baseWeapon = getBaseWeaponName(weaponName);

    setProgression(prev => {
      const newP = {
        ...prev,
        weaponXp: {
          ...prev.weaponXp,
          [baseWeapon]: 0
        }
      };
      localStorage.setItem('ztown_progression', JSON.stringify(newP));
      return newP;
    });
    soundService.playPowerUpPickup();
  }, [stats.weaponName]);
  const [godMode, setGodMode] = useState(false);
  const [showModMenu, setShowModMenu] = useState(false);
  const [lore, setLore] = useState("Wait for the bus...");
  const [isReloading, setIsReloading] = useState(false);
  const [bloodOverlay, setBloodOverlay] = useState(0);
  const [flashOverlay, setFlashOverlay] = useState(0);
  const [showRoundSplash, setShowRoundSplash] = useState(false);
  const [levelUpNotif, setLevelUpNotif] = useState<{level: number, show: boolean}>({level: 1, show: false});
  const [prestigeNotif, setPrestigeNotif] = useState<{prestige: number, show: boolean}>({prestige: 1, show: false});
  const [achievementNotif, setAchievementNotif] = useState<{name: string, icon: string, show: boolean}>({ name: '', icon: '', show: false });
  const prevLevelRef = useRef(getLevelData(progression.xp).level);
  const playerPosRef = useRef(new THREE.Vector3(0, 1.2, 15));

  useEffect(() => {
    const currentLevel = getLevelData(progression.xp).level;
    if (currentLevel > prevLevelRef.current) {
      setLevelUpNotif({ level: currentLevel, show: true });
      soundService.playPowerUpPickup();
      setTimeout(() => setLevelUpNotif(prev => ({ ...prev, show: false })), 4000);
      prevLevelRef.current = currentLevel;
    }
  }, [progression.xp]);
  const [lastPerkGained, setLastPerkGained] = useState<string | null>(null);
  const [interactPrompt, setInteractPrompt] = useState<{ type: string; cost: number; id: string } | null>(null);
  const [hitmarker, setHitmarker] = useState(0);
  const [isSprinting, setIsSprinting] = useState(false);
  const [gameKey, setGameKey] = useState(0); 
  const [now, setNow] = useState(Date.now());
  const [gameStartTime, setGameStartTime] = useState(Date.now());
  const [endingSequence, setEndingSequence] = useState<string[] | null>(null);
  const [isBuyableEnding, setIsBuyableEnding] = useState(false);
  const [openDoors, setOpenDoors] = useState<string[]>([]);
  const [teleportTarget, setTeleportTarget] = useState<THREE.Vector3 | null>(null);
  const [selectedWeaponInfo, setSelectedWeaponInfo] = useState<string | null>(null);

  // Red9 Easter Egg State
  const [red9CurseActive, setRed9CurseActive] = useState(false);
  const [red9BlessingClaimed, setRed9BlessingClaimed] = useState(false);
  
  // Easter Egg State
  const [easterEggTriggered, setEasterEggTriggered] = useState(false);
  const [heartPositions, setHeartPositions] = useState<THREE.Vector3[]>([]);
  const [collectedHearts, setCollectedHearts] = useState<boolean[]>([false, false, false]);
  const [dragonActive, setDragonActive] = useState(false);
  const [dragonHealth, setDragonHealth] = useState(250000); // 2500 * 100 (base zombie hp)
  const [bossDefeated, setBossDefeated] = useState(false);
  
  const [isBoxCycling, setIsBoxCycling] = useState(false);
  const [cyclingWeapon, setCyclingWeapon] = useState<string | null>(null);
  const [infoTab, setInfoTab] = useState<'guns' | 'perks' | 'bombs' | 'powerups' | 'enemies' | 'progression'>('guns');

  const [instaKillExpiry, setInstaKillExpiry] = useState(0);
  const [doublePointsExpiry, setDoublePointsExpiry] = useState(0);
  const [deathMachineExpiry, setDeathMachineExpiry] = useState(0);
  const [fireSaleExpiry, setFireSaleExpiry] = useState(0);
  const [zombieBloodExpiry, setZombieBloodExpiry] = useState(0);
  const dyingWishExpiry = useRef(0);
  const previousWeaponRef = useRef<{name: string, ammo: number, maxAmmo: number, tier: number} | null>(null);
  const [hudMode, setHudMode] = useState<'all' | 'info' | 'hidden'>('all');
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [showPauseSettings, setShowPauseSettings] = useState(false);
  const [showControlsMenu, setShowControlsMenu] = useState(false);
  const [showProgressMenu, setShowProgressMenu] = useState(false);
  const [otherPlayers, setOtherPlayers] = useState<PlayerScore[]>([]);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [loadoutCategory, setLoadoutCategory] = useState<'all' | 'pistol' | 'smg' | 'ar' | 'shotgun' | 'lmg' | 'sniper' | 'wonder' | 'melee' | 'special'>('all');

  const [teleportToPlayerId, setTeleportToPlayerId] = useState<string | null>(null);
  const [teleportPlayerToMeId, setTeleportPlayerToMeId] = useState<string | null>(null);

  useEffect(() => {
    console.log("Initializing socket connection...");
    // Use default connection which handles origin correctly
    const newSocket = io(window.location.origin, {
      path: '/socket.io',
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      withCredentials: true
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log("Socket connected:", newSocket.id);
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', (reason) => {
      console.log("Socket disconnected:", reason);
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (err: any) => {
      console.error("Socket connection error:", err.message, err.type, err.description);
      setConnectionStatus('disconnected');
    });

    newSocket.on('force_teleport', (pos) => {
      setTeleportTarget(new THREE.Vector3(pos.x, pos.y, pos.z));
    });

    newSocket.on('room_created', (r) => {
      setRoom(r);
      setStatus(GameStatus.LOBBY);
    });

    newSocket.on('room_joined', (r) => {
      setRoom(r);
      setStatus(GameStatus.LOBBY);
    });

    newSocket.on('room_updated', (r) => {
      setRoom(r);
    });

    newSocket.on('game_started', (r) => {
      setRoom(r);
      startGame(true);
    });

    newSocket.on('zombie_updated', (zombies) => {
      // This will be handled by passing it to Scene
      setSyncedZombies(zombies);
    });

    newSocket.on('game_event', (event) => {
      if (event.type === 'door_opened') {
        setOpenDoors(prev => [...prev, event.doorId]);
      } else if (event.type === 'powerup_spawned') {
        // Handle powerup spawn
      }
    });

    newSocket.on('player_updated', (playerState) => {
      setOtherPlayers(prev => {
        const existing = prev.find(p => p.id === playerState.id);
        if (existing) {
          return prev.map(p => p.id === playerState.id ? { ...p, ...playerState } : p);
        }
        return [...prev, playerState];
      });
    });

    newSocket.on('leaderboard_updated', (data) => {
      setWorldLeaderboard(data);
    });

    newSocket.on('error', (msg) => {
      alert(msg);
    });

    newSocket.emit('get_leaderboard');

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Sync local player state to server
  useEffect(() => {
    if (socket && room && status === GameStatus.PLAYING && isOnline) {
      const interval = setInterval(() => {
        socket.emit('player_update', {
          roomId: room.id,
          playerState: {
            name: customGameConfig.playerName,
            points: stats.points,
            kills: stats.kills,
            downs: stats.downs,
            revives: stats.revives,
            headshots: stats.headshots,
            knifeKills: stats.knifeKills,
            equipmentKills: stats.equipmentKills,
            hp: stats.hp,
            isDowned: stats.isDowned,
            isBot: false,
            position: { x: playerPosRef.current.x, y: playerPosRef.current.y, z: playerPosRef.current.z },
            ping: 20 // Mock ping
          }
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [socket, room, status, stats, isOnline, customGameConfig.playerName]);

  // Simulate bot activity (reduced to just ping and occasional random events that aren't combat-related)
  useEffect(() => {
    if (status !== GameStatus.PLAYING || !isCustomGameSession || otherPlayers.length === 0) return;

    const interval = setInterval(() => {
      setOtherPlayers(prev => prev.map(player => {
        if (!player.isBot) return player;
        
        // Random chance for bot to get a down or revive (still simulated for now as bots don't have full AI for this)
        const roll = Math.random();
        let newPoints = player.points;
        let newDowns = player.downs;
        let newRevives = player.revives;

        if (roll < 0.05) { // Much lower chance for non-combat events
          const actionRoll = Math.random();
          if (actionRoll < 0.4) { // Down
             newDowns++;
             newPoints = Math.max(0, newPoints - 500);
          } else if (actionRoll < 0.8) { // Revive
             newRevives++;
             newPoints += 250;
          }
        }

        // Simulate ping fluctuation
        const newPing = Math.max(0, Math.min(999, (player.ping || 20) + Math.floor(Math.random() * 10 - 5)));

        return {
          ...player,
          points: newPoints,
          downs: newDowns,
          revives: newRevives,
          ping: newPing
        };
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [status, isCustomGameSession, otherPlayers.length]);
  const [modMenuType, setModMenuType] = useState<'limited' | 'full'>('full');
  const [hudSettings, setHudSettings] = useState<HUDSettings>(() => {
    const saved = localStorage.getItem('ztown_hud_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_HUD_SETTINGS, ...parsed };
      } catch (e) {
        return INITIAL_HUD_SETTINGS;
      }
    }
    return INITIAL_HUD_SETTINGS;
  });

  const [gameSettings, setGameSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('ztown_game_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_GAME_SETTINGS, ...parsed };
      } catch (e) {
        return INITIAL_GAME_SETTINGS;
      }
    }
    return INITIAL_GAME_SETTINGS;
  });

  const [keybindSettings, setKeybindSettings] = useState<KeybindSettings>(() => {
    const saved = localStorage.getItem('ztown_keybind_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_KEYBIND_SETTINGS, ...parsed };
      } catch (e) {
        return INITIAL_KEYBIND_SETTINGS;
      }
    }
    return INITIAL_KEYBIND_SETTINGS;
  });

  const [gamepadSettings, setGamepadSettings] = useState<GamepadSettings>(() => {
    const saved = localStorage.getItem('ztown_gamepad_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_GAMEPAD_SETTINGS, ...parsed };
      } catch (e) {
        return INITIAL_GAMEPAD_SETTINGS;
      }
    }
    return INITIAL_GAMEPAD_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('ztown_game_settings', JSON.stringify(gameSettings));
    soundService.setVolume(gameSettings.sfxVolume);
    soundService.setMusicVolume(gameSettings.musicVolume);
  }, [gameSettings]);

  useEffect(() => {
    localStorage.setItem('ztown_keybind_settings', JSON.stringify(keybindSettings));
  }, [keybindSettings]);

  useEffect(() => {
    localStorage.setItem('ztown_gamepad_settings', JSON.stringify(gamepadSettings));
  }, [gamepadSettings]);

  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistUrl, setNewPlaylistUrl] = useState('');

  useEffect(() => {
    setSelectedMenuIndex(0);
  }, [status, showPauseSettings, showModMenu, showProgressMenu, showControlsMenu]);





  const [isBinding, setIsBinding] = useState<string | null>(null);
  const [isBindingGamepad, setIsBindingGamepad] = useState<string | null>(null);
  const [controllerConnected, setControllerConnected] = useState(false);
  
  const statsRef = useRef(stats);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  // Gamepad Menu Navigation
  useEffect(() => {
    if (status === GameStatus.PLAYING) return;

    let animationFrameId: number;
    let lastButtonStates: Record<number, boolean> = {};
    let lastAxisTime = 0;
    const AXIS_DELAY = 150;

    const pollMenuGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      let activeGamepad: Gamepad | null = null;
      
      for (const gp of gamepads) {
        if (gp && gp.connected) {
          activeGamepad = gp;
          break;
        }
      }

      setControllerConnected(!!activeGamepad);

      if (activeGamepad && !isBindingGamepad) {
        const now = Date.now();
        
        const triggerKey = (key: string) => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
            setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true })), 50);
        };

        const checkButton = (idx: number, key: string) => {
            const isPressed = activeGamepad!.buttons[idx]?.pressed;
            const wasPressed = lastButtonStates[idx] || false;
            if (isPressed && !wasPressed) {
                triggerKey(key);
            }
            lastButtonStates[idx] = isPressed;
        };

        // Standard mappings
        checkButton(12, 'ArrowUp');    // D-Pad Up
        checkButton(13, 'ArrowDown');  // D-Pad Down
        checkButton(14, 'ArrowLeft');  // D-Pad Left
        checkButton(15, 'ArrowRight'); // D-Pad Right
        checkButton(0, 'Enter');       // A (Select)
        checkButton(1, 'Escape');      // B (Back)

        // Stick Navigation
        const yAxis = activeGamepad.axes[1];
        const xAxis = activeGamepad.axes[0];
        
        if (Math.abs(yAxis) > 0.5) {
            if (now - lastAxisTime > AXIS_DELAY) {
                if (yAxis < -0.5) triggerKey('ArrowUp');
                if (yAxis > 0.5) triggerKey('ArrowDown');
                lastAxisTime = now;
            }
        } else if (Math.abs(xAxis) > 0.5) {
             if (now - lastAxisTime > AXIS_DELAY) {
                if (xAxis < -0.5) triggerKey('ArrowLeft');
                if (xAxis > 0.5) triggerKey('ArrowRight');
                lastAxisTime = now;
            }
        } else {
            lastAxisTime = 0;
        }
      }
      
      animationFrameId = requestAnimationFrame(pollMenuGamepad);
    };

    pollMenuGamepad();
    return () => cancelAnimationFrame(animationFrameId);
  }, [status, isBindingGamepad]);

  useEffect(() => {
    const handleKeybind = (e: KeyboardEvent) => {
      if (!isBinding) return;
      
      e.preventDefault();
      e.stopPropagation();

      let key = e.key;
      if (key === ' ') key = 'space';
      
      setKeybindSettings(prev => ({ ...prev, [isBinding]: key.toLowerCase() }));
      setIsBinding(null);
    };

    const handleMouseBind = (e: MouseEvent) => {
      if (!isBinding) return;
      e.preventDefault();
      e.stopPropagation();
      setKeybindSettings(prev => ({ ...prev, [isBinding]: `mouse${e.button}` }));
      setIsBinding(null);
    };

    if (isBinding) {
      window.addEventListener('keydown', handleKeybind);
      window.addEventListener('mousedown', handleMouseBind);
    }

    return () => {
      window.removeEventListener('keydown', handleKeybind);
      window.removeEventListener('mousedown', handleMouseBind);
    };
  }, [isBinding]);

  useEffect(() => {
    if (!isBindingGamepad) return;

    let animationFrameId: number;
    let lastButtonStates: Record<number, boolean> = {};
    let initialCheckDone = false;

    const pollGamepadForBind = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      let activeGamepad: Gamepad | null = null;
      
      for (const gp of gamepads) {
        if (gp && gp.connected) {
          activeGamepad = gp;
          break;
        }
      }

      if (activeGamepad) {
        if (!initialCheckDone) {
             for (let i = 0; i < activeGamepad.buttons.length; i++) {
                 lastButtonStates[i] = activeGamepad.buttons[i].pressed;
             }
             initialCheckDone = true;
             animationFrameId = requestAnimationFrame(pollGamepadForBind);
             return;
        }

        for (let i = 0; i < activeGamepad.buttons.length; i++) {
          const isPressed = activeGamepad.buttons[i].pressed;
          const wasPressed = lastButtonStates[i] || false;
          
          if (isPressed && !wasPressed) {
            setGamepadSettings(prev => ({ ...prev, [isBindingGamepad]: i }));
            setIsBindingGamepad(null);
            return; // Stop polling once bound
          }
          lastButtonStates[i] = isPressed;
        }
      }

      animationFrameId = requestAnimationFrame(pollGamepadForBind);
    };

    animationFrameId = requestAnimationFrame(pollGamepadForBind);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isBindingGamepad]);

  useEffect(() => {
    localStorage.setItem('ztown_hud_settings', JSON.stringify(hudSettings));
  }, [hudSettings]);

  // Leaderboard & Nickname State
  const [leaderboardMapId, setLeaderboardMapId] = useState<string>('town');
  const [nickname, setNickname] = useState(() => localStorage.getItem('ztown_nickname') || '');
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>(() => {
    const saved = localStorage.getItem('ztown_leaderboard_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const modMenuTimer = useRef<NodeJS.Timeout | null>(null);
  const modMenuTriggered = useRef(false);

  // Hold Enter for Mod Menu
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let longPressTriggered = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (status === GameStatus.PAUSED && !showModMenu && !showPauseSettings && !showProgressMenu && !showControlsMenu && selectedMenuIndex === 2) {
        if ((e.key === 'Enter' || e.key === ' ') && !timer && !e.repeat) {
           longPressTriggered = false;
           timer = setTimeout(() => {
             setModMenuType('full');
             setShowModMenu(true);
             longPressTriggered = true;
           }, 3000);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (status === GameStatus.PAUSED && !showModMenu && !showPauseSettings && !showProgressMenu && !showControlsMenu && selectedMenuIndex === 2) {
        if (e.key === 'Enter' || e.key === ' ') {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
          if (!longPressTriggered) {
             setShowPauseSettings(true);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (timer) clearTimeout(timer);
    };
  }, [status, showModMenu, showPauseSettings, showProgressMenu, showControlsMenu, selectedMenuIndex]);

  const filteredWeapons = useMemo(() => {
    return SORTED_WEAPONS.filter(([name]) => {
      if (loadoutCategory === 'all') return true;
      const upperName = name.toUpperCase();
      let category = 'ar';
      if (upperName.includes('RAY') || upperName.includes('WUNDER') || upperName.includes('THUNDER') || upperName.includes('MUSTANG')) category = 'wonder';
      else if (upperName.includes('KNIFE')) category = 'melee';
      else if (upperName.includes('DSR') || upperName.includes('SNIPER')) category = 'sniper';
      else if (upperName.includes('HAMR') || upperName.includes('RPD') || upperName.includes('BROWNING') || upperName.includes('LMG')) category = 'lmg';
      else if (upperName.includes('REMINGTON') || upperName.includes('STRIKER') || upperName.includes('OLYMPIA') || upperName.includes('SHOTGUN')) category = 'shotgun';
      else if (upperName.includes('MP5') || upperName.includes('PPSH') || upperName.includes('THOMPSON') || upperName.includes('MP40') || upperName.includes('VECTOR') || upperName.includes('TYPE 100') || upperName.includes('SMG')) category = 'smg';
      else if (upperName.includes('M1911') || upperName.includes('PYTHON') || upperName.includes('PISTOL')) category = 'pistol';
      else if (upperName.includes('DEATH')) category = 'special';
      
      return category === loadoutCategory;
    });
  }, [loadoutCategory]);

  const teleportCount = 34 + heartPositions.length;
  useEffect(() => {
    const handleMenuNav = (e: KeyboardEvent) => {
      if (selectedWeaponInfo) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
          setSelectedWeaponInfo(null);
        }
        return;
      }

      if (status !== GameStatus.START && status !== GameStatus.PAUSED && status !== GameStatus.LEADERBOARD && status !== GameStatus.SETTINGS && status !== GameStatus.INFO && status !== GameStatus.GAMEOVER && status !== GameStatus.CUSTOM_GAME && status !== GameStatus.LOADOUT) return;

      const isStart = status === GameStatus.START;
      const isPaused = status === GameStatus.PAUSED && !showPauseSettings && !showModMenu && !showProgressMenu && !showControlsMenu;
      const isLeaderboard = status === GameStatus.LEADERBOARD;
      const isSettings = status === GameStatus.SETTINGS || (status === GameStatus.PAUSED && showPauseSettings);
      const isControls = status === GameStatus.PAUSED && showControlsMenu;
      const isProgress = status === GameStatus.PAUSED && showProgressMenu;
      const isInfo = status === GameStatus.INFO;
      const isCustomGame = status === GameStatus.CUSTOM_GAME && !showModMenu;
      const isModMenu = (status === GameStatus.PAUSED || status === GameStatus.CUSTOM_GAME) && showModMenu;
      const isGameOver = status === GameStatus.GAMEOVER;
      const isLoadout = status === GameStatus.LOADOUT;

      if (e.key === 'Escape') {
        if (isSettings) status === GameStatus.PAUSED ? setShowPauseSettings(false) : setStatus(GameStatus.START);
        else if (isControls) setShowControlsMenu(false);
        else if (isProgress) setShowProgressMenu(false);
        else if (isModMenu) setShowModMenu(false);
        else if (isInfo || isCustomGame || isLoadout) setStatus(GameStatus.START);
        else if (isLeaderboard) setStatus(GameStatus.START);
        else if (isPaused) togglePause(); // Resume game
        return;
      }

      let maxIndex = 0;
      if (isStart) {
        // Maps + Nickname + 7 Buttons
        maxIndex = MAPS.length + 7;
      }
      else if (isPaused) maxIndex = isCustomGameSession ? 5 : 4;
      else if (isGameOver) maxIndex = 1;
      else if (isLeaderboard) {
        const filtered = leaderboard.filter(e => e.mapId === leaderboardMapId);
        maxIndex = 1 + MAPS.length + (filtered.length > 0 ? filtered.length : 0);
      }
      else if (isSettings) maxIndex = 43; // 0:Back, 1:HUD, 2-11:Camos, 12:BtnScale, 13:HudScale, 14-41:Pos, 42:Reset, 43:Save
      else if (isControls) {
        const gamepadKeysCount = Object.keys(gamepadSettings).filter(k => !k.startsWith('sensitivity')).length;
        const keybindKeysCount = Object.keys(keybindSettings).length;
        maxIndex = 4 + gamepadKeysCount + 1 + keybindKeysCount + 1 - 1; 
      }
      else if (isProgress) maxIndex = 1; // 0:BackTop, 1:BackBottom
      else if (isInfo) {
        let contentLen = 0;
        if (infoTab === 'guns') contentLen = SORTED_WEAPONS.length;
        else if (infoTab === 'perks') contentLen = 19;
        else if (infoTab === 'bombs') contentLen = 3;
        else if (infoTab === 'powerups') contentLen = 7;
        else if (infoTab === 'enemies') contentLen = 8;
        else if (infoTab === 'progression') contentLen = 1;
        maxIndex = 1 + 5 + contentLen; // 0:Back, 1-5:Tabs, 6..N:Items, N+1:Return
      } else if (isModMenu) {
         const teleportCount = 34 + heartPositions.length;
         const equipmentCount = 3;
         const perksCount = 22;
         const perkButtonsCount = 2;
         const weaponButtonsCount = 1;
         const weaponsCount = Object.keys(WEAPONS).length;
         const camosCount = 13;
         const powerUpsCount = 8;
         const footerCount = 1;
         
         maxIndex = 8 + 2 + 10 + 1 + teleportCount + equipmentCount + perksCount + perkButtonsCount + 1 + weaponsCount + camosCount + powerUpsCount + footerCount - 1;
      } else if (isLoadout) {
         maxIndex = 1 + 9 + filteredWeapons.length; // 0:Back, 1-9:Tabs, 10..N:Weapons
      } else if (isCustomGame) {
         maxIndex = 13; // 0:Back, 1-3:Maps, 4:Name, 5-9:Bots, 10:Round, 11:Points, 12:God, 13:Start
      }

      if (isCustomGame) {
        if (selectedMenuIndex === 10) { // Starting Round
           if (e.key === 'ArrowLeft') {
             setCustomGameConfig(prev => ({ ...prev, startingRound: Math.max(1, prev.startingRound - 1) }));
             return;
           }
           if (e.key === 'ArrowRight') {
             setCustomGameConfig(prev => ({ ...prev, startingRound: Math.min(100, prev.startingRound + 1) }));
             return;
           }
        }
        if (selectedMenuIndex === 11) { // Starting Points
           if (e.key === 'ArrowLeft') {
             setCustomGameConfig(prev => ({ ...prev, startingPoints: Math.max(0, prev.startingPoints - 500) }));
             return;
           }
           if (e.key === 'ArrowRight') {
             setCustomGameConfig(prev => ({ ...prev, startingPoints: prev.startingPoints + 500 }));
             return;
           }
        }
      }

      if (e.key === 'ArrowUp' || e.key === keybindSettings.moveForward || e.key === 'ArrowLeft') {
        e.preventDefault();
        let next = (selectedMenuIndex - 1 + maxIndex + 1) % (maxIndex + 1);
        if (isModMenu && modMenuType === 'limited') {
           if (next >= 8 && next <= 20) next = 7;
           else if (next === 6) next = 5;
           else if (next >= 1 && next <= 4) next = 0;
        }
        setSelectedMenuIndex(next);
      } else if (e.key === 'ArrowDown' || e.key === keybindSettings.moveBackward || e.key === 'ArrowRight') {
        e.preventDefault();
        let next = (selectedMenuIndex + 1) % (maxIndex + 1);
        if (isModMenu && modMenuType === 'limited') {
           if (next >= 1 && next <= 4) next = 5;
           else if (next === 6) next = 7;
           else if (next >= 8 && next <= 20) next = 21;
        }
        setSelectedMenuIndex(next);
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === keybindSettings.jump) {
        e.preventDefault();
        if (isStart) {
          document.getElementById(`menu-item-${selectedMenuIndex}`)?.click();
          if (selectedMenuIndex === MAPS.length) {
             document.getElementById(`menu-item-${selectedMenuIndex}`)?.focus();
          }
        } else if (isModMenu || isLoadout || isCustomGame) {
          document.getElementById(`menu-item-${selectedMenuIndex}`)?.click();
        } else if (isPaused) {
          if (selectedMenuIndex === 0) togglePause();
          else if (selectedMenuIndex === 1) setShowProgressMenu(true);
          else if (selectedMenuIndex === 2) { /* Handled by hold logic */ }
          else if (selectedMenuIndex === 3) {
            if (isCustomGameSession) {
              setModMenuType('limited');
              setShowModMenu(true);
            } else {
              setShowControlsMenu(true);
            }
          }
          else if (selectedMenuIndex === 4) {
            if (isCustomGameSession) setShowControlsMenu(true);
            else fullRestart();
          }
          else if (selectedMenuIndex === 5 && isCustomGameSession) fullRestart();
        } else if (isLeaderboard) {
          if (selectedMenuIndex === 0) setStatus(GameStatus.START);
          else if (selectedMenuIndex === 1) {
            if(confirm('Clear leaderboard?')) { setLeaderboard([]); localStorage.removeItem('ztown_leaderboard_v2'); }
          } else if (selectedMenuIndex >= 2 && selectedMenuIndex < 2 + MAPS.length) {
            setLeaderboardMapId(MAPS[selectedMenuIndex - 2].id);
          }
        } else if (isSettings) {
          if (selectedMenuIndex === 0) status === GameStatus.PAUSED ? setShowPauseSettings(false) : setStatus(GameStatus.START);
          else if (selectedMenuIndex === 1) setHudMode(prev => prev === 'all' ? 'info' : prev === 'info' ? 'hidden' : 'all');
          else if (selectedMenuIndex >= 2 && selectedMenuIndex <= 11) {
            const camos = ['none', 'gold', 'diamond', 'dark_matter', 'cherry_blossom', 'dragon', 'ice', 'magma', 'nebula', 'spectrum'] as const;
            setStats(prev => ({ ...prev, selectedCamo: camos[selectedMenuIndex - 2] }));
          }
          else if (selectedMenuIndex === 42) setHudSettings(INITIAL_HUD_SETTINGS);
          else if (selectedMenuIndex === 43) status === GameStatus.PAUSED ? setShowPauseSettings(false) : setStatus(GameStatus.START);
        } else if (isControls) {
          const gamepadKeys = Object.keys(gamepadSettings).filter(k => !k.startsWith('sensitivity'));
          const gamepadKeysCount = gamepadKeys.length;
          const keybindKeysCount = Object.keys(keybindSettings).length;
          
          if (selectedMenuIndex === 0) setShowControlsMenu(false);
          else if (selectedMenuIndex === 1) { /* Connect Controller logic placeholder */ }
          else if (selectedMenuIndex === 2 || selectedMenuIndex === 3) { /* Sensitivity Sliders */ }
          else if (selectedMenuIndex >= 4 && selectedMenuIndex < 4 + gamepadKeysCount) {
             const action = gamepadKeys[selectedMenuIndex - 4];
             setIsBindingGamepad(action);
          }
          else if (selectedMenuIndex === 4 + gamepadKeysCount) setGamepadSettings(INITIAL_GAMEPAD_SETTINGS);
          else if (selectedMenuIndex >= 4 + gamepadKeysCount + 1 && selectedMenuIndex < 4 + gamepadKeysCount + 1 + keybindKeysCount) {
             const keys = Object.keys(keybindSettings);
             setIsBinding(keys[selectedMenuIndex - (4 + gamepadKeysCount + 1)]);
          }
          else if (selectedMenuIndex === 4 + gamepadKeysCount + 1 + keybindKeysCount) setKeybindSettings(INITIAL_KEYBIND_SETTINGS);
        } else if (isProgress) {
          setShowProgressMenu(false);
        } else if (isGameOver) {
          if (selectedMenuIndex === 0) startGame();
          else if (selectedMenuIndex === 1) fullRestart();
        } else if (isInfo) {
          if (selectedMenuIndex === 0) setStatus(GameStatus.START);
          else if (selectedMenuIndex >= 1 && selectedMenuIndex <= 5) {
             const tabs = ['guns', 'perks', 'bombs', 'powerups', 'enemies'] as const;
             setInfoTab(tabs[selectedMenuIndex - 1]);
          } else if (selectedMenuIndex === maxIndex) {
             setStatus(GameStatus.START);
          } else {
             document.getElementById(`menu-item-${selectedMenuIndex}`)?.click();
          }
        }
      } else if (isSettings && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === keybindSettings.moveLeft || e.key === keybindSettings.moveRight)) {
        // Handle horizontal adjustments for settings
        const step = (e.key === 'ArrowRight' || e.key === keybindSettings.moveRight) ? 1 : -1;
        if (selectedMenuIndex === 12) {
          setHudSettings(prev => ({ ...prev, buttonScale: Math.max(0.5, Math.min(2, prev.buttonScale + step * 0.1)) }));
        } else if (selectedMenuIndex === 13) {
          setHudSettings(prev => ({ ...prev, hudScale: Math.max(0.5, Math.min(2, prev.hudScale + step * 0.1)) }));
        } else if (selectedMenuIndex >= 14 && selectedMenuIndex <= 41) {
          const posIndex = Math.floor((selectedMenuIndex - 14) / 2);
          const isY = (selectedMenuIndex - 14) % 2 === 1;
          const keys = ['statsPos', 'healthBarPos', 'pausePos', 'weaponPos', 'ammoPos', 'joystickPos', 'grenadePos', 'flashbangPos', 'monkeyBombPos', 'jumpPos', 'switchPos', 'knifePos', 'shootPos', 'reloadPos'];
          const key = keys[posIndex];
          setHudSettings(prev => ({ 
            ...prev, 
            [key]: { 
              ...(prev as any)[key], 
              [isY ? 'y' : 'x']: (prev as any)[key][isY ? 'y' : 'x'] + step * 5 
            } 
          }));
        }
      } else if (isControls && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === keybindSettings.moveLeft || e.key === keybindSettings.moveRight)) {
         const step = (e.key === 'ArrowRight' || e.key === keybindSettings.moveRight) ? 1 : -1;
         if (selectedMenuIndex === 2) {
            setGamepadSettings(prev => ({ ...prev, sensitivityX: Math.max(0.1, Math.min(5.0, prev.sensitivityX + step * 0.1)) }));
         } else if (selectedMenuIndex === 3) {
            setGamepadSettings(prev => ({ ...prev, sensitivityY: Math.max(0.1, Math.min(5.0, prev.sensitivityY + step * 0.1)) }));
         }
      }
    };

    window.addEventListener('keydown', handleMenuNav);
    return () => window.removeEventListener('keydown', handleMenuNav);
  }, [status, showPauseSettings, showModMenu, showProgressMenu, showControlsMenu, selectedWeaponInfo, keybindSettings, selectedMenuIndex, leaderboard, hudMode, infoTab, heartPositions, loadoutCategory, customGameConfig, filteredWeapons]);

  useEffect(() => {
    const el = document.getElementById(`menu-item-${selectedMenuIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedMenuIndex]);

  const handleSettingsPressStart = () => {
    if (modMenuTimer.current) clearTimeout(modMenuTimer.current);
    modMenuTriggered.current = false;
    modMenuTimer.current = setTimeout(() => {
      setShowModMenu(true);
      modMenuTriggered.current = true;
    }, 2250);
  };

  const handleSettingsPressEnd = () => {
    if (modMenuTimer.current) {
      clearTimeout(modMenuTimer.current);
      modMenuTimer.current = null;
    }
  };

  const moveInput = useRef({ x: 0, y: 0 });
  const lookInput = useRef({ x: 0, y: 0 });
  const keyboardLookInput = useRef({ x: 0, y: 0 });
  const joystickActive = useRef(false);
  const touchLookActive = useRef(false);
  const shootRequest = useRef(false);
  const shootLeftRequest = useRef(false);
  const phoneShootRequest = useRef(false);
  const knifeRequest = useRef(false);
  const jumpRequest = useRef(false);
  const slideRequest = useRef(false);
  const grenadeRequest = useRef(false);
  const flashbangRequest = useRef(false);
  const monkeyBombRequest = useRef(false);
  const sprintRequest = useRef(false);
  const aimRequest = useRef(false);
  const lastDamageTime = useRef(0);
  
  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number } | null>(null);

  const gameState = useMemo(() => ({
    round: stats.round,
    isReloading,
    ammo: stats.ammo,
    perks: stats.perks,
    weaponTier: stats.weaponTier,
    weaponName: stats.weaponName,
    attachments: stats.attachments,
    instaKill: instaKillExpiry > now,
    doublePoints: doublePointsExpiry > now,
    nukeTrigger: false,
    monkeyBombActive: false,
    healthRefillsBought: stats.healthRefillsBought,
    godMode,
    selectedCamo: stats.selectedCamo,
    hasBowie: stats.hasBowie,
    isDowned: stats.isDowned,
    downedTimer: stats.downedTimer,
    zombiesRemaining: stats.zombiesRemaining,
    hp: stats.hp,
    level: getLevelData(progression.xp).level,
    prestige: progression.prestige
  }), [stats, isReloading, instaKillExpiry, doublePointsExpiry, now, godMode, progression.xp, progression.prestige]);

  const [killAllZombies, setKillAllZombies] = useState(false);
  const [teleportZombiesToMe, setTeleportZombiesToMe] = useState(false);
  const [spawnZombieType, setSpawnZombieType] = useState<ZombieType | null>(null);
  const [changeAllZombiesType, setChangeAllZombiesType] = useState<ZombieType | null>(null);

  // Timer Heartbeat for UI countdowns and game timer
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      if (status === GameStatus.PLAYING) {
        setStats(prev => ({ ...prev, time: prev.time + 0.5 }));
      }
    }, 500);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== GameStatus.PLAYING) return;
    const regenInterval = setInterval(() => {
      const currentTime = Date.now();
      const regenDelay = stats.perks.includes('revive') ? 1000 : 4000;
      if (currentTime - lastDamageTime.current > regenDelay) {
        setStats(prev => {
          if (prev.hp >= prev.maxHp) return prev;
          const regenAmount = stats.perks.includes('revive') ? 5 : 1;
          return { ...prev, hp: Math.min(prev.maxHp, prev.hp + regenAmount) };
        });
      }
    }, 1000);
    return () => clearInterval(regenInterval);
  }, [status, stats.perks]);

  const saveScore = useCallback((finalStats: any) => {
    if (isCustomGameSession) return;
    const entry: ScoreEntry = {
      nickname: (nickname || 'Anonymous').trim() || 'Anonymous',
      round: finalStats.round,
      kills: finalStats.kills,
      headshots: finalStats.headshots,
      knifeKills: finalStats.knifeKills,
      equipmentKills: finalStats.equipmentKills,
      time: finalStats.time,
      date: Date.now(),
      mapId: finalStats.activeMapId || 'town',
      isBuyableEnding: finalStats.isBuyableEnding,
      bossDefeated: bossDefeated,
      red9QuestCompleted: red9BlessingClaimed,
      mainEasterEggCompleted: easterEggTriggered,
      prestigeMasterStars: progression.stars || 0,
      level: getLevelData(progression.xp).level,
      prestige: progression.prestige
    };
    const newBoard = [...leaderboard, entry]
      .sort((a, b) => b.round - a.round || b.kills - a.kills);
    
    // Keep top 10 per map
    const mapScores: Record<string, ScoreEntry[]> = {};
    newBoard.forEach(e => {
      if (!mapScores[e.mapId]) mapScores[e.mapId] = [];
      if (mapScores[e.mapId].length < 10) {
        mapScores[e.mapId].push(e);
      }
    });
    
    const finalBoard = Object.values(mapScores).flat();
    setLeaderboard(finalBoard);
    localStorage.setItem('ztown_leaderboard_v2', JSON.stringify(finalBoard));

    if (socket) {
      socket.emit('submit_score', entry);
    }
  }, [nickname, leaderboard, bossDefeated, red9BlessingClaimed, easterEggTriggered, isCustomGameSession, socket]);

  const onGameOver = useCallback(() => {
    if (status === GameStatus.PLAYING && !endingSequence) {
      setStatus(GameStatus.GAMEOVER);
      setSelectedMenuIndex(0);
      soundService.playGameOver();
      saveScore(stats);
    }
  }, [status, endingSequence, stats, saveScore]);

  useEffect(() => {
    if (status === GameStatus.PLAYING && stats.hp <= 0 && !endingSequence && !stats.isDowned) {
      onGameOver();
    }
  }, [stats.hp, stats.isDowned, status, onGameOver, endingSequence]);

  const onGameOverRef = useRef(onGameOver);
  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  // Downed Timer and Game Over Check
  useEffect(() => {
    if (status !== GameStatus.PLAYING) return;

    const timer = setInterval(() => {
      // Handle Player Downed Timer
      setStats(prev => {
        if (prev.isDowned) {
          if (prev.downedTimer <= 1) {
            // Player died
            onGameOverRef.current();
            return { ...prev, isDowned: false, downedTimer: 0, hp: 0 };
          }
          return { ...prev, downedTimer: prev.downedTimer - 1 };
        }
        return prev;
      });

      // Handle Bot Downed Timers
      if (isCustomGameSession) {
        setOtherPlayers(prev => prev.map(p => {
          if (p.isDowned) {
            if (p.downedTimer <= 1) {
              // Bot died - wait for next round
              return { ...p, downedTimer: 0, hp: 0, isDowned: false }; 
            }
            return { ...p, downedTimer: p.downedTimer - 1 };
          }
          return p;
        }));

        // Global Game Over Check: Only end if player timer hits 0 (handled in player timer block)
        // or if we want to keep a check for "everyone is dead and cannot be revived"
        // But the user specifically asked for the 10s timer to always run.
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [status, isCustomGameSession]);

  const handleStatsUpdate = useCallback((update: any, playerId?: string, weaponUsed?: string) => {
    if (playerId && playerId.startsWith('bot-')) {
      setOtherPlayers(prev => prev.map(p => {
        if (p.id === playerId) {
          const next = { ...p };
          if (update.points !== undefined) next.points += update.points;
          if (update.kills !== undefined) next.kills += update.kills;
          if (update.headshots !== undefined) next.headshots += update.headshots;
          if (update.knifeKills !== undefined) next.knifeKills += update.knifeKills || 0;
          if (update.equipmentKills !== undefined) next.equipmentKills += update.equipmentKills || 0;
          if (update.gems !== undefined) next.gems = (next.gems || 0) + update.gems;
          if (typeof update.downs === 'number') next.downs = (next.downs || 0) + update.downs;
          if (typeof update.revives === 'number') next.revives = (next.revives || 0) + update.revives;
          if (update.isDowned !== undefined) next.isDowned = update.isDowned;
          if (update.downedTimer !== undefined) next.downedTimer = update.downedTimer;
          if (update.isReviving !== undefined) next.isReviving = update.isReviving;
          if (update.hp !== undefined) next.hp = update.hp;
          return next;
        }
        return p;
      }));
      return;
    }

    // Handle Weapon XP
    if (weaponUsed && !isCustomGameSession && !(status === GameStatus.CUSTOM_GAME)) {
      const baseWeapon = getBaseWeaponName(weaponUsed);
      setProgression(prev => {
        const playerLevel = getLevelData(prev.xp).level;
        const weaponLevelReq = WEAPONS[baseWeapon]?.unlockLevel || 1;
        if (playerLevel < weaponLevelReq) return prev; // Locked, no XP

        const currentXp = prev.weaponXp?.[baseWeapon] || 0;
        const newXp = currentXp + (update.kills ? 100 : 0) + (update.headshots ? 50 : 0); // 100 XP per kill, +50 for headshot
        
        // Check for level up
        const oldLevel = getWeaponLevel(currentXp);
        const newLevel = getWeaponLevel(newXp);
        
        if (newLevel > oldLevel && newLevel % 5 === 0) {
           // Notify attachment unlock? Maybe a toast later.
           setLastPerkGained(`LEVEL ${newLevel} REACHED FOR ${baseWeapon}!`);
           setTimeout(() => setLastPerkGained(null), 3000);
           soundService.playPowerUpPickup();
        }

        const newP = {
          ...prev,
          weaponXp: {
            ...prev.weaponXp,
            [baseWeapon]: newXp
          }
        };
        localStorage.setItem('ztown_progression', JSON.stringify(newP));
        return newP;
      });
    }

    setStats(prev => {
      const next = { ...prev };
      let changed = false;

      if (update.hp !== undefined) {
        if (godMode && update.hp < 0) return prev;
        if (update.hp < 0) {
          if (Date.now() < dyingWishExpiry.current) return prev; // Invincible
          setBloodOverlay(0.6);
          soundService.playHurt();
          lastDamageTime.current = Date.now();
        }
        
        const oldHp = next.hp;
        next.hp = Math.min(next.maxHp, Math.max(0, next.hp + update.hp));
        
        // Downed Logic for Player
        if (next.hp <= 0 && !next.isDowned && oldHp > 0) {
           // Only allow downed state if there are teammates (bots) to revive
           const hasTeammates = activeBots > 0;

           if (hasTeammates) {
             // Go down and wait for revive from bots
             next.isDowned = true;
             next.downedTimer = 10; // 10 seconds to be revived
             next.hp = 0;
             next.downs = (next.downs || 0) + 1;
             soundService.playHurt();
           } else {
             // Instant death - no downed state in solo
             next.hp = 0;
             next.isDowned = false;
             next.downs = (next.downs || 0) + 1;
             soundService.playHurt();
             // The useEffect watching stats.hp will trigger onGameOver
           }
        }
        
        // Dying Wish Logic
        if (next.hp <= 0 && next.perks.includes('dying') && !next.isDowned) {
          next.hp = next.maxHp;
          next.perks = next.perks.filter(p => p !== 'dying');
          dyingWishExpiry.current = Date.now() + 10000; // 10s invincibility
          soundService.playPowerUpPickup(); // Use as a "save" sound
          setFlashOverlay(0.5); // Visual feedback
        }
        
        changed = true;
      }
      if (update.points !== undefined) {
        const prestigeMultiplier = 1 + progression.prestige * 0.05;
        const levelMultiplier = 1 + Math.floor(getLevelData(progression.xp).level / 5) * 0.01;
        const doublePointsMultiplier = Date.now() < doublePointsExpiry ? 2 : 1;
        const pts = update.points > 0 ? Math.floor(update.points * doublePointsMultiplier * prestigeMultiplier * levelMultiplier) : update.points;
        
        next.points += pts; 
        if (pts > 0) {
          next.totalPoints += pts;
          if (!isCustomGameSession) {
            setProgression(p => {
              // Reduce XP gain to 10% of points to make leveling harder
              const xpGain = Math.ceil(pts * 0.1);
              const newP = { ...p, xp: p.xp + xpGain };
              localStorage.setItem('ztown_progression', JSON.stringify(newP));
              return newP;
            });
          }
        }
        changed = true;
      }
      if (update.gems !== undefined) {
        next.gems = (next.gems || 0) + update.gems;
        changed = true;
      }
      if (update.kills !== undefined) {
        next.kills += update.kills;
        if (update.kills > 0 && !isCustomGameSession && status !== GameStatus.CUSTOM_GAME) {
          setProgression(p => {
            const newP = { ...p, totalKills: (p.totalKills || 0) + update.kills };
            localStorage.setItem('ztown_progression', JSON.stringify(newP));
            return newP;
          });
        }
        changed = true;
      }
      if (update.revives !== undefined) {
        next.revives = (next.revives || 0) + update.revives;
        if (update.revives > 0 && !isCustomGameSession && status !== GameStatus.CUSTOM_GAME) {
          setProgression(p => {
            const newP = { ...p, totalRevives: (p.totalRevives || 0) + update.revives };
            localStorage.setItem('ztown_progression', JSON.stringify(newP));
            return newP;
          });
        }
        changed = true;
      }
      if (update.headshots !== undefined) {
        next.headshots += update.headshots;
        if (next.headshots >= 100) unlockAchievement('headshot_machine');
        changed = true;
      }
      if (update.knifeKills !== undefined) {
        next.knifeKills += update.knifeKills;
        changed = true;
      }
      if (update.equipmentKills !== undefined) {
        next.equipmentKills += update.equipmentKills;
        changed = true;
      }
      if (update.zombiesRemaining !== undefined) {
        next.zombiesRemaining = update.zombiesRemaining;
        changed = true;
      }
      if (update.ammo !== undefined) {
        next.ammo = update.ammo;
        changed = true;
      }
      if (update.grenades !== undefined) {
        next.grenades = update.grenades;
        changed = true;
      }
      if (update.flashbangs !== undefined) {
        next.flashbangs = update.flashbangs;
        changed = true;
      }
      if (update.monkeyBombs !== undefined) {
        next.monkeyBombs = update.monkeyBombs;
        changed = true;
      }
      if (update.monkeyBombActive !== undefined) {
        gameState.monkeyBombActive = update.monkeyBombActive;
      }
      if (update.round !== undefined) {
        if (update.round > next.round) {
          setShowRoundSplash(true);
          soundService.playRoundStart();
          setTimeout(() => setShowRoundSplash(false), 3000);
          next.grenades = Math.min(4, next.grenades + 2);
          next.flashbangs = Math.min(2, next.flashbangs + 1);
          
          // Revive player if downed at round end
          if (next.isDowned) {
            next.isDowned = false;
            next.downedTimer = 0;
            next.hp = next.maxHp;
          }

          // Respawn/Revive bots
          if (isCustomGameSession) {
            setOtherPlayers(prev => prev.map(p => ({
              ...p,
              isDowned: false,
              downedTimer: 0,
              hp: 150
            })));
          }

          if (next.round >= 5 && next.kills === next.knifeKills) {
            unlockAchievement('knife_only');
          }

          if (red9CurseActive) {
            next.points = Math.max(0, next.points - 420);
            setLore("Red9's curse drains you...");
          }
        }
        next.round = update.round;
        // Respawn bots on new round
        if (isCustomGameSession) {
          setOtherPlayers(prev => prev.map(p => ({ ...p, hp: 150, isDowned: false, downedTimer: 0 })));
        }
        changed = true;
      }
      if (update.hit) {
        setHitmarker(1);
      }
      if (update.flashPlayer) {
        setFlashOverlay(1.0);
      }
      if (update.addPerk !== undefined) {
        if (!next.perks.includes(update.addPerk)) {
          next.perks = [...next.perks, update.addPerk];
          if (update.addPerk === 'jugg') {
            next.maxHp = 250;
            next.hp = 250;
          }
          changed = true;
        }
      }
      if (update.addAllPerks) {
        const allPerks = ['jugg', 'speed', 'stamin', 'double', 'mule', 'phd', 'deadshot', 'electric', 'revive', 'vulture', 'widow', 'slider', 'winter', 'dying', 'razor', 'timeslip', 'bandolier', 'tortoise', 'blaze', 'stronghold', 'blood', 'elemental'];
        next.perks = [...new Set([...next.perks, ...allPerks])];
        next.maxHp = 350; // Jugg + Tortoise
        next.hp = 350;
        changed = true;
      }

      if (update.selectedCamo !== undefined) {
        next.selectedCamo = update.selectedCamo;
        changed = true;
      }
      if (update.isDowned !== undefined) {
        next.isDowned = update.isDowned;
        changed = true;
      }
      if (update.downedTimer !== undefined) {
        next.downedTimer = update.downedTimer;
        changed = true;
      }
      if (update.isReviving !== undefined) {
        next.isReviving = update.isReviving;
        changed = true;
      }
      if (typeof update.downs === 'number') {
        next.downs = (next.downs || 0) + update.downs;
        changed = true;
      }
      if (typeof update.revives === 'number') {
        next.revives = (next.revives || 0) + update.revives;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [doublePointsExpiry, godMode, red9CurseActive, progression.prestige, isCustomGameSession, activeBots]);

  const handlePowerUp = useCallback((type: PowerUpType) => {
    soundService.playPowerUpPickup();
    const currentTime = Date.now();
    const duration = stats.perks.includes('timeslip') ? 45000 : 30000;

    switch(type) {
      case 'MAX_AMMO':
        setStats(prev => {
          const next = { 
            ...prev, 
            ammo: WEAPONS[prev.weaponName].clip, 
            maxAmmo: prev.perks.includes('bandolier') ? Math.floor(WEAPONS[prev.weaponName].max * 1.5) : WEAPONS[prev.weaponName].max,
            grenades: 4, 
            flashbangs: 2,
            monkeyBombs: Math.max(prev.monkeyBombs, 3)
          };
          if (prev.secondaryWeaponName) {
            next.secondaryAmmo = WEAPONS[prev.secondaryWeaponName].clip;
            next.secondaryMaxAmmo = prev.perks.includes('bandolier') ? Math.floor(WEAPONS[prev.secondaryWeaponName].max * 1.5) : WEAPONS[prev.secondaryWeaponName].max;
          }
          if (prev.tertiaryWeaponName) {
            next.tertiaryAmmo = WEAPONS[prev.tertiaryWeaponName].clip;
            next.tertiaryMaxAmmo = prev.perks.includes('bandolier') ? Math.floor(WEAPONS[prev.tertiaryWeaponName].max * 1.5) : WEAPONS[prev.tertiaryWeaponName].max;
          }
          return next;
        });
        break;
      case 'INSTA_KILL':
        setInstaKillExpiry(currentTime + duration);
        break;
      case 'DOUBLE_POINTS':
        setDoublePointsExpiry(currentTime + duration);
        break;
      case 'NUKE':
        gameState.nukeTrigger = true;
        handleStatsUpdate({ points: 400 });
        break;
      case 'DEATH_MACHINE':
        setDeathMachineExpiry(currentTime + duration);
        setStats(prev => {
          if (prev.weaponName !== 'DEATH_MACHINE') {
            previousWeaponRef.current = {
              name: prev.weaponName,
              ammo: prev.ammo,
              maxAmmo: prev.maxAmmo,
              tier: prev.weaponTier
            };
          }
          return {
            ...prev,
            weaponName: 'DEATH_MACHINE',
            ammo: 999,
            maxAmmo: 999,
            weaponTier: 3 // High tier for effects
          };
        });
        break;
      case 'FIRE_SALE':
        setFireSaleExpiry(currentTime + duration);
        break;
      case 'ZOMBIE_BLOOD':
        setZombieBloodExpiry(currentTime + duration);
        break;
      case 'GEM':
        handleStatsUpdate({ points: 500, gems: 1 });
        break;
      case 'GRENADE':
        setStats(prev => ({ ...prev, grenades: Math.min(4, prev.grenades + 1) }));
        break;
      case 'FLASHBANG':
        setStats(prev => ({ ...prev, flashbangs: Math.min(2, prev.flashbangs + 1) }));
        break;
      case 'MONKEY_BOMB':
        setStats(prev => ({ ...prev, monkeyBombs: Math.min(3, prev.monkeyBombs + 1) }));
        break;
      case 'SKIP_ROUND':
        setStats(prev => ({ ...prev, zombiesRemaining: 0 }));
        break;
    }
  }, [gameState, handleStatsUpdate, stats.perks]);

  useEffect(() => {
    if (deathMachineExpiry > 0) {
      const timeRemaining = deathMachineExpiry - Date.now();
      const expire = () => {
        setDeathMachineExpiry(0);
        setStats(prev => {
          if (previousWeaponRef.current) {
            const restored = {
              ...prev,
              weaponName: previousWeaponRef.current.name,
              ammo: previousWeaponRef.current.ammo,
              maxAmmo: previousWeaponRef.current.maxAmmo,
              weaponTier: previousWeaponRef.current.tier
            };
            previousWeaponRef.current = null;
            return restored;
          }
          return prev;
        });
      };

      if (timeRemaining <= 0) {
        expire();
      } else {
        const timer = setTimeout(expire, timeRemaining);
        return () => clearTimeout(timer);
      }
    }
  }, [deathMachineExpiry]);

  useEffect(() => {
    if (hitmarker > 0) {
      const timer = setTimeout(() => setHitmarker(0), 150);
      return () => clearInterval(timer);
    }
  }, [hitmarker]);

  useEffect(() => {
    if (isCustomGameSession || status === GameStatus.CUSTOM_GAME) return;

    if (stats.round >= 50) unlockAchievement('round_50');
    if (stats.round >= 100) unlockAchievement('round_100');
    if (stats.totalPoints >= 1000000) unlockAchievement('millionaire');
    if (stats.headshots >= 1000) unlockAchievement('headshot_king');
    if (stats.knifeKills >= 500) unlockAchievement('knife_master');
    if (progression.totalKills >= 10000) unlockAchievement('zombie_slayer');
    if (progression.totalRevives >= 50) unlockAchievement('revive_master');
  }, [stats.round, stats.totalPoints, stats.headshots, stats.knifeKills, progression.totalKills, progression.totalRevives, isCustomGameSession, status, unlockAchievement]);

  const handleInteract = () => {
    if (!interactPrompt || isBoxCycling) return;
    if (interactPrompt.id === 'healthRefill' && stats.healthRefillsBought >= 3) return;
    if (stats.points < interactPrompt.cost) return;

    if (interactPrompt.id.startsWith('revive_')) {
      const botId = interactPrompt.id.replace('revive_', '');
      handleStatsUpdate({ isDowned: false, hp: 150 }, botId);
      handleStatsUpdate({ revives: 1 }); // Player gets credit
    } else if (interactPrompt.id === 'box') {
      setIsBoxCycling(true);
      setStats(prev => ({ ...prev, points: prev.points - interactPrompt.cost }));
      const weaponKeys = Object.keys(WEAPONS).filter(k => !Object.values(PAP_MAPPING).includes(k));
      const boxItems = [...weaponKeys, 'MONKEY BOMBS'];
      const cycleInterval = setInterval(() => {
        setCyclingWeapon(boxItems[Math.floor(Math.random() * boxItems.length)]);
        soundService.playBoxTick();
      }, 100);
      setTimeout(() => {
        clearInterval(cycleInterval);
        const rand = Math.random();
        let finalWeapon = 'MP5';
        if (rand < 0.05) {
          finalWeapon = 'RAY GUN';
        } else if (rand < 0.15) {
          finalWeapon = 'MONKEY BOMBS';
        } else {
          const normalWeapons = weaponKeys.filter(w => w !== 'RAY GUN' && w !== 'M1911');
          finalWeapon = normalWeapons[Math.floor(Math.random() * normalWeapons.length)];
        }
        
        if (finalWeapon === 'MONKEY BOMBS') {
           setStats(prev => ({ ...prev, monkeyBombs: Math.max(prev.monkeyBombs, 3) }));
           setLastPerkGained("MONKEY BOMBS ACQUIRED!");
           setTimeout(() => setLastPerkGained(null), 3000);
        } else {
          setStats(prev => {
            if (prev.secondaryWeaponName === null && prev.weaponName !== finalWeapon) {
              return {
                ...prev,
                secondaryWeaponName: finalWeapon,
                secondaryAmmo: WEAPONS[finalWeapon].clip,
                secondaryMaxAmmo: WEAPONS[finalWeapon].max,
                secondaryWeaponTier: 1,
                secondaryAttachments: getActiveAttachments(finalWeapon, getLevelData(progression.xp).level, progression.weaponAttachments || {})
              };
            } else if (prev.perks.includes('mule') && prev.tertiaryWeaponName === null && prev.weaponName !== finalWeapon && prev.secondaryWeaponName !== finalWeapon) {
              return {
                ...prev,
                tertiaryWeaponName: finalWeapon,
                tertiaryAmmo: WEAPONS[finalWeapon].clip,
                tertiaryMaxAmmo: WEAPONS[finalWeapon].max,
                tertiaryWeaponTier: 1,
                tertiaryAttachments: getActiveAttachments(finalWeapon, getLevelData(progression.xp).level, progression.weaponAttachments || {})
              };
            } else {
              return {
                ...prev,
                weaponName: finalWeapon,
                ammo: WEAPONS[finalWeapon].clip,
                maxAmmo: WEAPONS[finalWeapon].max,
                weaponTier: 1,
                attachments: getActiveAttachments(finalWeapon, getLevelData(progression.xp).level, progression.weaponAttachments || {})
              };
            }
          });
        }
        setIsBoxCycling(false);
        setCyclingWeapon(null);
        soundService.playPerk();
      }, 3000);
    } else if (interactPrompt.id === 'pap') {
      const papName = PAP_MAPPING[stats.weaponName];
      if (!papName) return; 
      
      soundService.playPerk();
      unlockAchievement('town_pap');
      setStats(prev => ({
        ...prev,
        points: prev.points - interactPrompt.cost,
        weaponName: papName,
        ammo: WEAPONS[papName].clip,
        maxAmmo: WEAPONS[papName].max,
        weaponTier: 2
      }));
      setLastPerkGained("WEAPON PACKED!");
      setTimeout(() => setLastPerkGained(null), 3000);
    } else if (interactPrompt.id === 'buyableEnding') {
      soundService.playPerk();
      setStats(prev => ({ ...prev, points: prev.points - 50000 }));
      setEndingSequence([
        "MUKKA BOY THAT THE END OF THE ROAD",
        "we miss you loads RED9",
        "only god can judge me"
      ]);
    } else if (interactPrompt.id === 'healthRefill') {
      soundService.playPerk();
      setStats(prev => ({
        ...prev,
        points: prev.points - interactPrompt.cost,
        hp: prev.maxHp,
        healthRefillsBought: prev.healthRefillsBought + 1
      }));
      setLastPerkGained("Health Refilled");
      setTimeout(() => setLastPerkGained(null), 3000);
    } else if (interactPrompt.type.startsWith('WALLBUY:')) {
      const weaponName = interactPrompt.type.replace('WALLBUY: ', '');
      
      if (weaponName === 'Bowie Knife') {
        if (stats.hasBowie || stats.points < interactPrompt.cost) return;
        soundService.playPerk();
        setStats(prev => ({ ...prev, points: prev.points - interactPrompt.cost, hasBowie: true }));
        setLastPerkGained("BOWIE KNIFE PURCHASED");
        setTimeout(() => setLastPerkGained(null), 3000);
        return;
      }

      const weaponStats = WEAPONS[weaponName];
      
      if (!weaponStats) return;

      // Check if player already has the weapon (or its PAP version)
      const hasWeapon = stats.weaponName === weaponName || stats.secondaryWeaponName === weaponName || stats.tertiaryWeaponName === weaponName;
      const papName = PAP_MAPPING[weaponName];
      const hasPapWeapon = papName && (stats.weaponName === papName || stats.secondaryWeaponName === papName || stats.tertiaryWeaponName === papName);

      if (hasWeapon || hasPapWeapon) {
        // Buy Ammo
        const isPrimary = stats.weaponName === weaponName || (papName && stats.weaponName === papName);
        const isSecondary = stats.secondaryWeaponName === weaponName || (papName && stats.secondaryWeaponName === papName);
        const currentAmmo = isPrimary ? stats.ammo : (isSecondary ? stats.secondaryAmmo : stats.tertiaryAmmo);
        const currentMax = isPrimary ? stats.maxAmmo : (isSecondary ? stats.secondaryMaxAmmo : stats.tertiaryMaxAmmo);
        let possibleMax = (papName && (stats.weaponName === papName || stats.secondaryWeaponName === papName || stats.tertiaryWeaponName === papName)) ? WEAPONS[papName].max : weaponStats.max;
        if (stats.perks.includes('bandolier')) possibleMax = Math.floor(possibleMax * 1.5);
        
        if (currentMax >= possibleMax) return; // Already full reserve

        soundService.playPerk(); // Cha-ching sound
        setStats(prev => {
           const ammoCost = (papName && (prev.weaponName === papName || prev.secondaryWeaponName === papName || prev.tertiaryWeaponName === papName)) ? 4500 : Math.floor(interactPrompt.cost / 2);
           if (prev.points < ammoCost) return prev;

           const next = { ...prev, points: prev.points - ammoCost };
           
           if (isPrimary) {
             next.maxAmmo = possibleMax;
           } else if (isSecondary) {
             next.secondaryMaxAmmo = possibleMax;
           } else {
             next.tertiaryMaxAmmo = possibleMax;
           }
           return next;
        });
        setLastPerkGained("AMMO PURCHASED");
        setTimeout(() => setLastPerkGained(null), 3000);
      } else {
        // Buy Weapon
        if (stats.points < interactPrompt.cost) return;

        soundService.playPerk();
        setStats(prev => {
          const next = { ...prev, points: prev.points - interactPrompt.cost };
          
          if (prev.secondaryWeaponName === null) {
             // We have only 1 weapon. Add as secondary and switch to it.
             next.secondaryWeaponName = prev.weaponName;
             next.secondaryAmmo = prev.ammo;
             next.secondaryMaxAmmo = prev.maxAmmo;
             next.secondaryWeaponTier = prev.weaponTier;
             next.secondaryAttachments = prev.attachments;
             
             next.weaponName = weaponName;
             next.ammo = weaponStats.clip;
             next.maxAmmo = prev.perks.includes('bandolier') ? Math.floor(weaponStats.max * 1.5) : weaponStats.max;
             next.weaponTier = 1;
             next.attachments = getActiveAttachments(weaponName, getLevelData(progression.xp).level, progression.weaponAttachments || {});
             next.activeSlot = 1;
          } else if (prev.perks.includes('mule') && prev.tertiaryWeaponName === null) {
             // We have 2 weapons and Mule Kick. Add as tertiary and switch to it.
             next.tertiaryWeaponName = prev.secondaryWeaponName;
             next.tertiaryAmmo = prev.secondaryAmmo;
             next.tertiaryMaxAmmo = prev.secondaryMaxAmmo;
             next.tertiaryWeaponTier = prev.secondaryWeaponTier;
             next.tertiaryAttachments = prev.secondaryAttachments;

             next.secondaryWeaponName = prev.weaponName;
             next.secondaryAmmo = prev.ammo;
             next.secondaryMaxAmmo = prev.maxAmmo;
             next.secondaryWeaponTier = prev.weaponTier;
             next.secondaryAttachments = prev.attachments;
             
             next.weaponName = weaponName;
             next.ammo = weaponStats.clip;
             next.maxAmmo = prev.perks.includes('bandolier') ? Math.floor(weaponStats.max * 1.5) : weaponStats.max;
             next.weaponTier = 1;
             next.attachments = getActiveAttachments(weaponName, getLevelData(progression.xp).level, progression.weaponAttachments || {});
             next.activeSlot = 2;
          } else {
             // We have full slots. Replace current.
             next.weaponName = weaponName;
             next.ammo = weaponStats.clip;
             next.maxAmmo = prev.perks.includes('bandolier') ? Math.floor(weaponStats.max * 1.5) : weaponStats.max;
             next.weaponTier = 1;
             next.attachments = getActiveAttachments(weaponName, getLevelData(progression.xp).level, progression.weaponAttachments || {});
          }
          return next;
        });
        setLastPerkGained(`${weaponName} PURCHASED`);
        setTimeout(() => setLastPerkGained(null), 3000);
      }
    } else if (interactPrompt.id.startsWith('heart_')) {
      const index = parseInt(interactPrompt.id.split('_')[1]);
      soundService.playPerk();
      const newCollected = [...collectedHearts];
      newCollected[index] = true;
      setCollectedHearts(newCollected);
      setLastPerkGained(`Dragon Heart ${index + 1}/3 Found`);
      setTimeout(() => setLastPerkGained(null), 3000);
    } else if (interactPrompt.id === 'summon_dragon') {
      soundService.playPerk();
      setDragonActive(true);
      setLastPerkGained("DRAGON SUMMONED!");
      setTimeout(() => setLastPerkGained(null), 3000);
    } else if (interactPrompt.id.endsWith('_door')) {
      if (openDoors.includes(interactPrompt.id)) return;
      soundService.playPerk(); // Reuse perk sound for now
      setStats(prev => ({ ...prev, points: prev.points - interactPrompt.cost }));
      setOpenDoors(prev => [...prev, interactPrompt.id]);
      setLastPerkGained("DOOR OPENED");
      setTimeout(() => setLastPerkGained(null), 3000);
      
      if (isOnline && socket && room) {
        socket.emit('game_event', {
          roomId: room.id,
          type: 'door_opened',
          doorId: interactPrompt.id
        });
      }
    } else {
      setStats(prev => {
        if (prev.perks.includes(interactPrompt.id)) return prev;
        soundService.playPerk();
        const next = { ...prev, points: prev.points - interactPrompt.cost };
        next.perks = [...prev.perks, interactPrompt.id];
        if (interactPrompt.id === 'jugg') {
          next.maxHp = next.perks.includes('tortoise') ? 350 : 250;
          next.hp = next.maxHp; 
        }
        if (interactPrompt.id === 'tortoise') {
          next.maxHp += 100;
          next.hp = next.maxHp;
        }
        if (interactPrompt.id === 'bandolier') {
          next.maxAmmo = Math.floor(next.maxAmmo * 1.5);
          next.secondaryMaxAmmo = Math.floor(next.secondaryMaxAmmo * 1.5);
          next.tertiaryMaxAmmo = Math.floor(next.tertiaryMaxAmmo * 1.5);
        }
        setLastPerkGained(interactPrompt.type);
        setTimeout(() => setLastPerkGained(null), 3000);
        return next;
      });
    }
  };


  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      getRoundLore(stats.round).then(setLore);
    }
  }, [status, stats.round]);

  useEffect(() => {
    if (endingSequence) {
      const timer = setTimeout(() => {
        setStatus(GameStatus.GAMEOVER);
        setSelectedMenuIndex(0);
        saveScore({ ...statsRef.current, isBuyableEnding: true });
        setEndingSequence(null);
      }, 10000); // Show for 10 seconds total
      return () => clearTimeout(timer);
    }
  }, [endingSequence]);

  useEffect(() => {
    if (bloodOverlay > 0) {
      const timer = setInterval(() => setBloodOverlay(prev => Math.max(0, prev - 0.04)), 50);
      return () => clearInterval(timer);
    }
  }, [bloodOverlay]);

  useEffect(() => {
    if (flashOverlay > 0) {
      const timer = setInterval(() => setFlashOverlay(prev => Math.max(0, prev - 0.01)), 20);
      return () => clearInterval(timer);
    }
  }, [flashOverlay]);

  useEffect(() => {
    if (status === GameStatus.LEADERBOARD) {
      const el = document.getElementById(`menu-item-${selectedMenuIndex}`);
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedMenuIndex, status]);

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 16);
    setNickname(val);
    localStorage.setItem('ztown_nickname', val);
  };

  const handleReload = () => {
    const weapon = WEAPONS[stats.weaponName];
    const baseClip = weapon.clip;
    const clipSize = stats.attachments.includes('extended_mag') ? Math.ceil(baseClip * 1.5) : baseClip;
    
    if (isReloading || stats.ammo === clipSize || status === GameStatus.PAUSED) return;
    setIsReloading(true);
    soundService.playReload();
    const reloadSpeed = stats.perks.includes('speed') ? 600 : 1200;
    setTimeout(() => {
      setStats(s => ({ ...s, ammo: clipSize }));
      setIsReloading(false);
    }, reloadSpeed);
  };

  const switchWeapon = () => {
    if (isReloading || !stats.secondaryWeaponName || status !== GameStatus.PLAYING) return;
    soundService.playReload(); 
    setStats(prev => {
      const hasTertiary = prev.perks.includes('mule') && prev.tertiaryWeaponName !== null;
      
      if (hasTertiary) {
        const newActiveSlot = ((prev.activeSlot + 1) % 3) as 0 | 1 | 2;
        return {
          ...prev,
          activeSlot: newActiveSlot,
          weaponName: prev.secondaryWeaponName!,
          secondaryWeaponName: prev.tertiaryWeaponName!,
          tertiaryWeaponName: prev.weaponName,
          ammo: prev.secondaryAmmo,
          maxAmmo: prev.secondaryMaxAmmo,
          secondaryAmmo: prev.tertiaryAmmo,
          secondaryMaxAmmo: prev.tertiaryMaxAmmo,
          tertiaryAmmo: prev.ammo,
          tertiaryMaxAmmo: prev.maxAmmo,
          weaponTier: prev.secondaryWeaponTier,
          secondaryWeaponTier: prev.tertiaryWeaponTier,
          tertiaryWeaponTier: prev.weaponTier,
          attachments: prev.secondaryAttachments,
          secondaryAttachments: prev.tertiaryAttachments,
          tertiaryAttachments: prev.attachments,
        };
      } else {
        const newActiveSlot = prev.activeSlot === 0 ? 1 : 0;
        return {
          ...prev,
          activeSlot: newActiveSlot,
          weaponName: prev.secondaryWeaponName!,
          secondaryWeaponName: prev.weaponName,
          ammo: prev.secondaryAmmo,
          maxAmmo: prev.secondaryMaxAmmo,
          secondaryAmmo: prev.ammo,
          secondaryMaxAmmo: prev.maxAmmo,
          weaponTier: prev.secondaryWeaponTier,
          secondaryWeaponTier: prev.weaponTier,
          attachments: prev.secondaryAttachments,
          secondaryAttachments: prev.attachments,
        };
      }
    });
  };

  const handleJumpOrSlide = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;
    if (sprintRequest.current) {
      slideRequest.current = true;
      setTimeout(() => slideRequest.current = false, 100);
    } else {
      jumpRequest.current = true;
      setTimeout(() => jumpRequest.current = false, 100);
    }
  }, [status]);

  const throwGrenade = (e?: React.TouchEvent | React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (stats.grenades > 0 && status === GameStatus.PLAYING) {
      grenadeRequest.current = true;
      setStats(prev => ({ ...prev, grenades: prev.grenades - 1 }));
      setTimeout(() => grenadeRequest.current = false, 100);
    }
  };

  const throwFlashbang = (e?: React.TouchEvent | React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (stats.flashbangs > 0 && status === GameStatus.PLAYING) {
      flashbangRequest.current = true;
      setStats(prev => ({ ...prev, flashbangs: prev.flashbangs - 1 }));
      setTimeout(() => flashbangRequest.current = false, 100);
    }
  };

  const throwMonkeyBomb = (e?: React.TouchEvent | React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (stats.monkeyBombs > 0 && status === GameStatus.PLAYING) {
      monkeyBombRequest.current = true;
      setStats(prev => ({ ...prev, monkeyBombs: prev.monkeyBombs - 1 }));
      setTimeout(() => monkeyBombRequest.current = false, 100);
    }
  };

  const callbacksRef = useRef({
    handleReload,
    switchWeapon,
    handleInteract,
    handleJumpOrSlide,
    throwGrenade,
    throwFlashbang,
    throwMonkeyBomb
  });

  useEffect(() => {
    callbacksRef.current = {
      handleReload,
      switchWeapon,
      handleInteract,
      handleJumpOrSlide,
      throwGrenade,
      throwFlashbang,
      throwMonkeyBomb
    };
  });

  const keysRef = useRef({ w: false, a: false, s: false, d: false, up: false, down: false, left: false, right: false });

  // PC Controls
  useEffect(() => {
    if (status !== GameStatus.PLAYING) return;

    const keys = keysRef.current;

    const updateMoveInput = () => {
      let x = 0, y = 0;
      if (keys.d) x += 1;
      if (keys.a) x -= 1;
      if (keys.w) y += 1;
      if (keys.s) y -= 1;
      
      const len = Math.sqrt(x * x + y * y);
      if (len > 0) {
        moveInput.current = { x: x / len, y: y / len };
      } else {
        // Only reset moveInput if we are actually using keyboard controls
        // If the user is on mobile, keys will be all false, but we shouldn't overwrite the joystick
        // Wait, if keys are all false, we only reset if we were previously moving with keyboard
        // To be safe, we only set moveInput from keyboard if a key is pressed.
        // If no keys are pressed, we don't force it to 0,0 unless we just released a key.
      }
    };

    const updateLookInput = () => {
      let x = 0, y = 0;
      if (keys.right) x += 1;
      if (keys.left) x -= 1;
      if (keys.down) y += 1;
      if (keys.up) y -= 1;
      
      const len = Math.sqrt(x * x + y * y);
      if (len > 0) {
        keyboardLookInput.current = { x: x / len, y: y / len };
      } else {
        keyboardLookInput.current = { x: 0, y: 0 };
      }
    };

    let keyboardMoving = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isBinding || e.repeat || (e.target as HTMLElement).tagName === 'INPUT') return;
      const key = e.key.toLowerCase();
      
      if (key === 'tab') {
        e.preventDefault();
        setShowScoreboard(true);
      }

      if (key === keybindSettings.moveForward) keys.w = true;
      else if (key === keybindSettings.moveLeft) keys.a = true;
      else if (key === keybindSettings.moveBackward) keys.s = true;
      else if (key === keybindSettings.moveRight) keys.d = true;
      else if (key === keybindSettings.lookUp) keys.up = true;
      else if (key === keybindSettings.lookDown) keys.down = true;
      else if (key === keybindSettings.lookLeft) keys.left = true;
      else if (key === keybindSettings.lookRight) keys.right = true;
      else if (key === keybindSettings.jump) callbacksRef.current.handleJumpOrSlide();
      else if (key === keybindSettings.sprint) { sprintRequest.current = true; setIsSprinting(true); }
      else if (key === keybindSettings.reload) callbacksRef.current.handleReload();
      else if (key === keybindSettings.switchWeapon) callbacksRef.current.switchWeapon();
      else if (key === keybindSettings.interact) callbacksRef.current.handleInteract();
      else if (key === keybindSettings.grenade) callbacksRef.current.throwGrenade(e as any);
      else if (key === keybindSettings.knife) knifeRequest.current = true;
      else if (key === keybindSettings.shoot) shootRequest.current = true;
      else if (key === keybindSettings.aim) {
        if (stats.weaponName === 'MUSTANG & SALLY') {
          shootLeftRequest.current = true;
        } else {
          aimRequest.current = true;
        }
      }
      else if (key === keybindSettings.pause) togglePause();
      
      if (keys.w || keys.a || keys.s || keys.d) {
        keyboardMoving = true;
        let x = 0, y = 0;
        if (keys.d) x += 1;
        if (keys.a) x -= 1;
        if (keys.w) y += 1;
        if (keys.s) y -= 1;
        const len = Math.sqrt(x * x + y * y);
        moveInput.current = { x: x / len, y: y / len };
      }
      
      if (keys.up || keys.down || keys.left || keys.right) {
        updateLookInput();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || isBinding) return;
      const key = e.key.toLowerCase();
      
      if (key === 'tab') {
        setShowScoreboard(false);
      }

      if (key === keybindSettings.moveForward) keys.w = false;
      else if (key === keybindSettings.moveLeft) keys.a = false;
      else if (key === keybindSettings.moveBackward) keys.s = false;
      else if (key === keybindSettings.moveRight) keys.d = false;
      else if (key === keybindSettings.lookUp) keys.up = false;
      else if (key === keybindSettings.lookDown) keys.down = false;
      else if (key === keybindSettings.lookLeft) keys.left = false;
      else if (key === keybindSettings.lookRight) keys.right = false;
      else if (key === keybindSettings.sprint) { sprintRequest.current = false; setIsSprinting(false); }
      else if (key === keybindSettings.knife) knifeRequest.current = false;
      else if (key === keybindSettings.shoot) shootRequest.current = false;
      else if (key === keybindSettings.aim) {
        if (stats.weaponName === 'MUSTANG & SALLY') {
          shootLeftRequest.current = false;
        } else {
          aimRequest.current = false;
        }
      }

      if (keyboardMoving) {
        let x = 0, y = 0;
        if (keys.d) x += 1;
        if (keys.a) x -= 1;
        if (keys.w) y += 1;
        if (keys.s) y -= 1;
        const len = Math.sqrt(x * x + y * y);
        if (len > 0) {
          moveInput.current = { x: x / len, y: y / len };
        } else {
          // Only reset if joystick isn't active
          if (!joystickActive.current) {
            moveInput.current = { x: 0, y: 0 };
          }
          keyboardMoving = false;
        }
      }
      
      updateLookInput();
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (status !== GameStatus.PLAYING || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('.mod-menu-container')) return;
      const key = `mouse${e.button}`;
      if (key === keybindSettings.shoot) shootRequest.current = true;
      else if (key === keybindSettings.aim) {
        if (stats.weaponName === 'MUSTANG & SALLY') {
          shootLeftRequest.current = true;
        } else {
          aimRequest.current = true;
        }
      }
      else if (key === keybindSettings.knife) knifeRequest.current = true;
      else if (key === keybindSettings.grenade) callbacksRef.current.throwGrenade(e as any);
      else if (key === keybindSettings.interact) callbacksRef.current.handleInteract();
    };
    const handleMouseUp = (e: MouseEvent) => {
      const key = `mouse${e.button}`;
      if (key === keybindSettings.shoot) shootRequest.current = false;
      else if (key === keybindSettings.aim) {
        if (stats.weaponName === 'MUSTANG & SALLY') {
          shootLeftRequest.current = false;
        } else {
          aimRequest.current = false;
        }
      }
      else if (key === keybindSettings.knife) knifeRequest.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      if (keyboardMoving) {
        moveInput.current = { x: 0, y: 0 };
      }
      shootRequest.current = false;
      shootLeftRequest.current = false;
      sprintRequest.current = false;
      setIsSprinting(false);
    };
  }, [status, keybindSettings, isBinding, stats.weaponName]);

  // Gamepad Support
  useEffect(() => {
    if (status !== GameStatus.PLAYING) return;

    let animationFrameId: number;
    let lastButtonStates: Record<number, boolean> = {};

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      let activeGamepad: Gamepad | null = null;
      
      for (const gp of gamepads) {
        if (gp && gp.connected) {
          activeGamepad = gp;
          break;
        }
      }

      if (activeGamepad) {
        // Movement (Left Stick)
        const deadzone = 0.2;
        let moveX = activeGamepad.axes[0];
        let moveY = activeGamepad.axes[1];
        
        if (Math.abs(moveX) < deadzone) moveX = 0;
        if (Math.abs(moveY) < deadzone) moveY = 0;
        
        if (moveX !== 0 || moveY !== 0) {
          moveInput.current = { x: moveX, y: -moveY }; // Invert Y for forward/back
        } else if (!keysRef.current.w && !keysRef.current.a && !keysRef.current.s && !keysRef.current.d && !joystickActive.current) {
          // Only reset if keyboard and joystick aren't moving
          moveInput.current = { x: 0, y: 0 };
        }

        // Look (Right Stick)
        let lookX = activeGamepad.axes[2];
        let lookY = activeGamepad.axes[3];
        
        if (Math.abs(lookX) < deadzone) lookX = 0;
        if (Math.abs(lookY) < deadzone) lookY = 0;
        
        if (lookX !== 0 || lookY !== 0) {
          keyboardLookInput.current = { 
            x: lookX * gamepadSettings.sensitivityX, 
            y: lookY * gamepadSettings.sensitivityY 
          };
        } else if (!keysRef.current.up && !keysRef.current.down && !keysRef.current.left && !keysRef.current.right) {
          // Only reset if keyboard isn't looking
          keyboardLookInput.current = { x: 0, y: 0 };
        }

        // Buttons
        const currentButtonStates: Record<number, boolean> = {};
        
        // First pass: Read all button states
        for (let i = 0; i < activeGamepad.buttons.length; i++) {
            currentButtonStates[i] = activeGamepad.buttons[i].pressed;
        }

        const checkButton = (index: number, action: () => void, isContinuous = false) => {
          if (index < 0 || index >= activeGamepad!.buttons.length) return;
          const isPressed = currentButtonStates[index];
          const wasPressed = lastButtonStates[index] || false;
          
          if (isPressed && (!wasPressed || isContinuous)) {
            action();
          }
        };

        checkButton(gamepadSettings.jump, () => callbacksRef.current.handleJumpOrSlide());
        checkButton(gamepadSettings.interact, () => callbacksRef.current.handleInteract());
        checkButton(gamepadSettings.reload, () => callbacksRef.current.handleReload());
        checkButton(gamepadSettings.switchWeapon, () => callbacksRef.current.switchWeapon());
        checkButton(gamepadSettings.grenade, () => callbacksRef.current.throwGrenade());
        checkButton(gamepadSettings.pause, () => togglePause());
        checkButton(gamepadSettings.flashbang, () => callbacksRef.current.throwFlashbang());
        checkButton(gamepadSettings.monkeyBomb, () => callbacksRef.current.throwMonkeyBomb());

        // Continuous actions
        const isShooting = activeGamepad.buttons[gamepadSettings.shoot]?.pressed || false;
        shootRequest.current = isShooting;

        const isKnifing = activeGamepad.buttons[gamepadSettings.knife]?.pressed || false;
        knifeRequest.current = isKnifing;

        const isSprinting = activeGamepad.buttons[gamepadSettings.sprint]?.pressed || false;
        sprintRequest.current = isSprinting;
        setIsSprinting(isSprinting);

        const isAiming = activeGamepad.buttons[gamepadSettings.aim]?.pressed || false;
        if (stats.weaponName === 'MUSTANG & SALLY') {
          shootLeftRequest.current = isAiming;
          aimRequest.current = false;
        } else {
          aimRequest.current = isAiming;
          shootLeftRequest.current = false;
        }

        // Update last states
        lastButtonStates = currentButtonStates;
      }

      animationFrameId = requestAnimationFrame(pollGamepad);
    };

    pollGamepad();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [status, gamepadSettings, stats.weaponName]);

  // Pointer Lock for Mouse Look
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (status === GameStatus.PLAYING && document.pointerLockElement === canvas) {
        lookInput.current = {
          x: e.movementX * 0.002,
          y: e.movementY * 0.002
        };
      }
    };

    const handleClick = () => {
      if (status === GameStatus.PLAYING) {
        canvas.requestPointerLock().catch(() => {
          // Ignore pointer lock errors on unsupported platforms
        });
      }
    };
    
    const handlePointerLockChange = () => {
      if (document.pointerLockElement !== canvas && status === GameStatus.PLAYING) {
        setStatus(GameStatus.PAUSED);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
    };
  }, [status]);

  const generateHeartPositions = () => {
    const mapId = stats.activeMapId || 'town';
    const possiblePoints: THREE.Vector3[] = [];
    
    if (mapId === 'town') {
      possiblePoints.push(
        new THREE.Vector3(-15, 1.5, -5),  // Bank (away from Jugg)
        new THREE.Vector3(15, 1.5, 15),   // Bar (away from Speed Cola)
        new THREE.Vector3(-25, 1.5, 25),  // Church (away from Stamin-Up)
        new THREE.Vector3(25, 1.5, -25),  // Diner (away from Double Tap)
        new THREE.Vector3(10, 1.5, -35),  // Apartments (away from Mule Kick)
        new THREE.Vector3(75, 1.5, 75),   // Garage (away from PHD)
        new THREE.Vector3(-65, 1.5, -60), // Factory (away from Deadshot)
        new THREE.Vector3(65, 1.5, -65),  // Hospital (away from Electric Cherry)
        new THREE.Vector3(-75, 1.5, 65),  // Warehouse (away from Quick Revive)
        new THREE.Vector3(75, 1.5, 15),   // Police (away from Vulture Aid)
        new THREE.Vector3(-40, 1.5, 10),  // Store (away from Widow's Wine)
        new THREE.Vector3(40, 1.5, 10),   // Office (away from Slider Wine)
        new THREE.Vector3(0, 1.5, 40),    // Outside South
        new THREE.Vector3(40, 1.5, 40),   // Outside SE
        new THREE.Vector3(-40, 1.5, -40), // Outside NW
        new THREE.Vector3(10, 1.5, 10)    // Center (offset)
      );
    } else {
      possiblePoints.push(
        new THREE.Vector3(0, 1.5, -15),
        new THREE.Vector3(-15, 1.5, -20),
        new THREE.Vector3(15, 1.5, 20),
        new THREE.Vector3(-10, 1.5, 25),
        new THREE.Vector3(25, 1.5, 0),
        new THREE.Vector3(-25, 1.5, 0),
        new THREE.Vector3(0, 1.5, 25),
        new THREE.Vector3(20, 1.5, 30),
        new THREE.Vector3(-20, 1.5, -30),
        new THREE.Vector3(20, 1.5, -30),
        new THREE.Vector3(-20, 1.5, 30),
        new THREE.Vector3(0, 1.5, -50),
        new THREE.Vector3(0, 1.5, 50),
        new THREE.Vector3(50, 1.5, 0),
        new THREE.Vector3(-50, 1.5, 0),
        new THREE.Vector3(50, 1.5, 50),
        new THREE.Vector3(-50, 1.5, -50),
        new THREE.Vector3(50, 1.5, -50),
        new THREE.Vector3(-50, 1.5, 50)
      );
    }

    // Shuffle and pick 3
    const shuffled = possiblePoints.sort(() => 0.5 - Math.random());
    setHeartPositions(shuffled.slice(0, 3));
  };

  const startGame = (fromLobby = false) => {
    setGameKey(prev => prev + 1);
    setIsCustomGameSession(fromLobby ? room?.isCustom : false);
    setModMenuType(fromLobby && room?.isCustom ? 'limited' : 'full');
    setActiveBots(fromLobby ? 0 : 0);
    
    if (fromLobby && room) {
      setOtherPlayers(room.players.filter((p: any) => p.id !== socket?.id).map((p: any) => ({
        id: p.id,
        name: p.name,
        points: 500,
        kills: 0,
        downs: 0,
        revives: 0,
        headshots: 0,
        knifeKills: 0,
        equipmentKills: 0,
        hp: 150,
        isDowned: false,
        isBot: false,
        ping: 20,
        variant: p.variant || Math.floor(Math.random() * 1000)
      })));
      setStats(prev => ({ ...getInitialStats(getLevelData(progression.xp).level, progression.prestige, room.mapId, prev.selectedCamo, progression.weaponAttachments), activeMapId: room.mapId }));
    } else {
      setOtherPlayers([]);
      setStats(prev => getInitialStats(getLevelData(progression.xp).level, progression.prestige, prev.activeMapId, prev.selectedCamo, progression.weaponAttachments));
    }
    
    setGodMode(false);
    setBloodOverlay(0);
    setFlashOverlay(0);
    setInstaKillExpiry(0);
    setDoublePointsExpiry(0);
    setLastPerkGained(null);
    setOpenDoors([]);
    setStatus(GameStatus.PLAYING);
    setShowRoundSplash(true);
    setGameStartTime(Date.now());
    
    // Reset Easter Egg
    setCollectedHearts([false, false, false]);
    setDragonActive(false);
    setDragonHealth(250000);
    setBossDefeated(false);
    setRed9CurseActive(false);
    setRed9BlessingClaimed(false);
    setEasterEggTriggered(false);
    generateHeartPositions();

    soundService.playRoundStart();
    setTimeout(() => setShowRoundSplash(false), 3000);
  };

  const startCustomGame = () => {
    if (isOnline) {
      socket?.emit('create_room', {
        name: customGameConfig.playerName,
        mapId: customGameConfig.mapId,
        isCustom: true
      });
      return;
    }
    setGameKey(prev => prev + 1);
    setIsCustomGameSession(true);
    setModMenuType('limited');
    setActiveBots(customGameConfig.bots);
    
    // Initialize bots
    const bots: PlayerScore[] = [];
    for (let i = 0; i < customGameConfig.bots; i++) {
      bots.push({
        id: `bot-${i}`,
        name: customGameConfig.botNames[i] || `Bot ${i+1}`,
        points: customGameConfig.startingPoints,
        kills: 0,
        revives: 0,
        downs: 0,
        headshots: 0,
        knifeKills: 0,
        equipmentKills: 0,
        ping: 0,
        isBot: true,
        isDowned: false,
        downedTimer: 0,
        hp: 150,
        level: Math.floor(Math.random() * 55) + 1,
        prestige: Math.floor(Math.random() * 11),
        variant: Math.floor(Math.random() * 5),
        isReviving: false
      });
    }
    setOtherPlayers(bots);

    setStats(prev => {
      const initial = getInitialStats(getLevelData(progression.xp).level, progression.prestige, customGameConfig.mapId, prev.selectedCamo, progression.weaponAttachments);
      return {
        ...initial,
        points: customGameConfig.startingPoints,
        totalPoints: customGameConfig.startingPoints,
        round: customGameConfig.startingRound,
        weaponName: customGameConfig.startingWeapon,
        attachments: getActiveAttachments(customGameConfig.startingWeapon, getLevelData(progression.xp).level, progression.weaponAttachments || {}),
        ammo: WEAPONS[customGameConfig.startingWeapon]?.clip || 8,
        maxAmmo: WEAPONS[customGameConfig.startingWeapon]?.max || 80,
      };
    });
    setGodMode(customGameConfig.godMode);
    setBloodOverlay(0);
    setFlashOverlay(0);
    setInstaKillExpiry(0);
    setDoublePointsExpiry(0);
    setLastPerkGained(null);
    setOpenDoors([]);
    setStatus(GameStatus.PLAYING);
    setShowRoundSplash(true);
    setGameStartTime(Date.now());
    
    // Reset Easter Egg
    setCollectedHearts([false, false, false]);
    setDragonActive(false);
    setDragonHealth(250000);
    setBossDefeated(false);
    setRed9CurseActive(false);
    setRed9BlessingClaimed(false);
    setEasterEggTriggered(false);
    generateHeartPositions();

    soundService.playRoundStart();
    setTimeout(() => setShowRoundSplash(false), 3000);
  };

  const fullRestart = () => {
    setGameKey(prev => prev + 1);
    setStats(prev => getInitialStats(getLevelData(progression.xp).level, progression.prestige, prev.activeMapId, prev.selectedCamo, progression.weaponAttachments));
    setBloodOverlay(0);
    setOpenDoors([]);
    setStatus(GameStatus.START);
    
    // Reset Easter Egg
    setCollectedHearts([false, false, false]);
    setDragonActive(false);
    setDragonHealth(250000);
    setBossDefeated(false);
    setRed9CurseActive(false);
    setRed9BlessingClaimed(false);
    setEasterEggTriggered(false);
    generateHeartPositions();
  };

  const togglePause = () => {
    if (status === GameStatus.PLAYING) {
      setStatus(GameStatus.PAUSED);
      setShowPauseSettings(false);
      setShowModMenu(false);
      setShowProgressMenu(false);
    } else if (status === GameStatus.PAUSED) {
      setStatus(GameStatus.PLAYING);
      setShowPauseSettings(false);
      setShowModMenu(false);
      setShowProgressMenu(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (status !== GameStatus.PLAYING) return;
    for (const touch of Array.from(e.changedTouches)) {
      const target = touch.target as HTMLElement;
      if (target.closest('.joystick-base, button, a')) {
        continue;
      }
      if (lookTouchId.current === null) {
        lookTouchId.current = touch.identifier;
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (status !== GameStatus.PLAYING || lookTouchId.current === null) return;
    for (const touch of Array.from(e.changedTouches)) {
      if (touch.identifier === lookTouchId.current) {
        if (lastLookPos.current) {
          const dx = touch.clientX - lastLookPos.current.x;
          const dy = touch.clientY - lastLookPos.current.y;
          lookInput.current = { 
            x: lookInput.current.x + dx * 0.006, 
            y: lookInput.current.y + dy * 0.006 
          };
        }
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
        break; 
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (lookTouchId.current === null) return;
    for (const touch of Array.from(e.changedTouches)) {
      if (touch.identifier === lookTouchId.current) {
        lookTouchId.current = null;
        lastLookPos.current = null;
        lookInput.current = { x: 0, y: 0 };
        break;
      }
    }
  };

  const isInstaKillActive = instaKillExpiry > now;
  const isDoublePointsActive = doublePointsExpiry > now;
  const isFireSaleActive = fireSaleExpiry > now;
  const isZombieBloodActive = zombieBloodExpiry > now;
  const isDeathMachineActive = deathMachineExpiry > now;
  const isHealthRefillLocked = interactPrompt?.id === 'healthRefill' && stats.healthRefillsBought >= 3;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDragonDefeated = useCallback(() => {
    setDragonActive(false);
    setBossDefeated(true);
    setStats(prev => {
      const allPerks = ['jugg', 'speed', 'stamin', 'double', 'mule', 'phd', 'deadshot', 'electric', 'revive', 'vulture', 'widow', 'slider', 'winter', 'dying', 'razor', 'timeslip', 'bandolier', 'tortoise', 'blaze', 'stronghold', 'blood', 'elemental'];
      // Add 5 random perks
      const currentPerks = new Set(prev.perks);
      const availablePerks = allPerks.filter(p => !currentPerks.has(p));
      const newPerks = [...prev.perks];
      for(let i=0; i<5 && availablePerks.length > 0; i++) {
        const randIdx = Math.floor(Math.random() * availablePerks.length);
        newPerks.push(availablePerks[randIdx]);
        availablePerks.splice(randIdx, 1);
      }
      
      const hasJugg = newPerks.includes('jugg');
      const hasTortoise = newPerks.includes('tortoise');
      let newMaxHp = hasJugg ? 250 : 100;
      if (hasTortoise) newMaxHp += 100;

      return {
        ...prev,
        points: prev.points + 20000,
        totalPoints: prev.totalPoints + 20000,
        perks: newPerks,
        maxHp: newMaxHp,
        hp: newMaxHp
      };
    });
    setLastPerkGained("DRAGON DEFEATED! +20k PTS +5 PERKS");
    setTimeout(() => setLastPerkGained(null), 5000);
  }, []);

  const handleRed9Blessing = useCallback(() => {
    if (red9BlessingClaimed) return;
    setRed9BlessingClaimed(true);
    setStats(prev => {
      const allPerks = ['jugg', 'speed', 'stamin', 'double', 'mule', 'phd', 'deadshot', 'electric', 'revive', 'vulture', 'widow', 'slider', 'winter', 'dying', 'razor', 'timeslip', 'bandolier', 'tortoise', 'blaze', 'stronghold', 'blood', 'elemental'];
      const currentPerks = new Set(prev.perks);
      const availablePerks = allPerks.filter(p => !currentPerks.has(p));
      const newPerks = [...prev.perks];
      for(let i=0; i<3 && availablePerks.length > 0; i++) {
        const randIdx = Math.floor(Math.random() * availablePerks.length);
        newPerks.push(availablePerks[randIdx]);
        availablePerks.splice(randIdx, 1);
      }
      const hasJugg = newPerks.includes('jugg');
      const hasTortoise = newPerks.includes('tortoise');
      let newMaxHp = hasJugg ? 250 : 100;
      if (hasTortoise) newMaxHp += 100;

      return {
        ...prev,
        points: prev.points + 3500,
        totalPoints: prev.totalPoints + 3500,
        perks: newPerks,
        maxHp: newMaxHp,
        hp: newMaxHp
      };
    });
    setLastPerkGained("Red9's spirit blesses you.");
    setTimeout(() => setLastPerkGained(null), 5000);
    soundService.playPowerUpPickup();
  }, [red9BlessingClaimed]);

  const handleRed9Curse = useCallback(() => {
    if (red9CurseActive) return;
    setRed9CurseActive(true);
    setLastPerkGained("i miss you too but dont wake me up ya dickhead");
    setTimeout(() => setLastPerkGained(null), 5000);
    // soundService.playLaugh();
  }, [red9CurseActive]);

  const instaKillTimeLeft = Math.max(0, Math.ceil((instaKillExpiry - now) / 1000));
  const doublePointsTimeLeft = Math.max(0, Math.ceil((doublePointsExpiry - now) / 1000));
  const fireSaleTimeLeft = Math.max(0, Math.ceil((fireSaleExpiry - now) / 1000));
  const zombieBloodTimeLeft = Math.max(0, Math.ceil((zombieBloodExpiry - now) / 1000));
  const deathMachineTimeLeft = Math.max(0, Math.ceil((deathMachineExpiry - now) / 1000));

  return (
    <div className="relative w-full h-full bg-black select-none overflow-hidden touch-none font-sans" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd}>
      <div className="absolute inset-0 z-0">
        <Canvas key={gameKey} shadows gl={{ antialias: true, alpha: false }} camera={{ fov: 75, near: 0.01, far: 150 }}>
          <Suspense fallback={null}>
            <Scene 
              gameMode={customGameConfig.gameMode}
              status={status}
              mapConfig={MAPS.find(m => m.id === stats.activeMapId) || MAPS[0]}
              botCount={activeBots}
              otherPlayers={otherPlayers}
              onGameOver={onGameOver}
              moveInput={moveInput}
              lookInput={lookInput}
              keyboardLookInput={keyboardLookInput}
              shootRequest={shootRequest}
              shootLeftRequest={shootLeftRequest}
              phoneShootRequest={phoneShootRequest}
              knifeRequest={knifeRequest}
              jumpRequest={jumpRequest}
              slideRequest={slideRequest}
              grenadeRequest={grenadeRequest}
              flashbangRequest={flashbangRequest}
              monkeyBombRequest={monkeyBombRequest}
              sprintRequest={sprintRequest}
              aimRequest={aimRequest}
              onStatsUpdate={handleStatsUpdate}
              onPowerUp={handlePowerUp}
              onInteractAvailable={setInteractPrompt}
              progression={progression}
              onGameEvent={(event) => {
                if (isOnline && socket && room) {
                  if (event.type === 'zombie_update') {
                    socket.emit('zombie_update', { roomId: room.id, zombies: event.zombies });
                  } else {
                    socket.emit('game_event', { roomId: room.id, ...event });
                  }
                }
              }}
              isHost={room?.host === socket?.id}
              syncedZombies={syncedZombies}
              playerPosRef={playerPosRef}
              gameState={gameState}
              openDoors={openDoors}
              teleportTarget={teleportTarget}
              onTeleportComplete={() => setTeleportTarget(null)}
              heartPositions={heartPositions}
              collectedHearts={collectedHearts}
              dragonActive={dragonActive}
              dragonHealth={dragonHealth}
              setDragonHealth={setDragonHealth}
              killAllZombies={killAllZombies}
              setKillAllZombies={setKillAllZombies}
              teleportToPlayerId={teleportToPlayerId}
        onTeleportToPlayerComplete={() => setTeleportToPlayerId(null)}
        teleportPlayerToMeId={teleportPlayerToMeId}
        onTeleportPlayerToMeComplete={() => setTeleportPlayerToMeId(null)}
        teleportZombiesToMe={teleportZombiesToMe}
              setTeleportZombiesToMe={setTeleportZombiesToMe}
              spawnZombieType={spawnZombieType}
              onSpawnZombieComplete={() => setSpawnZombieType(null)}
              changeAllZombiesType={changeAllZombiesType}
              onChangeAllZombiesComplete={() => setChangeAllZombiesType(null)}
              onDragonDefeated={handleDragonDefeated}
              onRed9Blessing={handleRed9Blessing}
              onRed9Curse={handleRed9Curse}
              red9BlessingClaimed={red9BlessingClaimed}
              red9CurseActive={red9CurseActive}
              onEasterEggTriggered={() => setEasterEggTriggered(true)}
              onUnlockAchievement={unlockAchievement}
              fireSaleActive={fireSaleExpiry > now}
              zombieBloodActive={zombieBloodExpiry > now}
              playerName={customGameConfig.playerName}
              botNames={customGameConfig.botNames}
              gameSettings={gameSettings}
            />
          </Suspense>
        </Canvas>
      </div>

      <div className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300 shadow-[inset_0_0_150px_rgba(153,0,0,1)]" style={{ opacity: bloodOverlay }} />
      <div className="absolute inset-0 pointer-events-none z-[60] bg-white transition-opacity duration-100" style={{ opacity: flashOverlay }} />

      {(status === GameStatus.PLAYING || status === GameStatus.PAUSED) && (
        <>

          {showRoundSplash && (
            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none animate-in fade-in zoom-in duration-500">
               <h2 className="text-9xl font-black text-red-700 italic tracking-tighter drop-shadow-[0_0_40px_rgba(185,28,28,0.9)]">ROUND {stats.round}</h2>
            </div>
          )}

          {levelUpNotif.show && (
            <div className="absolute top-[15%] left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-none animate-in slide-in-from-bottom-10 fade-in duration-500">
              <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 text-transparent bg-clip-text font-black text-6xl uppercase italic tracking-widest drop-shadow-[0_0_30px_rgba(234,179,8,1)] flex items-center gap-4">
                <Star className="w-12 h-12 text-yellow-400 fill-yellow-400 animate-pulse" />
                Level Up!
                <Star className="w-12 h-12 text-yellow-400 fill-yellow-400 animate-pulse" />
              </div>
              <div className="text-white font-black text-8xl uppercase italic drop-shadow-[0_0_40px_rgba(255,255,255,1)] mt-2">
                {levelUpNotif.level}
              </div>
              <div className="mt-4 bg-black/60 backdrop-blur-md px-8 py-3 rounded-full border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)] animate-pulse">
                <span className="text-yellow-400 font-bold text-xl uppercase tracking-widest">+10 Starting Points</span>
              </div>
            </div>
          )}

          {lastPerkGained && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in slide-in-from-bottom fade-in duration-500">
               <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 shadow-2xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                    <PlusCircle className="text-white w-5 h-5" />
                  </div>
                  <span className="text-white font-black italic tracking-tighter uppercase">{lastPerkGained}</span>
               </div>
            </div>
          )}

          {dragonActive && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-1/2 max-w-2xl flex flex-col items-center gap-2">
              <span className="text-red-600 font-black italic text-2xl tracking-widest drop-shadow-[0_0_10px_rgba(220,38,38,0.8)] uppercase">Zombie Dragon</span>
              <div className="w-full h-6 bg-black/80 border-2 border-red-900 rounded-sm overflow-hidden relative shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, (dragonHealth / 250000) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {(hudMode === 'info' || hudMode === 'all') && (
            <div 
              className="absolute z-20 space-y-3 pointer-events-none"
              style={{ top: hudSettings.statsPos.y, left: hudSettings.statsPos.x, transform: `scale(${hudSettings.hudScale})`, transformOrigin: 'top left' }}
            >
              <div className="flex items-center gap-4 bg-black/60 px-5 py-2 rounded-sm border-l-4 border-red-700 backdrop-blur-md shadow-xl">
                 <Skull className="text-red-600 w-8 h-8" />
                 <span className="text-red-600 font-black text-4xl italic">{stats.round}</span>
              </div>
              <div className="flex items-center gap-4 bg-black/60 px-5 py-2 rounded-sm border-l-4 border-orange-600 backdrop-blur-md shadow-xl">
                 <UserX className="text-orange-500 w-6 h-6" />
                 <span className="text-orange-400 font-black text-2xl italic">{stats.zombiesRemaining}</span>
              </div>
              <div className="flex flex-col gap-1 bg-black/60 px-5 py-2 rounded-sm border-l-4 border-emerald-500 backdrop-blur-md shadow-xl">
                 <div className="flex items-center gap-4">
                   <Database className="text-emerald-500 w-6 h-6" />
                   <span className="text-emerald-400 font-black text-2xl italic">{stats.points}</span>
                 </div>
                 <div className="text-emerald-500/50 text-[10px] font-black uppercase tracking-widest text-right pr-1">
                   Total: {stats.totalPoints}
                 </div>
              </div>
              <div className="flex items-center gap-4 bg-black/60 px-5 py-2 rounded-sm border-l-4 border-yellow-500 backdrop-blur-md shadow-xl">
                 {progression.prestige > 0 ? getPrestigeIcon(progression.prestige, 24) : <Star className="text-yellow-500 w-6 h-6" />}
                 <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400 font-black text-xl italic leading-none">Lvl {getLevelData(progression.xp).level}</span>
                      {Array.from({ length: progression.stars || 0 }).map((_, i) => (
                        <Star key={i} className="text-yellow-400 w-3 h-3 fill-yellow-400" />
                      ))}
                    </div>
                   {progression.prestige > 0 && <span className={`${getPrestigeColor(progression.prestige)} font-black text-[10px] uppercase tracking-widest`}>Prestige {progression.prestige}</span>}
                 </div>
              </div>
              <div className="flex items-center gap-4 bg-black/60 px-5 py-2 rounded-sm border-l-4 border-blue-500 backdrop-blur-md shadow-xl">
                 <Timer className="text-blue-500 w-6 h-6" />
                 <span className="text-blue-400 font-black text-2xl italic">{formatTime(stats.time)}</span>
              </div>
              
              <div className="flex gap-2 pt-2">
                {stats.perks.includes('jugg') && (
                  <div className="w-12 h-12 bg-red-600/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-in zoom-in duration-300 backdrop-blur-sm">
                    <Heart className="text-white w-7 h-7" />
                  </div>
                )}
                {stats.perks.includes('speed') && (
                  <div className="w-12 h-12 bg-green-600/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_15px_rgba(22,163,74,0.5)] animate-in zoom-in duration-300 backdrop-blur-sm">
                    <Gauge className="text-white w-7 h-7" />
                  </div>
                )}
                {stats.perks.includes('stamin') && (
                  <div className="w-12 h-12 bg-yellow-500/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_15px_rgba(234,179,8,0.5)] animate-in zoom-in duration-300 backdrop-blur-sm">
                    <Zap className="text-white w-7 h-7" />
                  </div>
                )}
                {stats.perks.includes('double') && (
                  <div className="w-12 h-12 bg-orange-600/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_15px_rgba(234,88,12,0.5)] animate-in zoom-in duration-300 backdrop-blur-sm">
                    <Shield className="text-white w-7 h-7" />
                  </div>
                )}
                {stats.perks.includes('mule') && (
                  <div className="w-12 h-12 bg-indigo-600/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_15px_rgba(79,70,229,0.5)] animate-in zoom-in duration-300 backdrop-blur-sm">
                    <Database className="text-white w-7 h-7" />
                  </div>
                )}
                {stats.perks.includes('phd') && (
                  <div className="w-12 h-12 bg-purple-600/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_15px_rgba(147,51,234,0.5)] animate-in zoom-in duration-300 backdrop-blur-sm">
                    <Bomb className="text-white w-7 h-7" />
                  </div>
                )}
                {stats.perks.includes('deadshot') && (
                  <div className="w-12 h-12 bg-gray-600/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_15px_rgba(75,85,99,0.5)] animate-in zoom-in duration-300 backdrop-blur-sm">
                    <HeadshotIcon className="text-white w-7 h-7" />
                  </div>
                )}
                {stats.perks.includes('electric') && (
                  <div className="w-12 h-12 bg-cyan-500/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-in zoom-in duration-300 backdrop-blur-sm">
                    <Zap className="text-white w-7 h-7" />
                  </div>
                )}
                {stats.perks.includes('revive') && (
                  <div className="w-12 h-12 bg-blue-500/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-in zoom-in duration-300 backdrop-blur-sm">
                    <Activity className="text-white w-7 h-7" />
                  </div>
                )}
                {stats.perks.includes('vulture') && (
                  <div className="w-12 h-12 bg-lime-500/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_15px_rgba(132,204,22,0.5)] animate-in zoom-in duration-300 backdrop-blur-sm">
                    <Database className="text-white w-7 h-7" />
                  </div>
                )}
                {stats.perks.includes('widow') && (
                  <div className="w-12 h-12 bg-pink-600/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_15px_rgba(219,39,119,0.5)] animate-in zoom-in duration-300 backdrop-blur-sm">
                    <Swords className="text-white w-7 h-7" />
                  </div>
                )}
                {stats.perks.includes('slider') && (
                  <div className="w-12 h-12 bg-orange-400/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_15px_rgba(251,146,60,0.5)] animate-in zoom-in duration-300 backdrop-blur-sm">
                    <SlideIcon className="text-white w-7 h-7" />
                  </div>
                )}
                {stats.perks.includes('winter') && (
                  <div className="w-12 h-12 bg-blue-200/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_15px_rgba(191,219,254,0.5)] animate-in zoom-in duration-300 backdrop-blur-sm">
                    <Snowflake className="text-white w-7 h-7" />
                  </div>
                )}
                {stats.perks.includes('dying') && (
                  <div className="w-12 h-12 bg-red-600/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-in zoom-in duration-300 backdrop-blur-sm">
                    <Flame className="text-white w-7 h-7" />
                  </div>
                )}
                {stats.perks.includes('razor') && (
                  <div className="w-12 h-12 bg-purple-400/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_15px_rgba(192,132,252,0.5)] animate-in zoom-in duration-300 backdrop-blur-sm">
                    <Scissors className="text-white w-7 h-7" />
                  </div>
                )}
                {stats.perks.includes('timeslip') && (
                  <div className="w-12 h-12 bg-cyan-300/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_15px_rgba(103,232,249,0.5)] animate-in zoom-in duration-300 backdrop-blur-sm">
                    <Hourglass className="text-white w-7 h-7" />
                  </div>
                )}
                {stats.perks.includes('bandolier') && (
                  <div className="w-12 h-12 bg-orange-400/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_15px_rgba(251,146,60,0.5)] animate-in zoom-in duration-300 backdrop-blur-sm">
                    <Database className="text-white w-7 h-7" />
                  </div>
                )}
                {stats.perks.includes('tortoise') && (
                  <div className="w-12 h-12 bg-emerald-400/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_15px_rgba(52,211,153,0.5)] animate-in zoom-in duration-300 backdrop-blur-sm">
                    <Shield className="text-white w-7 h-7" />
                  </div>
                )}
                {stats.perks.includes('blaze') && (
                  <div className="w-12 h-12 bg-orange-600/90 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_15px_rgba(234,88,12,0.5)] animate-in zoom-in duration-300 backdrop-blur-sm">
                    <Flame className="text-white w-7 h-7" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                 {isInstaKillActive && (
                   <div className="flex items-center gap-3 bg-red-600/90 text-white px-4 py-1.5 rounded-full border border-white/30 shadow-lg animate-pulse backdrop-blur-sm">
                      <Crosshair size={18} />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase italic tracking-wider leading-none">INSTA-KILL</span>
                        <span className="text-sm font-black italic tabular-nums leading-none">{instaKillTimeLeft}s</span>
                      </div>
                   </div>
                 )}
                 {isDoublePointsActive && (
                   <div className="flex items-center gap-3 bg-emerald-600/90 text-white px-4 py-1.5 rounded-full border border-white/30 shadow-lg animate-pulse backdrop-blur-sm">
                      <TrendingUp size={18} />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase italic tracking-wider leading-none">DOUBLE POINTS</span>
                        <span className="text-sm font-black italic tabular-nums leading-none">{doublePointsTimeLeft}s</span>
                      </div>
                   </div>
                 )}
                 {isFireSaleActive && (
                   <div className="flex items-center gap-3 bg-orange-600/90 text-white px-4 py-1.5 rounded-full border border-white/30 shadow-lg animate-pulse backdrop-blur-sm">
                      <Flame size={18} />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase italic tracking-wider leading-none">FIRE SALE</span>
                        <span className="text-sm font-black italic tabular-nums leading-none">{fireSaleTimeLeft}s</span>
                      </div>
                   </div>
                 )}
                 {isZombieBloodActive && (
                   <div className="flex items-center gap-3 bg-red-900/90 text-white px-4 py-1.5 rounded-full border border-white/30 shadow-lg animate-pulse backdrop-blur-sm">
                      <Droplet size={18} />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase italic tracking-wider leading-none">ZOMBIE BLOOD</span>
                        <span className="text-sm font-black italic tabular-nums leading-none">{zombieBloodTimeLeft}s</span>
                      </div>
                   </div>
                 )}
                 {isDeathMachineActive && (
                   <div className="flex items-center gap-3 bg-cyan-600/90 text-white px-4 py-1.5 rounded-full border border-white/30 shadow-lg animate-pulse backdrop-blur-sm">
                      <Skull size={18} />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase italic tracking-wider leading-none">DEATH MACHINE</span>
                        <span className="text-sm font-black italic tabular-nums leading-none">{deathMachineTimeLeft}s</span>
                      </div>
                   </div>
                 )}
              </div>
            </div>
          )}

          <div 
            className="absolute z-20 flex flex-col items-end pointer-events-none text-right"
            style={{ top: hudSettings.pausePos.y, right: hudSettings.pausePos.x, transform: `scale(${hudSettings.hudScale})`, transformOrigin: 'top right' }}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); togglePause(); }}
              className="pointer-events-auto bg-white/10 p-4 rounded-full border border-white/20 backdrop-blur-md active:scale-90 transition-all text-white shadow-xl"
              style={{ transform: `scale(${hudSettings.buttonScale})` }}
            >
              {status === GameStatus.PAUSED ? <Play size={24} /> : <Pause size={24} />}
            </button>
          </div>

          {(hudMode === 'info' || hudMode === 'all') && (
            <>
              <div 
                className="absolute z-20 flex flex-col items-end gap-4 pointer-events-none text-right"
                style={{ top: hudSettings.weaponPos.y, right: hudSettings.weaponPos.x, transform: `scale(${hudSettings.hudScale})`, transformOrigin: 'top right' }}
              >
                <div className="flex flex-col items-end">
                  {stats.weaponName === 'MUSTANG & SALLY' ? (
                    <>
                      <div className={`font-black italic tracking-tighter text-2xl drop-shadow-lg uppercase leading-none transition-colors duration-500 ${stats.weaponTier > 1 ? 'text-blue-400 animate-pulse' : 'text-white'}`}>MUSTANG</div>
                      <div className={`font-black italic tracking-tighter text-2xl drop-shadow-lg uppercase leading-none transition-colors duration-500 ${stats.weaponTier > 1 ? 'text-blue-400 animate-pulse' : 'text-white'}`}>SALLY</div>
                      <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Twin Guns</div>
                    </>
                  ) : (
                    <div className={`font-black italic tracking-tighter text-2xl drop-shadow-lg uppercase leading-none transition-colors duration-500 ${stats.weaponTier > 1 ? 'text-blue-400 animate-pulse' : 'text-white'}`}>{stats.weaponName}</div>
                  )}
                  {stats.secondaryWeaponName && (
                    <div className="text-white/40 font-bold italic text-xs uppercase tracking-tighter mt-1">{stats.secondaryWeaponName}</div>
                  )}
                  {stats.tertiaryWeaponName && (
                    <div className="text-white/40 font-bold italic text-xs uppercase tracking-tighter mt-1">{stats.tertiaryWeaponName}</div>
                  )}
                </div>
              </div>

              <div 
                className="absolute z-20 pointer-events-none"
                style={{ top: hudSettings.healthBarPos.y, left: hudSettings.healthBarPos.x, transform: `scale(${hudSettings.hudScale})`, transformOrigin: 'top left' }}
              >
                <div className="flex items-center gap-3 bg-black/40 p-2 rounded-full border border-white/10 backdrop-blur-sm relative">
                  <Activity className="text-red-500 w-4 h-4" />
                  <div className="w-32 h-4 bg-white/10 rounded-full overflow-hidden relative">
                    <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${(stats.hp / stats.maxHp) * 100}%` }} />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-md">
                      {Math.ceil(stats.hp)} / {stats.maxHp}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {status === GameStatus.PLAYING && endingSequence && (
            <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black/40 pointer-events-none">
              <div className="flex flex-col items-center gap-12">
                {endingSequence.map((text, idx) => (
                  <div 
                    key={idx} 
                    className="text-white font-black italic uppercase tracking-tighter text-4xl sm:text-6xl animate-in slide-in-from-top duration-[2000ms] text-center px-4 drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]"
                  >
                    [ {text} ]
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === GameStatus.PLAYING && hudMode === 'all' && (
            <>
              {/* Scoreboard removed from HUD */}

              <div 
                className="absolute z-30 pointer-events-auto"
                style={{ bottom: hudSettings.joystickPos.y, left: hudSettings.joystickPos.x }}
              >
                 <Joystick 
                   onMove={(x, y) => { 
                     moveInput.current = { x, y }; 
                     joystickActive.current = (x !== 0 || y !== 0);
                   }} 
                   onSprint={(active) => { sprintRequest.current = active; setIsSprinting(active); }}
                   label="Movement" 
                   scale={hudSettings.buttonScale * hudSettings.hudScale}
                 />
              </div>

              {customGameConfig.gameMode === 'dead_ops' && (
                <div 
                  className="absolute z-30 pointer-events-auto"
                  style={{ bottom: hudSettings.joystickPos.y, right: hudSettings.joystickPos.x }}
                >
                   <Joystick 
                     onMove={(x, y) => { 
                       keyboardLookInput.current = { x, y }; 
                       phoneShootRequest.current = (x !== 0 || y !== 0);
                     }} 
                     label="Aim & Shoot" 
                     scale={hudSettings.buttonScale * hudSettings.hudScale}
                   />
                </div>
              )}

              {customGameConfig.gameMode !== 'dead_ops' && (
                <>
                  <button 
                    onTouchStart={throwGrenade} 
                    onMouseDown={throwGrenade} 
                    className="absolute z-30 pointer-events-auto w-16 h-16 bg-gray-800/80 active:bg-gray-600 rounded-full flex flex-col items-center justify-center border-2 border-white/20 shadow-xl active:scale-90 transition-all backdrop-blur-md"
                    style={{ bottom: hudSettings.grenadePos.y, left: hudSettings.grenadePos.x, transform: `scale(${hudSettings.buttonScale * hudSettings.hudScale})`, transformOrigin: 'bottom left' }}
                  >
                     <Bomb size={24} className="text-white" />
                     <span className="text-[10px] font-black text-white">{stats.grenades}</span>
                  </button>

                  <button 
                    onTouchStart={throwFlashbang} 
                    onMouseDown={throwFlashbang} 
                    className="absolute z-30 pointer-events-auto w-16 h-16 bg-yellow-800/80 active:bg-yellow-600 rounded-full flex flex-col items-center justify-center border-2 border-white/20 shadow-xl active:scale-90 transition-all backdrop-blur-md"
                    style={{ bottom: hudSettings.flashbangPos.y, left: hudSettings.flashbangPos.x, transform: `scale(${hudSettings.buttonScale * hudSettings.hudScale})`, transformOrigin: 'bottom left' }}
                  >
                     <Sun size={24} className="text-white" />
                     <span className="text-[10px] font-black text-white">{stats.flashbangs}</span>
                  </button>

                  <button 
                    onTouchStart={throwMonkeyBomb} 
                    onMouseDown={throwMonkeyBomb} 
                    className="absolute z-30 pointer-events-auto w-16 h-16 bg-red-900/80 active:bg-red-700 rounded-full flex flex-col items-center justify-center border-2 border-white/20 shadow-xl active:scale-90 transition-all backdrop-blur-md"
                    style={{ bottom: hudSettings.monkeyBombPos.y, left: hudSettings.monkeyBombPos.x, transform: `scale(${hudSettings.buttonScale * hudSettings.hudScale})`, transformOrigin: 'bottom left' }}
                  >
                     <BoxIcon size={24} className="text-white" />
                     <span className="text-[10px] font-black text-white">{stats.monkeyBombs}</span>
                  </button>
                </>
              )}

              {/* Gem Counter for Dead Ops */}
              {customGameConfig.gameMode === 'dead_ops' && (
                <div 
                  className="absolute z-30 pointer-events-none flex items-center gap-2 bg-purple-900/80 px-4 py-2 rounded-full border border-purple-500/50 backdrop-blur-md shadow-lg"
                  style={{ top: '15%', left: '50%', transform: 'translateX(-50%)' }}
                >
                   <div className="w-6 h-6 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7] animate-pulse" />
                   <span className="text-white font-black italic text-2xl tracking-widest drop-shadow-md">{stats.gems || 0}</span>
                </div>
              )}

              {isBoxCycling && cyclingWeapon && (
                <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-none">
                   <div className="px-8 py-4 bg-yellow-600/80 text-white rounded-lg border-2 border-white/20 shadow-[0_0_30px_rgba(202,138,4,0.5)] animate-pulse flex items-center gap-3">
                      <BoxIcon className="w-6 h-6 animate-spin" />
                      <div className="flex flex-col items-start">
                        <span className="text-[10px] font-bold uppercase opacity-60">
                          Mystery Box
                        </span>
                        <span className="text-xl font-black italic tracking-tighter">
                          {cyclingWeapon}
                        </span>
                      </div>
                   </div>
                </div>
              )}

              {stats.isDowned && (
            <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-red-900/20 pointer-events-none">
              <div className="text-white font-black text-6xl italic animate-pulse drop-shadow-lg">DOWNED</div>
              <div className="text-white font-black text-4xl mt-4 drop-shadow-lg">REVIVE IN {stats.downedTimer}s</div>
              <div className="text-white/80 text-sm mt-2 uppercase tracking-widest drop-shadow-md">Wait for a bot or player to revive you</div>
            </div>
          )}

          {interactPrompt && !isBoxCycling && (
                <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-auto">
                   <button 
                      onClick={handleInteract}
                      disabled={isHealthRefillLocked || (interactPrompt.id === 'pap' && stats.weaponTier > 1)}
                      className={`px-8 py-4 ${isHealthRefillLocked || (interactPrompt.id === 'pap' && stats.weaponTier > 1) ? 'bg-red-900 border-red-500 opacity-50 cursor-not-allowed' : (stats.points >= interactPrompt.cost ? 'bg-emerald-600 animate-pulse' : 'bg-gray-600')} text-white rounded-lg border-2 border-white/20 shadow-2xl transition-all active:scale-90 flex items-center gap-3`}
                   >
                      {interactPrompt.id === 'pap' ? <PapIcon className="w-6 h-6" /> : <ShoppingCart className="w-6 h-6" />}
                      <div className="flex flex-col items-start">
                        <span className="text-[10px] font-bold uppercase opacity-60">
                          {isHealthRefillLocked ? 'Max Uses Reached' : (interactPrompt.id === 'pap' && stats.weaponTier > 1 ? 'Weapon Already Packed' : `Buy ${interactPrompt.type}`)}
                        </span>
                        <span className="text-xl font-black italic tracking-tighter">
                          {isHealthRefillLocked || (interactPrompt.id === 'pap' && stats.weaponTier > 1) ? 'LOCKED' : (stats.perks.includes(interactPrompt.id) ? 'OWNED' : `$${interactPrompt.cost}`)}
                        </span>
                      </div>
                   </button>
                </div>
              )}

              <div 
                className="absolute z-30 pointer-events-auto text-white text-5xl font-black italic tracking-tighter drop-shadow-2xl text-right w-48"
                style={{ bottom: hudSettings.ammoPos.y, right: hudSettings.ammoPos.x, transform: `scale(${hudSettings.buttonScale * hudSettings.hudScale})`, transformOrigin: 'bottom right' }}
              >
                  {isReloading ? <span className="text-blue-500 text-xl animate-pulse block">RELOADING</span> : (
                    stats.weaponName === 'MUSTANG & SALLY' ? 
                      `${Math.floor(stats.ammo / 100)}/${stats.ammo % 100}` : 
                      `${stats.ammo}/${WEAPONS[stats.weaponName].clip}`
                  )}
              </div>
              
              {customGameConfig.gameMode !== 'dead_ops' && (
                <button 
                  onTouchStart={(e) => { e.stopPropagation(); handleJumpOrSlide(); }}
                  className="absolute z-40 pointer-events-auto w-20 h-20 bg-emerald-700/80 active:bg-emerald-500 rounded-full flex flex-col items-center justify-center border-4 border-white/40 shadow-xl active:scale-95 transition-all backdrop-blur-md"
                  style={{ bottom: hudSettings.jumpPos.y, right: hudSettings.jumpPos.x, transform: `scale(${hudSettings.buttonScale * hudSettings.hudScale})`, transformOrigin: 'bottom right' }}
                >
                  {isSprinting ? <SlideIcon className="text-white w-8 h-8" /> : <ArrowUp className="text-white w-8 h-8" />}
                  <span className="text-[8px] font-black text-white mt-1 uppercase tracking-widest">{isSprinting ? 'Slide' : 'Jump'}</span>
                </button>
              )}

              <button 
                onTouchStart={(e) => { e.stopPropagation(); switchWeapon(); }} 
                disabled={!stats.secondaryWeaponName}
                className={`absolute z-40 pointer-events-auto w-20 h-20 ${stats.secondaryWeaponName ? 'bg-indigo-700/80 active:bg-indigo-500' : 'bg-gray-800/40 opacity-50'} rounded-full flex flex-col items-center justify-center border-4 border-white/40 shadow-xl active:scale-95 transition-all backdrop-blur-md`}
                style={{ bottom: hudSettings.switchPos.y, right: hudSettings.switchPos.x, transform: `scale(${hudSettings.buttonScale * hudSettings.hudScale})`, transformOrigin: 'bottom right' }}
              >
                <RefreshCw className="text-white w-8 h-8" />
                <span className="text-[8px] font-black text-white mt-1 uppercase tracking-widest">Switch</span>
              </button>

              {customGameConfig.gameMode !== 'dead_ops' && (
                <button 
                  onTouchStart={(e) => { e.stopPropagation(); knifeRequest.current = true; }} 
                  onTouchEnd={(e) => { e.stopPropagation(); knifeRequest.current = false; }} 
                  className="absolute z-40 pointer-events-auto w-20 h-20 bg-orange-700/80 active:bg-orange-500 rounded-full flex items-center justify-center border-4 border-white/40 shadow-xl active:scale-95 transition-all backdrop-blur-md"
                  style={{ bottom: hudSettings.knifePos.y, right: hudSettings.knifePos.x, transform: `scale(${hudSettings.buttonScale * hudSettings.hudScale})`, transformOrigin: 'bottom right' }}
                >
                  <Swords className="text-white w-10 h-10" />
                </button>
              )}

              <button 
                className={`fire-btn absolute z-40 pointer-events-auto w-28 h-28 ${customGameConfig.gameMode === 'dead_ops' ? 'hidden' : 'bg-red-700/80 active:bg-red-500'} rounded-full flex items-center justify-center border-4 border-white/40 shadow-[0_0_40px_rgba(185,28,28,0.4)] active:scale-95 transition-all backdrop-blur-md touch-none`}
                style={{ bottom: hudSettings.shootPos.y, right: hudSettings.shootPos.x, transform: `scale(${hudSettings.buttonScale * hudSettings.hudScale})`, transformOrigin: 'bottom right' }}
                onTouchStart={() => { phoneShootRequest.current = true; }}
                onTouchEnd={() => { phoneShootRequest.current = false; }}
              >
                <Target className="text-white w-14 h-14 pointer-events-none" />
              </button>

              {customGameConfig.gameMode === 'dead_ops' && (
                <button 
                  onTouchStart={(e) => { e.stopPropagation(); slideRequest.current = true; setIsSprinting(true); }}
                  onTouchEnd={(e) => { e.stopPropagation(); slideRequest.current = false; setIsSprinting(false); }}
                  className="absolute z-40 pointer-events-auto w-20 h-20 bg-blue-700/80 active:bg-blue-500 rounded-full flex flex-col items-center justify-center border-4 border-white/40 shadow-xl active:scale-95 transition-all backdrop-blur-md"
                  style={{ bottom: hudSettings.shootPos.y, right: hudSettings.shootPos.x, transform: `scale(${hudSettings.buttonScale * hudSettings.hudScale})`, transformOrigin: 'bottom right' }}
                >
                  <SlideIcon className="text-white w-8 h-8" />
                  <span className="text-[8px] font-black text-white mt-1 uppercase tracking-widest">Slide</span>
                </button>
              )}

              {customGameConfig.gameMode !== 'dead_ops' && (
                <button 
                  onTouchStart={(e) => { e.stopPropagation(); handleReload(); }} 
                  className="absolute z-40 pointer-events-auto w-16 h-16 bg-blue-700/80 active:bg-blue-500 rounded-full flex items-center justify-center border-4 border-white/40 shadow-xl active:scale-90 transition-all backdrop-blur-md"
                  style={{ bottom: hudSettings.reloadPos.y, right: hudSettings.reloadPos.x, transform: `scale(${hudSettings.buttonScale * hudSettings.hudScale})`, transformOrigin: 'bottom right' }}
                >
                  <RefreshCw className="text-white w-8 h-8" />
                </button>
              )}
            </>
          )}

          {status === GameStatus.PLAYING && showCrosshair && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <div className="w-6 h-6 relative flex items-center justify-center">
                <div className="absolute w-[2px] h-4 bg-white/40" />
                <div className="absolute h-[2px] w-4 bg-white/40" />
                {hitmarker > 0 && (
                  <div className="absolute w-8 h-8 flex items-center justify-center animate-in zoom-in duration-100">
                    <div className="absolute w-[2px] h-4 bg-white rotate-45 translate-x-3 translate-y-3" />
                    <div className="absolute w-[2px] h-4 bg-white -rotate-45 -translate-x-3 translate-y-3" />
                    <div className="absolute w-[2px] h-4 bg-white rotate-45 -translate-x-3 -translate-y-3" />
                    <div className="absolute w-[2px] h-4 bg-white -rotate-45 translate-x-3 -translate-y-3" />
                  </div>
                )}
              </div>
            </div>
          )}




          {status === GameStatus.PAUSED && !showPauseSettings && !showModMenu && !showProgressMenu && (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-black/70 backdrop-blur-sm p-8 overflow-y-auto">
               <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in duration-300 my-auto py-8">
                  <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase drop-shadow-2xl">PAUSED</h2>
                  {isCustomGameSession && (
                    <div className="text-xl font-bold text-purple-400 uppercase tracking-widest mb-4">
                      Playing as: {customGameConfig.playerName}
                    </div>
                  )}
                  <div className="space-y-4">
                    <button 
                      onClick={togglePause} 
                      className={`w-full py-6 bg-red-700 text-white font-black text-3xl rounded-sm shadow-2xl active:scale-95 transition-all uppercase italic tracking-tighter flex items-center justify-center gap-4 ${selectedMenuIndex === 0 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                    >
                      <Play size={32} /> Resume
                    </button>
                    <button 
                      onClick={() => setShowProgressMenu(true)} 
                      className={`w-full py-4 bg-white/10 text-white font-black text-xl rounded-sm shadow-2xl active:scale-95 transition-all uppercase italic tracking-tighter border border-white/20 flex items-center justify-center gap-3 ${selectedMenuIndex === 1 ? 'ring-2 ring-white bg-white/20' : ''}`}
                    >
                      <Trophy size={24} /> In Game Progress
                    </button>
                    <button 
                      onMouseDown={handleSettingsPressStart}
                      onTouchStart={handleSettingsPressStart}
                      onMouseUp={handleSettingsPressEnd}
                      onTouchEnd={handleSettingsPressEnd}
                      onMouseLeave={handleSettingsPressEnd}
                      onClick={(e) => {
                        if (modMenuTriggered.current) {
                          modMenuTriggered.current = false;
                          e.stopPropagation();
                          return;
                        }
                        setShowPauseSettings(true);
                      }}
                      className={`w-full py-4 bg-white/10 text-white font-black text-xl rounded-sm shadow-2xl active:scale-95 transition-all uppercase italic tracking-tighter border border-white/20 flex items-center justify-center gap-3 ${selectedMenuIndex === 2 ? 'ring-2 ring-white bg-white/20' : ''}`}
                    >
                      <Gauge size={24} /> Settings
                    </button>
                    {isCustomGameSession && (
                      <button 
                        onClick={() => {
                          setModMenuType('limited');
                          setShowModMenu(true);
                        }}
                        className={`w-full py-4 bg-emerald-900/50 text-emerald-400 font-black text-xl rounded-sm shadow-2xl active:scale-95 transition-all uppercase italic tracking-tighter border border-emerald-500/30 flex items-center justify-center gap-3 ${selectedMenuIndex === 3 ? 'ring-2 ring-white bg-white/20' : ''}`}
                      >
                        <Shield size={24} /> Mod Menu
                      </button>
                    )}
                    <button 
                      onClick={() => setShowControlsMenu(true)} 
                      className={`w-full py-4 bg-white/10 text-white font-black text-xl rounded-sm shadow-2xl active:scale-95 transition-all uppercase italic tracking-tighter border border-white/20 flex items-center justify-center gap-3 ${selectedMenuIndex === (isCustomGameSession ? 4 : 3) ? 'ring-2 ring-white bg-white/20' : ''}`}
                    >
                      <Gamepad size={24} /> Controls
                    </button>
                    <button 
                      onClick={fullRestart} 
                      className={`w-full py-4 bg-white/10 text-white font-black text-xl rounded-sm shadow-2xl active:scale-95 transition-all uppercase italic tracking-tighter border border-white/20 flex items-center justify-center gap-3 ${selectedMenuIndex === (isCustomGameSession ? 5 : 4) ? 'ring-2 ring-white bg-white/20' : ''}`}
                    >
                      <LogOut size={24} /> Quit Game
                    </button>
                  </div>
               </div>
            </div>
          )}

          {/* Real-time Scoreboard (Tab) */}
          {showScoreboard && status === GameStatus.PLAYING && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none">
              <div className="bg-black/80 border border-white/10 rounded-sm p-6 max-w-4xl w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-150">
                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                  <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">SCOREBOARD</h2>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-white/40 text-[10px] uppercase font-black tracking-widest">Round</span>
                      <span className="text-xl text-white font-black italic">{stats.round}</span>
                    </div>
                    <div className="w-[1px] h-8 bg-white/10" />
                    <div className="flex flex-col items-end">
                      <span className="text-white/40 text-[10px] uppercase font-black tracking-widest">Time</span>
                      <span className="text-xl text-white font-black italic">{formatTime(stats.time)}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-white/50 text-[10px] uppercase font-bold tracking-widest border-b border-white/10">
                        <th className="p-3">Player</th>
                        <th className="p-3 text-center">Lvl</th>
                        {customGameConfig.gameMode === 'dead_ops' && <th className="p-3 text-center text-purple-400">Gems</th>}
                        <th className="p-3 text-right">Score</th>
                        <th className="p-3 text-center">Kills</th>
                        <th className="p-3 text-center text-red-400">Downs</th>
                        <th className="p-3 text-center text-emerald-400">Revives</th>
                        <th className="p-3 text-center text-orange-400">HS</th>
                        <th className="p-3 text-right">Ping</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-bold text-white">
                      {/* Local Player Row */}
                      <tr className="bg-white/10 border-b border-white/5">
                        <td className="p-3 flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-emerald-400 font-black text-sm">{isCustomGameSession ? customGameConfig.playerName : "Player"}</span>
                           {stats.isReviving && <span className="text-[10px] bg-emerald-600 text-white px-1 rounded animate-pulse">REVIVING</span>}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {getPrestigeIcon(progression.prestige, 12)}
                            <span className="text-yellow-400 font-black italic">{getLevelData(progression.xp).level}</span>
                          </div>
                        </td>
                        {customGameConfig.gameMode === 'dead_ops' && <td className="p-3 text-center font-mono text-purple-400">{stats.gems || 0}</td>}
                        <td className="p-3 text-right text-yellow-400 font-mono text-sm">{stats.points}</td>
                        <td className="p-3 text-center font-mono">{stats.kills}</td>
                        <td className="p-3 text-center font-mono text-red-400">{stats.downs || 0}</td>
                        <td className="p-3 text-center font-mono text-emerald-400">{stats.revives || 0}</td>
                        <td className="p-3 text-center font-mono text-orange-400">{stats.headshots}</td>
                        <td className="p-3 text-right font-mono text-green-400">0</td>
                      </tr>
                      
                      {/* Other Players / Bots */}
                      {otherPlayers.map(player => (
                        <tr key={player.id} className="border-b border-white/5 bg-black/20">
                          <td className="p-3 flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${player.isBot ? 'bg-purple-500' : 'bg-blue-500'}`} />
                            <span className={`${player.isBot ? 'text-purple-400' : 'text-blue-400'} font-medium text-sm`}>{player.name}</span>
                            {player.isDowned && <span className="text-[10px] bg-red-600 text-white px-1 rounded animate-pulse">DOWN</span>}
                            {player.isReviving && <span className="text-[10px] bg-emerald-600 text-white px-1 rounded animate-pulse ml-1">REVIVING</span>}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {player.prestige !== undefined ? getPrestigeIcon(player.prestige, 12) : null}
                              <span className="text-yellow-400/60 font-black italic">{player.level !== undefined ? player.level : '-'}</span>
                            </div>
                          </td>
                          {customGameConfig.gameMode === 'dead_ops' && <td className="p-3 text-center font-mono text-purple-400">{player.gems || 0}</td>}
                          <td className="p-3 text-right text-white/60 font-mono text-sm">{player.points}</td>
                          <td className="p-3 text-center text-white/60 font-mono">{player.kills}</td>
                          <td className="p-3 text-center text-red-400/60 font-mono">{player.downs || 0}</td>
                          <td className="p-3 text-center text-emerald-400/60 font-mono">{player.revives || 0}</td>
                          <td className="p-3 text-center text-orange-400/60 font-mono">{player.headshots || 0}</td>
                          <td className={`p-3 text-right font-mono ${player.ping < 50 ? 'text-green-400' : player.ping < 100 ? 'text-yellow-400' : 'text-red-400'}`}>{player.ping || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {status === GameStatus.PAUSED && showProgressMenu && (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-black/80 backdrop-blur-md overflow-y-auto p-4 sm:p-8">
               <div className="max-w-md w-full text-center space-y-6 animate-in zoom-in duration-300 my-auto py-12">
                  <div className="flex items-center justify-between mb-4">
                    <button id="menu-item-0" onClick={() => setShowProgressMenu(false)} className={`p-2 text-white/50 hover:text-white transition-colors ${selectedMenuIndex === 0 ? 'ring-2 ring-white bg-white/20 rounded-full' : ''}`}>
                      <ChevronLeft size={32} />
                    </button>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">PROGRESS</h2>
                    <div className="w-10" />
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-sm p-8 space-y-6 shadow-2xl">
                    <div className="flex flex-col items-center">
                      <span className="text-white/40 text-sm uppercase font-black tracking-widest mb-1">Time Elapsed</span>
                      <span className="text-4xl text-white font-black italic">{formatTime(stats.time)}</span>
                    </div>
                    
                    <div className="h-[1px] bg-white/10 w-full" />
                    
                    {/* Detailed Scoreboard */}
                    <div className="flex items-center justify-between mb-2 px-2">
                       <span className="text-white/40 text-[10px] uppercase font-black tracking-widest">Total Team Kills</span>
                       <span className="text-emerald-400 font-black italic text-xl">{stats.kills + otherPlayers.reduce((sum, p) => sum + p.kills, 0)}</span>
                    </div>
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="text-white/50 text-[10px] uppercase font-bold tracking-widest border-b border-white/10">
                            <th className="p-3">Player</th>
                            <th className="p-3 text-center">Lvl</th>
                            {customGameConfig.gameMode === 'dead_ops' && <th className="p-3 text-center text-purple-400">Gems</th>}
                            <th className="p-3 text-right">Score</th>
                            <th className="p-3 text-center" title="Kills">Kills</th>
                            <th className="p-3 text-center text-red-400" title="Downs">Downs</th>
                            <th className="p-3 text-center text-emerald-400" title="Revives">Revives</th>
                            <th className="p-3 text-center text-orange-400" title="Headshots">Headshots</th>
                            <th className="p-3 text-center text-blue-400" title="Knife Kills">Knife</th>
                            <th className="p-3 text-center text-purple-400" title="Equipment Kills">Equip</th>
                            <th className="p-3 text-right">Ping</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs font-bold text-white">
                          {/* Local Player Row */}
                          <tr className="bg-white/10 border-b border-white/5">
                            <td className="p-3 flex items-center gap-3">
                               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                               <span className="text-emerald-400 font-black text-sm">{isCustomGameSession ? customGameConfig.playerName : "Player"}</span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {getPrestigeIcon(progression.prestige, 12)}
                                <span className="text-yellow-400 font-black italic">{getLevelData(progression.xp).level}</span>
                              </div>
                            </td>
                            {customGameConfig.gameMode === 'dead_ops' && <td className="p-3 text-center font-mono text-purple-400">{stats.gems || 0}</td>}
                            <td className="p-3 text-right text-yellow-400 font-mono text-sm">{stats.points}</td>
                            <td className="p-3 text-center font-mono">{stats.kills}</td>
                            <td className="p-3 text-center font-mono text-red-400">{stats.downs || 0}</td>
                            <td className="p-3 text-center font-mono text-emerald-400">{stats.revives || 0}</td>
                            <td className="p-3 text-center font-mono text-orange-400">{stats.headshots}</td>
                            <td className="p-3 text-center font-mono text-blue-400">{stats.knifeKills}</td>
                            <td className="p-3 text-center font-mono text-purple-400">{stats.equipmentKills}</td>
                            <td className="p-3 text-right font-mono text-green-400">0</td>
                          </tr>
                          
                          {/* Other Players / Bots */}
                          {otherPlayers.map(player => (
                            <tr key={player.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="p-3 flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${player.isBot ? 'bg-purple-500' : 'bg-blue-500'}`} />
                                <span className={`${player.isBot ? 'text-purple-400' : 'text-blue-400'} font-medium text-sm`}>{player.name}</span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {player.prestige !== undefined ? getPrestigeIcon(player.prestige, 12) : null}
                                  <span className="text-yellow-400/60 font-black italic">{player.level !== undefined ? player.level : '-'}</span>
                                </div>
                              </td>
                              {customGameConfig.gameMode === 'dead_ops' && <td className="p-3 text-center font-mono text-purple-400">{player.gems || 0}</td>}
                              <td className="p-3 text-right text-white/60 font-mono text-sm">{player.points}</td>
                              <td className="p-3 text-center text-white/60 font-mono">{player.kills}</td>
                              <td className="p-3 text-center text-red-400/60 font-mono">{player.downs || 0}</td>
                              <td className="p-3 text-center text-emerald-400/60 font-mono">{player.revives || 0}</td>
                              <td className="p-3 text-center text-orange-400/60 font-mono">{player.headshots || 0}</td>
                              <td className="p-3 text-center text-blue-400/60 font-mono">{player.knifeKills || 0}</td>
                              <td className="p-3 text-center text-purple-400/60 font-mono">{player.equipmentKills || 0}</td>
                              <td className={`p-3 text-right font-mono ${player.ping < 50 ? 'text-green-400' : player.ping < 100 ? 'text-yellow-400' : 'text-red-400'}`}>{player.ping || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="h-[1px] bg-white/10 w-full" />
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between bg-black/40 p-3 rounded-sm border border-white/5">
                        <span className="text-white/60 text-xs uppercase font-black tracking-widest">Dragon Hearts</span>
                        <span className={`text-sm font-black italic ${collectedHearts.filter(Boolean).length === 3 ? 'text-emerald-500' : 'text-yellow-500'}`}>
                          {collectedHearts.filter(Boolean).length} / 3
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-black/40 p-3 rounded-sm border border-white/5">
                        <span className="text-white/60 text-xs uppercase font-black tracking-widest">Red9 Easter Egg</span>
                        <span className={`text-sm font-black italic ${red9BlessingClaimed ? 'text-emerald-500' : 'text-red-500'}`}>
                          {red9BlessingClaimed ? 'DONE' : 'NOT DONE'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-black/40 p-3 rounded-sm border border-white/5">
                        <span className="text-white/60 text-xs uppercase font-black tracking-widest">Mystery Box Easter Egg</span>
                        <span className={`text-sm font-black italic ${easterEggTriggered ? 'text-emerald-500' : 'text-red-500'}`}>
                          {easterEggTriggered ? 'DONE' : 'NOT DONE'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-black/40 p-3 rounded-sm border border-white/5">
                        <span className="text-white/60 text-xs uppercase font-black tracking-widest">Dragon Boss</span>
                        <span className={`text-sm font-black italic ${bossDefeated ? 'text-emerald-500' : 'text-red-500'}`}>
                          {bossDefeated ? 'DEFEATED' : 'NOT DEFEATED'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button id="menu-item-1" onClick={() => setShowProgressMenu(false)} className={`w-full py-4 bg-white/10 text-white font-black text-xl rounded-sm shadow-2xl active:scale-95 transition-all uppercase italic tracking-tighter border border-white/20 flex items-center justify-center gap-3 ${selectedMenuIndex === 1 ? 'ring-2 ring-white bg-white/20' : ''}`}>
                    <ChevronLeft size={24} /> Back
                  </button>
               </div>
            </div>
          )}

          {status === GameStatus.PAUSED && showControlsMenu && (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-black/80 backdrop-blur-md overflow-y-auto p-4 sm:p-8">
               <div className="max-w-md w-full text-center space-y-6 animate-in zoom-in duration-300 my-auto py-12">
                  <div className="flex items-center justify-between mb-4">
                    <button id="menu-item-0" onClick={() => setShowControlsMenu(false)} className={`p-2 text-white/50 hover:text-white transition-colors ${selectedMenuIndex === 0 ? 'ring-2 ring-white bg-white/20 rounded-full' : ''}`}>
                      <ChevronLeft size={32} />
                    </button>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">CONTROLS</h2>
                    <div className="w-10" />
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white/5 p-6 rounded-sm border border-white/10">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-center gap-2">
                        <Gamepad size={24} /> Controller
                      </h3>
                      <button id="menu-item-1" className={`w-full py-4 ${controllerConnected ? 'bg-emerald-600/80' : 'bg-blue-600/80'} text-white font-black text-lg rounded-sm shadow-lg active:scale-95 transition-all uppercase italic tracking-tighter flex items-center justify-center gap-3 mb-2 ${selectedMenuIndex === 1 ? 'ring-2 ring-white scale-105' : ''}`}>
                        <Bluetooth size={20} /> {controllerConnected ? 'Controller Connected' : 'Connect Xbox Controller'}
                      </button>
                      <p className="text-white/40 text-xs uppercase tracking-widest mb-4">{controllerConnected ? 'Ready to play' : 'Bluetooth pairing handled by OS'}</p>
                      
                      <div className="space-y-4 mb-6">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/60">
                            <span>Sensitivity X</span>
                            <span>{gamepadSettings.sensitivityX.toFixed(1)}</span>
                          </div>
                          <input 
                            id="menu-item-2"
                            type="range" min="0.1" max="5.0" step="0.1" 
                            value={gamepadSettings.sensitivityX} 
                            onChange={(e) => setGamepadSettings(prev => ({ ...prev, sensitivityX: parseFloat(e.target.value) }))}
                            className={`w-full accent-blue-600 ${selectedMenuIndex === 2 ? 'ring-2 ring-white rounded-sm' : ''}`}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/60">
                            <span>Sensitivity Y</span>
                            <span>{gamepadSettings.sensitivityY.toFixed(1)}</span>
                          </div>
                          <input 
                            id="menu-item-3"
                            type="range" min="0.1" max="5.0" step="0.1" 
                            value={gamepadSettings.sensitivityY} 
                            onChange={(e) => setGamepadSettings(prev => ({ ...prev, sensitivityY: parseFloat(e.target.value) }))}
                            className={`w-full accent-blue-600 ${selectedMenuIndex === 3 ? 'ring-2 ring-white rounded-sm' : ''}`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-left text-sm font-mono text-white/70">
                        {Object.entries(gamepadSettings).filter(([k]) => !k.startsWith('sensitivity')).map(([action, btnIndex], idx) => (
                          <React.Fragment key={action}>
                            <div className="text-white/50 uppercase text-xs flex items-center">{action.replace(/([A-Z])/g, ' $1').trim()}</div>
                            <button 
                              id={`menu-item-${idx + 4}`}
                              onClick={() => setIsBindingGamepad(action)}
                              className={`bg-white/5 p-2 rounded text-center hover:bg-white/10 transition-colors w-full ${selectedMenuIndex === idx + 4 ? 'ring-2 ring-white bg-white/20' : ''}`}
                            >
                              {isBindingGamepad === action ? '...' : `Button ${btnIndex}`}
                            </button>
                          </React.Fragment>
                        ))}
                      </div>
                      {isBindingGamepad && (
                        <div className="mt-4 text-center text-yellow-400 font-bold animate-pulse text-sm uppercase tracking-widest">
                          Press any button to bind for "{isBindingGamepad.replace(/([A-Z])/g, ' $1').trim()}"
                        </div>
                      )}
                      <button id={`menu-item-${Object.keys(gamepadSettings).filter(k => !k.startsWith('sensitivity')).length + 4}`} onClick={() => setGamepadSettings(INITIAL_GAMEPAD_SETTINGS)} className={`w-full mt-4 py-2 bg-red-600/80 text-white font-black text-sm rounded-sm shadow-lg active:scale-95 transition-all uppercase italic tracking-tighter flex items-center justify-center gap-3 ${selectedMenuIndex === Object.keys(gamepadSettings).filter(k => !k.startsWith('sensitivity')).length + 4 ? 'ring-2 ring-white scale-105' : ''}`}>
                        <RotateCcw size={16} /> Reset Gamepad
                      </button>
                    </div>

                    <div className="bg-white/5 p-6 rounded-sm border border-white/10">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-center gap-2">
                        <Keyboard size={24} /> PC Controls
                      </h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-left text-sm font-mono text-white/70">
                        {Object.entries(keybindSettings).map(([action, key], idx) => {
                          const gamepadKeysCount = Object.keys(gamepadSettings).filter(k => !k.startsWith('sensitivity')).length;
                          const itemIdx = idx + gamepadKeysCount + 5;
                          return (
                          <React.Fragment key={action}>
                            <div className="text-white/50 uppercase text-xs flex items-center">{action.replace(/([A-Z])/g, ' $1').trim()}</div>
                            <button 
                              id={`menu-item-${itemIdx}`}
                              onClick={() => setIsBinding(action)}
                              className={`bg-white/5 p-2 rounded text-center hover:bg-white/10 transition-colors w-full ${selectedMenuIndex === itemIdx ? 'ring-2 ring-white bg-white/20' : ''}`}
                            >
                              {isBinding === action ? '...' : String(key).toUpperCase()}
                            </button>
                          </React.Fragment>
                        )})}
                      </div>
                      {isBinding && (
                        <div className="mt-4 text-center text-yellow-400 font-bold animate-pulse text-sm uppercase tracking-widest">
                          Press any key to bind for "{isBinding.replace(/([A-Z])/g, ' $1').trim()}"
                        </div>
                      )}
                      <button id={`menu-item-${Object.keys(gamepadSettings).filter(k => !k.startsWith('sensitivity')).length + Object.keys(keybindSettings).length + 5}`} onClick={() => setKeybindSettings(INITIAL_KEYBIND_SETTINGS)} className={`w-full mt-4 py-2 bg-red-600/80 text-white font-black text-sm rounded-sm shadow-lg active:scale-95 transition-all uppercase italic tracking-tighter flex items-center justify-center gap-3 ${selectedMenuIndex === Object.keys(gamepadSettings).filter(k => !k.startsWith('sensitivity')).length + Object.keys(keybindSettings).length + 5 ? 'ring-2 ring-white scale-105' : ''}`}>
                        <RotateCcw size={16} /> Reset PC Controls
                      </button>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </>
      )}
          {(status === GameStatus.PAUSED || status === GameStatus.CUSTOM_GAME) && showModMenu && (
            <div className="absolute inset-0 z-[130] flex flex-col items-center bg-black/80 backdrop-blur-md overflow-y-auto p-4 sm:p-8 mod-menu-container" onTouchStart={(e) => e.stopPropagation()}>
               <div className="max-w-md w-full text-center space-y-6 animate-in zoom-in duration-300 my-auto py-12">
                  <div className="flex items-center justify-between mb-4">
                    <button id="menu-item-0" onClick={() => setShowModMenu(false)} className={`p-2 text-white/50 hover:text-white transition-colors ${selectedMenuIndex === 0 ? 'ring-2 ring-white bg-white/20 rounded-full' : ''}`}>
                      <ChevronLeft size={32} />
                    </button>
                    <h2 className="text-4xl font-black text-emerald-500 italic tracking-tighter uppercase">MOD MENU</h2>
                    <div className="w-10" />
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      id="menu-item-0"
                      onClick={(e) => { e.stopPropagation(); setGodMode(!godMode); }} 
                      className={`w-full py-4 ${godMode ? 'bg-emerald-600' : 'bg-white/10'} text-white font-black text-xl rounded-sm shadow-2xl active:scale-95 transition-all uppercase italic tracking-tighter border border-white/20 flex items-center justify-center gap-3 ${selectedMenuIndex === 0 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                    >
                      <Shield size={24} /> God Mode: {godMode ? 'ON' : 'OFF'}
                    </button>

                    {modMenuType === 'full' && (
                      <div className="flex gap-2">
                        <button 
                          id="menu-item-1"
                          onClick={(e) => { e.stopPropagation(); handleStatsUpdate({ points: 10000 }); }} 
                          className={`flex-1 py-4 bg-white/10 text-white font-black text-lg rounded-sm shadow-2xl active:scale-95 transition-all uppercase italic tracking-tighter border border-white/20 flex items-center justify-center gap-2 ${selectedMenuIndex === 1 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                        >
                          <Database size={20} /> +10k Pts
                        </button>
                        <button 
                          id="menu-item-2"
                          onClick={(e) => { e.stopPropagation(); setStats(prev => ({ ...prev, points: 500, totalPoints: 500 })); handleStatsUpdate({ points: 0 }); }} 
                          className={`flex-1 py-4 bg-red-900/20 text-red-500 font-black text-lg rounded-sm shadow-2xl active:scale-95 transition-all uppercase italic tracking-tighter border border-red-900/30 flex items-center justify-center gap-2 ${selectedMenuIndex === 2 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                        >
                          <RotateCcw size={20} /> Reset Pts
                        </button>
                      </div>
                    )}

                    {modMenuType === 'full' && (
                      <div className="flex gap-2">
                        <button 
                          id="menu-item-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            setKillAllZombies(true);
                            setTeleportTarget(null); // Explicitly clear any pending teleport
                            setShowModMenu(false);
                            if (status === GameStatus.PAUSED) setStatus(GameStatus.PLAYING);
                          }} 
                          className={`flex-1 py-4 bg-red-900/40 text-red-500 font-black text-lg rounded-sm shadow-2xl active:scale-95 transition-all uppercase italic tracking-tighter border border-red-900/50 flex items-center justify-center gap-2 ${selectedMenuIndex === 3 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                        >
                          <Skull size={20} /> Kill All
                        </button>
                        <button 
                          id="menu-item-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTeleportZombiesToMe(true);
                            setTeleportTarget(null); // Explicitly clear any pending teleport
                            setShowModMenu(false);
                            if (status === GameStatus.PAUSED) setStatus(GameStatus.PLAYING);
                          }} 
                          className={`flex-1 py-4 bg-purple-900/40 text-purple-500 font-black text-lg rounded-sm shadow-2xl active:scale-95 transition-all uppercase italic tracking-tighter border border-purple-900/50 flex items-center justify-center gap-2 ${selectedMenuIndex === 4 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                        >
                          <Target size={20} /> TP Zombies
                        </button>
                      </div>
                    )}

                    <button 
                      id="menu-item-5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDragonActive(true);
                        setDragonHealth(250000);
                        setShowModMenu(false);
                        if (status === GameStatus.PAUSED) setStatus(GameStatus.PLAYING);
                      }} 
                      className={`w-full py-4 bg-red-900/40 text-red-500 font-black text-xl rounded-sm shadow-2xl active:scale-95 transition-all uppercase italic tracking-tighter border border-red-900/50 flex items-center justify-center gap-3 ${selectedMenuIndex === 5 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                    >
                      <Skull size={24} /> Start Boss Fight
                    </button>

                    {modMenuType === 'full' && (
                      <button 
                        id="menu-item-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDragonDefeated();
                          setShowModMenu(false);
                          if (status === GameStatus.PAUSED) setStatus(GameStatus.PLAYING);
                        }} 
                        className={`w-full py-4 bg-orange-900/40 text-orange-500 font-black text-xl rounded-sm shadow-2xl active:scale-95 transition-all uppercase italic tracking-tighter border border-orange-900/50 flex items-center justify-center gap-3 ${selectedMenuIndex === 6 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                      >
                        <Flame size={24} /> Kill Boss
                      </button>
                    )}

                    <button 
                      id="menu-item-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStats(prev => ({ ...prev, hasBowie: true }));
                      }} 
                      className={`w-full py-4 bg-blue-900/40 text-blue-500 font-black text-xl rounded-sm shadow-2xl active:scale-95 transition-all uppercase italic tracking-tighter border border-blue-900/50 flex items-center justify-center gap-3 ${selectedMenuIndex === 7 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                    >
                      <Swords size={24} /> Give Bowie Knife
                    </button>

                    {modMenuType === 'full' && (
                      <div className="pt-4 border-t border-white/10">
                        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-3 text-left">Level Manager</h3>
                        <div className="flex gap-2 mb-4">
                          <button 
                            id="menu-item-8"
                            onClick={(e) => { e.stopPropagation(); handleLevelDown(); }}
                            className={`flex-1 py-3 bg-white/10 text-white font-black text-lg rounded-sm border border-white/20 flex items-center justify-center gap-2 active:scale-95 transition-all ${selectedMenuIndex === 8 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                          >
                            <ChevronDown size={20} /> Level Down
                          </button>
                          <button 
                            id="menu-item-9"
                            onClick={(e) => { e.stopPropagation(); handleLevelUp(); }}
                            className={`flex-1 py-3 bg-emerald-600/20 text-emerald-500 font-black text-lg rounded-sm border border-emerald-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all ${selectedMenuIndex === 9 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                          >
                            <ChevronUp size={20} /> Level Up
                          </button>
                        </div>
                      </div>
                    )}

                    {modMenuType === 'full' && (
                      <div className="pt-4 border-t border-white/10">
                        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-3 text-left">Weapon Level Manager</h3>
                        <div className="flex gap-2 mb-4">
                          <button 
                            id="menu-item-30"
                            onClick={(e) => { e.stopPropagation(); handleResetWeaponLevel(); }}
                            className={`flex-1 py-3 bg-white/10 text-white font-black text-lg rounded-sm border border-white/20 flex items-center justify-center gap-2 active:scale-95 transition-all ${selectedMenuIndex === 30 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                          >
                            <ChevronDown size={20} /> Reset Level
                          </button>
                          <button 
                            id="menu-item-31"
                            onClick={(e) => { e.stopPropagation(); handleMaxWeaponLevel(); }}
                            className={`flex-1 py-3 bg-emerald-600/20 text-emerald-500 font-black text-lg rounded-sm border border-emerald-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all ${selectedMenuIndex === 31 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                          >
                            <ChevronUp size={20} /> Max Level
                          </button>
                        </div>
                        <div className="text-center text-xs text-white/40 uppercase tracking-widest mb-2">
                           Current: {stats.weaponName}
                        </div>
                      </div>
                    )}

                    {modMenuType === 'full' && (
                      <div className="pt-4 border-t border-white/10">
                        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-3 text-left">Prestige Manager</h3>
                        <div className="grid grid-cols-5 gap-2 mb-4">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p, i) => (
                            <button
                              key={p}
                              id={`menu-item-${10 + i}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setProgression((prev) => {
                                  const newP = { ...prev, prestige: p };
                                  localStorage.setItem('ztown_progression', JSON.stringify(newP));
                                  return newP;
                                });
                              }}
                              className={`aspect-square flex flex-col items-center justify-center bg-black/40 border ${
                                progression.prestige === p
                                  ? "border-yellow-500 bg-yellow-500/20"
                                  : "border-white/10 hover:bg-white/10"
                              } rounded-sm transition-all active:scale-95 ${selectedMenuIndex === 10 + i ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                            >
                              {getPrestigeIcon(p, 24)}
                              <span className="text-[10px] font-bold text-white/60 mt-1">{p}</span>
                            </button>
                          ))}
                        </div>
                        <button
                          id="menu-item-20"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
                              const newP = { xp: 0, prestige: 0, stars: 0, achievements: [] };
                              setProgression(newP);
                              localStorage.setItem('ztown_progression', JSON.stringify(newP));
                            }
                          }}
                          className={`w-full py-3 bg-red-950/50 text-red-500 font-black text-sm rounded-sm border border-red-900/50 hover:bg-red-900/50 transition-all uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 ${selectedMenuIndex === 20 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                        >
                          <Trash2 size={16} /> Reset All Progress
                        </button>
                      </div>
                    )}

                    <div className="pt-4 border-t border-white/10">
                      <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-3 text-left">Powerups</h3>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <button 
                          id="menu-item-21"
                          onClick={(e) => { e.stopPropagation(); handlePowerUp('MAX_AMMO'); }}
                          className={`py-3 bg-green-900/40 text-green-500 font-black text-sm rounded-sm border border-green-900/50 hover:bg-green-900/50 transition-all uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 ${selectedMenuIndex === 21 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                        >
                          Max Ammo
                        </button>
                        <button 
                          id="menu-item-22"
                          onClick={(e) => { e.stopPropagation(); handlePowerUp('INSTA_KILL'); }}
                          className={`py-3 bg-red-900/40 text-red-500 font-black text-sm rounded-sm border border-red-900/50 hover:bg-red-900/50 transition-all uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 ${selectedMenuIndex === 22 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                        >
                          Insta-Kill
                        </button>
                        <button 
                          id="menu-item-23"
                          onClick={(e) => { e.stopPropagation(); handlePowerUp('DOUBLE_POINTS'); }}
                          className={`py-3 bg-yellow-900/40 text-yellow-500 font-black text-sm rounded-sm border border-yellow-900/50 hover:bg-yellow-900/50 transition-all uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 ${selectedMenuIndex === 23 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                        >
                          Double Points
                        </button>
                        <button 
                          id="menu-item-24"
                          onClick={(e) => { e.stopPropagation(); handlePowerUp('NUKE'); }}
                          className={`py-3 bg-orange-900/40 text-orange-500 font-black text-sm rounded-sm border border-orange-900/50 hover:bg-orange-900/50 transition-all uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 ${selectedMenuIndex === 24 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                        >
                          Nuke
                        </button>
                         <button 
                          id="menu-item-25"
                          onClick={(e) => { e.stopPropagation(); handlePowerUp('DEATH_MACHINE'); }}
                          className={`py-3 bg-cyan-900/40 text-cyan-500 font-black text-sm rounded-sm border border-cyan-900/50 hover:bg-cyan-900/50 transition-all uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 ${selectedMenuIndex === 25 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                        >
                          Death Machine
                        </button>
                         <button 
                          id="menu-item-26"
                          onClick={(e) => { e.stopPropagation(); handlePowerUp('FIRE_SALE'); }}
                          className={`py-3 bg-orange-600/40 text-orange-300 font-black text-sm rounded-sm border border-orange-600/50 hover:bg-orange-600/50 transition-all uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 ${selectedMenuIndex === 26 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                        >
                          Fire Sale
                        </button>
                         <button 
                          id="menu-item-27"
                          onClick={(e) => { e.stopPropagation(); handlePowerUp('ZOMBIE_BLOOD'); }}
                          className={`py-3 bg-red-950/40 text-red-300 font-black text-sm rounded-sm border border-red-950/50 hover:bg-red-950/50 transition-all uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 ${selectedMenuIndex === 27 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                        >
                          Zombie Blood
                        </button>
                        <button 
                          id="menu-item-28"
                          onClick={(e) => { e.stopPropagation(); handlePowerUp('SKIP_ROUND'); }}
                          className={`py-3 bg-purple-900/40 text-purple-500 font-black text-sm rounded-sm border border-purple-900/50 hover:bg-purple-900/50 transition-all uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 ${selectedMenuIndex === 28 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                        >
                          <Timer size={14} /> Skip Round
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-3 text-left">Zombie Spawner</h3>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {(['normal', 'runner', 'tank', 'inferno', 'parasite', 'crawler', 'brute'] as ZombieType[]).map((type, i) => (
                          <button 
                            key={type}
                            id={`zombie-spawn-${type}`}
                            onClick={(e) => { e.stopPropagation(); setSpawnZombieType(type); }}
                            className={`py-3 bg-purple-900/40 text-purple-400 font-black text-[10px] rounded-sm border border-purple-900/50 hover:bg-purple-900/50 transition-all uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95`}
                          >
                            Spawn {type}
                          </button>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-white/5">
                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 text-left">Change All Current Zombies</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {(['normal', 'runner', 'tank', 'inferno', 'parasite', 'crawler', 'brute'] as ZombieType[]).map((type, i) => (
                            <button 
                              key={`change-${type}`}
                              onClick={(e) => { e.stopPropagation(); setChangeAllZombiesType(type); }}
                              className={`py-2 bg-emerald-900/40 text-emerald-400 font-black text-[10px] rounded-sm border border-emerald-900/50 hover:bg-emerald-900/50 transition-all uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95`}
                            >
                              All to {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-3 text-left">Players ({otherPlayers.length})</h3>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                        {otherPlayers.map((player, i) => (
                          <div key={player.id} className="flex items-center justify-between bg-white/5 p-2 rounded-sm border border-white/10">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${player.isBot ? 'bg-purple-500' : 'bg-blue-500'}`} />
                              <span className="text-white font-bold text-xs uppercase">{player.name}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTeleportToPlayerId(player.id);
                                  setShowModMenu(false);
                                  if (status === GameStatus.PAUSED) setStatus(GameStatus.PLAYING);
                                }}
                                className="px-2 py-1 bg-blue-600/40 text-blue-400 border border-blue-600/50 rounded-sm text-[10px] font-black uppercase hover:bg-blue-600/60 transition-all"
                              >
                                TP To
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (player.isBot) {
                                    setTeleportPlayerToMeId(player.id);
                                  } else {
                                    socket?.emit('admin_teleport', {
                                      targetId: player.id,
                                      position: { x: playerPosRef.current.x, y: playerPosRef.current.y, z: playerPosRef.current.z }
                                    });
                                  }
                                  setShowModMenu(false);
                                  if (status === GameStatus.PAUSED) setStatus(GameStatus.PLAYING);
                                }}
                                className="px-2 py-1 bg-orange-600/40 text-orange-400 border border-orange-600/50 rounded-sm text-[10px] font-black uppercase hover:bg-orange-600/60 transition-all"
                              >
                                Bring Here
                              </button>
                            </div>
                          </div>
                        ))}
                        {otherPlayers.length === 0 && (
                          <div className="text-white/30 text-xs italic text-center py-2">No other players found</div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-3 text-left">Teleport Locations</h3>
                      <div className={status === GameStatus.CUSTOM_GAME ? "grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1" : "grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1"}>
                        {[
                          { name: 'Spawn', pos: [0, 1.2, 15], color: 'bg-blue-600/40 text-blue-400 border-blue-600/50' },
                          { name: 'Juggernog', pos: [-25, 1.2, -15], color: 'bg-red-600/40 text-red-400 border-red-600/50' },
                          { name: 'Speed Cola', pos: [25, 1.2, 5], color: 'bg-emerald-600/40 text-emerald-400 border-emerald-600/50' },
                          { name: 'Stamin-Up', pos: [-35, 1.2, 35], color: 'bg-yellow-600/40 text-yellow-400 border-yellow-600/50' },
                          { name: 'Double Tap', pos: [35, 1.2, -35], color: 'bg-orange-600/40 text-orange-400 border-orange-600/50' },
                          { name: 'Mule Kick', pos: [0, 1.2, -45], color: 'bg-indigo-600/40 text-indigo-400 border-indigo-600/50' },
                          { name: 'PHD Flopper', pos: [82, 1.2, 85], color: 'bg-purple-600/40 text-purple-400 border-purple-600/50' },
                          { name: 'Deadshot', pos: [-75, 1.2, -70], color: 'bg-gray-600/40 text-gray-400 border-gray-600/50' },
                          { name: 'Electric Cherry', pos: [75, 1.2, -75], color: 'bg-cyan-600/40 text-cyan-400 border-cyan-600/50' },
                          { name: 'Quick Revive', pos: [-85, 1.2, 75], color: 'bg-blue-500/40 text-blue-300 border-blue-500/50' },
                          { name: 'Vulture Aid', pos: [85, 1.2, 25], color: 'bg-lime-600/40 text-lime-400 border-lime-600/50' },
                          { name: 'Widow\'s Wine', pos: [-50, 1.2, 0], color: 'bg-pink-600/40 text-pink-400 border-pink-600/50' },
                          { name: 'Slider Wine', pos: [50, 1.2, 0], color: 'bg-orange-500/40 text-orange-300 border-orange-500/50' },
                          { name: 'Winter\'s Wail', pos: [-70, 1.2, -70], color: 'bg-blue-300/40 text-blue-200 border-blue-300/50' },
                          { name: 'Dying Wish', pos: [-80, 1.2, 75], color: 'bg-red-500/40 text-red-300 border-red-500/50' },
                          { name: 'Ethereal Razor', pos: [70, 1.2, -75], color: 'bg-purple-500/40 text-purple-300 border-purple-500/50' },
                          { name: 'Timeslip', pos: [-30, 1.2, 35], color: 'bg-cyan-400/40 text-cyan-200 border-cyan-400/50' },
                          { name: 'Bandolier', pos: [20, 1.2, 5], color: 'bg-orange-400/40 text-orange-200 border-orange-400/50' },
                          { name: 'Tortoise', pos: [-20, 1.2, -15], color: 'bg-emerald-500/40 text-emerald-300 border-emerald-500/50' },
                          { name: 'Blaze Phase', pos: [5, 1.2, -45], color: 'bg-orange-700/40 text-orange-500 border-orange-700/50' },
                          { name: 'Stone Cold Stronghold', pos: (() => {
                            const pos = MAPS.find(m => m.id === stats.activeMapId)?.interactables.find(i => i.id === 'stronghold')?.pos;
                            return pos ? [pos[0], 1.2, pos[2]] : [0, 1.2, 0];
                          })(), color: 'bg-purple-700/40 text-purple-500 border-purple-700/50' },
                          { name: 'Blood Wolf Bite', pos: (() => {
                            const pos = MAPS.find(m => m.id === stats.activeMapId)?.interactables.find(i => i.id === 'blood')?.pos;
                            return pos ? [pos[0], 1.2, pos[2]] : [0, 1.2, 0];
                          })(), color: 'bg-red-800/40 text-red-600 border-red-800/50' },
                          { name: 'Elemental Pop', pos: (() => {
                            const pos = MAPS.find(m => m.id === stats.activeMapId)?.interactables.find(i => i.id === 'elemental')?.pos;
                            return pos ? [pos[0], 1.2, pos[2]] : [0, 1.2, 0];
                          })(), color: 'bg-pink-500/40 text-pink-300 border-pink-500/50' },
                          { name: 'Pack-A-Punch', pos: [88, 1.2, 85], color: 'bg-cyan-500/40 text-cyan-300 border-cyan-500/50' },
                          { name: 'Mystery Box', pos: [0, 1.2, 0], color: 'bg-yellow-500/40 text-yellow-300 border-yellow-500/50' },
                          { name: 'MP5 Wallbuy', pos: [20, 1.2, 20], color: 'bg-stone-600/40 text-stone-400 border-stone-600/50' },
                          { name: 'M14 Wallbuy', pos: [-30, 1.2, 48], color: 'bg-stone-600/40 text-stone-400 border-stone-600/50' },
                          { name: 'Olympia Wallbuy', pos: [30, 1.2, -25], color: 'bg-stone-600/40 text-stone-400 border-stone-600/50' },
                          { name: 'AK-47 Wallbuy', pos: [-70, 1.2, -50], color: 'bg-stone-600/40 text-stone-400 border-stone-600/50' },
                          { name: 'Galil Wallbuy', pos: [70, 1.2, -58], color: 'bg-stone-600/40 text-stone-400 border-stone-600/50' },
                          { name: 'Bowie Knife', pos: stats.activeMapId === 'bunker' ? [18, 1.2, 5] : [-54, 1.2, 8], color: 'bg-stone-700/40 text-stone-300 border-stone-700/50' },
                          { name: 'Gravestone', pos: stats.activeMapId === 'bunker' ? [-55, 1.2, 0] : [115, 1.2, 0], color: 'bg-stone-800/40 text-stone-500 border-stone-800/50' },
                          // Dragon Hearts
                          ...heartPositions.map((pos, i) => ({ name: `Dragon Heart ${i+1}`, pos: [pos.x, pos.y, pos.z], color: 'bg-red-900/40 text-red-500 border-red-900/50' })),
                          { name: 'Crafting Table', pos: MAPS.find(m => m.id === stats.activeMapId)?.craftingTablePos || [0, 1.2, 90], color: 'bg-orange-800/40 text-orange-500 border-orange-800/50' },
                          { name: 'Buyable Ending', pos: (() => {
                            const pos = MAPS.find(m => m.id === stats.activeMapId)?.interactables.find(i => i.id === 'buyableEnding')?.pos;
                            return pos ? [pos[0], 1.2, pos[2]] : [0, 1.2, 0];
                          })(), color: 'bg-green-800/40 text-green-500 border-green-800/50' }
                        ].map((loc, i) => (
                          <button
                            key={i}
                            id={`menu-item-${21 + i}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setTeleportTarget(new THREE.Vector3(...loc.pos));
                              setShowModMenu(false);
                              if (status === GameStatus.PAUSED) setStatus(GameStatus.PLAYING);
                            }}
                            className={`py-3 px-2 ${loc.color || 'bg-white/10 text-white/60 border-white/20'} border rounded-sm text-xs font-black uppercase italic tracking-tighter active:scale-95 hover:brightness-125 transition-all flex items-center justify-center gap-2 shadow-lg ${selectedMenuIndex === 21 + i ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                          >
                            <MapIcon size={14} /> {loc.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-3 text-left">Equipment</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          id={`menu-item-${21 + teleportCount}`}
                          onClick={() => setStats(prev => ({ ...prev, grenades: prev.grenades + 2 }))} 
                          className={`py-4 bg-green-900/40 text-green-500 font-black text-sm rounded-sm border border-green-900/50 uppercase italic tracking-tighter active:scale-95 transition-all flex flex-col items-center gap-2 shadow-xl hover:bg-green-900/60 ${selectedMenuIndex === 21 + teleportCount ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                        >
                          <Bomb size={20} /> +2 Grenades
                        </button>
                        <button 
                          id={`menu-item-${21 + teleportCount + 1}`}
                          onClick={() => setStats(prev => ({ ...prev, flashbangs: prev.flashbangs + 2 }))} 
                          className={`py-4 bg-yellow-900/40 text-yellow-500 font-black text-sm rounded-sm border border-yellow-900/50 uppercase italic tracking-tighter active:scale-95 transition-all flex flex-col items-center gap-2 shadow-xl hover:bg-yellow-900/60 ${selectedMenuIndex === 21 + teleportCount + 1 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                        >
                          <Sun size={20} /> +2 Flash
                        </button>
                        <button 
                          id={`menu-item-${21 + teleportCount + 2}`}
                          onClick={() => setStats(prev => ({ ...prev, monkeyBombs: prev.monkeyBombs + 3 }))} 
                          className={`py-4 bg-cyan-900/40 text-cyan-500 font-black text-sm rounded-sm border border-cyan-900/50 uppercase italic tracking-tighter active:scale-95 transition-all flex flex-col items-center gap-2 shadow-xl hover:bg-cyan-900/60 ${selectedMenuIndex === 21 + teleportCount + 2 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                        >
                          <BoxIcon size={20} /> +3 Monkey
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-3 text-left">Individual Perks</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'jugg', name: 'Juggernog', icon: Heart, color: 'text-red-500', bg: 'bg-red-900/40 border-red-900/50' },
                          { id: 'speed', name: 'Speed Cola', icon: RefreshCw, color: 'text-emerald-500', bg: 'bg-emerald-900/40 border-emerald-900/50' },
                          { id: 'stamin', name: 'Stamin-Up', icon: Wind, color: 'text-yellow-500', bg: 'bg-yellow-900/40 border-yellow-900/50' },
                          { id: 'double', name: 'Double Tap', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-900/40 border-orange-900/50' },
                          { id: 'mule', name: 'Mule Kick', icon: ShoppingCart, color: 'text-indigo-500', bg: 'bg-indigo-900/40 border-indigo-900/50' },
                          { id: 'phd', name: 'PHD Flopper', icon: Bomb, color: 'text-purple-500', bg: 'bg-purple-900/40 border-purple-900/50' },
                          { id: 'deadshot', name: 'Deadshot', icon: Crosshair, color: 'text-gray-400', bg: 'bg-gray-800/40 border-gray-800/50' },
                          { id: 'electric', name: 'Electric Cherry', icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-900/40 border-cyan-900/50' },
                          { id: 'revive', name: 'Quick Revive', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-900/40 border-blue-900/50' },
                          { id: 'vulture', name: 'Vulture Aid', icon: Database, color: 'text-lime-500', bg: 'bg-lime-900/40 border-lime-900/50' },
                          { id: 'widow', name: 'Widow\'s Wine', icon: Swords, color: 'text-pink-600', bg: 'bg-pink-900/40 border-pink-900/50' },
                          { id: 'slider', name: 'Slider Wine', icon: SlideIcon, color: 'text-orange-400', bg: 'bg-orange-800/40 border-orange-800/50' },
                          { id: 'winter', name: 'Winter\'s Wail', icon: Snowflake, color: 'text-blue-200', bg: 'bg-blue-800/40 border-blue-800/50' },
                          { id: 'dying', name: 'Dying Wish', icon: Flame, color: 'text-red-600', bg: 'bg-red-950/40 border-red-950/50' },
                          { id: 'razor', name: 'Ethereal Razor', icon: Scissors, color: 'text-purple-400', bg: 'bg-purple-800/40 border-purple-800/50' },
                          { id: 'timeslip', name: 'Timeslip', icon: Hourglass, color: 'text-cyan-300', bg: 'bg-cyan-800/40 border-cyan-800/50' },
                          { id: 'bandolier', name: 'Bandolier Bandit', icon: Database, color: 'text-orange-400', bg: 'bg-orange-700/40 border-orange-700/50' },
                          { id: 'tortoise', name: 'Victorious Tortoise', icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-800/40 border-emerald-800/50' },
                          { id: 'blaze', name: 'Blaze Phase', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-950/40 border-orange-950/50' },
                          { id: 'stronghold', name: 'Stone Cold', icon: Shield, color: 'text-purple-500', bg: 'bg-purple-950/40 border-purple-950/50' },
                          { id: 'blood', name: 'Blood Wolf', icon: Swords, color: 'text-red-700', bg: 'bg-red-950/40 border-red-950/50' },
                          { id: 'elemental', name: 'Elemental Pop', icon: Zap, color: 'text-pink-500', bg: 'bg-pink-800/40 border-pink-800/50' },
                        ].map((perk, i) => (
                          <button
                            key={perk.id}
                            id={`menu-item-${21 + teleportCount + 3 + i}`}
                            onClick={() => setStats(prev => {
                              const hasPerk = prev.perks.includes(perk.id);
                              const newPerks = hasPerk ? prev.perks.filter(p => p !== perk.id) : [...prev.perks, perk.id];
                              
                              const hasJugg = newPerks.includes('jugg');
                              const hasTortoise = newPerks.includes('tortoise');
                              let newMaxHp = hasJugg ? 250 : 100;
                              if (hasTortoise) newMaxHp += 100;
                              
                              let nextState = { ...prev, perks: newPerks, maxHp: newMaxHp, hp: Math.min(prev.hp, newMaxHp) };
                              if (perk.id === 'mule' && hasPerk && prev.tertiaryWeaponName !== null) {
                                if (nextState.activeSlot === 0) {
                                  // We lose Weapon 2 (tertiaryWeaponName)
                                  nextState.tertiaryWeaponName = null;
                                  nextState.tertiaryAmmo = 0;
                                  nextState.tertiaryMaxAmmo = 0;
                                  nextState.tertiaryWeaponTier = 1;
                                } else if (nextState.activeSlot === 1) {
                                  // We lose Weapon 2 (secondaryWeaponName)
                                  nextState.secondaryWeaponName = prev.tertiaryWeaponName;
                                  nextState.secondaryAmmo = prev.tertiaryAmmo;
                                  nextState.secondaryMaxAmmo = prev.tertiaryMaxAmmo;
                                  nextState.secondaryWeaponTier = prev.tertiaryWeaponTier;
                                  
                                  nextState.tertiaryWeaponName = null;
                                  nextState.tertiaryAmmo = 0;
                                  nextState.tertiaryMaxAmmo = 0;
                                  nextState.tertiaryWeaponTier = 1;
                                  
                                  nextState.activeSlot = 0; // Reset to 0 to keep it simple, or keep it 1?
                                  // If we keep it 1, then activeSlot is 1, but we only have 2 weapons.
                                  // Wait, if we have 2 weapons, activeSlot can be 0 or 1.
                                  // If we were at slot 1, and we lost slot 2, we are still at slot 1.
                                  // But wait, if activeSlot is 1, weaponName is Weapon 1.
                                  // secondaryWeaponName is Weapon 0.
                                  // So if we just shift tertiary to secondary, we are fine.
                                } else if (nextState.activeSlot === 2) {
                                  // We lose Weapon 2 (weaponName)
                                  nextState.weaponName = prev.secondaryWeaponName!;
                                  nextState.ammo = prev.secondaryAmmo;
                                  nextState.maxAmmo = prev.secondaryMaxAmmo;
                                  nextState.weaponTier = prev.secondaryWeaponTier;
                                  
                                  nextState.secondaryWeaponName = prev.tertiaryWeaponName!;
                                  nextState.secondaryAmmo = prev.tertiaryAmmo;
                                  nextState.secondaryMaxAmmo = prev.tertiaryMaxAmmo;
                                  nextState.secondaryWeaponTier = prev.tertiaryWeaponTier;
                                  
                                  nextState.tertiaryWeaponName = null;
                                  nextState.tertiaryAmmo = 0;
                                  nextState.tertiaryMaxAmmo = 0;
                                  nextState.tertiaryWeaponTier = 1;
                                  
                                  nextState.activeSlot = 0;
                                }
                              }
                              return nextState;
                            })}
                            className={`py-3 px-3 rounded-sm border transition-all flex items-center gap-3 text-sm font-black uppercase italic tracking-tighter shadow-lg ${
                              stats.perks.includes(perk.id) 
                                ? `${perk.bg} text-white ring-2 ring-white/50` 
                                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                            } ${selectedMenuIndex === 40 + heartPositions.length + i ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                          >
                            <perk.icon size={20} className={stats.perks.includes(perk.id) ? perk.color : ''} />
                            {perk.name}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button 
                          id={`menu-item-${21 + teleportCount + 3 + 22}`}
                          onClick={() => setStats(prev => ({ ...prev, perks: ['jugg', 'speed', 'stamin', 'double', 'mule', 'phd', 'deadshot', 'electric', 'revive', 'vulture', 'widow', 'slider', 'winter', 'dying', 'razor', 'timeslip', 'bandolier', 'tortoise', 'blaze', 'stronghold', 'blood', 'elemental'], maxHp: 350, hp: 350 }))} 
                          className={`flex-1 py-2 bg-emerald-600/20 text-emerald-500 font-black text-xs rounded-sm border border-emerald-600/30 uppercase italic tracking-tighter ${selectedMenuIndex === 21 + teleportCount + 3 + 22 ? 'ring-2 ring-white bg-white/20 z-10' : ''}`}
                        >
                          All Perks
                        </button>
                        <button 
                          id={`menu-item-${21 + teleportCount + 3 + 23}`}
                          onClick={() => setStats(prev => {
                            let nextState = { ...prev, perks: [], maxHp: 100, hp: Math.min(prev.hp, 100) };
                            if (prev.perks.includes('mule') && prev.tertiaryWeaponName !== null) {
                              if (nextState.activeSlot === 0) {
                                nextState.tertiaryWeaponName = null;
                                nextState.tertiaryAmmo = 0;
                                nextState.tertiaryMaxAmmo = 0;
                                nextState.tertiaryWeaponTier = 1;
                              } else if (nextState.activeSlot === 1) {
                                nextState.secondaryWeaponName = prev.tertiaryWeaponName;
                                nextState.secondaryAmmo = prev.tertiaryAmmo;
                                nextState.secondaryMaxAmmo = prev.tertiaryMaxAmmo;
                                nextState.secondaryWeaponTier = prev.tertiaryWeaponTier;
                                nextState.tertiaryWeaponName = null;
                                nextState.tertiaryAmmo = 0;
                                nextState.tertiaryMaxAmmo = 0;
                                nextState.tertiaryWeaponTier = 1;
                              } else if (nextState.activeSlot === 2) {
                                nextState.weaponName = prev.secondaryWeaponName!;
                                nextState.ammo = prev.secondaryAmmo;
                                nextState.maxAmmo = prev.secondaryMaxAmmo;
                                nextState.weaponTier = prev.secondaryWeaponTier;
                                nextState.secondaryWeaponName = prev.tertiaryWeaponName!;
                                nextState.secondaryAmmo = prev.tertiaryAmmo;
                                nextState.secondaryMaxAmmo = prev.tertiaryMaxAmmo;
                                nextState.secondaryWeaponTier = prev.tertiaryWeaponTier;
                                nextState.tertiaryWeaponName = null;
                                nextState.tertiaryAmmo = 0;
                                nextState.tertiaryMaxAmmo = 0;
                                nextState.tertiaryWeaponTier = 1;
                                nextState.activeSlot = 0;
                              }
                            }
                            return nextState;
                          })} 
                          className={`flex-1 py-2 bg-red-900/20 text-red-500 font-black text-xs rounded-sm border border-red-900/30 uppercase italic tracking-tighter ${selectedMenuIndex === 21 + teleportCount + 3 + 23 ? 'ring-2 ring-white bg-white/20 z-10' : ''}`}
                        >
                          Clear Perks
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest text-left">Weapons</h3>
                        <button
                          id={`menu-item-${21 + teleportCount + 3 + 24}`}
                          onClick={() => {
                            const papName = PAP_MAPPING[stats.weaponName];
                            if (papName) {
                              soundService.playPerk();
                              setStats(prev => ({
                                ...prev,
                                weaponName: papName,
                                ammo: WEAPONS[papName].clip,
                                maxAmmo: WEAPONS[papName].max,
                                weaponTier: 2
                              }));
                            }
                          }}
                          className={`px-3 py-1 bg-cyan-600/20 text-cyan-400 border border-cyan-600/30 rounded-sm text-[10px] font-black uppercase italic tracking-tighter active:scale-95 transition-all flex items-center gap-1 ${selectedMenuIndex === 21 + teleportCount + 3 + 24 ? 'ring-2 ring-white bg-white/20 z-10' : ''}`}
                        >
                          <PapIcon size={12} /> Pack-A-Punch Current
                        </button>
                      </div>
                      <div className={status === GameStatus.CUSTOM_GAME ? "grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1" : "grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1"}>
                        {Object.keys(WEAPONS).map((wName, i) => {
                          const isPap = isPapWeapon(wName);
                          const isWonder = isWonderWeapon(wName);
                          const isCustomGame = status === GameStatus.CUSTOM_GAME;

                          return (
                          <button
                            key={wName}
                            id={`menu-item-${21 + teleportCount + 3 + 25 + i}`}
                            onClick={() => {
                              soundService.playPerk();
                              setStats(prev => ({
                                ...prev,
                                weaponName: wName,
                                ammo: WEAPONS[wName].clip,
                                maxAmmo: WEAPONS[wName].max,
                                weaponTier: isPap ? 2 : 1
                              }));
                            }}
                            className={isCustomGame ? `relative aspect-video rounded-sm border-2 transition-all flex flex-col items-center justify-center shadow-lg overflow-hidden group ${
                              stats.weaponName === wName 
                                ? 'bg-emerald-900/40 border-emerald-500 ring-2 ring-emerald-500/50 scale-105 z-10' 
                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30'
                            } ${selectedMenuIndex === 21 + teleportCount + 3 + 25 + i ? 'ring-4 ring-white scale-105 z-10' : ''}` : `py-3 px-2 rounded-sm border transition-all flex items-center justify-center text-xs font-black uppercase italic tracking-tighter text-center h-12 shadow-lg ${
                              stats.weaponName === wName 
                                ? 'bg-emerald-600 text-white ring-2 ring-white/50 scale-105 z-10' 
                                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                            } ${selectedMenuIndex === 21 + teleportCount + 3 + 25 + i ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                          >
                            {isCustomGame ? (
                              <>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 pointer-events-none" />
                                <div className="w-full h-full p-2 flex items-center justify-center scale-75 group-hover:scale-90 transition-transform duration-300">
                                    <GunModel color={WEAPONS[wName].color} isPap={isPap} name={wName} />
                                </div>
                                <div className="absolute bottom-1 left-0 right-0 text-center z-20 px-1">
                                    <span className={`text-[8px] font-black uppercase italic tracking-widest truncate block ${stats.weaponName === wName ? 'text-emerald-400' : 'text-white/60'}`}>
                                        {wName}
                                    </span>
                                </div>
                                {isPap && (
                                    <div className="absolute top-1 right-1 z-20">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                                    </div>
                                )}
                                {isWonder && (
                                    <div className="absolute top-1 right-1 z-20">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                                    </div>
                                )}
                              </>
                            ) : (
                              wName
                            )}
                          </button>
                        )})}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-3 text-left">Weapon Camos</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {(['none', 'gold', 'diamond', 'dark_matter', 'cherry_blossom', 'dragon', 'ice', 'magma', 'nebula', 'red_hex', 'into_the_void', 'cosmic', 'spectrum'] as any[]).map((camo, i) => (
                          <button 
                            key={camo}
                            id={`menu-item-${21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + i}`}
                            onClick={() => {
                              soundService.playPerk();
                              setStats(prev => ({ ...prev, selectedCamo: camo }));
                            }}
                            className={`aspect-square rounded-sm border-2 transition-all flex items-center justify-center shadow-lg overflow-hidden relative group ${
                              stats.selectedCamo === camo 
                                ? 'border-white ring-2 ring-white/50 z-10 scale-105' 
                                : 'border-white/10 opacity-70 hover:opacity-100 hover:scale-105'
                            } ${selectedMenuIndex === 21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + i ? 'ring-4 ring-white scale-110 z-20' : ''}`}
                          >
                            <div className={`absolute inset-0 ${
                              camo === 'none' ? 'bg-stone-800' :
                              camo === 'gold' ? 'bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700' :
                              camo === 'diamond' ? 'bg-gradient-to-br from-cyan-300 via-blue-400 to-blue-600' :
                              camo === 'dark_matter' ? 'bg-gradient-to-br from-purple-900 via-fuchsia-900 to-black' :
                              camo === 'cherry_blossom' ? 'bg-gradient-to-br from-pink-200 via-pink-400 to-red-400' :
                              camo === 'dragon' ? 'bg-gradient-to-br from-red-600 via-orange-500 to-yellow-500' :
                              camo === 'ice' ? 'bg-gradient-to-br from-cyan-100 via-cyan-300 to-blue-500' :
                              camo === 'magma' ? 'bg-gradient-to-br from-orange-500 via-red-600 to-stone-900' :
                              camo === 'nebula' ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500' :
                              camo === 'red_hex' ? 'bg-gradient-to-br from-red-500 via-red-700 to-black' :
                              camo === 'into_the_void' ? 'bg-gradient-to-br from-violet-900 via-indigo-900 to-black' :
                              camo === 'cosmic' ? 'bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-800' :
                              camo === 'spectrum' ? 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500' :
                              'bg-gray-800'
                            }`} />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1 z-20">
                              <span className="text-[8px] font-black uppercase text-white/90 block truncate text-center">
                                {camo.replace(/_/g, ' ')}
                              </span>
                            </div>
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {status !== GameStatus.CUSTOM_GAME && (
                      <div className="pt-4 border-t border-white/10">
                        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-3 text-left">Power-Ups</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            id={`menu-item-${21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + 13}`}
                            onClick={() => handlePowerUp('INSTA_KILL')} 
                            className={`py-3 px-3 rounded-sm border transition-all flex items-center justify-center gap-2 text-xs font-black uppercase italic tracking-tighter ${
                              Date.now() < instaKillExpiry ? 'bg-red-600/20 border-red-600/40 text-red-500' : 'bg-white/5 border-white/10 text-white/40'
                            } ${selectedMenuIndex === 21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + 13 ? 'ring-2 ring-white bg-white/20 z-10' : ''}`}
                          >
                            <Skull size={14} /> Insta-Kill
                          </button>
                          <button 
                            id={`menu-item-${21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + 14}`}
                            onClick={() => handlePowerUp('DOUBLE_POINTS')} 
                            className={`py-3 px-3 rounded-sm border transition-all flex items-center justify-center gap-2 text-xs font-black uppercase italic tracking-tighter ${
                              Date.now() < doublePointsExpiry ? 'bg-yellow-600/20 border-yellow-600/40 text-yellow-500' : 'bg-white/5 border-white/10 text-white/40'
                            } ${selectedMenuIndex === 21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + 14 ? 'ring-2 ring-white bg-white/20 z-10' : ''}`}
                          >
                            <Database size={14} /> Double Pts
                          </button>
                          <button 
                            id={`menu-item-${21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + 15}`}
                            onClick={() => handlePowerUp('MAX_AMMO')} 
                            className={`py-3 px-3 bg-white/5 border border-white/10 text-white/40 rounded-sm flex items-center justify-center gap-2 text-xs font-black uppercase italic tracking-tighter active:bg-white/10 ${selectedMenuIndex === 21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + 15 ? 'ring-2 ring-white bg-white/20 z-10' : ''}`}
                          >
                            <RefreshCw size={14} /> Max Ammo
                          </button>
                          <button 
                            id={`menu-item-${21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + 16}`}
                            onClick={() => handlePowerUp('NUKE')} 
                            className={`py-3 px-3 bg-white/5 border border-white/10 text-white/40 rounded-sm flex items-center justify-center gap-2 text-xs font-black uppercase italic tracking-tighter active:bg-white/10 ${selectedMenuIndex === 21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + 16 ? 'ring-2 ring-white bg-white/20 z-10' : ''}`}
                          >
                            <Bomb size={14} /> Nuke
                          </button>
                          <button 
                            id={`menu-item-${21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + 17}`}
                            onClick={() => handlePowerUp('DEATH_MACHINE')} 
                            className={`py-3 px-3 rounded-sm border transition-all flex items-center justify-center gap-2 text-xs font-black uppercase italic tracking-tighter ${
                              Date.now() < deathMachineExpiry ? 'bg-cyan-600/20 border-cyan-600/40 text-cyan-500' : 'bg-white/5 border-white/10 text-white/40'
                            } ${selectedMenuIndex === 21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + 17 ? 'ring-2 ring-white bg-white/20 z-10' : ''}`}
                          >
                            <Skull size={14} /> Death Machine
                          </button>
                          <button 
                            id={`menu-item-${21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + 18}`}
                            onClick={() => handlePowerUp('FIRE_SALE')} 
                            className={`py-3 px-3 rounded-sm border transition-all flex items-center justify-center gap-2 text-xs font-black uppercase italic tracking-tighter ${
                              Date.now() < fireSaleExpiry ? 'bg-orange-600/20 border-orange-600/40 text-orange-500' : 'bg-white/5 border-white/10 text-white/40'
                            } ${selectedMenuIndex === 21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + 18 ? 'ring-2 ring-white bg-white/20 z-10' : ''}`}
                          >
                            <Flame size={14} /> Fire Sale
                          </button>
                          <button 
                            id={`menu-item-${21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + 19}`}
                            onClick={() => handlePowerUp('ZOMBIE_BLOOD')} 
                            className={`py-3 px-3 rounded-sm border transition-all flex items-center justify-center gap-2 text-xs font-black uppercase italic tracking-tighter ${
                              Date.now() < zombieBloodExpiry ? 'bg-red-900/20 border-red-900/40 text-red-500' : 'bg-white/5 border-white/10 text-white/40'
                            } ${selectedMenuIndex === 21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + 19 ? 'ring-2 ring-white bg-white/20 z-10' : ''}`}
                          >
                            <Droplet size={14} /> Zombie Blood
                          </button>
                          <button 
                            id={`menu-item-${21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + 20}`}
                            onClick={() => setStats(prev => ({ ...prev, round: prev.round + 1 }))} 
                            className={`py-3 px-3 bg-white/5 border border-white/10 text-white/40 rounded-sm flex items-center justify-center gap-2 text-xs font-black uppercase italic tracking-tighter active:bg-white/10 ${selectedMenuIndex === 21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + 20 ? 'ring-2 ring-white bg-white/20 z-10' : ''}`}
                          >
                            <TrendingUp size={14} /> Skip Round
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    id={`menu-item-${21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + 21}`}
                    onClick={() => setShowModMenu(false)} 
                    className={`w-full py-4 bg-emerald-600 text-white font-black text-xl rounded-sm shadow-2xl active:scale-95 transition-all uppercase italic tracking-tighter flex items-center justify-center gap-3 mt-4 ${selectedMenuIndex === 21 + teleportCount + 3 + 25 + Object.keys(WEAPONS).length + 21 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                  >
                    <Play size={24} /> Close Mod Menu
                  </button>
               </div>
            </div>
          )}

      {status === GameStatus.GAMEOVER && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center bg-black/90 backdrop-blur-md animate-in fade-in duration-1000 p-6 overflow-y-auto">
           <div className="absolute inset-0 bg-red-900/10 pointer-events-none mix-blend-multiply animate-pulse" />
           <div className="max-w-lg w-full text-center space-y-8 relative z-10 my-auto py-8">
              <div className="space-y-1">
                <div className="text-red-600 font-black italic uppercase tracking-widest text-lg drop-shadow-lg">Z-Town Red9&Spendawg</div>
                <p className="text-red-500 font-bold italic uppercase tracking-[0.2em] text-sm mt-4">You did not survive the town</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-8 rounded-sm shadow-2xl space-y-8">
                  {isCustomGameSession ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-2 px-2">
                         <span className="text-white/40 text-[10px] uppercase font-black tracking-widest">Final Team Kills</span>
                         <span className="text-emerald-400 font-black italic text-xl">{stats.kills + otherPlayers.reduce((sum, p) => sum + p.kills, 0)}</span>
                      </div>
                      <div className="w-full overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                          <thead>
                            <tr className="text-white/50 text-[10px] uppercase font-bold tracking-widest border-b border-white/10">
                              <th className="p-3">Player</th>
                              <th className="p-3 text-center">Lvl</th>
                              <th className="p-3 text-right">Score</th>
                              <th className="p-3 text-center">Kills</th>
                              <th className="p-3 text-center text-red-400">Downs</th>
                              <th className="p-3 text-center text-emerald-400">Revives</th>
                              <th className="p-3 text-center text-orange-400">HS</th>
                              <th className="p-3 text-center text-blue-400">Knife</th>
                              <th className="p-3 text-center text-purple-400">Equip</th>
                            </tr>
                          </thead>
                          <tbody className="text-xs font-bold text-white">
                            <tr className="bg-white/10 border-b border-white/5">
                              <td className="p-3 flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                 <span className="text-emerald-400 font-black">{customGameConfig.playerName}</span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {getPrestigeIcon(progression.prestige, 12)}
                                  <span className="text-yellow-400 font-black italic">{getLevelData(progression.xp).level}</span>
                                </div>
                              </td>
                              <td className="p-3 text-right text-yellow-400 font-mono">{stats.points}</td>
                              <td className="p-3 text-center font-mono">{stats.kills}</td>
                              <td className="p-3 text-center font-mono text-red-400">{stats.downs || 0}</td>
                              <td className="p-3 text-center font-mono text-emerald-400">{stats.revives || 0}</td>
                              <td className="p-3 text-center font-mono text-orange-400">{stats.headshots}</td>
                              <td className="p-3 text-center font-mono text-blue-400">{stats.knifeKills}</td>
                              <td className="p-3 text-center font-mono text-purple-400">{stats.equipmentKills}</td>
                            </tr>
                            {otherPlayers.map(player => (
                              <tr key={player.id} className="border-b border-white/5">
                                <td className="p-3 flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${player.isBot ? 'bg-purple-500' : 'bg-blue-500'}`} />
                                  <span className={`${player.isBot ? 'text-purple-400' : 'text-blue-400'} font-medium`}>{player.name}</span>
                                </td>
                                <td className="p-3 text-center text-white/30 font-mono">-</td>
                                <td className="p-3 text-right text-white/60 font-mono">{player.points}</td>
                                <td className="p-3 text-center text-white/60 font-mono">{player.kills}</td>
                                <td className="p-3 text-center text-red-400/60 font-mono">{player.downs || 0}</td>
                                <td className="p-3 text-center text-emerald-400/60 font-mono">{player.revives || 0}</td>
                                <td className="p-3 text-center text-orange-400/60 font-mono">{player.headshots || 0}</td>
                                <td className="p-3 text-center text-blue-400/60 font-mono">{player.knifeKills || 0}</td>
                                <td className="p-3 text-center text-purple-400/60 font-mono">{player.equipmentKills || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <div className="text-white/30 text-[10px] uppercase font-bold tracking-widest">Rounds</div>
                        <div className="text-4xl text-white font-black italic">{stats.round}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-white/30 text-[10px] uppercase font-bold tracking-widest">Kills</div>
                        <div className="text-4xl text-white font-black italic">{stats.kills}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-white/30 text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1"><Timer size={10} /> Time</div>
                        <div className="text-4xl text-white font-black italic">{formatTime(stats.time)}</div>
                      </div>
                    </div>
                  )}
                 <div className="h-[1px] bg-white/10 w-full" />
                 <div className="flex justify-between items-center px-4">
                    <span className="text-white/40 uppercase font-black text-xs">Score recorded for</span>
                    <span className="text-emerald-500 font-black text-xl italic">{nickname || 'Survivor'}</span>
                 </div>
              </div>
              <div className="flex flex-col gap-4">
                <button id="menu-item-0" onClick={() => startGame(false)} className={`w-full py-6 bg-red-800 text-white font-black text-3xl rounded-sm shadow-2xl active:scale-95 hover:bg-red-700 transition-all uppercase italic tracking-tighter border-b-4 border-red-950 flex items-center justify-center gap-4 ${selectedMenuIndex === 0 ? 'ring-4 ring-white scale-105 z-10' : ''}`}>
                   <RotateCcw size={28} /> Retry
                </button>
                <button id="menu-item-1" onClick={fullRestart} className={`w-full py-4 bg-white/10 text-white font-black text-xl rounded-sm shadow-2xl active:scale-95 hover:bg-white/20 transition-all uppercase italic tracking-tighter border border-white/10 flex items-center justify-center gap-3 ${selectedMenuIndex === 1 ? 'ring-2 ring-white bg-white/20' : ''}`}>
                   <RefreshCw size={20} /> Reload Game
                </button>
              </div>
           </div>
        </div>
      )}

      {status === GameStatus.LEADERBOARD && (
        <div className="absolute inset-0 z-[110] flex flex-col items-center bg-black/95 p-4 sm:p-6 overflow-hidden">
          <div className="max-w-4xl w-full h-full flex flex-col space-y-4 sm:space-y-8 animate-in slide-in-from-bottom duration-500 py-4 sm:py-8">
            <div className="flex items-center justify-between flex-shrink-0">
              <button id="menu-item-0" onClick={() => setStatus(GameStatus.START)} className={`p-3 bg-white/5 rounded-full text-white/60 active:scale-90 transition-all border border-white/10 ${selectedMenuIndex === 0 ? 'ring-2 ring-white bg-white/20' : ''}`}><ChevronLeft size={24} /></button>
              <h2 className="text-3xl sm:text-5xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2 sm:gap-4"><Trophy className="text-yellow-500 w-6 h-6 sm:w-10 sm:h-10" /> Hall of Fame</h2>
              <button id="menu-item-1" onClick={() => { if(confirm('Clear leaderboard?')) { setLeaderboard([]); localStorage.removeItem('ztown_leaderboard_v2'); } }} className={`p-3 bg-red-900/20 rounded-full text-red-500/60 active:scale-90 transition-all border border-red-900/20 ${selectedMenuIndex === 1 ? 'ring-2 ring-red-500 bg-red-900/40' : ''}`} style={{ display: 'none' }}><Trash2 size={24} /></button>
            </div>

            {/* Leaderboard Tabs */}
            <div className="flex gap-2 justify-center">
              <button 
                onClick={() => setLeaderboardTab('personal')}
                className={`px-6 py-2 rounded-sm font-black italic uppercase transition-all border ${leaderboardTab === 'personal' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
              >
                Top 10 (Personal)
              </button>
              <button 
                onClick={() => setLeaderboardTab('friends')}
                className={`px-6 py-2 rounded-sm font-black italic uppercase transition-all border ${leaderboardTab === 'friends' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
              >
                Friends Top 10
              </button>
              <button 
                onClick={() => {
                  setLeaderboardTab('world');
                  socket?.emit('get_leaderboard');
                }}
                className={`px-6 py-2 rounded-sm font-black italic uppercase transition-all border ${leaderboardTab === 'world' ? 'bg-purple-600 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
              >
                World's Top 100
              </button>
            </div>

            {/* Map Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 flex-shrink-0 no-scrollbar">
              {MAPS.map((map, idx) => (
                <button
                  key={map.id}
                  id={`menu-item-${idx + 2}`}
                  onClick={() => setLeaderboardMapId(map.id)}
                  className={`px-4 py-2 rounded-sm font-black italic uppercase text-xs transition-all whitespace-nowrap border ${
                    leaderboardMapId === map.id 
                      ? 'bg-white text-black border-white' 
                      : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                  } ${selectedMenuIndex === idx + 2 ? 'ring-2 ring-white scale-105' : ''}`}
                >
                  {map.name}
                </button>
              ))}
            </div>
            
            <div className="flex-grow overflow-auto bg-white/5 border border-white/10 rounded-sm shadow-2xl no-scrollbar">
              <div className="min-w-[1200px]">
                {/* Header */}
                <div className="grid grid-cols-[60px_minmax(150px,1fr)_80px_80px_100px_80px_80px_100px_80px_80px_80px_80px_80px] gap-4 p-4 border-b border-white/10 bg-white/5 sticky top-0 z-10">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Rank</span>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Nickname</span>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center">Prestige</span>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center">Level</span>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center">Date</span>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center">Time</span>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center">Round</span>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center">Score</span>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center">Kills</span>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center">Headshots</span>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center">Knife Kills</span>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center">Equip Kills</span>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center">Status</span>
                </div>

                {(() => {
                  const data = leaderboardTab === 'personal' ? leaderboard.filter(e => e.mapId === leaderboardMapId) : 
                               leaderboardTab === 'friends' ? [] : 
                               worldLeaderboard.filter(e => e.mapId === leaderboardMapId);
                  
                  if (leaderboardTab === 'friends') {
                    return (
                      <div className="p-12 text-center flex flex-col items-center justify-center gap-6">
                        <div className="text-white/30 italic mb-4 text-xl font-black uppercase tracking-widest">Log in to see your friends' scores</div>
                        <button className="px-8 py-4 bg-[#1877F2] text-white font-black italic uppercase tracking-widest rounded-sm shadow-xl active:scale-95 transition-all flex items-center gap-3 w-full max-w-md justify-center">
                          <UserPlus size={24} /> Log in with Facebook
                        </button>
                        <button className="px-8 py-4 bg-emerald-600 text-white font-black italic uppercase tracking-widest rounded-sm shadow-xl active:scale-95 transition-all flex items-center gap-3 w-full max-w-md justify-center mt-2">
                          <Users size={24} /> Connect Contacts
                        </button>
                        <button className="px-8 py-4 bg-white/10 text-white font-black italic uppercase tracking-widest rounded-sm shadow-xl active:scale-95 transition-all flex items-center gap-3 w-full max-w-md justify-center mt-2 border border-white/20">
                          <PlusCircle size={24} /> Add Friend Manually
                        </button>
                      </div>
                    );
                  }

                  if (data.length === 0) {
                    return <div className="p-12 text-center text-white/30 italic">No legends recorded for {MAPS.find(m => m.id === leaderboardMapId)?.name} yet.</div>;
                  }
                  return data.map((entry, idx) => (
                    <div 
                      key={idx} 
                      id={`menu-item-${idx + 2 + MAPS.length}`} 
                      className={`grid grid-cols-[60px_minmax(150px,1fr)_80px_80px_100px_80px_80px_100px_80px_80px_80px_80px_80px] gap-4 p-4 items-center border-b border-white/5 transition-all ${
                        selectedMenuIndex === idx + 2 + MAPS.length ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <span className={`text-xl font-black italic ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-orange-400' : 'text-white/20'}`}>#{idx + 1}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-white font-black italic tracking-tighter text-lg uppercase truncate">{entry.nickname || 'Anonymous'}</span>
                        {entry.prestigeMasterStars && entry.prestigeMasterStars > 0 && (
                          <div className="flex gap-0.5">
                            {Array.from({ length: entry.prestigeMasterStars }).map((_, i) => (
                              <Star key={i} className="text-yellow-400 w-2 h-2 fill-yellow-400" />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-center">
                        {entry.prestige !== undefined ? getPrestigeIcon(entry.prestige, 20) : <span className="text-white/10">-</span>}
                      </div>
                      <span className="text-yellow-400 font-black italic text-lg text-center">{entry.level || '-'}</span>
                      <span className="text-white/30 text-[9px] font-bold uppercase tracking-widest text-center">{new Date(entry.date).toLocaleDateString()}</span>
                      <span className="text-blue-400 font-black italic text-sm text-center">{formatTime(entry.time || 0)}</span>
                      <span className="text-red-500 font-black italic text-xl text-center">{entry.round}</span>
                      <span className="text-yellow-500 font-black italic text-xl text-center">{entry.kills * 100}</span>
                      <span className="text-orange-500 font-black italic text-xl text-center">{entry.kills}</span>
                      <span className="text-orange-500 font-black italic text-xl text-center">{entry.headshots || 0}</span>
                      <span className="text-blue-500 font-black italic text-xl text-center">{entry.knifeKills || 0}</span>
                      <span className="text-purple-500 font-black italic text-xl text-center">{entry.equipmentKills || 0}</span>
                      <div className="flex justify-center gap-1">
                        {entry.isBuyableEnding && (
                          <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-sm p-1" title="Buyable Ending">
                            <Trophy size={12} className="text-yellow-500" />
                          </div>
                        )}
                        {entry.bossDefeated && (
                          <div className="bg-red-900/40 border border-red-500/40 rounded-sm p-1" title="Boss Defeated">
                            <Flame size={12} className="text-red-500" />
                          </div>
                        )}
                        {entry.red9QuestCompleted && (
                          <div className="bg-blue-900/40 border border-blue-500/40 rounded-sm p-1" title="Red9 Quest Completed">
                            <Gem size={12} className="text-blue-400" />
                          </div>
                        )}
                        {entry.mainEasterEggCompleted && (
                          <div className="bg-purple-900/40 border border-purple-500/40 rounded-sm p-1" title="Main Easter Egg Completed">
                            <Egg size={12} className="text-purple-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {(status === GameStatus.SETTINGS || (status === GameStatus.PAUSED && showPauseSettings)) && (
        <div className="absolute inset-0 z-[110] flex flex-col items-center bg-black/95 p-6 overflow-y-auto">
          <div className="max-w-xl w-full space-y-8 animate-in slide-in-from-bottom duration-500 my-auto py-8">
            <div className="flex items-center justify-between">
              <button id="menu-item-0" onClick={() => status === GameStatus.PAUSED ? setShowPauseSettings(false) : setStatus(GameStatus.START)} className={`p-3 bg-white/5 rounded-full text-white/60 active:scale-90 transition-all border border-white/10 ${selectedMenuIndex === 0 ? 'ring-2 ring-white bg-white/20' : ''}`}><ChevronLeft size={24} /></button>
              <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4"><Gauge className="text-blue-500 w-10 h-10" /> Settings</h2>
              <div className="w-12" />
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-sm p-8 space-y-8">
               <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-white font-black italic tracking-tighter text-2xl uppercase">HUD Visibility</span>
                    <span className="text-white/30 text-xs font-bold uppercase tracking-widest">Toggle on-screen information and controls</span>
                  </div>
                  <button 
                    id="menu-item-1"
                    onClick={() => setHudMode(prev => prev === 'all' ? 'info' : prev === 'info' ? 'hidden' : 'all')}
                    className={`px-6 py-2 rounded-sm border-2 font-black italic uppercase transition-all ${
                      hudMode === 'all' ? 'bg-emerald-600 border-emerald-400 text-white' : 
                      hudMode === 'info' ? 'bg-blue-600 border-blue-400 text-white' : 
                      'bg-gray-800 border-gray-600 text-white/50'
                    } ${selectedMenuIndex === 1 ? 'ring-4 ring-white scale-110' : ''}`}
                  >
                    {hudMode === 'all' ? 'ALL' : hudMode === 'info' ? 'INFO ONLY' : 'HIDDEN'}
                  </button>
               </div>

               <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-white font-black italic tracking-tighter text-2xl uppercase">Crosshair</span>
                    <span className="text-white/30 text-xs font-bold uppercase tracking-widest">Toggle crosshair visibility</span>
                  </div>
                  <button 
                    id="menu-item-2"
                    onClick={() => setShowCrosshair(!showCrosshair)}
                    className={`px-6 py-2 rounded-sm border-2 font-black italic uppercase transition-all ${
                      showCrosshair ? 'bg-emerald-600 border-emerald-400 text-white' : 
                      'bg-red-600 border-red-400 text-white/50'
                    } ${selectedMenuIndex === 2 ? 'ring-4 ring-white scale-110' : ''}`}
                  >
                    {showCrosshair ? 'VISIBLE' : 'HIDDEN'}
                  </button>
               </div>

               <div className="h-[1px] bg-white/10 w-full" />

               <div className="space-y-6">
                  <span className="text-white/40 uppercase font-black text-xs tracking-[0.3em]">Weapon Camo</span>
                  <div className="grid grid-cols-4 gap-2">
                    {(['none', 'gold', 'diamond', 'dark_matter', 'cherry_blossom', 'dragon', 'ice', 'magma', 'nebula', 'red_hex', 'into_the_void', 'cosmic', 'spectrum'] as const).map((camo, idx) => (
                      <button
                        key={camo}
                        id={`menu-item-${idx + 3}`}
                        onClick={() => setStats(prev => ({ ...prev, selectedCamo: camo }))}
                        className={`relative aspect-square rounded-sm border-2 transition-all overflow-hidden group ${
                          stats.selectedCamo === camo 
                            ? 'border-yellow-500 ring-2 ring-yellow-500/50 scale-105 z-10' 
                            : 'border-white/10 opacity-60 hover:opacity-100 hover:scale-105'
                        } ${selectedMenuIndex === idx + 3 ? 'ring-4 ring-white scale-110 z-20 opacity-100' : ''}`}
                        title={camo.replace('_', ' ').toUpperCase()}
                      >
                        <div className={`absolute inset-0 ${
                          camo === 'none' ? 'bg-zinc-800' :
                          camo === 'gold' ? 'bg-yellow-400' :
                          camo === 'diamond' ? 'bg-cyan-100' :
                          camo === 'dark_matter' ? 'bg-purple-900' :
                          camo === 'cherry_blossom' ? 'bg-pink-300' :
                          camo === 'dragon' ? 'bg-red-900' :
                          camo === 'ice' ? 'bg-blue-200' :
                          camo === 'magma' ? 'bg-orange-600' :
                          camo === 'nebula' ? 'bg-indigo-900' :
                          camo === 'red_hex' ? 'bg-red-900' :
                          camo === 'into_the_void' ? 'bg-black' :
                          camo === 'cosmic' ? 'bg-blue-900' :
                          'bg-gradient-to-r from-red-500 via-green-500 to-blue-500 animate-gradient'
                        }`} />
                        {camo === 'diamond' && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')] opacity-50" />}
                        {camo === 'dark_matter' && <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-purple-800 animate-pulse" />}
                        {camo === 'magma' && <div className="absolute inset-0 bg-gradient-to-t from-red-600 to-yellow-500 opacity-80" />}
                        {camo === 'spectrum' && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                        {camo === 'red_hex' && <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/hex/256/256')] opacity-50 mix-blend-overlay" />}
                        {camo === 'into_the_void' && <div className="absolute inset-0 bg-purple-900/50 animate-pulse" />}
                        {camo === 'cosmic' && <div className="absolute inset-0 bg-cyan-500/30 animate-pulse" />}
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-[8px] text-white font-bold uppercase text-center py-1 truncate px-1">
                          {camo.replace('_', ' ')}
                        </div>
                      </button>
                    ))}
                  </div>
               </div>

               <div className="h-[1px] bg-white/10 w-full" />

               <div className="space-y-6">
                  <span className="text-white/40 uppercase font-black text-xs tracking-[0.3em]">HUD Customization</span>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/60">
                        <span>Button Scale</span>
                        <span>{hudSettings.buttonScale.toFixed(2)}x</span>
                      </div>
                      <input 
                        id="menu-item-12"
                        type="range" min="0.5" max="2" step="0.1" 
                        value={hudSettings.buttonScale} 
                        onChange={(e) => setHudSettings(prev => ({ ...prev, buttonScale: parseFloat(e.target.value) }))}
                        className={`w-full accent-red-600 ${selectedMenuIndex === 12 ? 'ring-2 ring-white rounded-sm' : ''}`}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/60">
                        <span>HUD Scale</span>
                        <span>{hudSettings.hudScale.toFixed(2)}x</span>
                      </div>
                      <input 
                        id="menu-item-13"
                        type="range" min="0.5" max="2" step="0.1" 
                        value={hudSettings.hudScale} 
                        onChange={(e) => setHudSettings(prev => ({ ...prev, hudScale: parseFloat(e.target.value) }))}
                        className={`w-full accent-red-600 ${selectedMenuIndex === 13 ? 'ring-2 ring-white rounded-sm' : ''}`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      {[
                        { key: 'statsPos', label: 'Stats (Top/Left)' },
                        { key: 'healthBarPos', label: 'Health Bar (Top/Left)' },
                        { key: 'pausePos', label: 'Pause (Top/Right)' },
                        { key: 'weaponPos', label: 'Weapon Info (Top/Right)' },
                        { key: 'ammoPos', label: 'Ammo Text (Bottom/Right)' },
                        { key: 'joystickPos', label: 'Joystick (Bottom/Left)' },
                        { key: 'grenadePos', label: 'Grenade (Bottom/Left)' },
                        { key: 'flashbangPos', label: 'Flashbang (Bottom/Left)' },
                        { key: 'monkeyBombPos', label: 'Monkey Bomb (Bottom/Left)' },
                        { key: 'jumpPos', label: 'Jump (Bottom/Right)' },
                        { key: 'switchPos', label: 'Switch (Bottom/Right)' },
                        { key: 'knifePos', label: 'Knife (Bottom/Right)' },
                        { key: 'shootPos', label: 'Shoot (Bottom/Right)' },
                        { key: 'reloadPos', label: 'Reload (Bottom/Right)' },
                      ].map(({ key, label }, idx) => (
                        <div key={key} className="space-y-2">
                          <span className="text-[10px] font-bold uppercase text-white/40 tracking-widest">{label}</span>
                          <div className="flex gap-2">
                            <input id={`menu-item-${14 + idx * 2}`} type="number" value={(hudSettings as any)[key].x} onChange={(e) => setHudSettings(prev => ({ ...prev, [key]: { ...(prev as any)[key], x: parseInt(e.target.value) || 0 } }))} className={`w-full bg-white/5 border border-white/10 rounded p-2 text-white text-sm ${selectedMenuIndex === 14 + idx * 2 ? 'ring-2 ring-white bg-white/20' : ''}`} placeholder="X" />
                            <input id={`menu-item-${14 + idx * 2 + 1}`} type="number" value={(hudSettings as any)[key].y} onChange={(e) => setHudSettings(prev => ({ ...prev, [key]: { ...(prev as any)[key], y: parseInt(e.target.value) || 0 } }))} className={`w-full bg-white/5 border border-white/10 rounded p-2 text-white text-sm ${selectedMenuIndex === 14 + idx * 2 + 1 ? 'ring-2 ring-white bg-white/20' : ''}`} placeholder="Y" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <button 
                      id="menu-item-42"
                      onClick={() => setHudSettings(INITIAL_HUD_SETTINGS)}
                      className={`w-full py-2 bg-white/5 border border-white/10 text-white/60 text-xs font-bold uppercase tracking-widest rounded hover:bg-white/10 transition-all ${selectedMenuIndex === 42 ? 'ring-2 ring-white bg-white/20' : ''}`}
                    >
                      Reset to Default
                    </button>
                  </div>
               </div>

               <div className="h-[1px] bg-white/10 w-full" />

               <div className="space-y-6">
                  <span className="text-white/40 uppercase font-black text-xs tracking-[0.3em]">Game Settings</span>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/60">
                        <span>SFX Volume</span>
                        <span>{Math.round(gameSettings.sfxVolume * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.01" 
                        value={gameSettings.sfxVolume} 
                        onChange={(e) => setGameSettings(prev => ({ ...prev, sfxVolume: parseFloat(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/60">
                        <span>Music Volume</span>
                        <span>{Math.round(gameSettings.musicVolume * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.01" 
                        value={gameSettings.musicVolume} 
                        onChange={(e) => setGameSettings(prev => ({ ...prev, musicVolume: parseFloat(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-white font-black italic tracking-tighter text-xl uppercase">Weather</span>
                        <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Atmospheric conditions</span>
                      </div>
                      <div className="flex gap-2">
                        {(['dynamic', 'clear', 'rain', 'fog'] as const).map((type) => (
                          <button 
                            key={type}
                            onClick={() => setGameSettings(prev => ({ ...prev, weatherType: type }))}
                            className={`px-3 py-1 rounded-sm border-2 font-black italic uppercase transition-all text-[10px] ${
                              gameSettings.weatherType === type 
                                ? 'bg-blue-600 border-blue-400 text-white' 
                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-white font-black italic tracking-tighter text-xl uppercase">Custom Music</span>
                          <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Play your own tracks</span>
                        </div>
                        <button 
                          onClick={() => setGameSettings(prev => ({ ...prev, musicEnabled: !prev.musicEnabled }))}
                          className={`px-4 py-1 rounded-sm border-2 font-black italic uppercase transition-all text-xs ${
                            gameSettings.musicEnabled ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-red-600 border-red-400 text-white/50'
                          }`}
                        >
                          {gameSettings.musicEnabled ? 'ON' : 'OFF'}
                        </button>
                      </div>
                      
                      {gameSettings.musicEnabled && (
                        <div className="flex flex-col gap-4 mt-2">
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={gameSettings.customMusicUrl}
                              onChange={(e) => setGameSettings(prev => ({ ...prev, customMusicUrl: e.target.value }))}
                              placeholder="Enter MP3/WAV URL..."
                              className="flex-1 bg-white/5 border border-white/10 rounded p-2 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-blue-500"
                            />
                            <button 
                              onClick={() => {
                                  if (gameSettings.customMusicUrl) {
                                      soundService.playMusic(gameSettings.customMusicUrl);
                                  }
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-500"
                            >
                              PLAY
                            </button>
                          </div>

                          <div className="space-y-2">
                            <span className="text-white/40 uppercase font-black text-[10px] tracking-[0.2em]">Playlist</span>
                            
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={newPlaylistName}
                                onChange={(e) => setNewPlaylistName(e.target.value)}
                                placeholder="Song Name"
                                className="w-1/3 bg-white/5 border border-white/10 rounded p-2 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-blue-500"
                              />
                              <input 
                                type="text" 
                                value={newPlaylistUrl}
                                onChange={(e) => setNewPlaylistUrl(e.target.value)}
                                placeholder="Song URL"
                                className="flex-1 bg-white/5 border border-white/10 rounded p-2 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-blue-500"
                              />
                              <button 
                                onClick={() => {
                                  if (newPlaylistName && newPlaylistUrl) {
                                    setGameSettings(prev => ({
                                      ...prev,
                                      customPlaylist: [...(prev.customPlaylist || []), { name: newPlaylistName, url: newPlaylistUrl }]
                                    }));
                                    setNewPlaylistName('');
                                    setNewPlaylistUrl('');
                                  }
                                }}
                                className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-500"
                              >
                                <PlusCircle size={14} />
                              </button>
                            </div>

                            <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                              {gameSettings.customPlaylist?.map((track, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white/5 p-2 rounded hover:bg-white/10 group">
                                  <span className="text-white text-xs font-medium truncate flex-1 mr-2">{track.name}</span>
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => {
                                        setGameSettings(prev => ({ ...prev, customMusicUrl: track.url }));
                                        soundService.playMusic(track.url);
                                      }}
                                      className="text-blue-400 hover:text-blue-300"
                                    >
                                      <Play size={12} />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setGameSettings(prev => ({
                                          ...prev,
                                          customPlaylist: prev.customPlaylist.filter((_, i) => i !== idx)
                                        }));
                                      }}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {(!gameSettings.customPlaylist || gameSettings.customPlaylist.length === 0) && (
                                <div className="text-white/20 text-xs italic text-center py-2">No tracks in playlist</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
               </div>

               <div className="h-[1px] bg-white/10 w-full" />

            <button id="menu-item-43" onClick={() => status === GameStatus.PAUSED ? setShowPauseSettings(false) : setStatus(GameStatus.START)} className={`w-full py-5 bg-red-800 text-white font-black text-2xl rounded-sm shadow-2xl active:scale-95 transition-all uppercase italic tracking-tighter border-b-4 border-red-950 ${selectedMenuIndex === 43 ? 'ring-4 ring-white scale-105' : ''}`}>
               Save and Return
            </button>
          </div>
        </div>
      </div>
      )}

      {status === GameStatus.START && (
        <div className="absolute inset-0 z-50 flex flex-col items-center bg-black/95 p-8 overflow-y-auto">
          {achievementNotif.show && (
            <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 bg-black/80 backdrop-blur-xl border-2 border-purple-500/50 p-4 rounded-sm shadow-[0_0_30px_rgba(168,85,247,0.4)] animate-in slide-in-from-top duration-500 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(168,85,247,0.5)] shrink-0">
                {achievementNotif.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.2em]">Achievement Unlocked</span>
                <span className="text-white font-black italic text-xl uppercase tracking-tight">{achievementNotif.name}</span>
              </div>
            </div>
          )}
          {prestigeNotif.show && (
            <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 pointer-events-none animate-in fade-in zoom-in duration-1000">
              <div className={`bg-gradient-to-b from-white to-${getPrestigeColor(prestigeNotif.prestige).replace('text-', '')} text-transparent bg-clip-text font-black text-8xl uppercase italic tracking-widest drop-shadow-[0_0_50px_currentColor] flex items-center gap-6 mb-8`}>
                <div className="animate-pulse">{getPrestigeIcon(prestigeNotif.prestige, 80)}</div>
                Prestige {prestigeNotif.prestige}
                <div className="animate-pulse">{getPrestigeIcon(prestigeNotif.prestige, 80)}</div>
              </div>
              <div className="text-white font-bold text-3xl uppercase tracking-widest animate-pulse drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
                You have reached a new level of power
              </div>
              <div className="mt-12 flex gap-4">
                <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-sm border border-yellow-500/30 flex flex-col items-center">
                  <span className="text-yellow-400 font-black text-2xl">+500</span>
                  <span className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Starting Points</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-sm border border-yellow-500/30 flex flex-col items-center">
                  <span className="text-yellow-400 font-black text-2xl">+10</span>
                  <span className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Max Health</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-sm border border-yellow-500/30 flex flex-col items-center">
                  <span className="text-yellow-400 font-black text-2xl">+10%</span>
                  <span className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Damage</span>
                </div>
              </div>
            </div>
          )}
          <div className="max-w-md w-full text-center space-y-12 animate-in fade-in duration-700 my-auto py-8">
            <h1 className="text-center">
              <div className="text-8xl font-black text-red-800 tracking-tighter uppercase italic leading-none drop-shadow-[0_0_30px_rgba(153,27,27,0.7)] mb-2">
                Z-Town
              </div>
              <div className="text-4xl font-bold text-red-600/80 tracking-widest uppercase italic leading-none">
                Red9&Spendawg
              </div>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  {connectionStatus === 'connected' ? 'Server Online' : connectionStatus === 'connecting' ? 'Connecting to Server...' : 'Server Offline'}
                </span>
              </div>
            </h1>

            <div className="bg-black/50 border border-white/10 p-4 rounded-sm flex flex-col items-center gap-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-white font-black italic text-xl">Level {getLevelData(progression.xp).level}</span>
                  {Array.from({ length: progression.stars || 0 }).map((_, i) => (
                    <Star key={i} className="text-yellow-400 w-4 h-4 fill-yellow-400" />
                  ))}
                </div>
                {progression.prestige > 0 && (
                  <span className={`${getPrestigeColor(progression.prestige)} font-black italic text-xl flex items-center gap-2`}>
                    {getPrestigeIcon(progression.prestige, 20)} Prestige {progression.prestige}
                  </span>
                )}
              </div>
              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-500"
                  style={{ width: `${getLevelData(progression.xp).isMaxLevel ? 100 : (getLevelData(progression.xp).currentLevelXp / getLevelData(progression.xp).xpForNext) * 100}%` }}
                />
              </div>
              <div className="flex justify-between w-full text-xs text-white/50 font-bold uppercase tracking-widest">
                <span>{getLevelData(progression.xp).currentLevelXp} XP</span>
                <span>{getLevelData(progression.xp).isMaxLevel ? 'MAX LEVEL' : `${getLevelData(progression.xp).xpForNext} XP`}</span>
              </div>
              {getLevelData(progression.xp).isMaxLevel && (
                <button 
                  onClick={() => {
                    if (progression.prestige < 10) {
                      if (confirm('Are you sure you want to prestige? This will reset your level to 1.')) {
                        setProgression(p => {
                          const newP = { ...p, xp: 0, prestige: p.prestige + 1 };
                          if (newP.prestige === 10) unlockAchievement('prestige_master');
                          localStorage.setItem('ztown_progression', JSON.stringify(newP));
                          setPrestigeNotif({ prestige: newP.prestige, show: true });
                          soundService.playPowerUpPickup();
                          setTimeout(() => setPrestigeNotif(prev => ({ ...prev, show: false })), 6000);
                          return newP;
                        });
                      }
                    } else {
                      if (confirm('Are you sure you want to reset to Level 1? You will gain a Prestige Master Star!')) {
                        setProgression(p => {
                          const newP = { ...p, xp: 0, stars: (p.stars || 0) + 1 };
                          if (newP.stars === 1) unlockAchievement('star_collector');
                          localStorage.setItem('ztown_progression', JSON.stringify(newP));
                          soundService.playPowerUpPickup();
                          return newP;
                        });
                      }
                    }
                  }}
                  className="mt-2 w-full py-2 bg-yellow-600/20 text-yellow-500 border border-yellow-600/50 font-black uppercase italic tracking-widest rounded-sm hover:bg-yellow-600/40 transition-all"
                >
                  {progression.prestige < 10 ? 'Enter Prestige' : 'Reset Level (Gain Star)'}
                </button>
              )}
            </div>

            <div className="space-y-6">
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                  <MapIcon size={16} /> Select Battlefield
                </h3>
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                  {MAPS.map((map, i) => (
                    <button
                      key={map.id}
                      id={`menu-item-${i}`}
                      onClick={() => setStats(prev => ({ ...prev, activeMapId: map.id }))}
                      className={`relative group overflow-hidden rounded-sm border-2 transition-all aspect-video ${
                        stats.activeMapId === map.id 
                          ? 'border-red-600 ring-2 ring-red-600/50' 
                          : 'border-white/10 grayscale hover:grayscale-0 opacity-60 hover:opacity-100'
                      } ${selectedMenuIndex === i ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                    >
                      <img src={map.thumbnail} alt={map.name} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 text-left">
                        <div className="text-xs font-black text-white uppercase italic tracking-tighter leading-none">{map.name}</div>
                        <div className="text-[8px] font-bold text-white/60 uppercase tracking-widest mt-1 truncate">{map.description}</div>
                      </div>
                      {stats.activeMapId === map.id && (
                        <div className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow-lg">
                          <Activity size={10} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-red-500 transition-colors" size={20} />
                <input 
                  id={`menu-item-${MAPS.length}`}
                  type="text" 
                  value={nickname}
                  onChange={handleNicknameChange}
                  placeholder="Survivor Nickname..."
                  className={`w-full bg-white/5 border-2 border-white/10 px-12 py-5 rounded-sm text-white font-black italic text-xl focus:border-red-700 focus:bg-white/10 outline-none transition-all placeholder:text-white/20 uppercase tracking-tight ${selectedMenuIndex === MAPS.length ? 'ring-2 ring-white bg-white/10' : ''}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex items-center justify-between bg-white/5 p-4 rounded-sm border border-white/10">
                  <span className="text-white font-black italic uppercase">Online Mode</span>
                  <button 
                    onClick={() => setIsOnline(!isOnline)}
                    className={`w-16 h-8 rounded-full transition-colors relative ${isOnline ? 'bg-emerald-500' : 'bg-white/20'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${isOnline ? 'left-9' : 'left-1'}`} />
                  </button>
                </div>
                {isOnline && (
                  <>
                    <div className="col-span-2">
                      <input 
                        type="text" 
                        value={joinRoomId}
                        onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                        placeholder="ENTER ROOM CODE..."
                        className="w-full bg-white/5 border-2 border-white/10 px-4 py-4 rounded-sm text-white font-black italic text-xl focus:border-red-700 outline-none placeholder:text-white/20 uppercase text-center tracking-widest"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        if (joinRoomId && socket) {
                          socket.emit('join_room', { roomId: joinRoomId, name: nickname });
                        }
                      }}
                      className="col-span-2 py-5 bg-emerald-600 text-white font-black text-2xl rounded-sm shadow-xl active:scale-95 transition-all uppercase italic tracking-tighter border-b-4 border-emerald-800 hover:bg-emerald-500 ring-2 ring-white/10"
                    >
                      Join Room
                    </button>
                  </>
                )}
                <button 
                  id={`menu-item-${MAPS.length + 1}`}
                  onClick={() => {
                    if (isOnline) {
                      socket?.emit('create_room', {
                        roomId: myRoomId,
                        name: nickname,
                        mapId: stats.activeMapId,
                        isCustom: false
                      });
                    } else {
                      startGame(false);
                    }
                  }} 
                  className={`col-span-2 py-8 bg-red-800 text-white font-black text-4xl rounded-sm shadow-2xl active:scale-95 hover:bg-red-700 transition-all uppercase italic tracking-tighter border-b-8 border-red-950 ${selectedMenuIndex === MAPS.length + 1 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                >
                  {isOnline ? 'Host Game' : 'Deploy'}
                </button>
                <button 
                  id={`menu-item-${MAPS.length + 2}`}
                  onClick={() => {
                    setLeaderboardMapId(stats.activeMapId || 'town');
                    setStatus(GameStatus.LEADERBOARD);
                  }} 
                  className={`py-5 bg-white/5 border border-white/10 text-white/80 font-black text-xl rounded-sm active:scale-95 flex items-center justify-center gap-3 uppercase italic transition-all hover:bg-white/10 ${selectedMenuIndex === MAPS.length + 2 ? 'ring-2 ring-white bg-white/20' : ''}`}
                >
                  <Trophy size={20} className="text-yellow-600 shrink-0" /> Hall of Fame
                </button>
                <button 
                  id={`menu-item-${MAPS.length + 3}`}
                  onClick={() => setStatus(GameStatus.SETTINGS)} 
                  className={`py-5 bg-white/5 border border-white/10 text-white/80 font-black text-xl rounded-sm active:scale-95 flex items-center justify-center gap-3 uppercase italic transition-all hover:bg-white/10 ${selectedMenuIndex === MAPS.length + 3 ? 'ring-2 ring-white bg-white/20' : ''}`}
                >
                  <Gauge size={20} className="text-blue-500 shrink-0" /> Settings
                </button>
                <button 
                  id={`menu-item-${MAPS.length + 4}`}
                  onClick={() => setStatus(GameStatus.ACHIEVEMENTS)} 
                  className={`py-5 bg-white/5 border border-white/10 text-white/80 font-black text-xl rounded-sm active:scale-95 flex items-center justify-center gap-3 uppercase italic transition-all hover:bg-white/10 ${selectedMenuIndex === MAPS.length + 4 ? 'ring-2 ring-white bg-white/20' : ''}`}
                >
                  <Medal size={20} className="text-purple-500 shrink-0" /> Achievements
                </button>
                <button 
                  id={`menu-item-${MAPS.length + 5}`}
                  onClick={() => setStatus(GameStatus.INFO)} 
                  className={`py-5 bg-white/5 border border-white/10 text-white/80 font-black text-xl rounded-sm active:scale-95 flex items-center justify-center gap-3 uppercase italic transition-all hover:bg-white/10 ${selectedMenuIndex === MAPS.length + 5 ? 'ring-2 ring-white bg-white/20' : ''}`}
                >
                  <AlertCircle size={20} className="text-emerald-500 shrink-0" /> Game Info
                </button>
                <button 
                  id={`menu-item-${MAPS.length + 6}`}
                  onClick={() => setStatus(GameStatus.LOADOUT)} 
                  className={`py-5 bg-white/5 border border-white/10 text-white/80 font-black text-xl rounded-sm active:scale-95 flex items-center justify-center gap-3 uppercase italic transition-all hover:bg-white/10 ${selectedMenuIndex === MAPS.length + 6 ? 'ring-2 ring-white bg-white/20' : ''}`}
                >
                  <Crosshair size={20} className="text-orange-500 shrink-0" /> Loadout
                </button>
                <button 
                  id={`menu-item-${MAPS.length + 7}`}
                  onClick={() => setStatus(GameStatus.CUSTOM_GAME)} 
                  className={`col-span-2 py-5 bg-purple-900/50 border border-purple-500/30 text-white font-black text-2xl rounded-sm active:scale-95 flex items-center justify-center gap-3 uppercase italic transition-all hover:bg-purple-800/50 ${selectedMenuIndex === MAPS.length + 7 ? 'ring-4 ring-white scale-105 z-10' : ''}`}
                >
                  <Wrench size={24} className="text-purple-400" /> Custom Game
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 opacity-30 mt-8">
              <AlertCircle size={20} className="text-white" />
              <span className="text-white text-[10px] uppercase font-bold italic tracking-widest">Mobile Optimized Experience</span>
            </div>
          </div>
        </div>
      )}
      {status === GameStatus.LOADOUT && (
        <div className="absolute inset-0 z-50 flex flex-col items-center bg-black/95 p-8 overflow-y-auto">
          <div className="max-w-6xl w-full space-y-8 animate-in slide-in-from-bottom duration-500 py-8">
            <div className="flex items-center justify-between sticky top-0 bg-black/95 z-20 py-4 border-b border-white/10">
              <button 
                id="menu-item-0"
                onClick={() => setStatus(GameStatus.START)} 
                className={`p-3 bg-white/5 rounded-full text-white/60 active:scale-90 transition-all border border-white/10 ${selectedMenuIndex === 0 ? 'ring-2 ring-white bg-white/20 text-white' : ''}`}
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-4xl sm:text-5xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                <Crosshair className="text-orange-500 w-8 h-8 sm:w-10 sm:h-10" /> Weapon Loadout
              </h2>
              <div className="w-12"></div>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 justify-center sticky top-24 bg-black/95 z-20 py-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'pistol', label: 'Pistols' },
                { id: 'smg', label: 'SMGs' },
                { id: 'ar', label: 'Assault Rifles' },
                { id: 'shotgun', label: 'Shotguns' },
                { id: 'lmg', label: 'LMGs' },
                { id: 'sniper', label: 'Snipers' },
                { id: 'wonder', label: 'Wonder Weapons' },
                { id: 'melee', label: 'Melee' },
                { id: 'special', label: 'Special' },
              ].map((cat, i) => (
                <button
                  key={cat.id}
                  id={`menu-item-${i + 1}`}
                  onClick={() => setLoadoutCategory(cat.id as any)}
                  className={`px-4 py-2 rounded-sm text-xs font-black uppercase italic tracking-widest transition-all border ${
                    loadoutCategory === cat.id 
                      ? 'bg-orange-600 text-white border-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.5)] scale-105' 
                      : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredWeapons.map(([weaponName, weaponStats], i) => {
                const isSelected = selectedMenuIndex === i + 10;
                const attachments = getActiveAttachments(weaponName, getLevelData(progression.xp).level, progression.weaponAttachments || {});
                const availableAttachments: WeaponAttachment[] = ['red_dot', 'acog', 'foregrip', 'extended_mag', 'laser_sight', 'suppressor'];
                const weaponLevelReq = weaponStats.unlockLevel || 1;
                const isLocked = getLevelData(progression.xp).level < weaponLevelReq;
                
                // Filter incompatible attachments
                const validAttachments = availableAttachments.filter(att => {
                    if (weaponName === 'Bowie Knife' || weaponName === 'Ray Gun') return false;
                    if (att === 'suppressor' && (weaponName.includes('LMG') || weaponName.includes('Sniper') || weaponName.includes('Ray Gun'))) return false;
                    if ((att === 'red_dot' || att === 'acog') && weaponName === 'Bowie Knife') return false;
                    return true;
                });

                if (validAttachments.length === 0) return null; // Skip weapons with no attachments

                return (
                  <div 
                    key={weaponName}
                    id={`menu-item-${i + 10}`}
                    className={`bg-white/5 border border-white/10 p-6 rounded-sm transition-all relative overflow-hidden group ${isSelected ? 'ring-2 ring-orange-500 bg-white/10 scale-[1.02] z-10 shadow-2xl shadow-orange-900/20' : 'hover:bg-white/10'}`}
                  >
                    {isLocked && (
                        <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
                            <Lock size={32} className="text-red-500 mb-2" />
                            <span className="text-white font-black italic uppercase tracking-widest">Unlocked at Level {weaponLevelReq}</span>
                        </div>
                    )}
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        {getWeaponIcon(weaponName, 100)}
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3 w-full">
                                <div className="p-2 bg-white/5 rounded-sm border border-white/10 shrink-0">
                                    {getWeaponIcon(weaponName, 24)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-black text-white uppercase italic tracking-tight truncate">{weaponName}</h3>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black text-orange-500 uppercase italic">LVL {getWeaponLevel(progression.weaponXp?.[weaponName] || 0)}</span>
                                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">MAX 30</span>
                                        </div>
                                    </div>
                                    
                                    {/* XP Bar */}
                                    <div className="mt-1 space-y-1">
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            <div 
                                                className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
                                                style={{ width: `${getWeaponProgress(progression.weaponXp?.[weaponName] || 0)}%` }} 
                                            />
                                        </div>
                                        <div className="flex justify-between text-[7px] font-bold text-white/20 uppercase tracking-widest">
                                            <span>XP: {progression.weaponXp?.[weaponName] || 0}</span>
                                            <span>{getWeaponLevel(progression.weaponXp?.[weaponName] || 0) >= 30 ? 'MAXED' : `${(progression.weaponXp?.[weaponName] || 0) % 500} / 500`}</span>
                                        </div>
                                    </div>

                                    {/* Stats Display */}
                                    {(() => {
                                        const currentStats = getWeaponStatsWithAttachments(weaponStats, attachments);
                                        const isModified = JSON.stringify(currentStats) !== JSON.stringify(weaponStats);
                                        
                                        return (
                                            <>
                                                <div className="flex gap-2 mt-3">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-sm ${currentStats.clip > weaponStats.clip ? 'text-emerald-400' : 'text-white/40'}`}>
                                                        MAG: {currentStats.clip}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-sm">
                                                        RELOAD: {(currentStats.reload / 1000).toFixed(1)}s
                                                    </span>
                                                </div>
                                                <div className="flex flex-col gap-1.5 mt-3 w-full">
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em]">
                                                            <span className="text-white/20">Firepower</span>
                                                            <span className={currentStats.damage > weaponStats.damage ? 'text-emerald-400' : 'text-white/40'}>
                                                                {currentStats.damage}
                                                                {currentStats.damage > weaponStats.damage && <span className="ml-1">↑</span>}
                                                            </span>
                                                        </div>
                                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                            <div 
                                                                className={`h-full ${currentStats.damage > weaponStats.damage ? 'bg-emerald-500' : 'bg-gradient-to-r from-orange-600 to-orange-400'}`} 
                                                                style={{ width: `${Math.min(100, (currentStats.damage / 1000) * 100)}%` }} 
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">
                                                            <span>Cycle Rate</span>
                                                            <span className="text-white/40">{currentStats.rate}ms</span>
                                                        </div>
                                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                            <div 
                                                                className="h-full bg-gradient-to-r from-blue-600 to-blue-400" 
                                                                style={{ width: `${Math.max(5, 100 - (currentStats.rate / 10))}%` }} 
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-end border-b border-white/5 pb-1">
                                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Attachments</h4>
                                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Unlock every 5 levels</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {validAttachments.map((att) => {
                                    const isEquipped = attachments.includes(att);
                                    const weaponLevel = getWeaponLevel(progression.weaponXp?.[weaponName] || 0);
                                    const isUnlocked = isAttachmentUnlocked(weaponLevel, att);
                                    
                                    return (
                                        <button
                                            key={att}
                                            disabled={!isUnlocked || isLocked}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!isUnlocked || isLocked) return;
                                                
                                                const newAttachments = isEquipped 
                                                    ? attachments.filter(a => a !== att)
                                                    : [...attachments, att];
                                                
                                                setProgression(prev => {
                                                    const newP = {
                                                        ...prev,
                                                        weaponAttachments: {
                                                            ...prev.weaponAttachments,
                                                            [weaponName]: newAttachments
                                                        }
                                                    };
                                                    localStorage.setItem('ztown_progression', JSON.stringify(newP));
                                                    return newP;
                                                });
                                                soundService.playHover();
                                            }}
                                            className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm border transition-all flex items-center gap-2 relative ${
                                                !isUnlocked 
                                                    ? 'bg-black/60 border-white/5 text-white/10 cursor-not-allowed' 
                                                    : isEquipped 
                                                        ? 'bg-orange-500 text-white border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.4)]' 
                                                        : 'bg-black/40 border-white/10 text-white/40 hover:bg-white/10 hover:text-white hover:border-white/30'
                                            }`}
                                        >
                                            {isUnlocked ? getAttachmentIcon(att) : <Database size={12} className="opacity-50" />}
                                            {att.replace('_', ' ')}
                                            {!isUnlocked && (
                                                <div className="absolute -top-1 -right-1 bg-red-500/80 text-white text-[6px] px-1 rounded-full font-black">
                                                    LVL {att === 'red_dot' ? 5 : att === 'foregrip' ? 10 : att === 'extended_mag' ? 15 : att === 'acog' ? 20 : att === 'laser_sight' ? 25 : 30}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {status === GameStatus.LOBBY && room && (
        <div className="absolute inset-0 z-[120] flex flex-col items-center bg-black p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-4xl w-full space-y-8 animate-in slide-in-from-bottom duration-500 py-8">
            <div className="flex items-center justify-between">
              <button onClick={() => {
                if (socket) {
                  socket.emit('leave_room', room.id);
                  setRoom(null);
                }
                setStatus(GameStatus.START);
              }} className="p-3 bg-white/5 rounded-full text-white/60 active:scale-90 transition-all border border-white/10">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-4xl sm:text-5xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                <Activity className="text-emerald-500 w-8 h-8 sm:w-10 sm:h-10" /> Online Lobby
              </h2>
              <div className="w-12"></div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-sm text-center">
              <h3 className="text-2xl font-black text-white uppercase italic mb-2">Room Code</h3>
              <div className="flex items-center justify-center gap-4">
                <div className="text-6xl font-black text-emerald-500 tracking-widest">{room.id}</div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(room.id);
                    setLastPerkGained("COPIED TO CLIPBOARD");
                    setTimeout(() => setLastPerkGained(null), 3000);
                  }}
                  className="p-3 bg-white/10 hover:bg-white/20 active:scale-90 transition-all rounded-sm border border-white/20 text-white"
                  title="Copy Room Code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
              </div>
              <p className="text-white/40 mt-4 uppercase font-bold tracking-widest text-sm">Share this code with up to 3 friends</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-sm">
              <h3 className="text-xl font-black text-white uppercase italic mb-4">Players ({room.players.length}/4)</h3>
              <div className="space-y-2">
                {room.players.map((p: any, i: number) => (
                  <div key={p.id} className="flex items-center justify-between bg-white/5 p-4 rounded-sm border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${p.isHost ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                      <span className="text-white font-black text-xl uppercase italic">{p.name}</span>
                    </div>
                    {p.isHost && <span className="text-yellow-500 font-bold uppercase text-xs tracking-widest border border-yellow-500/30 px-2 py-1 rounded-sm">Host</span>}
                  </div>
                ))}
              </div>
            </div>

            {room.host === socket?.id ? (
              <button 
                onClick={() => socket?.emit('start_game', room.id)}
                className="w-full py-6 bg-emerald-600 text-white font-black text-3xl rounded-sm shadow-2xl active:scale-95 hover:bg-emerald-500 transition-all uppercase italic tracking-tighter border-b-4 border-emerald-800"
              >
                Start Match
              </button>
            ) : (
              <div className="w-full py-6 bg-white/5 text-white/50 font-black text-3xl rounded-sm text-center uppercase italic tracking-tighter border border-white/10">
                Waiting for Host...
              </div>
            )}
          </div>
        </div>
      )}
      {status === GameStatus.CUSTOM_GAME && (
        <div className="absolute inset-0 z-[120] flex flex-col items-center bg-black p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-4xl w-full space-y-8 animate-in slide-in-from-bottom duration-500 py-8">
            <div className="flex items-center justify-between">
              <button id="menu-item-0" onClick={() => setStatus(GameStatus.START)} className={`p-3 bg-white/5 rounded-full text-white/60 active:scale-90 transition-all border border-white/10 ${selectedMenuIndex === 0 ? 'ring-2 ring-white bg-white/20' : ''}`}>
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-4xl sm:text-5xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                <Wrench className="text-purple-500 w-8 h-8 sm:w-10 sm:h-10" /> Custom Game
              </h2>
              <div className="w-12"></div>
            </div>

            <div className="w-full bg-purple-900/20 border border-purple-500/30 p-4 rounded-sm flex items-center justify-center gap-3">
              <Activity className="text-purple-400" size={20} />
              <span className="text-purple-200 font-bold uppercase tracking-widest text-sm">XP & Achievements Disabled - For Fun Only</span>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 p-6 rounded-sm">
                <h3 className="text-xl font-black text-white uppercase italic mb-4">Map Selection</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                  {MAPS.map((map, i) => (
                    <button
                      key={map.id}
                      id={`menu-item-${i + 1}`}
                      onClick={() => setCustomGameConfig(prev => ({ ...prev, mapId: map.id }))}
                      className={`relative group overflow-hidden rounded-sm border-2 transition-all aspect-video ${
                        customGameConfig.mapId === map.id 
                          ? 'border-purple-500 ring-2 ring-purple-500/50' 
                          : 'border-white/10 grayscale hover:grayscale-0 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={map.thumbnail} alt={map.name} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute bottom-1 left-1 right-1 text-left">
                        <div className="text-[10px] font-black text-white uppercase italic tracking-tighter leading-none truncate">{map.name}</div>
                      </div>
                      {customGameConfig.mapId === map.id && (
                        <div className="absolute top-1 right-1 bg-purple-500 text-white p-0.5 rounded-full shadow-lg">
                          <CheckCircle2 size={10} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-sm space-y-6">
                <h3 className="text-xl font-black text-white uppercase italic">Game Settings</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="col-span-full">
                    <label className="block text-white/60 font-bold uppercase text-xs mb-2">Game Mode</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setCustomGameConfig(prev => ({ ...prev, gameMode: 'standard' }))}
                        className={`flex-1 p-4 rounded-sm font-black italic border-2 transition-all flex flex-col items-center gap-2 ${
                          customGameConfig.gameMode === 'standard'
                            ? 'bg-purple-900/40 border-purple-500 text-white'
                            : 'bg-black/50 border-white/10 text-white/40 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-lg uppercase">Standard</span>
                        <span className="text-[10px] font-normal opacity-60">Classic Zombies Experience</span>
                      </button>
                      <button
                        onClick={() => setCustomGameConfig(prev => ({ ...prev, gameMode: 'dead_ops' }))}
                        className={`flex-1 p-4 rounded-sm font-black italic border-2 transition-all flex flex-col items-center gap-2 ${
                          customGameConfig.gameMode === 'dead_ops'
                            ? 'bg-emerald-900/40 border-emerald-500 text-white'
                            : 'bg-black/50 border-white/10 text-white/40 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-lg uppercase">Dead Ops Arcade</span>
                        <span className="text-[10px] font-normal opacity-60">Top-Down Twin Stick Shooter</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/60 font-bold uppercase text-xs mb-2">Starting Points</label>
                    <input 
                      id="menu-item-11"
                      type="number" 
                      value={customGameConfig.startingPoints}
                      onChange={(e) => setCustomGameConfig(prev => ({ ...prev, startingPoints: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-black/50 border border-white/10 text-white p-3 rounded-sm font-black italic outline-none focus:border-purple-500 transition-colors"
                      min="0"
                      step="500"
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 font-bold uppercase text-xs mb-2">Starting Round</label>
                    <input 
                      id="menu-item-10"
                      type="number" 
                      value={customGameConfig.startingRound}
                      onChange={(e) => setCustomGameConfig(prev => ({ ...prev, startingRound: parseInt(e.target.value) || 1 }))}
                      className="w-full bg-black/50 border border-white/10 text-white p-3 rounded-sm font-black italic outline-none focus:border-purple-500 transition-colors"
                      min="1"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 font-bold uppercase text-xs mb-2">Bots</label>
                    <div className="flex gap-2">
                       {[0, 1, 2, 3, 4].map((count, i) => (
                          <button
                             key={count}
                             id={`menu-item-${5 + i}`}
                             onClick={() => setCustomGameConfig(prev => ({ ...prev, bots: count }))}
                             className={`flex-1 p-3 rounded-sm font-black italic border transition-all ${
                                customGameConfig.bots === count
                                   ? 'bg-purple-500 border-purple-400 text-white'
                                   : 'bg-black/50 border-white/10 text-white/40 hover:bg-white/5'
                             } ${selectedMenuIndex === 5 + i ? 'ring-2 ring-white' : ''}`}
                          >
                             {count}
                          </button>
                       ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/60 font-bold uppercase text-xs mb-2">God Mode</label>
                    <button
                      id="menu-item-12"
                      onClick={() => setCustomGameConfig(prev => ({ ...prev, godMode: !prev.godMode }))}
                      className={`w-full p-3 rounded-sm font-black italic uppercase transition-colors border ${
                        customGameConfig.godMode 
                          ? 'bg-purple-500 border-purple-400 text-white' 
                          : 'bg-black/50 border-white/10 text-white/40 hover:bg-white/5'
                      }`}
                    >
                      {customGameConfig.godMode ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-white/60 font-bold uppercase text-xs mb-2">Player Name</label>
                    <input 
                      id="menu-item-4"
                      type="text" 
                      value={customGameConfig.playerName}
                      onChange={(e) => setCustomGameConfig(prev => ({ ...prev, playerName: e.target.value }))}
                      className="w-full bg-black/50 border border-white/10 text-white p-3 rounded-sm font-black italic outline-none focus:border-purple-500 transition-colors"
                      maxLength={12}
                    />
                  </div>

                  {customGameConfig.bots > 0 && (
                    <div className="col-span-full mt-4 border-t border-white/10 pt-4">
                      <label className="block text-white/60 font-bold uppercase text-xs mb-2">Bot Names</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Array.from({ length: customGameConfig.bots }).map((_, i) => (
                          <input 
                            key={i}
                            type="text" 
                            value={customGameConfig.botNames[i] || `Bot ${i+1}`}
                            onChange={(e) => {
                              const newBotNames = [...customGameConfig.botNames];
                              newBotNames[i] = e.target.value;
                              setCustomGameConfig(prev => ({ ...prev, botNames: newBotNames }));
                            }}
                            className="w-full bg-black/50 border border-white/10 text-white p-3 rounded-sm font-black italic outline-none focus:border-purple-500 transition-colors"
                            placeholder={`Bot ${i+1}`}
                            maxLength={12}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-white/60 font-bold uppercase text-xs mb-2">Starting Weapon</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto pr-2 bg-black/20 p-4 rounded-sm border border-white/10 custom-scrollbar">
                    {SORTED_WEAPONS.map(([name]) => {
                      const isPap = isPapWeapon(name);
                      const isWonder = isWonderWeapon(name);
                      const isSelected = customGameConfig.startingWeapon === name;
                      const weaponData = WEAPONS[name];

                      return (
                        <button
                          key={name}
                          onClick={() => setCustomGameConfig(prev => ({ ...prev, startingWeapon: name }))}
                          className={`relative aspect-video rounded-sm border-2 transition-all flex flex-col items-center justify-center shadow-lg overflow-hidden group ${
                            isSelected 
                              ? 'bg-emerald-900/40 border-emerald-500 ring-2 ring-emerald-500/50 scale-105 z-10' 
                              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30'
                          }`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 pointer-events-none" />
                          <div className="w-full h-full p-2 flex items-center justify-center scale-75 group-hover:scale-90 transition-transform duration-300">
                              <GunModel color={weaponData.color} isPap={isPap} name={name} />
                          </div>
                          <div className="absolute bottom-1 left-0 right-0 text-center z-20 px-1">
                              <span className={`text-[8px] font-black uppercase italic tracking-widest truncate block ${isSelected ? 'text-emerald-400' : 'text-white/60'}`}>
                                  {name}
                              </span>
                          </div>
                          {isPap && (
                              <div className="absolute top-1 right-1 z-20">
                                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                              </div>
                          )}
                          {isWonder && (
                              <div className="absolute top-1 right-1 z-20">
                                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                              </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button 
                id="menu-item-13"
                onClick={startCustomGame} 
                className="w-full py-6 bg-purple-900 text-white font-black text-3xl rounded-sm shadow-2xl active:scale-95 hover:bg-purple-800 transition-all uppercase italic tracking-tighter border-b-4 border-purple-950 flex items-center justify-center gap-4"
              >
                <Play size={28} /> Start Custom Match
              </button>
            </div>
          </div>
        </div>
      )}
      {status === GameStatus.ACHIEVEMENTS && (
        <div className="absolute inset-0 z-[120] flex flex-col items-center bg-black p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-4xl w-full space-y-8 animate-in slide-in-from-bottom duration-500 py-8">
            <div className="flex items-center justify-between">
              <button id="menu-item-0" onClick={() => setStatus(GameStatus.START)} className={`p-3 bg-white/5 rounded-full text-white/60 active:scale-90 transition-all border border-white/10 ${selectedMenuIndex === 0 ? 'ring-2 ring-white bg-white/20' : ''}`}>
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-4xl sm:text-5xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                <Medal className="text-purple-500 w-8 h-8 sm:w-10 sm:h-10" /> Achievements
              </h2>
              <div className="text-right">
                <div className="text-purple-500 font-black text-2xl italic leading-none">
                  {progression.achievements.length} / {ACHIEVEMENTS.length}
                </div>
                <div className="text-white/20 text-[10px] font-bold uppercase tracking-widest mt-1">Unlocked</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ACHIEVEMENTS.map((achievement, idx) => {
                const isUnlocked = progression.achievements.includes(achievement.id);
                return (
                  <div 
                    key={achievement.id}
                    className={`p-4 rounded-sm border-2 transition-all flex items-center gap-4 ${
                      isUnlocked 
                        ? 'bg-purple-900/10 border-purple-500/40' 
                        : 'bg-white/5 border-white/5 opacity-40'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0 ${
                      isUnlocked ? 'bg-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'bg-white/5'
                    }`}>
                      {achievement.icon}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-black italic uppercase tracking-tight text-lg ${isUnlocked ? 'text-white' : 'text-white/40'}`}>
                          {achievement.name}
                        </span>
                        {achievement.mapId && (
                          <span className="px-1.5 py-0.5 bg-white/10 rounded-sm text-[8px] font-bold text-white/40 uppercase tracking-widest">
                            {achievement.mapId}
                          </span>
                        )}
                      </div>
                      <p className="text-white/40 text-xs font-medium leading-tight mt-1">
                        {achievement.description}
                      </p>
                    </div>
                    {isUnlocked && (
                      <div className="ml-auto">
                        <CheckCircle2 className="text-purple-500" size={20} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {status === GameStatus.INFO && (
        <div className="absolute inset-0 z-[120] flex flex-col items-center bg-black p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-2xl w-full space-y-6 animate-in slide-in-from-bottom duration-500 my-auto py-8">
            <div className="flex items-center justify-between">
              <button id="menu-item-0" onClick={() => setStatus(GameStatus.START)} className={`p-3 bg-white/5 rounded-full text-white/60 active:scale-90 transition-all border border-white/10 ${selectedMenuIndex === 0 ? 'ring-2 ring-white bg-white/20' : ''}`}>
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-4xl sm:text-5xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                <AlertCircle className="text-emerald-500 w-8 h-8 sm:w-10 sm:h-10" /> Game Intel
              </h2>
              <div className="w-12" />
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-white/5 p-1 rounded-sm border border-white/10 gap-1">
              {[
                { id: 'guns', label: 'Guns', icon: <Swords size={16} /> },
                { id: 'perks', label: 'Perks', icon: <Zap size={16} /> },
                { id: 'bombs', label: 'Tactical', icon: <Bomb size={16} /> },
                { id: 'powerups', label: 'Power-Ups', icon: <Zap size={16} /> },
                { id: 'enemies', label: 'Enemies', icon: <Skull size={16} /> },
                { id: 'progression', label: 'Progression', icon: <Trophy size={16} /> },
              ].map((tab, idx) => (
                <button
                  key={tab.id}
                  id={`menu-item-${idx + 1}`}
                  onClick={() => setInfoTab(tab.id as any)}
                  className={`flex-1 py-3 rounded-sm flex items-center justify-center gap-2 text-[10px] font-black uppercase italic tracking-tighter transition-all ${
                    infoTab === tab.id 
                      ? 'bg-emerald-600 text-white shadow-lg scale-[1.02]' 
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  } ${selectedMenuIndex === idx + 1 ? 'ring-2 ring-white z-10' : ''}`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-sm overflow-hidden p-4 sm:p-6 min-h-[400px]">
              {/* Guns Section */}
              {infoTab === 'guns' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
                  <h3 className="text-xl font-black text-red-600 italic uppercase tracking-tighter flex items-center gap-2 border-b border-red-900/30 pb-2">
                    <Swords size={20} /> Arsenal
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SORTED_WEAPONS.map(([name, weaponStats], idx) => {
                        const isPap = isPapWeapon(name);
                        const isWonder = isWonderWeapon(name);
                        const isEquipped = stats.weaponName === name;

                        return (
                          <div 
                            key={name} 
                            id={`menu-item-${idx + 6}`}
                            onClick={() => setSelectedWeaponInfo(name)}
                            className={`p-3 rounded-sm border flex flex-col gap-1 transition-all group relative cursor-pointer ${
                            isEquipped ? 'ring-2 ring-emerald-500 bg-emerald-900/10 border-emerald-500/50' : (isPap ? 'bg-blue-900/20 border-blue-500/30 hover:bg-blue-900/40' : 'bg-white/5 border-white/10 hover:bg-white/10')
                          } ${selectedMenuIndex === idx + 6 ? 'ring-2 ring-white scale-105 z-10' : ''}`}>
                            {isEquipped && (
                              <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg uppercase italic z-10">
                                Equipped
                              </div>
                            )}
                            <div className="w-full h-24 bg-black/50 rounded-sm mb-2 border border-white/5 relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />
                              <GunModel color={weaponStats.color} isPap={isPap} name={name} />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`font-black italic uppercase text-sm transition-colors ${
                                isEquipped ? 'text-emerald-400' : (isPap ? 'text-blue-400 group-hover:text-blue-300' : 'text-white group-hover:text-red-500')
                              }`}>{name}</span>
                              <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                                isWonder ? 'bg-red-600 text-white' : (isPap ? 'bg-blue-600 text-white' : 'text-white/40')
                              }`}>
                                {isWonder ? 'Wonder' : (isPap ? 'Pack-A-Punch' : 'Standard')}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="flex flex-col">
                                <div className="flex justify-between items-center">
                                  <span className="text-[8px] text-white/30 uppercase font-bold">Damage</span>
                                  <span className="text-[9px] text-white/60 font-mono font-bold">{weaponStats.damage}</span>
                                </div>
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                                  <div className={`h-full transition-all duration-500 ${isPap ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, (weaponStats.damage / 1000) * 100)}%` }} />
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <div className="flex justify-between items-center">
                                  <span className="text-[8px] text-white/30 uppercase font-bold">Fire Rate</span>
                                  <span className="text-[9px] text-white/60 font-mono font-bold">{weaponStats.rate}ms</span>
                                </div>
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                                  <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (200 / weaponStats.rate) * 100)}%` }} />
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between mt-2 text-[9px] font-bold text-white/60 uppercase">
                              <span>Clip: {weaponStats.clip}</span>
                              <span>Max: {weaponStats.max}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Perks Section */}
              {infoTab === 'perks' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
                  <h3 className="text-xl font-black text-emerald-500 italic uppercase tracking-tighter flex items-center gap-2 border-b border-emerald-900/30 pb-2">
                    <Zap size={20} /> Perk-a-Colas
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'jugg', name: 'Juggernog', desc: 'Increases Max HP to 250. Essential for high rounds.', color: 'bg-red-600', icon: <Heart size={14} /> },
                      { id: 'speed', name: 'Speed Cola', desc: '50% Faster Reload speed. Great for LMGs.', color: 'bg-green-600', icon: <Gauge size={14} /> },
                      { id: 'stamin', name: 'Stamin-Up', desc: 'Increased Move Speed and sprint duration.', color: 'bg-yellow-500', icon: <Zap size={14} /> },
                      { id: 'double', name: 'Double Tap', desc: '2x Weapon Damage and increased fire rate.', color: 'bg-orange-600', icon: <Shield size={14} /> },
                      { id: 'mule', name: 'Mule Kick', desc: 'Carry a 3rd primary weapon slot.', color: 'bg-indigo-600', icon: <Database size={14} /> },
                      { id: 'revive', name: 'Quick Revive', desc: 'Faster HP Regeneration delay and rate.', color: 'bg-blue-500', icon: <Activity size={14} /> },
                      { id: 'phd', name: 'PHD Flopper', desc: 'Immunity to explosive self-damage.', color: 'bg-purple-600', icon: <Bomb size={14} /> },
                      { id: 'deadshot', name: 'Deadshot', desc: '6x Headshot damage multiplier (Base 4x).', color: 'bg-gray-600', icon: <Target size={14} /> },
                      { id: 'electric', name: 'Electric Cherry', desc: 'Shock nearby zombies when reloading empty.', color: 'bg-cyan-500', icon: <Zap size={14} /> },
                      { id: 'vulture', name: 'Vulture Aid', desc: 'Zombies drop points/ammo. See through walls.', color: 'bg-lime-600', icon: <Eye size={14} /> },
                      { id: 'widow', name: 'Widow\'s Wine', desc: 'Web grenades stun zombies when they hit you.', color: 'bg-pink-600', icon: <Swords size={14} /> },
                      { id: 'slider', name: 'Slider Wine', desc: 'Explosive slide that damages zombies.', color: 'bg-orange-400', icon: <Zap size={14} /> },
                      { id: 'winter', name: 'Winter\'s Wail', desc: 'Freezes zombies when they hit you.', color: 'bg-cyan-200', icon: <Sun size={14} /> },
                      { id: 'dying', name: 'Dying Wish', desc: 'Invincibility for 10s when HP hits 0.', color: 'bg-red-500', icon: <Shield size={14} /> },
                      { id: 'razor', name: 'Ethereal Razor', desc: 'Melee kills heal you for 20 HP.', color: 'bg-purple-500', icon: <Swords size={14} /> },
                      { id: 'timeslip', name: 'Timeslip', desc: '50% longer Power-up duration (45s).', color: 'bg-cyan-400', icon: <Timer size={14} /> },
                      { id: 'bandolier', name: 'Bandolier Bandit', desc: '50% more Max Ammo capacity.', color: 'bg-yellow-600', icon: <Database size={14} /> },
                      { id: 'tortoise', name: 'Victorious Tortoise', desc: '+100 Max HP (Total 350 with Jugg).', color: 'bg-emerald-600', icon: <Shield size={14} /> },
                      { id: 'blaze', name: 'Blaze Phase', desc: 'Faster slide with fire trail damage.', color: 'bg-orange-700', icon: <Flame size={14} /> },
                      { id: 'stronghold', name: 'Stone Cold', desc: 'Standing still creates a defensive circle.', color: 'bg-purple-500', icon: <Shield size={14} /> },
                      { id: 'blood', name: 'Blood Wolf', desc: 'Summons a wolf companion that attacks zombies.', color: 'bg-red-700', icon: <Swords size={14} /> },
                      { id: 'elemental', name: 'Elemental Pop', desc: 'Chance to apply random elemental effect.', color: 'bg-pink-500', icon: <Zap size={14} /> },
                    ].map((perk, idx) => (
                      <div key={perk.id} id={`menu-item-${idx + 6}`} className={`bg-white/5 p-4 rounded-sm border border-white/10 flex items-center gap-4 transition-colors ${selectedMenuIndex === idx + 6 ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/10'}`}>
                        <div className={`w-12 h-12 shrink-0 ${perk.color} rounded-full flex items-center justify-center border-2 border-white/20 shadow-lg`}>
                          {perk.icon}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-white uppercase italic">{perk.name}</span>
                          <span className="text-[10px] text-white/40 font-bold uppercase tracking-tight leading-tight mt-1">{perk.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bombs Section */}
              {infoTab === 'bombs' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
                  <h3 className="text-xl font-black text-orange-500 italic uppercase tracking-tighter flex items-center gap-2 border-b border-orange-900/30 pb-2">
                    <Bomb size={20} /> Tactical Equipment
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { name: 'Frag Grenade', desc: 'Standard explosive device. Cook it for timing. Refills every round.', damage: 'Up to 2400', radius: '8m', icon: <Bomb size={24} />, color: 'text-gray-400' },
                      { name: 'Flashbang', desc: 'Stuns and blinds zombies in a wide radius. Useful for escaping corners.', damage: 'Up to 1200', radius: '12m', icon: <Sun size={24} />, color: 'text-yellow-400' },
                      { name: 'Monkey Bomb', desc: 'Attracts all zombies with music before exploding. The ultimate distraction.', damage: 'Up to 4800', radius: '12m', icon: <BoxIcon size={24} />, color: 'text-red-500' },
                    ].map((bomb, idx) => (
                      <div key={bomb.name} id={`menu-item-${idx + 6}`} className={`bg-white/5 p-5 rounded-sm border border-white/10 flex items-center gap-6 transition-colors ${selectedMenuIndex === idx + 6 ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/10'}`}>
                        <div className={`${bomb.color} animate-pulse shrink-0`}>{bomb.icon}</div>
                        <div className="flex flex-col flex-1">
                          <div className="flex justify-between items-start">
                            <span className="text-lg font-black text-white uppercase italic leading-none">{bomb.name}</span>
                            <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
                              <span className="bg-black/50 px-2 py-1 rounded-sm border border-white/5">DMG: <span className="text-red-400">{bomb.damage}</span></span>
                              <span className="bg-black/50 px-2 py-1 rounded-sm border border-white/5">RAD: <span className="text-blue-400">{bomb.radius}</span></span>
                            </div>
                          </div>
                          <span className="text-xs text-white/40 font-bold uppercase tracking-tight leading-tight mt-2">{bomb.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enemies Section */}
              {infoTab === 'enemies' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
                  <h3 className="text-xl font-black text-red-600 italic uppercase tracking-tighter flex items-center gap-2 border-b border-red-900/30 pb-2">
                    <Skull size={20} /> Bestiary
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {/* Zombie */}
                    <div id="menu-item-6" onClick={() => {}} className={`bg-white/5 p-4 rounded-sm border border-white/10 flex flex-col sm:flex-row items-center gap-6 transition-colors ${selectedMenuIndex === 6 ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/10'}`}>
                      <div className="w-32 h-32 shrink-0 bg-black/50 rounded-sm border border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />
                        <ZombieModel variant="normal" />
                      </div>
                      <div className="flex flex-col w-full">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-2xl font-black text-emerald-500 uppercase italic leading-none">Zombie</span>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/60 font-bold uppercase">Common</span>
                              <span className="text-[10px] bg-red-900/40 px-2 py-0.5 rounded-full text-red-400 font-bold uppercase">Hostile</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-white/40 font-bold uppercase tracking-tight leading-tight mt-3 mb-3">
                          Reanimated corpses driven by an insatiable hunger. Their strength and speed increase with each wave.
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase text-white/60 bg-black/20 p-2 rounded-sm border border-white/5">
                          <div className="flex flex-col items-center border-r border-white/10">
                            <span className="text-white/30 text-[8px]">Health</span>
                            <span className="text-emerald-400">150 + 100/Rnd</span>
                          </div>
                          <div className="flex flex-col items-center border-r border-white/10">
                            <span className="text-white/30 text-[8px]">Damage</span>
                            <span className="text-red-400">50 / Hit</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-white/30 text-[8px]">Speed</span>
                            <span className="text-yellow-400">Variable</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Runner Zombie */}
                    <div id="menu-item-7" onClick={() => {}} className={`bg-white/5 p-4 rounded-sm border border-white/10 flex flex-col sm:flex-row items-center gap-6 transition-colors ${selectedMenuIndex === 7 ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/10'}`}>
                      <div className="w-32 h-32 shrink-0 bg-black/50 rounded-sm border border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />
                        <div className="absolute top-2 right-2 bg-red-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded text-white">Round 5+</div>
                        <ZombieModel variant="runner" />
                      </div>
                      <div className="flex flex-col w-full">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-2xl font-black text-red-400 uppercase italic leading-none">Runner</span>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[10px] bg-red-900/60 px-2 py-0.5 rounded-full text-red-200 font-bold uppercase">Fast</span>
                              <span className="text-[10px] bg-red-900/40 px-2 py-0.5 rounded-full text-red-400 font-bold uppercase">Hostile</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-white/40 font-bold uppercase tracking-tight leading-tight mt-3 mb-3">
                          Agile mutations that close the distance quickly. Lower health but extremely dangerous in groups.
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase text-white/60 bg-black/20 p-2 rounded-sm border border-white/5">
                          <div className="flex flex-col items-center border-r border-white/10">
                            <span className="text-white/30 text-[8px]">Health</span>
                            <span className="text-emerald-400">70% Normal</span>
                          </div>
                          <div className="flex flex-col items-center border-r border-white/10">
                            <span className="text-white/30 text-[8px]">Damage</span>
                            <span className="text-red-400">50 / Hit</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-white/30 text-[8px]">Speed</span>
                            <span className="text-red-500">Very Fast</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tank Zombie */}
                    <div id="menu-item-8" onClick={() => {}} className={`bg-white/5 p-4 rounded-sm border border-white/10 flex flex-col sm:flex-row items-center gap-6 transition-colors ${selectedMenuIndex === 8 ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/10'}`}>
                      <div className="w-32 h-32 shrink-0 bg-black/50 rounded-sm border border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />
                        <div className="absolute top-2 right-2 bg-slate-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded text-white">Round 10+</div>
                        <ZombieModel variant="tank" />
                      </div>
                      <div className="flex flex-col w-full">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-2xl font-black text-slate-400 uppercase italic leading-none">Tank</span>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[10px] bg-slate-700/60 px-2 py-0.5 rounded-full text-slate-200 font-bold uppercase">Armored</span>
                              <span className="text-[10px] bg-red-900/40 px-2 py-0.5 rounded-full text-red-400 font-bold uppercase">Hostile</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-white/40 font-bold uppercase tracking-tight leading-tight mt-3 mb-3">
                          Heavily armored juggernauts. Slow movement but massive health pool. Focus fire required.
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase text-white/60 bg-black/20 p-2 rounded-sm border border-white/5">
                          <div className="flex flex-col items-center border-r border-white/10">
                            <span className="text-white/30 text-[8px]">Health</span>
                            <span className="text-emerald-400">250% Normal</span>
                          </div>
                          <div className="flex flex-col items-center border-r border-white/10">
                            <span className="text-white/30 text-[8px]">Damage</span>
                            <span className="text-red-400">75 / Hit</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-white/30 text-[8px]">Speed</span>
                            <span className="text-slate-500">Slow</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Crawler Zombie */}
                    <div id="menu-item-9" onClick={() => {}} className={`bg-white/5 p-4 rounded-sm border border-white/10 flex flex-col sm:flex-row items-center gap-6 transition-colors ${selectedMenuIndex === 9 ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/10'}`}>
                      <div className="w-32 h-32 shrink-0 bg-black/50 rounded-sm border border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />
                        <div className="absolute top-2 right-2 bg-emerald-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded text-white">Round 8+</div>
                        <ZombieModel variant="crawler" />
                      </div>
                      <div className="flex flex-col w-full">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-2xl font-black text-emerald-600 uppercase italic leading-none">Crawler</span>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded-full text-emerald-200 font-bold uppercase">Stealth</span>
                              <span className="text-[10px] bg-red-900/40 px-2 py-0.5 rounded-full text-red-400 font-bold uppercase">Hostile</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-white/40 font-bold uppercase tracking-tight leading-tight mt-3 mb-3">
                          Low-profile mutations that scuttle along the ground. Hard to hit and release toxic gas.
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase text-white/60 bg-black/20 p-2 rounded-sm border border-white/5">
                          <div className="flex flex-col items-center border-r border-white/10">
                            <span className="text-white/30 text-[8px]">Health</span>
                            <span className="text-emerald-400">80% Normal</span>
                          </div>
                          <div className="flex flex-col items-center border-r border-white/10">
                            <span className="text-white/30 text-[8px]">Damage</span>
                            <span className="text-red-400">35 / Hit</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-white/30 text-[8px]">Speed</span>
                            <span className="text-yellow-400">Fast</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Parasite */}
                    <div id="menu-item-10" onClick={() => {}} className={`bg-white/5 p-4 rounded-sm border border-white/10 flex flex-col sm:flex-row items-center gap-6 transition-colors ${selectedMenuIndex === 10 ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/10'}`}>
                      <div className="w-32 h-32 shrink-0 bg-black/50 rounded-sm border border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />
                        <div className="absolute top-2 right-2 bg-purple-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded text-white">Round 12+</div>
                        <ZombieModel variant="parasite" />
                      </div>
                      <div className="flex flex-col w-full">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-2xl font-black text-purple-400 uppercase italic leading-none">Parasite</span>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[10px] bg-purple-900/60 px-2 py-0.5 rounded-full text-purple-200 font-bold uppercase">Flying</span>
                              <span className="text-[10px] bg-red-900/40 px-2 py-0.5 rounded-full text-red-400 font-bold uppercase">Hostile</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-white/40 font-bold uppercase tracking-tight leading-tight mt-3 mb-3">
                          Airborne pests that swarm the player. Weak individually but dangerous in numbers.
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase text-white/60 bg-black/20 p-2 rounded-sm border border-white/5">
                          <div className="flex flex-col items-center border-r border-white/10">
                            <span className="text-white/30 text-[8px]">Health</span>
                            <span className="text-emerald-400">50% Normal</span>
                          </div>
                          <div className="flex flex-col items-center border-r border-white/10">
                            <span className="text-white/30 text-[8px]">Damage</span>
                            <span className="text-red-400">20 / Hit</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-white/30 text-[8px]">Speed</span>
                            <span className="text-red-500">Very Fast</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Inferno Zombie */}
                    <div id="menu-item-11" onClick={() => {}} className={`bg-white/5 p-4 rounded-sm border border-white/10 flex flex-col sm:flex-row items-center gap-6 transition-colors ${selectedMenuIndex === 11 ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/10'}`}>
                      <div className="w-32 h-32 shrink-0 bg-black/50 rounded-sm border border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />
                        <div className="absolute top-2 right-2 bg-orange-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded text-white">Round 15+</div>
                        <ZombieModel variant="inferno" />
                      </div>
                      <div className="flex flex-col w-full">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-2xl font-black text-orange-500 uppercase italic leading-none">Inferno</span>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[10px] bg-orange-900/60 px-2 py-0.5 rounded-full text-orange-200 font-bold uppercase">Explosive</span>
                              <span className="text-[10px] bg-red-900/40 px-2 py-0.5 rounded-full text-red-400 font-bold uppercase">Hostile</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-white/40 font-bold uppercase tracking-tight leading-tight mt-3 mb-3">
                          Volatile zombies infused with element 115. They explode violently upon death, damaging nearby players.
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase text-white/60 bg-black/20 p-2 rounded-sm border border-white/5">
                          <div className="flex flex-col items-center border-r border-white/10">
                            <span className="text-white/30 text-[8px]">Health</span>
                            <span className="text-emerald-400">150% Normal</span>
                          </div>
                          <div className="flex flex-col items-center border-r border-white/10">
                            <span className="text-white/30 text-[8px]">Damage</span>
                            <span className="text-red-400">45 + Burn</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-white/30 text-[8px]">Speed</span>
                            <span className="text-yellow-400">Normal</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Brute */}
                    <div id="menu-item-12" onClick={() => {}} className={`bg-white/5 p-4 rounded-sm border border-white/10 flex flex-col sm:flex-row items-center gap-6 transition-colors ${selectedMenuIndex === 12 ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/10'}`}>
                      <div className="w-32 h-32 shrink-0 bg-black/50 rounded-sm border border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />
                        <div className="absolute top-2 right-2 bg-red-800 text-[8px] font-black uppercase px-1.5 py-0.5 rounded text-white">Round 20+</div>
                        <ZombieModel variant="brute" />
                      </div>
                      <div className="flex flex-col w-full">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-2xl font-black text-red-700 uppercase italic leading-none">Brute</span>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[10px] bg-red-950/60 px-2 py-0.5 rounded-full text-red-200 font-bold uppercase">Elite</span>
                              <span className="text-[10px] bg-red-900/40 px-2 py-0.5 rounded-full text-red-400 font-bold uppercase">Hostile</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-white/40 font-bold uppercase tracking-tight leading-tight mt-3 mb-3">
                          A massive, hulking monstrosity. Extremely durable and deals heavy damage.
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase text-white/60 bg-black/20 p-2 rounded-sm border border-white/5">
                          <div className="flex flex-col items-center border-r border-white/10">
                            <span className="text-white/30 text-[8px]">Health</span>
                            <span className="text-emerald-400">500% Normal</span>
                          </div>
                          <div className="flex flex-col items-center border-r border-white/10">
                            <span className="text-white/30 text-[8px]">Damage</span>
                            <span className="text-red-400">75 / Hit</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-white/30 text-[8px]">Speed</span>
                            <span className="text-slate-500">Very Slow</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dragon Boss */}
                    <div id="menu-item-13" onClick={() => {}} className={`bg-white/5 p-4 rounded-sm border border-white/10 flex flex-col sm:flex-row items-center gap-6 transition-colors ${selectedMenuIndex === 13 ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/10'}`}>
                      <div className="w-32 h-32 shrink-0 bg-black/50 rounded-sm border border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />
                        <DragonModel />
                      </div>
                      <div className="flex flex-col w-full">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-2xl font-black text-red-600 uppercase italic leading-none">Dragon Boss</span>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[10px] bg-yellow-600/20 px-2 py-0.5 rounded-full text-yellow-500 font-bold uppercase">Legendary</span>
                              <span className="text-[10px] bg-red-900/40 px-2 py-0.5 rounded-full text-red-400 font-bold uppercase">Boss</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-white/40 font-bold uppercase tracking-tight leading-tight mt-3 mb-3">
                          Ancient beast summoned through dark rituals. Controls the undead horde and rains fire from above.
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase text-white/60 bg-black/20 p-2 rounded-sm border border-white/5">
                          <div className="flex flex-col items-center border-r border-white/10">
                            <span className="text-white/30 text-[8px]">Health</span>
                            <span className="text-emerald-400">250,000</span>
                          </div>
                          <div className="flex flex-col items-center border-r border-white/10">
                            <span className="text-white/30 text-[8px]">Damage</span>
                            <span className="text-red-400">50 / Hit</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-white/30 text-[8px]">Weakness</span>
                            <span className="text-yellow-400">Head / Heart</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Power-ups Section */}
              {infoTab === 'powerups' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
                  <h3 className="text-xl font-black text-yellow-500 italic uppercase tracking-tighter flex items-center gap-2 border-b border-yellow-900/30 pb-2">
                    <Zap size={20} /> Field Power-Ups
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { name: 'Max Ammo', desc: 'Instantly refills all weapon reserves and tactical equipment.', icon: <RefreshCw size={14} /> },
                      { name: 'Insta-Kill', desc: 'For 30 seconds, any damage dealt to a zombie kills it instantly.', icon: <Skull size={14} /> },
                      { name: 'Double Points', desc: 'All points earned are doubled for 30 seconds.', icon: <Database size={14} /> },
                      { name: 'Nuke', desc: 'Explodes and kills all active zombies on the map. Grants 400 points.', icon: <Bomb size={14} /> },
                      { name: 'Death Machine', desc: 'Grants a minigun with infinite ammo for 30 seconds.', icon: <Swords size={14} /> },
                      { name: 'Fire Sale', desc: 'Spawns the Mystery Box at all locations for 10 points each.', icon: <Flame size={14} /> },
                      { name: 'Zombie Blood', desc: 'Zombies ignore you for 30 seconds.', icon: <UserX size={14} /> },
                    ].map((pu, idx) => (
                      <div key={pu.name} id={`menu-item-${idx + 6}`} className={`bg-white/5 p-4 rounded-sm border border-white/10 flex items-center gap-4 transition-colors ${selectedMenuIndex === idx + 6 ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/10'}`}>
                        <div className="w-10 h-10 shrink-0 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500 border border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                          {pu.icon}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-white uppercase italic">{pu.name}</span>
                          <span className="text-[10px] text-white/40 font-bold uppercase tracking-tight leading-tight mt-1">{pu.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progression Section */}
              {infoTab === 'progression' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
                  <h3 className="text-xl font-black text-emerald-500 italic uppercase tracking-tighter flex items-center gap-2 border-b border-emerald-900/30 pb-2">
                    <Trophy size={20} /> Progression & Prestige
                  </h3>
                  <div className="bg-white/5 p-6 rounded-sm border border-white/10 space-y-6">
                    <p className="text-white/70 text-sm font-medium leading-relaxed">
                      Earn XP by killing zombies, repairing barricades, and surviving rounds. 
                      Level up to increase your base stats and unlock permanent bonuses. 
                      Reach Level 55 to Prestige and gain even greater rewards!
                    </p>
                    
                    <div className="space-y-4">
                      <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">Leveling Rewards</h4>
                      <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Meaningful progression on your journey to Level 55</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="bg-black/20 p-3 rounded border border-white/5 flex items-start gap-3">
                          <div className="text-emerald-500 mt-0.5"><ArrowUp size={16} /></div>
                          <div>
                            <div className="text-sm font-bold text-white uppercase tracking-tight">Every Level</div>
                            <div className="text-xs text-white/60"><span className="text-emerald-400 font-bold">+10</span> Starting Points, <span className="text-emerald-400 font-bold">+1</span> Max Health</div>
                          </div>
                        </div>
                        <div className="bg-black/20 p-3 rounded border border-white/5 flex items-start gap-3">
                          <div className="text-blue-500 mt-0.5"><Star size={16} /></div>
                          <div>
                            <div className="text-sm font-bold text-white uppercase tracking-tight">Every 5 Levels</div>
                            <div className="text-xs text-white/60"><span className="text-blue-400 font-bold">+1%</span> Bonus Damage, <span className="text-blue-400 font-bold">+1%</span> Points Earned</div>
                          </div>
                        </div>
                        <div className="bg-black/20 p-3 rounded border border-white/5 flex items-start gap-3">
                          <div className="text-purple-500 mt-0.5"><Wind size={16} /></div>
                          <div>
                            <div className="text-sm font-bold text-white uppercase tracking-tight">Every 10 Levels</div>
                            <div className="text-xs text-white/60"><span className="text-purple-400 font-bold">+1%</span> Movement Speed, <span className="text-purple-400 font-bold">+1%</span> Reload Speed</div>
                          </div>
                        </div>
                        <div className="bg-black/20 p-3 rounded border border-white/5 flex items-start gap-3">
                          <div className="text-yellow-500 mt-0.5"><Trophy size={16} /></div>
                          <div>
                            <div className="text-sm font-bold text-white uppercase tracking-tight">Level 55</div>
                            <div className="text-xs text-white/60">Unlock Prestige Mode & Exclusive Icon</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-black text-yellow-500 italic uppercase tracking-tighter">Prestige Rewards</h4>
                      <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Stacking bonuses for each Prestige rank</p>
                      <ul className="space-y-2 text-sm text-white/60 font-medium">
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> <span className="text-yellow-400 font-bold">+500</span> Starting Points per Prestige</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> <span className="text-yellow-400 font-bold">+10</span> Max Health per Prestige</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> <span className="text-yellow-400 font-bold">+10%</span> Damage Multiplier per Prestige</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> <span className="text-yellow-400 font-bold">+5%</span> Points Earned per Prestige</li>
                      </ul>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">Prestige Ranks</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                          { level: 1, name: "Initiate", icon: <Star size={20} />, color: "text-amber-600", bg: "bg-amber-600/20", border: "border-amber-600/30" },
                          { level: 2, name: "Veteran", icon: <Shield size={20} />, color: "text-orange-500", bg: "bg-orange-500/20", border: "border-orange-500/30" },
                          { level: 3, name: "Elite", icon: <Zap size={20} />, color: "text-blue-500", bg: "bg-blue-500/20", border: "border-blue-500/30" },
                          { level: 4, name: "Master", icon: <Flame size={20} />, color: "text-red-500", bg: "bg-red-500/20", border: "border-red-500/30" },
                          { level: 5, name: "Grandmaster", icon: <Crown size={20} />, color: "text-purple-500", bg: "bg-purple-500/20", border: "border-purple-500/30" },
                          { level: 6, name: "Legend", icon: <Gem size={20} />, color: "text-cyan-500", bg: "bg-cyan-500/20", border: "border-cyan-500/30" },
                          { level: 7, name: "Mythic", icon: <Award size={20} />, color: "text-pink-500", bg: "bg-pink-500/20", border: "border-pink-500/30" },
                          { level: 8, name: "Immortal", icon: <Medal size={20} />, color: "text-emerald-500", bg: "bg-emerald-500/20", border: "border-emerald-500/30" },
                          { level: 9, name: "Godlike", icon: <Trophy size={20} />, color: "text-yellow-400", bg: "bg-yellow-400/20", border: "border-yellow-400/30" },
                          { level: 10, name: "Prestige Master", icon: <Skull size={20} />, color: "text-red-600", bg: "bg-red-600/20", border: "border-red-600/30" },
                        ].map(p => (
                          <div key={p.level} className={`flex flex-col items-center justify-center p-3 rounded-sm border ${p.border} ${p.bg} transition-transform hover:scale-105`}>
                            <div className={`mb-2 ${p.color} drop-shadow-[0_0_8px_currentColor]`}>{p.icon}</div>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-50">Prestige {p.level}</span>
                            <span className={`text-xs font-bold ${p.color} text-center leading-tight mt-0.5 uppercase`}>{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button id={`menu-item-${(infoTab === 'guns' ? SORTED_WEAPONS.length : infoTab === 'perks' ? 19 : infoTab === 'bombs' ? 3 : infoTab === 'enemies' ? 8 : infoTab === 'progression' ? 1 : 4) + 5}`} onClick={() => setStatus(GameStatus.START)} className={`w-full py-5 bg-emerald-700 text-white font-black text-2xl rounded-sm shadow-2xl active:scale-95 transition-all uppercase italic tracking-tighter border-b-4 border-emerald-950 ${selectedMenuIndex === (infoTab === 'guns' ? SORTED_WEAPONS.length : infoTab === 'perks' ? 19 : infoTab === 'bombs' ? 3 : infoTab === 'enemies' ? 8 : infoTab === 'progression' ? 1 : 4) + 5 ? 'ring-4 ring-white scale-105' : ''}`}>
               Return to Base
            </button>
          </div>
        </div>
      )}

      {/* Weapon Info Modal */}
      {selectedWeaponInfo && (
        <div className="absolute inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedWeaponInfo(null)}>
          <div className="bg-zinc-900 border border-white/10 rounded-sm p-6 max-w-md w-full shadow-2xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{selectedWeaponInfo}</h3>
              <button onClick={() => setSelectedWeaponInfo(null)} className="text-white/50 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="aspect-video bg-black/50 rounded-sm mb-6 border border-white/5 flex items-center justify-center overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />
              <div className="scale-150 transform">
                <GunModel color={WEAPONS[selectedWeaponInfo].color} isPap={isPapWeapon(selectedWeaponInfo)} name={selectedWeaponInfo} />
              </div>
              <div className="absolute bottom-3 left-3 z-20">
                <span className="text-xs font-black uppercase tracking-widest text-white/80 bg-black/60 px-2 py-1 rounded-sm backdrop-blur-md border border-white/10">
                  {isPapWeapon(selectedWeaponInfo) ? 'Pack-A-Punch' : (isWonderWeapon(selectedWeaponInfo) ? 'Wonder Weapon' : 'Standard Issue')}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {WEAPONS[selectedWeaponInfo].description && (
                <div className="bg-blue-500/10 p-3 rounded-sm border border-blue-500/20 mb-4">
                  <span className="text-[10px] text-blue-400 uppercase font-black tracking-widest block mb-1">Special Feature</span>
                  <span className="text-sm font-bold text-white italic">{WEAPONS[selectedWeaponInfo].description}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-sm border border-white/10">
                  <span className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-1">Damage</span>
                  <span className="text-xl font-black text-red-500 italic">{WEAPONS[selectedWeaponInfo].damage}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-sm border border-white/10">
                  <span className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-1">Fire Rate</span>
                  <span className="text-xl font-black text-emerald-500 italic">{WEAPONS[selectedWeaponInfo].rate}ms</span>
                </div>
                <div className="bg-white/5 p-3 rounded-sm border border-white/10">
                  <span className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-1">Magazine</span>
                  <span className="text-xl font-black text-blue-400 italic">{WEAPONS[selectedWeaponInfo].clip}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-sm border border-white/10">
                  <span className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-1">Reserves</span>
                  <span className="text-xl font-black text-yellow-500 italic">{WEAPONS[selectedWeaponInfo].max}</span>
                </div>
              </div>
              
              <div className="bg-white/5 p-3 rounded-sm border border-white/10">
                <span className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-2">Performance Profile</span>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-white/60 mb-1">
                      <span>Stopping Power</span>
                      <span>{Math.round((WEAPONS[selectedWeaponInfo].damage / 1000) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-black rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (WEAPONS[selectedWeaponInfo].damage / 1000) * 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-white/60 mb-1">
                      <span>Mobility</span>
                      <span>{Math.round((0.1 / 0.15) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-black rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (0.1 / 0.15) * 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-white/60 mb-1">
                      <span>Handling</span>
                      <span>{Math.round((100 / 2000) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-black rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (100 / 2000) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
