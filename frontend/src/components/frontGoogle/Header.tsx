// @ts-nocheck
import React from 'react';

interface HeaderProps {
  scrollTo: (id: string) => void;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ scrollTo, isLoggedIn, onLoginClick, onLogoutClick }) => {
  /**
   * EDIT HERE — Header logo sizing/position
   * - Put your logo file in: `frontend/public/brand-logo.png` (or change `src`)
   * - Size in PX via `heightPx`
   * - Position tweak in % via `offsetXPct` / `offsetYPct` (applied as translate%)
   */
  const headerLogo = {
    src: '/brand-logo.png',
    alt: 'BinPacker',
    heightPx: 28, // smaller logo (change freely)
    offsetXPct: 0, // e.g. -10 moves left, +10 moves right (relative to itself)
    offsetYPct: 0, // e.g. -10 moves up, +10 moves down (relative to itself)
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-cyan-500/20">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Brand logo:
            Put your file at: frontend/public/brand-logo.png
            (or change the src below to match your filename/path) */}
        <div className="flex items-center gap-3">
          <img
            src={headerLogo.src}
            alt={headerLogo.alt}
            className="select-none"
            style={{
              height: `${headerLogo.heightPx}px`,
              width: 'auto',
              transform: `translate(${headerLogo.offsetXPct}%, ${headerLogo.offsetYPct}%)`,
            }}
            draggable={false}
          />
        </div>
        <nav className="hidden md:flex items-center space-x-8">
          <button
            onClick={() => scrollTo('features')}
            className="text-slate-300 hover:text-cyan-400 transition-colors duration-300"
          >
            Features
          </button>
          <button
            onClick={() => scrollTo('benefits')}
            className="text-slate-300 hover:text-cyan-400 transition-colors duration-300"
          >
            Benefits
          </button>
          <button
            onClick={isLoggedIn ? onLogoutClick : onLoginClick}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-5 py-2 rounded-md transition-all duration-300 transform hover:scale-105 glow-shadow"
          >
            {isLoggedIn ? 'Log out' : 'Login'}
          </button>
        </nav>
        <div className="md:hidden">
          <button
            onClick={isLoggedIn ? onLogoutClick : onLoginClick}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-4 py-2 rounded-md transition-all duration-300 transform hover:scale-105 glow-shadow"
          >
            {isLoggedIn ? 'Log out' : 'Login'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;


