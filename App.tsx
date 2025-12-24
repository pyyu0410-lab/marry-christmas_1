
import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { TreeMorphState } from './types';
import Experience from './Experience';
import { COLORS } from './constants';

const UI: React.FC<{ 
  state: TreeMorphState, 
  onToggle: () => void
}> = ({ state, onToggle }) => {
  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col justify-between p-8 md:p-12">
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div>
          <h1 className="text-4xl md:text-6xl font-serif text-[#D4AF37] tracking-tighter uppercase leading-none">
            Marry Christmas
          </h1>
          <p className="text-xs md:text-sm text-[#043927] font-bold tracking-[0.3em] uppercase mt-2 bg-[#D4AF37] px-2 py-1 inline-block">
            Have a Nice Day
          </p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-[#D4AF37] opacity-50 text-[10px] uppercase tracking-widest">COLLECTION 2025</p>
          <p className="text-[#D4AF37] text-2xl font-serif italic mt-1 drop-shadow-lg">Bless you</p>
        </div>
      </div>

      {/* Footer / Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 pointer-events-auto">
        <div className="max-w-xs order-2 md:order-1 text-center md:text-left">
          <h2 className="text-[#D4AF37] text-lg font-serif">
            From PYY
          </h2>
          <p className="text-white/40 text-xs mt-2 leading-relaxed">
            Witness the convergence of high-jewelry geometry and organic emerald foliage in a cinematic 3D space.
          </p>
        </div>

        <div className="flex items-center gap-4 order-1 md:order-2">
            <button
              onClick={onToggle}
              className="group relative px-12 py-5 overflow-hidden transition-all duration-500 bg-transparent border border-[#D4AF37]"
            >
              <div className="absolute inset-0 bg-[#D4AF37] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10 text-[#D4AF37] group-hover:text-[#01120b] font-bold tracking-widest text-xs uppercase transition-colors duration-500">
                {state === TreeMorphState.SCATTERED ? 'Assemble Tree' : 'Scatter Particles'}
              </span>
            </button>
        </div>

        <div className="hidden lg:flex gap-4 items-center order-3">
            <div className="w-12 h-[1px] bg-[#D4AF37]/30" />
            <span className="text-[10px] text-[#D4AF37] tracking-[0.5em] uppercase">Scroll to Explore</span>
        </div>
      </div>

      {/* Decoration lines */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1px] h-12 bg-[#D4AF37]/20" />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-12 bg-[#D4AF37]/20" />
    </div>
  );
};

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeMorphState>(TreeMorphState.SCATTERED);

  const toggleState = useCallback(() => {
    setTreeState(prev => 
      prev === TreeMorphState.SCATTERED ? TreeMorphState.TREE_SHAPE : TreeMorphState.SCATTERED
    );
  }, []);

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        }}
      >
        <Experience state={treeState} />
      </Canvas>
      <UI 
        state={treeState} 
        onToggle={toggleState} 
      />
      
      {/* Aesthetic Overlay Gradient */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-black/60" />
    </div>
  );
};

export default App;
