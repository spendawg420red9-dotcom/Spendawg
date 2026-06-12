import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stage, OrbitControls } from '@react-three/drei';
import { LocalPlayerModel } from './Scene';
import * as THREE from 'three';

export const Player3DViewer = ({ customization, profile, height = "h-[400px]" }: { customization?: any; profile?: any; height?: string }) => {
  const activeConfig = customization || profile;
  return (
    <div className={`w-full ${height} bg-black/40 rounded-sm border border-white/10 relative overflow-hidden`}>
      <Canvas camera={{ position: [0, 1.0, 8], fov: 35 }}>
        <Stage intensity={0.6} environment="city" adjustCamera={false} shadows={false}>
          <Suspense fallback={null}>
            <LocalPlayerModel 
              playerPos={new THREE.Vector3(0, 1.2, 0)}
              playerRot={new THREE.Euler(0, 0, 0)}
              isDowned={false}
              weaponName="pistol"
              camo="none"
              isShooting={false}
              isJumping={false}
              customization={activeConfig}
              variant={0}
              isVictoryPose={true}
            />
          </Suspense>
        </Stage>
        <OrbitControls enablePan={true} enableZoom={true} minDistance={1.5} maxDistance={8} />
      </Canvas>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1 rounded-full border border-white/20 text-[10px] text-white/60 font-black uppercase tracking-widest pointer-events-none">
        Drag to Rotate • Scroll to Zoom
      </div>
    </div>
  );
};

