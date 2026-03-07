import React, { useState } from 'react';
import { PlayerProfile } from '../types';

interface Props {
  profile: PlayerProfile;
  onClose: () => void;
  onUpdateProfile: (profile: PlayerProfile) => void;
}

export const PlayerProfileModal: React.FC<Props> = ({ profile, onClose, onUpdateProfile }) => {
  const [clanTag, setClanTag] = useState(profile.clanTag || '');

  const handleClanTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 5);
    setClanTag(value);
    onUpdateProfile({ ...profile, clanTag: value });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-full max-w-2xl text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black uppercase italic tracking-tight">Player Profile: {profile.nickname}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">Close</button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-zinc-800 p-4 rounded-xl">
              <label className="block text-xs font-bold text-zinc-400 uppercase">Clan Tag</label>
              <input 
                type="text" 
                value={clanTag} 
                onChange={handleClanTagChange}
                maxLength={5}
                className="w-full bg-zinc-700 p-2 rounded mt-1 font-mono uppercase"
                placeholder="TAG"
              />
            </div>
            <div className="bg-zinc-800 p-4 rounded-xl">
              <h3 className="text-sm font-bold text-zinc-400 uppercase mb-2">Stats</h3>
              <p>Level: {profile.level}</p>
              <p>Total Kills: {profile.totalKills}</p>
              <p>Boss Kills: {profile.bossKills}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-zinc-800 p-4 rounded-xl">
              <h3 className="text-sm font-bold text-zinc-400 uppercase mb-2">Most Used Guns</h3>
              {Object.entries(profile.mostUsedGuns).map(([gun, kills]) => (
                <p key={gun}>{gun}: {kills} kills</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
