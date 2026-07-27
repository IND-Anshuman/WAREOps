import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CanvasWarehouseTwin3D } from '../components/landing/CanvasWarehouseTwin3D';
import { FluidIslandNavbar } from '../components/landing/FluidIslandNavbar';
import { MissionSequenceHUD } from '../components/landing/MissionSequenceHUD';
import { FloatingTelemetryDock } from '../components/landing/FloatingTelemetryDock';
import { EventStreamTerminal } from '../components/landing/EventStreamTerminal';
import { SystemMetricsBand } from '../components/landing/SystemMetricsBand';
import { InteractiveDigitalTwinPreview } from '../components/landing/InteractiveDigitalTwinPreview';
import { PlatformArchitectureMap } from '../components/landing/PlatformArchitectureMap';
import { DataStreamPipeline } from '../components/landing/DataStreamPipeline';
import { RolePreviewGrid } from '../components/landing/RolePreviewGrid';
import { EnterpriseFooter } from '../components/landing/EnterpriseFooter';
import { Sparkles, Bot, ShieldCheck, ArrowDown } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleLaunchAuth = () => {
    navigate('/auth/login');
  };

  const scrollToSection = (id: string) => {
    if (id === 'auth' || id === 'login') {
      handleLaunchAuth();
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Subtle Noise / Film Grain Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.025] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"
      />

      {/* Floating Island Navbar */}
      <FluidIslandNavbar onLaunchAuth={handleLaunchAuth} onNavigateSection={scrollToSection} />

      {/* HERO SECTION */}
      <section id="hero" className="relative min-h-screen pt-28 pb-16 flex flex-col justify-between items-center px-4 overflow-hidden z-10">
        
        {/* 3D Canvas Background */}
        <CanvasWarehouseTwin3D />

        {/* Center Hero Heading Block */}
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6 pt-8 md:pt-16">
          
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl text-indigo-300 text-[10px] font-mono font-semibold uppercase tracking-[0.25em] shadow-xl animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span>AUTONOMOUS AMR INVENTORY AUDIT PLATFORM • v2.4</span>
          </div>

          {/* H1 Display Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white font-sans max-w-4xl mx-auto leading-[1.08] drop-shadow-2xl">
            Continuous Inventory{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400">
              Intelligence
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-sm md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
            Autonomous mobile robots continuously audit warehouse inventory, transmitting LiDAR observations to stream real-time digital twin state with 99.98% accuracy.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleLaunchAuth}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs tracking-wide shadow-xl shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
              <span>Launch Command Center</span>
              <Sparkles className="h-4 w-4 text-cyan-200 transition-transform group-hover:rotate-12" />
            </button>
            
            <button
              onClick={() => scrollToSection('spatial-twin')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-slate-300 hover:text-white font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2"
            >
              <span>Inspect Spatial Twin</span>
              <ArrowDown className="h-4 w-4 text-slate-400" />
            </button>
          </div>

        </div>

        {/* Live HUD Floating Widgets Row */}
        <div className="relative z-10 w-full max-w-6xl mx-auto mt-12 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-3 hidden lg:flex justify-start">
            <FloatingTelemetryDock />
          </div>
          <div className="lg:col-span-6 w-full">
            <MissionSequenceHUD />
          </div>
          <div className="lg:col-span-3 hidden lg:flex justify-end">
            <EventStreamTerminal />
          </div>
        </div>

      </section>

      {/* SYSTEM METRICS BAND */}
      <SystemMetricsBand />

      {/* SPATIAL DIGITAL TWIN PREVIEW */}
      <InteractiveDigitalTwinPreview />

      {/* PLATFORM ARCHITECTURE MAP */}
      <PlatformArchitectureMap />

      {/* HIGH-SPEED DATA PIPELINE */}
      <DataStreamPipeline />

      {/* ROLE COMMAND MATRIX */}
      <section id="roles" className="relative z-10 py-24 px-4 max-w-6xl mx-auto space-y-16">
        <RolePreviewGrid />
      </section>

      {/* ENTERPRISE FOOTER */}
      <EnterpriseFooter />
    </div>
  );
}
