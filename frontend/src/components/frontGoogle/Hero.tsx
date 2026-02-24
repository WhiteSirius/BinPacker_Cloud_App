// @ts-nocheck
import React from 'react';

interface HeroProps {
  scrollTo: (id: string) => void;
  isLoggedIn: boolean;
  onAccessAccount: () => void;
}

const Hero: React.FC<HeroProps> = ({ scrollTo, isLoggedIn, onAccessAccount }) => {
  /**
   * EDIT HERE — push the hero text block down (px)
   * Increase this to move the headline/subtitle/buttons lower.
   */
  const heroTextOffsetTopPx = 60;

  return (
    <section className="py-24 md:py-32 text-center relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-900/30 rounded-full blur-3xl animate-pulse"></div>
      </div>
      <div className="container mx-auto px-6 relative z-10">
        <div style={{ marginTop: `${heroTextOffsetTopPx}px` }}>
        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 animate-fade-in-down">
          Optimize Your Truck Loading with <br className="hidden md:block" />
          <span className="text-cyan-400 text-glow">Cloud-Powered 3D Bin Packing</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-8 animate-fade-in-up">
          Maximize space utilization, ensure EU compliance, and reduce costs with our intelligent collision points
          algorithm.
        </p>
        <div className="flex justify-center items-center space-x-4 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <button
            onClick={isLoggedIn ? onAccessAccount : () => scrollTo('auth')}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 glow-shadow"
          >
            {isLoggedIn ? 'Access your account' : 'Get Started Free'}
          </button>
          <button
            onClick={() => scrollTo('features')}
            className="border border-purple-500 text-purple-400 hover:bg-purple-500/20 font-bold text-lg px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Learn More
          </button>
        </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
      `}</style>
    </section>
  );
};

export default Hero;


