import React, { useState } from 'react';
import { 
  Cpu, Radio, Eye, Zap, Compass, Activity, 
  Layers, ChevronRight, CheckCircle2, Sliders, ShieldCheck, Box, Server
} from 'lucide-react';

// Hardware Modules Configuration
const HARDWARE_MODULES = [
  {
    id: 'compute',
    title: 'Processing Master Node',
    subtitle: 'Raspberry Pi 4 (4GB RAM) · Ubuntu 22.04 LTS',
    icon: Cpu,
    color: '#818cf8',
    glow: 'rgba(99, 102, 241, 0.25)',
    specs: [
      { label: 'Microcontroller OS', value: 'Ubuntu 22.04 LTS (64-bit)' },
      { label: 'Robotics Middleware', value: 'ROS 2 Humble Hawksbill' },
      { label: 'System Memory', value: '4GB LPDDR4 RAM' },
      { label: 'Core Tasks', value: 'Nav2, SLAM Toolbox, AMCL, Costmaps & TF Tree' },
    ],
    details: 'Serves as the main ROS 2 master node running Nav2 path planning, real-time SLAM mapping, sensor fusion, and asynchronous USB-serial telemetry bridges.'
  },
  {
    id: 'lidar',
    title: 'Navigation LiDAR Sensor',
    subtitle: 'RPLidar A1M8 360° Laser Scanner',
    icon: Radio,
    color: '#34d399',
    glow: 'rgba(16, 185, 129, 0.25)',
    specs: [
      { label: 'Scan Angle / Range', value: '360° Omnidirectional / 12 Meters' },
      { label: 'Sampling Rate', value: '8,000 Samples/sec' },
      { label: 'Interface Protocol', value: 'USB High-Speed Serial' },
      { label: 'ROS 2 Topic', value: '/scan (sensor_msgs/LaserScan)' },
    ],
    details: 'Provides high-frequency spatial point clouds for real-time occupancy grid mapping (SLAM Toolbox), AMCL particle filter localization, and dynamic obstacle avoidance.'
  },
  {
    id: 'motion',
    title: 'Differential Drive & Control',
    subtitle: 'Arduino Nano + Cytron MDD10A + TTN25 Motors',
    icon: Sliders,
    color: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.25)',
    specs: [
      { label: 'Motors', value: '2 × TTN25 Encoder Motors (12V, 370 RPM)' },
      { label: 'Motor Driver', value: 'Cytron MDD10A (Dual Channel 10A PWM)' },
      { label: 'Closed-Loop Control', value: 'Arduino Nano Hardware PID @ 100Hz' },
      { label: 'Odometry Protocol', value: '/odom & wheel encoder tick counting' },
    ],
    details: 'Converts ROS 2 cmd_vel velocity commands into differential wheel PWM signals. Features high-resolution quadrature encoders for closed-loop PID velocity regulation and pose estimation.'
  },
  {
    id: 'gimbal',
    title: '2-Axis Inspection Camera Gimbal',
    subtitle: 'ESP32-CAM + PCA9685 Servo Driver + 2× SG90 Servos',
    icon: Eye,
    color: '#f472b6',
    glow: 'rgba(236, 72, 153, 0.25)',
    specs: [
      { label: 'Optical Sensor', value: 'ESP32-CAM Wi-Fi Live Video Stream' },
      { label: 'Gimbal Degrees of Freedom', value: '2-DOF (Pitch & Yaw Pan/Tilt)' },
      { label: 'Servo Driver', value: 'PCA9685 16-Channel 12-Bit I2C' },
      { label: 'Inspection Purpose', value: 'Shelf scanning, Barcode & Optical QR OCR' },
    ],
    details: 'Allows independent camera panning and tilting to inspect high-bay warehouse rack rows without rotating the robot chassis, streaming HD visual streams over local Wi-Fi.'
  },
  {
    id: 'power',
    title: 'Power Distribution Infrastructure',
    subtitle: '12V Battery + Dual Step-Down Buck Converters',
    icon: Zap,
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.25)',
    specs: [
      { label: 'Main Power Source', value: '12V High-Cap Rechargeable Battery' },
      { label: 'DC-DC Regulators', value: 'Dual 5V High-Current Buck Converters' },
      { label: '12V Bus Rail', value: 'Direct Cytron MDD10A Motor Power' },
      { label: '5V Bus Rail', value: 'Raspberry Pi, Arduino, ESP32 & Servos' },
    ],
    details: 'Provides clean, isolated power rails for high-current inductive motor loads (12V) and sensitive digital logic microcontrollers (5V), ensuring zero voltage dropouts during peak acceleration.'
  }
];

