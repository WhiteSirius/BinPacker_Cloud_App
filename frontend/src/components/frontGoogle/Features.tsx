import React from 'react';
import { CubeIcon, ShieldCheckIcon, ChartBarIcon, FileSpreadsheetIcon } from './Icons';

const features = [
  {
    icon: <CubeIcon />,
    title: 'Intelligent 3D Optimization',
    description: 'Advanced algorithm achieves >90% space utilization with real-time 3D visualization.',
  },
  {
    icon: <ShieldCheckIcon />,
    title: 'EU Logistics Compliant',
    description: 'Built-in compliance with European transport regulations and safety standards.',
  },
  {
    icon: <ChartBarIcon />,
    title: 'Live Optimization Results',
    description: 'Instant feedback with detailed metrics and interactive visualization.',
  },
  {
    icon: <FileSpreadsheetIcon />,
    title: 'Easy Data Import',
    description: 'Import cargo data directly from Excel spreadsheets with a single click.',
  },
];

const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-slate-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Core Features</h2>
          <p className="text-slate-400 mt-2">Everything you need for smarter logistics.</p>
          <div className="mt-4 w-24 h-1 bg-cyan-500 mx-auto rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center transform transition-all duration-300 hover:scale-105 hover:bg-slate-700 hover:border-cyan-500"
            >
              <div className="flex justify-center items-center mb-4 text-cyan-400">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;





