import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Orb 1: Violet / Indigo Glow (Top Left) */}
      <div 
        className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-indigo-600/20 via-violet-600/15 to-transparent blur-[110px] animate-orb-1" 
      />

      {/* Orb 2: Cyan / Blue Glow (Top Right) */}
      <div 
        className="absolute top-20 -right-40 w-[580px] h-[580px] rounded-full bg-gradient-to-br from-cyan-600/15 via-blue-600/15 to-transparent blur-[120px] animate-orb-2" 
      />

      {/* Orb 3: Emerald / Teal Glow (Bottom Center) */}
      <div 
        className="absolute -bottom-36 left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-t from-emerald-600/15 via-teal-600/10 to-transparent blur-[130px] animate-orb-3" 
      />

      {/* Subtle Dot Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60" />

      {/* Vignette edge darkening */}
      <div className="absolute inset-0 bg-radial-vignette opacity-40" />
    </div>
  );
};