// ROS 2 Software Packages
const SOFTWARE_STACK = [
  { name: 'nav2_bringup & Navigation2', desc: 'Autonomous global path planning (A*) and DWB local obstacle avoidance controller.' },
  { name: 'slam_toolbox', desc: 'Real-time simultaneous localization and map building via laser scan matching.' },
  { name: 'AMCL (Adaptive Monte Carlo)', desc: 'Probabilistic particle filter localization on static occupancy grid maps.' },
  { name: 'tf2 & robot_state_publisher', desc: 'Maintains coordinate transformations (map ➔ odom ➔ base_link ➔ laser ➔ camera).' },
  { name: 'rplidar_ros & diff_drive_controller', desc: 'Hardware abstraction drivers for RPLidar A1M8 point cloud streams and motor velocity control.' },
];

export const KnowTheBotSection: React.FC = () => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('compute');
  const [activeTab, setActiveTab] = useState<'hardware' | 'software' | 'tftree'>('hardware');

  const selectedModule = HARDWARE_MODULES.find(m => m.id === selectedModuleId) || HARDWARE_MODULES[0];

  return (
    <section id="know-the-bot" className="relative z-10 py-24 px-4 max-w-6xl mx-auto border-t border-white/[0.08]">
      <div className="space-y-16">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-semibold uppercase tracking-wider">
            <Compass className="h-3.5 w-3.5 text-cyan-400" /> Robot Architecture Specs
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Know The AMR Hardware Bot
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Deep dive into the physical hardware components, ROS 2 Humble software node graph, and sensor fusion stack powering autonomous warehouse navigation.
          </p>
        </div>

        {/* Top Control Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-white/[0.03] border border-white/08 backdrop-blur-2xl">
            {[
              { id: 'hardware', label: 'Hardware Architecture', icon: Cpu },
              { id: 'software', label: 'ROS 2 Software Stack', icon: Server },
              { id: 'tftree', label: 'TF Coordinate Frame Tree', icon: Layers },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/05'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: HARDWARE MODULE SPECIFICATIONS */}
        {activeTab === 'hardware' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Module Buttons list */}
            <div className="lg:col-span-5 space-y-3">
              {HARDWARE_MODULES.map((mod) => {
                const isActive = mod.id === selectedModuleId;
                const IconComponent = mod.icon;

                return (
                  <button
                    key={mod.id}
                    onClick={() => setSelectedModuleId(mod.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${
                      isActive 
                        ? 'bg-[#0b1328] border-indigo-500/50 shadow-xl shadow-indigo-500/10' 
                        : 'bg-[#080d1a]/80 border-white/06 hover:border-white/20 hover:bg-[#0b1122]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all"
                        style={{
                          backgroundColor: `${mod.color}15`,
                          borderColor: `${mod.color}35`,
                          color: mod.color
                        }}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {mod.title}
                        </h4>
                        <p className="text-[11px] font-mono text-slate-400">{mod.subtitle}</p>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-transform ${isActive ? 'text-indigo-400 translate-x-1' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>

            {/* Right Active Module Specs Panel */}
            <div className="lg:col-span-7 rounded-3xl bg-[#080d1a]/90 border border-white/10 p-7 space-y-6 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
              <div 
                className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{ backgroundColor: selectedModule.color }}
              />

              <div className="flex items-center justify-between border-b border-white/08 pb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                    style={{
                      backgroundColor: `${selectedModule.color}20`,
                      borderColor: `${selectedModule.color}40`,
                      color: selectedModule.color
                    }}
                  >
                    <selectedModule.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedModule.title}</h3>
                    <p className="text-xs font-mono text-indigo-400">{selectedModule.subtitle}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  Verified Hardware
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {selectedModule.details}
              </p>

              {/* Specs Grid */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Technical Specifications
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedModule.specs.map((sp, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/06 space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 block">{sp.label}</span>
                      <span className="text-xs font-mono font-bold text-slate-100 block">{sp.value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: ROS 2 SOFTWARE STACK */}
        {activeTab === 'software' && (
          <div className="rounded-3xl bg-[#080d1a]/90 border border-white/10 p-8 space-y-8 backdrop-blur-2xl">
            <div className="border-b border-white/08 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-white">ROS 2 Humble Software Node Graph</h3>
                <p className="text-xs font-mono text-indigo-400 mt-1">Ubuntu 22.04 LTS · Nav2 Stack · SLAM Toolbox</p>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                Middleware: ROS 2 Humble
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SOFTWARE_STACK.map((pkg, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/06 space-y-2 hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                    <h4 className="text-sm font-bold text-white font-mono">{pkg.name}</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{pkg.desc}</p>
                </div>
              ))}
            </div>

            {/* Topics Table */}
            <div className="space-y-3 pt-4 border-t border-white/08">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Active ROS 2 Topics</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <strong>/scan</strong> — RPLidar A1M8 Pointcloud
                </div>
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                  <strong>/odom</strong> — Differential Wheel Odometry
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
                  <strong>/cmd_vel</strong> — Velocity Motion Vectors
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TF COORDINATE FRAME TREE */}
        {activeTab === 'tftree' && (
          <div className="rounded-3xl bg-[#080d1a]/90 border border-white/10 p-8 space-y-8 backdrop-blur-2xl">
            <div className="border-b border-white/08 pb-4">
              <h3 className="text-2xl font-bold text-white">TF Coordinate Transformation Tree</h3>
              <p className="text-xs font-mono text-indigo-400 mt-1">Spatial Kinematic Transform Chain (map ➔ camera_gimbal)</p>
            </div>

            {/* Visual Transform Chain */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-6 rounded-2xl bg-slate-950/80 border border-white/08 font-mono text-xs text-slate-200 overflow-x-auto">
              {[
                { frame: 'map', label: 'Global World Map' },
                { frame: 'odom', label: 'Odometry Frame' },
                { frame: 'base_link', label: 'Robot Chassis Base' },
                { frame: 'laser', label: 'RPLidar A1M8' },
                { frame: 'camera_gimbal', label: '2-Axis Servo Gimbal' },
              ].map((tf, idx, arr) => (
                <React.Fragment key={tf.frame}>
                  <div className="flex flex-col items-center p-3 rounded-xl bg-indigo-600/10 border border-indigo-500/30 text-center min-w-[130px]">
                    <span className="font-bold text-indigo-300 text-sm">{tf.frame}</span>
                    <span className="text-[10px] text-slate-400 mt-1">{tf.label}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <ChevronRight className="h-5 w-5 text-indigo-400 rotate-90 sm:rotate-0 my-1 sm:my-0" />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/06 text-xs text-slate-300 leading-relaxed font-sans space-y-2">
              <h4 className="font-bold text-white font-mono">Transform Kinematics Explanation:</h4>
              <p>
                The <strong>map ➔ odom</strong> transform is continuously estimated by SLAM Toolbox and AMCL. The <strong>odom ➔ base_link</strong> transform is computed at 100Hz from dual wheel encoder counts on the Arduino Nano. Static transforms (<strong>base_link ➔ laser</strong> and <strong>base_link ➔ camera_gimbal</strong>) are published by <code>robot_state_publisher</code> using XACRO URDF definitions.
              </p>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
