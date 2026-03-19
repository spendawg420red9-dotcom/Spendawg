import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stage, OrbitControls } from '@react-three/drei';
import { LocalPlayerModel } from './Scene';
import * as THREE from 'three';

export const Player3DViewer = ({ customization }: { customization: any }) => {
  return (
    <div className="w-full h-[400px] bg-black/40 rounded-sm border border-white/10 relative overflow-hidden">
      <Canvas shadows camera={{ position: [0, 2, 5], fov: 50 }}>
        <Stage intensity={0.5} environment="city" adjustCamera={false}>
          <Suspense fallback={null}>
            <LocalPlayerModel 
              playerPos={new THREE.Vector3(0, 0, 0)}
              playerRot={new THREE.Euler(0, 0, 0)}
              isDowned={false}
              weaponName="pistol"
              camo="none"
              isShooting={false}
              isJumping={false}
              customization={customization}
              variant={0}
            />
          </Suspense>
        </Stage>
        <OrbitControls enablePan={false} enableZoom={true} minDistance={2} maxDistance={10} autoRotate />
      </Canvas>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1 rounded-full border border-white/20 text-[10px] text-white/60 font-black uppercase tracking-widest pointer-events-none">
        Drag to Rotate • Scroll to Zoom
      </div>
    </div>
  );
};
