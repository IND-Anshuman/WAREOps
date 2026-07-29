import React, { useState, useMemo, useEffect } from 'react';

export interface TwinRobotPosition {
  robot_id: string;
  name?: string;
  x: number;
  y: number;
  battery: number;
  status: 'ONLINE' | 'AUDITING' | 'CHARGING' | 'OFFLINE';
  heading?: number;
}

export interface TwinBinState {
  bin_id: string;
  bin_code: string;       // e.g. "A1-R1-S4-P1"
  zone_id: string;        // "Zone A" | "Zone B"
  aisle_id: string;       // e.g. "Aisle A1"
  rack_id: string;        // e.g. "Rack A1-R1"
  row_id: string;         // e.g. "Row 4 (Top Shelf)"
  shelf_id: string;       // e.g. "Row 4"
  product_slot: string;   // e.g. "Product 1"
  current_sku: string | null;
  expected_sku?: string;
  bin_state: 'VERIFIED' | 'MISMATCH' | 'MISSING' | 'UNKNOWN' | 'UNSCANNED';
  x: number;
  y: number;
  confidence?: number;
}

interface WarehouseFloorPlanProps {
  robots: TwinRobotPosition[];
  bins: TwinBinState[];
  selectedBinId?: string | null;
  showRobots?: boolean;
  showBinStates?: boolean;
  showScanCones?: boolean;
  filterStatus?: string;
  filterZone?: string;
  onBinClick: (bin: TwinBinState) => void;
  onRobotClick?: (robot: TwinRobotPosition) => void;
}

const STATE_THEMES: Record<string, { fill: string; stroke: string; label: string }> = {
  VERIFIED: { fill: '#10b981', stroke: '#34d399', label: 'Verified Product' },
  MISMATCH: { fill: '#ef4444', stroke: '#f87171', label: 'SKU Mismatch' },
  MISSING: { fill: '#f59e0b', stroke: '#fbbf24', label: 'Missing Product' },
  UNKNOWN: { fill: '#ec4899', stroke: '#f472b6', label: 'Unknown' },
  UNSCANNED: { fill: '#1e293b', stroke: '#475569', label: 'Unscanned' },
};

// 2 ZONES Topology Configuration
const ZONES_2_CONFIG = [
  {
    id: 'Zone A',
    code: 'ZA',
    name: 'ZONE A · PRIMARY ELECTRONICS & ROBOTICS',
    color: 'rgba(99, 102, 241, 0.04)',
    stroke: 'rgba(99, 102, 241, 0.3)',
    accent: '#818cf8',
    x: 25, y: 25, w: 410, h: 530,
    aisles: [
      { id: 'Aisle A1', name: 'Aisle A1', yOffset: 45 },
      { id: 'Aisle A2', name: 'Aisle A2', yOffset: 280 },
    ]
  },
  {
    id: 'Zone B',
    code: 'ZB',
    name: 'ZONE B · SECONDARY ERGONOMICS & HEAVY STOCK',
    color: 'rgba(16, 185, 129, 0.04)',
    stroke: 'rgba(16, 185, 129, 0.3)',
    accent: '#34d399',
    x: 465, y: 25, w: 410, h: 530,
    aisles: [
      { id: 'Aisle B1', name: 'Aisle B1', yOffset: 45 },
      { id: 'Aisle B2', name: 'Aisle B2', yOffset: 280 },
    ]
  },
];

