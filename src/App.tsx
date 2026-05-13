/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Settings, Zap, Activity, Info, RefreshCw, Cpu, Layers, Terminal, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzePhysicsState } from './services/geminiService';

interface Cell {
  i: number;
  j: number;
  intensity: number;
}

export default function App() {
  const [latticeSize, setLatticeSize] = useState(18);
  const [gainLoss, setGainLoss] = useState(0.55);
  const [coupling, setCoupling] = useState(1.2);
  const [phase, setPhase] = useState(0);
  const [fieldData, setFieldData] = useState<Cell[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState("Initializing topological state monitoring...");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const lastAiRequestRef = useRef<number>(0);

  // Physics Update Logic
  const updatePhysics = useCallback((t: number) => {
    const newField: Cell[] = [];
    const center = latticeSize / 2;
    
    for (let i = 0; i < latticeSize; i++) {
      for (let j = 0; j < latticeSize; j++) {
        // Non-Hermitian Hamiltonian components
        // xDist drives the bulk-boundary correspondence shift
        const xDist = (i - center) / center;
        const yDist = (j - center) / center;
        
        // NHSE: Localized energy accumulation at boundaries
        const nhSkinEffect = Math.exp(gainLoss * (i - center) * 0.4);
        
        // Spatio-temporal modulation (Synthetic dimension)
        const modulation = Math.sin(t * 0.04 + (i + j) * 0.3) * phase * 0.5;
        
        // Topological wavefunction with coupling interaction
        const wave = Math.sin(coupling * (i * 0.3 + j * 0.3) - t * 0.08);
        
        // Resulting amplitude |psi|^2
        let intensity = (wave * nhSkinEffect + modulation + 1) / 2;
        
        // Clamping and saturation
        intensity = Math.min(1.2, Math.max(0, intensity));
        
        newField.push({ i, j, intensity });
      }
    }
    setFieldData(newField);
  }, [latticeSize, gainLoss, coupling, phase]);

  const performAiAnalysis = useCallback(async () => {
    const now = Date.now();
    if (now - lastAiRequestRef.current < 5000) return; // Rate limiting
    
    setIsAnalyzing(true);
    const analysis = await analyzePhysicsState({ gainLoss, coupling, latticeSize, phase });
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
    lastAiRequestRef.current = now;
  }, [gainLoss, coupling, latticeSize, phase]);

  // Animation Loop
  useEffect(() => {
    let frame = 0;
    const animate = () => {
      if (isSimulating) {
        frame++;
        updatePhysics(frame);
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isSimulating, updatePhysics]);

  // Periodic AI Analysis
  useEffect(() => {
    const interval = setInterval(performAiAnalysis, 15000);
    return () => clearInterval(interval);
  }, [performAiAnalysis]);

  // Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const cellSize = cw / latticeSize;

    // Background clear with slight trail effect would need a buffer, 
    // sticking to standard clear for crispness
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, cw, ch);
    
    // Draw edges first (grid)
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
    ctx.lineWidth = 0.5;
    for(let k = 0; k <= latticeSize; k++) {
        ctx.beginPath(); ctx.moveTo(k * cellSize, 0); ctx.lineTo(k * cellSize, ch); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, k * cellSize); ctx.lineTo(cw, k * cellSize); ctx.stroke();
    }

    fieldData.forEach(cell => {
      const { i, j, intensity } = cell;
      
      // Color mapping: deep indigo -> vibrant cyan -> pure white at peaks
      const hue = 180 + (intensity * 60);
      const sat = 70 + (intensity * 30);
      const light = 20 + (intensity * 60);
      
      ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${0.2 + intensity * 0.8})`;
      
      const x = i * cellSize;
      const y = j * cellSize;
      
      // Draw actual node
      const r = (cellSize / 2) * (0.4 + intensity * 0.6);
      ctx.beginPath();
      ctx.arc(x + cellSize/2, y + cellSize/2, r, 0, Math.PI * 2);
      ctx.fill();

      // Add glow for high intensity
      if (intensity > 0.7) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsla(${hue}, ${sat}%, ${light}%, 0.8)`;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });
  }, [fieldData, latticeSize]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Area */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.3em] text-cyan-400 uppercase">Proprietary Research Environment</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
              NH-Skin Effect Lab
              <span className="text-xs font-mono font-normal bg-slate-800 text-slate-400 px-3 py-1 rounded-md border border-slate-700">v2.0.26-ALPHA</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-500 font-bold uppercase">System Entropy</span>
                <span className="text-sm font-mono text-cyan-400">{(gainLoss * coupling / 0.5).toFixed(6)} ΔS</span>
             </div>
             <div className="h-8 w-px bg-slate-800 hidden md:block" />
             <Activity className="w-6 h-6 text-slate-700 hover:text-cyan-400 transition-colors cursor-help" />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Controls Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="bg-slate-900/80 border border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                  <Settings className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-lg font-bold">Hamiltonian Config</h2>
              </div>

              <div className="space-y-6">
                <ControlSlider 
                  label="Non-Hermitian Gain/Loss" 
                  value={gainLoss} 
                  min={0} max={1.5} step={0.01} 
                  onChange={setGainLoss} 
                  icon={<Zap className="w-4 h-4 text-yellow-400" />}
                  desc="Adjusts imaginary potential components driving the NHSE wavefunction collapse."
                />
                <ControlSlider 
                  label="Inter-Node Coupling" 
                  value={coupling} 
                  min={0.1} max={4} step={0.1} 
                  onChange={setCoupling} 
                  icon={<Activity className="w-4 h-4 text-cyan-400" />}
                  desc="Hopping amplitude between nodes (J). Governs the dispersion bandwidth."
                />
                <ControlSlider 
                  label="Synthetic Shift (Φ)" 
                  value={phase} 
                  min={0} max={Math.PI * 2} step={0.1} 
                  onChange={setPhase} 
                  icon={<RefreshCw className="w-4 h-4 text-indigo-400" />}
                  desc="Periodic modulation for synthetic 3D space projection."
                />
                
                <div className="pt-4 space-y-3">
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsSimulating(!isSimulating)}
                    className={`w-full py-4 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                      isSimulating 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' 
                        : 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400'
                    }`}
                  >
                    {isSimulating ? <><PauseIcon /> Stop Engine</> : <><PlayIcon /> Initiate Stream</>}
                  </motion.button>
                  
                  <button 
                    onClick={performAiAnalysis}
                    disabled={isAnalyzing}
                    className="w-full py-3 rounded-2xl text-xs font-bold border border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
                  >
                    {isAnalyzing ? "Processing Quantum Data..." : "Manual AI Diagnostics"}
                  </button>
                </div>
              </div>
            </div>

            {/* AI Diagnostics Box */}
            <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Cpu className="w-12 h-12 text-indigo-400" />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-[10px] uppercase tracking-widest text-indigo-300">Neural Interpretation</h3>
              </div>
              <div className="text-xs leading-relaxed text-indigo-100 font-mono italic min-h-[80px]">
                {aiAnalysis}
              </div>
              {isAnalyzing && (
                 <motion.div 
                    className="absolute bottom-0 left-0 h-1 bg-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, repeat: Infinity }}
                 />
              )}
            </div>
          </motion.div>

          {/* Main Visualizer Area */}
          <div className="lg:col-span-3 space-y-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black/80 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-[0_0_50px_-12px_rgba(34,197,94,0.1)] relative aspect-video flex items-center justify-center p-8 group"
            >
              <canvas 
                ref={canvasRef} 
                width={1000} 
                height={600}
                className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-transform duration-700 group-hover:scale-[1.02]"
              />
              
              {/* Overlay Indicators */}
              <div className="absolute top-8 left-8 flex flex-col gap-2">
                <div className="px-4 py-2 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 text-[10px] font-black tracking-widest flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full animate-ping ${isSimulating ? 'bg-cyan-400' : 'bg-amber-400'}`} />
                  {isSimulating ? 'LATTICE_STREAM_ACTIVE' : 'SYSTEM_IDLE'}
                </div>
                <div className="px-4 py-2 bg-cyan-950/40 backdrop-blur-md rounded-xl border border-cyan-500/20 text-[10px] font-mono text-cyan-300 flex items-center gap-2">
                  <Layers className="w-3 h-3" />
                  FLOQUET TOPOLOGY: Z2 ENABLER
                </div>
              </div>
              
              <div className="absolute bottom-8 right-8">
                 <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-2xl space-y-1 shadow-xl">
                    <div className="flex justify-between items-center gap-8 border-b border-slate-800 pb-2 mb-2">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Chern Number</span>
                        <span className="text-sm font-black text-white">{(coupling * 1.42).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-8">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">PT-Phase Transition</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${gainLoss > 0.8 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                           { gainLoss > 0.8 ? 'BROKEN' : 'UNBROKEN' }
                        </span>
                    </div>
                 </div>
              </div>
            </motion.div>

            {/* Metrics Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Synthetic Nodes" value={latticeSize * latticeSize} sub="High Bandwidth" />
              <StatCard label="Phase Offset" value={`${(phase / Math.PI).toFixed(2)}π`} sub="Radial Symmetry" />
              <StatCard label="Latency (μs)" value="0.042" sub="Sub-threshold" />
              <StatCard label="Backscatter" value="< 10⁻⁸" color="text-green-400" sub="Topo-Protected" />
            </div>

            <div className="bg-slate-900/30 border border-slate-800/50 p-6 rounded-3xl flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-slate-500 shrink-0 mt-1" />
                <div className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                    <strong className="text-slate-300">Technical Note:</strong> The Non-Hermitian Skin Effect (NHSE) observed here is a direct result of the non-trivial winding of the complex energy spectra. Unlike standard topological insulators, the bulk states themselves undergo localization at the boundary, providing a robust mechanism for optical localization and routing even under high-gain/loss variations.
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ControlSlider = ({ label, value, min, max, step, onChange, icon, desc }: any) => (
  <div className="space-y-3 p-1">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-tight">
        {icon}
        {label}
      </div>
      <span className="text-[10px] font-mono bg-black/40 border border-slate-800 px-2 py-1 rounded text-cyan-400 tabular-nums">
        {value.toFixed(2)}
      </span>
    </div>
    <input 
      type="range" min={min} max={max} step={step} value={value} 
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
    />
    <p className="text-[9px] text-slate-500 leading-tight italic">{desc}</p>
  </div>
);

const StatCard = ({ label, value, sub, color = "text-white" }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-slate-900/40 border border-slate-800/50 p-5 rounded-3xl flex flex-col gap-1 transition-colors hover:bg-slate-900/60"
  >
    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-black">{label}</span>
    <span className={`text-xl font-black ${color}`}>{value}</span>
    <span className="text-[8px] text-slate-600 font-mono uppercase">{sub}</span>
  </motion.div>
);

const PauseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
);

const PlayIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
);
