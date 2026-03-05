import * as THREE from 'three';

export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAMEOVER = 'GAMEOVER',
  LEADERBOARD = 'LEADERBOARD',
  SETTINGS = 'SETTINGS',
  INFO = 'INFO',
  ACHIEVEMENTS = 'ACHIEVEMENTS',
  CUSTOM_GAME = 'CUSTOM_GAME',
  LOBBY = 'LOBBY',
  LOADOUT = 'LOADOUT'
}

export type GameMode = 'standard' | 'dead_ops';

export type PowerUpType = 'MAX_AMMO' | 'INSTA_KILL' | 'DOUBLE_POINTS' | 'NUKE' | 'DEATH_MACHINE' | 'FIRE_SALE' | 'ZOMBIE_BLOOD' | 'SKIP_ROUND' | 'GEM' | 'GRENADE' | 'FLASHBANG' | 'KING_ROBBO' | 'MONKEY_BOMB';

export type WeaponCamo = 'none' | 'gilded' | 'crystal' | 'void_matter' | 'sakura' | 'wyvern' | 'frost' | 'lava' | 'galaxy' | 'crimson_hex' | 'abyss' | 'stellar' | 'prism';
export type WeaponAttachment = 'none' | 'red_dot' | 'acog' | 'foregrip' | 'extended_mag' | 'laser_sight' | 'suppressor';

export interface ScoreEntry {
  nickname: string;
  round: number;
  kills: number;
  headshots: number;
  knifeKills: number;
  equipmentKills: number;
  gems: number;
  time: number;
  date: number;
  mapId: string;
  isBuyableEnding?: boolean;
  bossDefeated?: boolean;
  red9QuestCompleted?: boolean;
  mainEasterEggCompleted?: boolean;
  rankMasteryStars?: number;
  level?: number;
  rankMastery?: number;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  points: number;
  totalPoints: number;
  kills: number;
  headshots: number;
  knifeKills: number;
  equipmentKills: number;
  gems: number;
  round: number;
  zombiesRemaining: number;
  ammo: number;
  maxAmmo: number;
  secondaryAmmo: number;
  secondaryMaxAmmo: number;
  tertiaryAmmo: number;
  tertiaryMaxAmmo: number;
  perks: string[];
  weaponTier: number;
  secondaryWeaponTier: number;
  tertiaryWeaponTier: number;
  weaponName: string;
  secondaryWeaponName: string | null;
  tertiaryWeaponName: string | null;
  attachments: WeaponAttachment[];
  secondaryAttachments: WeaponAttachment[];
  tertiaryAttachments: WeaponAttachment[];
  activeSlot: 0 | 1 | 2;
  healthRefillsBought: number;
  grenades: number;
  flashbangs: number;
  kingRobbos: number;
  time: number;
  activeMapId?: string;
  selectedCamo: WeaponCamo;
  hasBowie: boolean;
  isDowned: boolean;
  downedTimer: number;
  downs: number;
  deaths: number;
  revives: number;
  isReviving: boolean;
  variant: number;
}

export type ZombieType = 'normal' | 'runner' | 'tank' | 'inferno' | 'parasite' | 'crawler' | 'brute';

export interface Zombie {
  id: string;
  position: [number, number, number];
  hp: number;
  type: ZombieType;
}

export interface HUDSettings {
  controlMode?: 'touch' | 'pc' | 'gamepad';
  buttonScale: number;
  hudScale: number;
  statsPos: { x: number; y: number };
  healthBarPos: { x: number; y: number };
  weaponPos: { x: number; y: number };
  pausePos: { x: number; y: number };
  joystickPos: { x: number; y: number };
  grenadePos: { x: number; y: number };
  flashbangPos: { x: number; y: number };
  jumpPos: { x: number; y: number };
  switchPos: { x: number; y: number };
  knifePos: { x: number; y: number };
  shootPos: { x: number; y: number };
  reloadPos: { x: number; y: number };
  ammoPos: { x: number; y: number };
  kingRobboPos: { x: number; y: number };
  minimapPos?: { x: number; y: number };
  minimapVisible?: boolean;
  minimapScale?: number;
  gemPos?: { x: number; y: number };
  slidePos?: { x: number; y: number };
}

export interface GamepadSettings {
  jump: number;
  sprint: number;
  interact: number;
  reload: number;
  switchWeapon: number;
  knife: number;
  grenade: number;
  flashbang: number;
  kingRobbo: number;
  slide: number;
  select: number;
  pause: number;
  shoot: number;
  aim: number;
  sensitivityX: number;
  sensitivityY: number;
}

export interface GameSettings {
  sfxVolume: number;
  musicVolume: number;
  weatherType: 'clear' | 'rain' | 'fog' | 'dynamic';
  musicEnabled: boolean;
  customMusicUrl: string;
  customPlaylist: { name: string; url: string }[];
}

export interface KeybindSettings {
  moveForward: string;
  moveBackward: string;
  moveLeft: string;
  moveRight: string;
  lookUp: string;
  lookDown: string;
  lookLeft: string;
  lookRight: string;
  jump: string;
  sprint: string;
  interact: string;
  reload: string;
  switchWeapon: string;
  knife: string;
  grenade: string;
  flashbang: string;
  kingRobbo: string;
  slide: string;
  select: string;
  scrollUp: string;
  scrollDown: string;
  scrollLeft: string;
  scrollRight: string;
  pause: string;
  shoot: string;
  aim: string;
}

export interface MapObject {
  type: 'box' | 'wall' | 'cylinder' | 'plane' | 'building' | 'streetlight';
  pos: [number, number, number];
  args?: [number, number, number];
  color?: string;
  texture?: string;
  rotation?: [number, number, number];
  label?: string;
  lightColor?: string;
  doorCost?: number;
  doorId?: string;
}

export interface InteractableConfig {
  id: string;
  type: string;
  cost: number;
  pos: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
}

export interface MapConfig {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  floorColor: string;
  floorTexture: string;
  skyColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  objects: MapObject[];
  interactables: InteractableConfig[];
  spawnPoints: [number, number, number][];
  craftingTablePos: [number, number, number];
}

export interface ZombieData {
  id: string;
  position: THREE.Vector3;
  hp: number;
  maxHp: number;
  speed: number;
  lastAttack: number;
  hitFlash: number;
  variant: number;
  stunTimer: number;
  type: 'normal' | 'runner' | 'tank' | 'inferno' | 'parasite' | 'crawler' | 'brute';
  turnDirection?: number;
  turnTimer?: number;
  timeNotClose?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  mapId?: string;
  category: 'combat' | 'map' | 'progression' | 'easter_egg';
}

export interface PlayerScore {
  id: string;
  name: string;
  points: number;
  kills: number;
  revives: number;
  downs: number;
  headshots: number;
  knifeKills: number;
  equipmentKills: number;
  gems?: number;
  ping: number; // 0 for bots
  isBot: boolean;
  isDowned: boolean;
  downedTimer: number;
  hp: number;
  position?: { x: number; y: number; z: number };
  level?: number;
  rankMastery?: number;
  variant?: number;
  isReviving?: boolean;
}

export interface Progression {
  xp: number;
  rankMastery: number;
  stars: number;
  achievements: string[];
  weaponAttachments?: Record<string, WeaponAttachment[]>;
  weaponXp?: Record<string, number>;
  totalKills?: number;
  totalRevives?: number;
}