export const WarehouseFloorPlan: React.FC<WarehouseFloorPlanProps> = ({
  robots,
  bins,
  selectedBinId,
  showRobots = true,
  showBinStates = true,
  showScanCones = true,
  filterStatus = 'ALL',
  filterZone = 'ALL',
  onBinClick,
  onRobotClick,
}) => {
  const [hoveredBin, setHoveredBin] = useState<TwinBinState | null>(null);

  const filteredBins = useMemo(() => {
    return bins.filter((b) => {
      const matchStatus = filterStatus === 'ALL' || b.bin_state === filterStatus;
      const matchZone = filterZone === 'ALL' || b.zone_id === filterZone;
      return matchStatus && matchZone;
    });
  }, [bins, filterStatus, filterZone]);

  const activeBin = useMemo(() => {
    return bins.find((b) => b.bin_id === selectedBinId);
  }, [bins, selectedBinId]);

  return (
    <div className="relative w-full h-full min-h-[550px] flex flex-col justify-between select-none">
      
      {/* 5-Level Topology Hover Inspector HUD */}
      {hoveredBin && (
        <div
          className="absolute z-40 pointer-events-none rounded-xl border border-white/20 bg-[#080d1a]/95 p-3.5 shadow-2xl backdrop-blur-xl text-xs space-y-2"
          style={{
            left: `${Math.min(hoveredBin.x + 50, 640)}px`,
            top: `${Math.max(hoveredBin.y - 40, 20)}px`,
          }}
        >
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-2">
            <span className="font-mono font-bold text-slate-100 text-sm">{hoveredBin.bin_code}</span>
            <span
              className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase"
              style={{
                backgroundColor: `${STATE_THEMES[hoveredBin.bin_state]?.fill}25`,
                color: STATE_THEMES[hoveredBin.bin_state]?.stroke,
                border: `1px solid ${STATE_THEMES[hoveredBin.bin_state]?.stroke}50`,
              }}
            >
              {hoveredBin.bin_state}
            </span>
          </div>

          {/* Topology Hierarchy Breadcrumb */}
          <div className="text-[10px] font-mono text-indigo-300 font-semibold bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
            {hoveredBin.zone_id} ➔ {hoveredBin.aisle_id} ➔ {hoveredBin.rack_id} ➔ {hoveredBin.row_id} ➔ {hoveredBin.product_slot}
          </div>

          <div className="space-y-1 font-mono text-[11px]">
            <p className="text-slate-400">Expected Product: <strong className="text-slate-200">{hoveredBin.expected_sku || 'EMPTY'}</strong></p>
            <p className="text-slate-400">Observed QR Code: <span className="text-slate-200">{hoveredBin.current_sku || 'N/A'}</span></p>
          </div>

          {hoveredBin.confidence !== undefined && (
            <div className="pt-1 flex items-center justify-between border-t border-white/06 text-[10px]">
              <span className="text-slate-500">Scan Confidence</span>
              <span className="font-mono font-bold text-emerald-400">{Math.round(hoveredBin.confidence * 100)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Main SVG Map Canvas (900x580 Viewport) */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden p-2">
        <svg
          viewBox="0 0 900 580"
          className="w-full h-auto max-h-[600px] drop-shadow-2xl transition-all duration-300"
        >
          <defs>
            <linearGradient id="scanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>

            <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Clean Solid Dark Background Floor Base */}
          <rect width="900" height="580" fill="#060a17" rx="16" />

          {/* LEVEL 1: 2 ZONES (Zone A & Zone B) */}
          {ZONES_2_CONFIG.map((z) => (
            <g key={z.id}>
              {/* Zone Outer Boundary */}
              <rect
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                rx="14"
                fill={z.color}
                stroke={z.stroke}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Zone Header Badge */}
              <rect x={z.x + 15} y={z.y + 12} width={280} height={20} rx="5" fill="rgba(8, 13, 26, 0.9)" stroke={z.stroke} strokeWidth="1" />
              <text
                x={z.x + 25}
                y={z.y + 26}
                fill={z.accent}
                fontSize="10"
                fontWeight="800"
                letterSpacing="1"
                className="font-mono uppercase pointer-events-none"
              >
                {z.name}
              </text>

              {/* LEVEL 2: 2 AISLES PER ZONE */}
              {z.aisles.map((aisle, aIdx) => {
                const aisleY = z.y + aisle.yOffset;

                return (
                  <g key={aisle.id}>
                    {/* Aisle Corridor Designation Line & Label */}
                    <line x1={z.x + 20} y1={aisleY + 104} x2={z.x + z.w - 20} y2={aisleY + 104} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 3" />
                    <text
                      x={z.x + z.w / 2}
                      y={aisleY + 114}
                      fill="rgba(255,255,255,0.22)"
                      fontSize="9"
                      fontWeight="800"
                      textAnchor="middle"
                      className="font-mono tracking-widest pointer-events-none"
                    >
                      ▲ {aisle.name} CORRIDOR ▲
                    </text>

                    {/* LEVEL 3: 2 RACKS PER AISLE */}
                    {[1, 2].map((rNum) => {
                      const rackX = z.x + (rNum === 1 ? 25 : 215);
                      const rackY = aisleY;
                      const rackCode = `Rack ${z.code.slice(-1)}${aIdx + 1}-R${rNum}`;

                      return (
                        <g key={rackCode}>
                          {/* Outer Frame for Rack */}
                          <rect
                            x={rackX}
                            y={rackY}
                            width={170}
                            height={96}
                            rx="6"
                            fill="rgba(15, 23, 42, 0.92)"
                            stroke="rgba(255,255,255,0.18)"
                            strokeWidth="1"
                          />
                          <text
                            x={rackX + 8}
                            y={rackY + 10}
                            fill="rgba(255,255,255,0.45)"
                            fontSize="8"
                            fontWeight="800"
                            className="font-mono pointer-events-none uppercase"
                          >
                            {rackCode}
                          </text>

                          {/* LEVEL 4: 4 ROWS PER RACK (Row 4, Row 3, Row 2, Row 1) */}
                          {[1, 2, 3, 4].map((rowTier) => {
                            const rowY = rackY + 14 + (rowTier - 1) * 20;

                            return (
                              <g key={`row-${rackCode}-${rowTier}`}>
                                <line x1={rackX + 4} y1={rowY} x2={rackX + 166} y2={rowY} stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
                                <text
                                  x={rackX + 8}
                                  y={rowY + 14}
                                  fill="rgba(255,255,255,0.25)"
                                  fontSize="7"
                                  fontWeight="700"
                                  className="font-mono pointer-events-none"
                                >
                                  R{5 - rowTier}
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>
          ))}

          {/* LEVEL 5: 3 PRODUCTS / BINS PER ROW */}
          {filteredBins.map((bin) => {
            const isSelected = selectedBinId === bin.bin_id;
            const isHovered = hoveredBin?.bin_id === bin.bin_id;
            const theme = STATE_THEMES[showBinStates ? bin.bin_state : 'UNSCANNED'] || STATE_THEMES.UNSCANNED;

            return (
              <g
                key={bin.bin_id}
                onClick={() => onBinClick(bin)}
                onMouseEnter={() => setHoveredBin(bin)}
                onMouseLeave={() => setHoveredBin(null)}
                className="cursor-pointer"
              >
                {/* Fixed Steady Hit Target */}
                <rect x={bin.x - 3} y={bin.y - 3} width={48} height={22} fill="transparent" className="pointer-events-auto" />

                {/* Selected or Hover Halo */}
                {(isSelected || isHovered) && (
                  <rect
                    x={bin.x - 3}
                    y={bin.y - 3}
                    width={48}
                    height={22}
                    rx="6"
                    fill="none"
                    stroke={isSelected ? '#818cf8' : '#a5b4fc'}
                    strokeWidth={isSelected ? '2' : '1.5'}
                    strokeDasharray={isHovered && !isSelected ? '3 3' : undefined}
                    filter="url(#neonGlow)"
                  />
                )}

                {/* Individual Product Compartment / Bin Box */}
                <rect
                  x={bin.x}
                  y={bin.y}
                  width={42}
                  height={16}
                  rx="4"
                  fill={theme.fill}
                  fillOpacity={showBinStates ? (bin.bin_state === 'UNSCANNED' ? 0.35 : 0.85) : 0.4}
                  stroke={isSelected ? '#ffffff' : isHovered ? '#818cf8' : theme.stroke}
                  strokeWidth={isSelected ? '1.5' : isHovered ? '1.2' : '0.8'}
                  className="pointer-events-none"
                />

                {/* Product Label Code */}
                <text
                  x={bin.x + 21}
                  y={bin.y + 11}
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="800"
                  textAnchor="middle"
                  className="pointer-events-none font-mono tracking-tighter"
                >
                  {bin.bin_code.split('-').slice(2).join('') || bin.bin_code.slice(-4)}
                </text>
              </g>
            );
          })}

          {/* Holographic Laser Connector Line to Selected Product Bin */}
          {activeBin && (
            <g>
              <line
                x1={activeBin.x + 21}
                y1={activeBin.y + 8}
                x2={activeBin.x + (activeBin.x > 450 ? -70 : 70)}
                y2={activeBin.y - 30}
                stroke="#818cf8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                filter="url(#neonGlow)"
              />
              <circle cx={activeBin.x + 21} cy={activeBin.y + 8} r="3.5" fill="#818cf8" className="animate-ping" />
            </g>
          )}

          {/* SINGLE AMR BOT UNIT & TRAJECTORY PATH */}
          {showRobots && (
            <g>
              {/* AMR Planned Route Polyline */}
              <polyline
                points="230,175 230,410 670,410 670,175"
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity="0.65"
                filter="url(#neonGlow)"
              />

              {robots.slice(0, 1).map((robot) => {
                const rx = robot.x;
                const ry = robot.y;
                const isAuditing = robot.status === 'AUDITING';

              return (
                <g key={robot.robot_id} className="transition-all duration-700 ease-out">
                  {/* Scanning Cone Fan */}
                  {showScanCones && isAuditing && (
                    <polygon
                      points={`${rx},${ry} ${rx - 40},${ry - 60} ${rx + 40},${ry - 60}`}
                      fill="url(#scanGrad)"
                      className="animate-pulse"
                    />
                  )}

                  {/* AMR Radar Ring */}
                  <circle
                    cx={rx}
                    cy={ry}
                    r={18}
                    fill="rgba(99, 102, 241, 0.15)"
                    stroke="rgba(99, 102, 241, 0.4)"
                    strokeWidth="1"
                    className="animate-ping"
                  />

                  {/* AMR Chassis Pod */}
                  <circle cx={rx} cy={ry} r={11} fill="#4f46e5" stroke="#ffffff" strokeWidth="2" filter="url(#neonGlow)" />
                  <circle cx={rx} cy={ry} r={4} fill="#ffffff" />

                  {/* Robot Label Tag */}
                  <g transform={`translate(${rx - 40}, ${ry + 16})`}>
                    <rect x="0" y="0" width="80" height="18" rx="5" fill="rgba(8, 13, 26, 0.92)" stroke="#6366f1" strokeWidth="0.8" />
                    <text x="40" y="12" fill="#ffffff" fontSize="8" fontWeight="800" textAnchor="middle" className="font-mono pointer-events-none">
                      {robot.name || robot.robot_id} · {robot.battery}%
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
          )}
        </svg>
      </div>

      {/* Topology Hierarchy Footer */}
      <div className="border-t border-white/08 bg-[#080d1a] px-6 py-3.5 flex gap-6 justify-between items-center flex-wrap">
        <div className="flex gap-3 items-center font-mono text-[11px] text-slate-300">
          <span className="text-indigo-400 font-bold">Topology Specs:</span>
          <span className="text-emerald-400 font-semibold">2 Zones</span> ➔ 
          <span className="text-emerald-400 font-semibold">4 Aisles</span> (2/zone) ➔ 
          <span className="text-emerald-400 font-semibold">8 Racks</span> (2/aisle) ➔ 
          <span className="text-emerald-400 font-semibold">32 Rows</span> (4/rack) ➔ 
          <span className="text-emerald-400 font-semibold">96 Products</span> (3/row)
        </div>

        <div className="flex gap-4 items-center">
          {Object.entries(STATE_THEMES).slice(0, 4).map(([state, theme]) => (
            <div key={state} className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: theme.fill }} />
              <span className="text-slate-400 font-medium">{theme.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
