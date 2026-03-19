import { PlayerProfile } from './types';

export interface CallingCard {
  id: string;
  name: string;
  description: string;
  style: string; // Tailwind class
  condition?: (profile: PlayerProfile) => boolean;
}

export const CALLING_CARDS: CallingCard[] = [
  { id: 'default', name: 'Default', description: 'The standard calling card.', style: 'bg-zinc-700' },
  { id: 'zombie_slayer', name: 'Zombie Slayer', description: 'Kill 1000 zombies.', style: 'bg-red-900', condition: (p) => p.totalKills >= 1000 },
  { id: 'zombie_exterminator', name: 'Zombie Exterminator', description: 'Kill 10000 zombies.', style: 'bg-red-950 border border-red-500', condition: (p) => p.totalKills >= 10000 },
  { id: 'gem_collector', name: 'Gem Collector', description: 'Collect 500 gems.', style: 'bg-blue-900', condition: (p) => p.totalGems >= 500 },
  { id: 'gem_hoarder', name: 'Gem Hoarder', description: 'Collect 5000 gems.', style: 'bg-blue-950 border border-blue-400', condition: (p) => p.totalGems >= 5000 },
  { id: 'headshot_master', name: 'Headshot Master', description: 'Get 500 headshots.', style: 'bg-yellow-900', condition: (p) => p.totalHeadshots >= 500 },
  { id: 'sharpshooter', name: 'Sharpshooter', description: 'Get 5000 headshots.', style: 'bg-yellow-950 border border-yellow-500', condition: (p) => p.totalHeadshots >= 5000 },
  { id: 'medic', name: 'Medic', description: 'Revive 50 teammates.', style: 'bg-emerald-900', condition: (p) => p.totalRevives >= 50 },
  { id: 'combat_medic', name: 'Combat Medic', description: 'Revive 500 teammates.', style: 'bg-emerald-950 border border-emerald-500', condition: (p) => p.totalRevives >= 500 },
  { id: 'knife_expert', name: 'Knife Expert', description: 'Get 250 knife kills.', style: 'bg-zinc-800 border border-zinc-400', condition: (p) => p.totalKnifeKills >= 250 },
  { id: 'ninja', name: 'Ninja', description: 'Get 2500 knife kills.', style: 'bg-zinc-950 border border-zinc-300', condition: (p) => p.totalKnifeKills >= 2500 },
  { id: 'explosive_expert', name: 'Explosive Expert', description: 'Get 500 equipment kills.', style: 'bg-orange-900', condition: (p) => p.totalEquipmentKills >= 500 },
  { id: 'demolition_man', name: 'Demolition Man', description: 'Get 5000 equipment kills.', style: 'bg-orange-950 border border-orange-500', condition: (p) => p.totalEquipmentKills >= 5000 },
  { id: 'boss_hunter', name: 'Boss Hunter', description: 'Defeat 10 bosses.', style: 'bg-purple-900', condition: (p) => p.bossKills >= 10 },
  { id: 'boss_slayer', name: 'Boss Slayer', description: 'Defeat 100 bosses.', style: 'bg-purple-950 border border-purple-500', condition: (p) => p.bossKills >= 100 },
  { id: 'veteran', name: 'Veteran', description: 'Reach Level 50.', style: 'bg-gradient-to-r from-yellow-600 to-yellow-800', condition: (p) => p.level >= 50 },
  { id: 'prestige_master', name: 'Prestige Master', description: 'Reach Level 100.', style: 'bg-gradient-to-r from-yellow-400 via-yellow-600 to-yellow-800 border border-yellow-300', condition: (p) => p.level >= 100 },
  { id: 'shop_zombie_slayer', name: 'Shop: Zombie Slayer', description: 'Purchased from the Black Market', style: 'bg-red-800 border-2 border-red-500', condition: (p) => p.shopItems?.callingCards?.includes('zombie_slayer') },
  { id: 'shop_boss_killer', name: 'Shop: Boss Killer', description: 'Purchased from the Black Market', style: 'bg-purple-800 border-2 border-purple-500', condition: (p) => p.shopItems?.callingCards?.includes('boss_killer') },
  { id: 'shop_gem_collector', name: 'Shop: Gem Collector', description: 'Purchased from the Black Market', style: 'bg-cyan-800 border-2 border-cyan-500', condition: (p) => p.shopItems?.callingCards?.includes('gem_collector') },
];

export const isCallingCardUnlocked = (card: CallingCard, profile: PlayerProfile): boolean => {
  if (!card.condition) return true;
  return card.condition(profile);
};
