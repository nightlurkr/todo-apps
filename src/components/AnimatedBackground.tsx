import React from 'react';

/**
 * Orb beranimasi dengan blur 110-130px itu penyebab utama lag di HP:
 * tiap frame GPU harus memblur ulang layer sebesar layar. Di layar kecil
 * orb-nya tidak dirender sama sekali, hanya gradien statis.
 */
export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="hidden md:block absolute inset-0">
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-indigo-600/20 via-violet-600/15 to-transparent blur-[110px] animate-orb-1" />
        <div className="absolute top-20 -right-40 w-[580px] h-[580px] rounded-full bg-gradient-to-br from-cyan-600/15 via-blue-600/15 to-transparent blur-[120px] animate-orb-2" />
        <div className="absolute -bottom-36 left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-t from-emerald-600/15 via-teal-600/10 to-transparent blur-[130px] animate-orb-3" />
      </div>

      {/* Mobile: satu gradien statis, nol biaya per frame. */}
      <div className="md:hidden absolute inset-0 bg-static-ambient" />

      <div className="absolute inset-0 bg-grid-pattern opacity-50" />
    </div>
  );
};
