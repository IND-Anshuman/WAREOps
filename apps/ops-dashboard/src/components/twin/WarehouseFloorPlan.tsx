import React, { useMemo } from 'react';

// Color map based on bin state
const STATE_COLORS: Record<string, string> = {
  VERIFIED: '#10B981',      // Emerald Green
  MISMATCH: '#EF4444',      // Rose Red
  MISSING: '#F59E0B',       // Amber Yellow
  UNKNOWN: '#EC4899',       // Pink
  UNSCANNED: '#374151',     // Gray
};

interface TwinRobotPosition {
  robot_id: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  battery: number;
  status: string;
}

interface TwinBinState {
  bin_id: string;
  bin_code: string;
  current_sku: string | null;
  bin_state: 'VERIFIED' | 'MISMATCH' | 'MISSING' | 'UNKNOWN' | 'UNSCANNED';
  x: number;
  y: number;
  isHighlighted?: boolean;
}

interface WarehouseFloorPlanProps {
  robots: TwinRobotPosition[];
  bins: TwinBinState[];
  onBinClick: (bin: TwinBinState) => void;
}

export const WarehouseFloorPlan: React.FC<WarehouseFloorPlanProps> = ({
  robots,
  bins,
  onBinClick,
}) => {
  // SVG Canvas Scale Configurations
  const width = 800;
  const height = 500;

  // Render rack grids using memoization for WebGL-like performance optimization in SVG DOM
  const binRects = useMemo(() => {
    return bins.map((bin) => {
      // Map logical meters to SVG pixels
      const svgX = bin.x * 25 + 50; 
      const svgY = bin.y * 15 + 50;
      const color = STATE_COLORS[bin.bin_state] || STATE_COLORS.UNSCANNED;
      
      const isHighlighted = bin.isHighlighted;

      return (
        <rect
          key={bin.bin_id}
          x={svgX}
          y={svgY}
          width={18}
          height={10}
          rx={1}
          fill={color}
          stroke={isHighlighted ? '#F59E0B' : 'rgba(255,255,255,0.05)'}
          strokeWidth={isHighlighted ? 1.5 : 0.5}
          opacity={isHighlighted === false ? 0.3 : 1}
          className={`transition-all duration-300 cursor-pointer hover:stroke-white ${
            isHighlighted ? 'animate-pulse ring-2 ring-amber-500' : ''
          }`}
          onClick={() => onBinClick(bin)}
        >
          <title>{`${bin.bin_code} (${bin.bin_state})`}</title>
        </rect>
      );
    });
  }, [bins, onBinClick]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">📦 Real-Time Digital Twin Layout</h3>
        <div className="flex space-x-3 text-xs">
          {Object.entries(STATE_COLORS).map(([state, color]) => (
            <div key={state} className="flex items-center space-x-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-slate-400 capitalize">{state.toLowerCase()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="max-h-[500px] w-full select-none"
        >
          {/* Grid Background Lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#grid)" rx={8} />

          {/* Render Bins / Racks */}
          <g>{binRects}</g>

          {/* Render Robot positions with glow effect animation */}
          {robots.map((robot) => {
            const rx = robot.x * 25 + 50;
            const ry = robot.y * 15 + 50;
            const isAuditing = robot.status === 'AUDITING';

            return (
              <g key={robot.robot_id} className="transition-all duration-500 ease-out">
                {/* Outer pulsing ping wave */}
                <circle
                  cx={rx}
                  cy={ry}
                  r={12}
                  fill={isAuditing ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)'}
                  className={isAuditing ? 'animate-ping' : ''}
                />
                {/* Robot Core Dot */}
                <circle
                  cx={rx}
                  cy={ry}
                  r={6}
                  fill={isAuditing ? '#3B82F6' : '#10B981'}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
                {/* Text Label */}
                <text
                  x={rx + 10}
                  y={ry + 4}
                  fill="#94A3B8"
                  fontSize="10"
                  fontWeight="bold"
                  className="pointer-events-none drop-shadow"
                >
                  {robot.robot_id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
