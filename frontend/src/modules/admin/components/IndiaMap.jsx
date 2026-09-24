import React from 'react';
import { motion } from 'framer-motion';

const IndiaMap = ({ stateDistribution = [], selectedState, onStateClick }) => {
    // Color scale for heatmap
    const getColor = (count) => {
        if (count === 0) return '#e2e8f0'; // Default gray
        if (count < 5) return '#dcfce7'; // Light green
        if (count < 20) return '#bbf7d0';
        if (count < 50) return '#86efac';
        if (count < 100) return '#4ade80';
        return '#22c55e'; // Dark green
    };

    // Simplified SVG paths for Indian States (names must match INDIAN_STATES)
    // These are symbolic paths for a clean dashboard look
    const states = [
        { id: "Rajasthan", d: "M100,150 L150,140 L160,180 L110,190 Z" },
        { id: "Maharashtra", d: "M110,240 L160,230 L170,280 L120,290 Z" },
        { id: "Uttar Pradesh", d: "M170,140 L220,130 L230,170 L180,180 Z" },
        { id: "Gujarat", d: "M60,180 L100,170 L110,210 L70,220 Z" },
        { id: "Madhya Pradesh", d: "M130,180 L180,170 L190,220 L140,230 Z" },
        { id: "Tamil Nadu", d: "M160,340 L190,340 L190,400 L160,390 Z" },
        { id: "Karnataka", d: "M120,300 L160,290 L170,350 L130,360 Z" },
        { id: "Bihar", d: "M220,150 L260,140 L270,190 L230,200 Z" },
        { id: "West Bengal", d: "M260,190 L280,180 L290,250 L270,250 Z" },
        { id: "Delhi", d: "M165,145 L175,145 L175,155 L165,155 Z" },
        // Simplified India outline for background
        { id: "Outline", d: "M150,50 L200,80 L250,150 L280,250 L250,350 L200,450 L150,450 L100,350 L50,250 L80,150 L100,80 Z", isOutline: true }
    ];

    // Note: High-fidelity SVG paths would be too many lines. 
    // For a "Wow" factor while keeping code clean, we use a custom labeled heatmap grid or a real interactive SVG if possible.
    // I will use a real SVG derived from common geo sources but simplified to keep it under 500 lines.

    return (
        <div className="relative w-full h-[300px] md:h-[500px] bg-white rounded-2xl overflow-hidden p-4">
            <h3 className="text-sm md:text-lg font-bold mb-4" style={{ color: '#2d3748' }}>Interactive Business Reach</h3>

            <div className="flex flex-col md:flex-row h-full">
                {/* Map Logic */}
                <div className="flex-1 relative flex items-center justify-center">
                    <svg viewBox="0 0 400 500" className="w-full h-full max-h-[400px]">
                        {/* Simplified India Map - Symbolic for Heatmap */}
                        {/* Note: In a production app, we'd use a GeoJSON TopoJSON file here */}
                        {/* For this demo/task, I'll use a curated list of clickable regions */}

                        {/* Background Shadow */}
                        <path d="M200,20 L220,40 L280,100 L320,200 L300,350 L250,450 L150,480 L100,400 L80,250 L100,100 L150,30 Z" fill="#f7fafc" stroke="#edf2f7" strokeWidth="2" />

                        {/* Regional Hotspots (States) */}
                        {stateDistribution.map((item, idx) => {
                            // Positional mapping for major states (mock positions on 400x500 canvas)
                            const stateCoords = {
                                "Rajasthan": { x: 100, y: 150, r: 30 },
                                "Maharashtra": { x: 130, y: 280, r: 35 },
                                "Uttar Pradesh": { x: 200, y: 160, r: 32 },
                                "Gujarat": { x: 70, y: 220, r: 28 },
                                "Madhya Pradesh": { x: 150, y: 210, r: 38 },
                                "Karnataka": { x: 130, y: 360, r: 30 },
                                "Tamil Nadu": { x: 180, y: 410, r: 28 },
                                "Bihar": { x: 260, y: 180, r: 25 },
                                "Delhi": { x: 168, y: 150, r: 10 },
                                "West Bengal": { x: 290, y: 230, r: 22 },
                                "Telangana": { x: 180, y: 310, r: 25 },
                                "Andhra Pradesh": { x: 190, y: 360, r: 28 },
                                "Kerala": { x: 140, y: 440, r: 15 },
                                "Punjab": { x: 140, y: 100, r: 20 },
                                "Haryana": { x: 160, y: 120, r: 18 }
                            };

                            const coords = stateCoords[item.state] || { x: 200, y: 250, r: 20 };
                            const isSelected = selectedState === item.state;

                            return (
                                <g key={item.state} onClick={() => onStateClick(item.state)} className="cursor-pointer group">
                                    <motion.circle
                                        cx={coords.x}
                                        cy={coords.y}
                                        r={isSelected ? coords.r + 5 : coords.r}
                                        fill={getColor(item.count)}
                                        fillOpacity={isSelected ? 0.9 : 0.7}
                                        stroke={isSelected ? '#22c55e' : '#ffffff'}
                                        strokeWidth={isSelected ? 3 : 1}
                                        whileHover={{ scale: 1.1, fillOpacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                    />
                                    <text
                                        x={coords.x}
                                        y={coords.y + 4}
                                        textAnchor="middle"
                                        className="text-[10px] pointer-events-none font-bold"
                                        fill={isSelected ? '#065f46' : '#2d3748'}
                                        style={{ fontSize: isSelected ? '12px' : '8px' }}
                                    >
                                        {item.count}
                                    </text>
                                    {/* Tooltip on hover */}
                                    <title>{item.state}: {item.count} orders</title>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Legend & Summary */}
                <div className="w-full md:w-64 p-4 border-l border-gray-100 bg-gray-50/50 rounded-xl">
                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-4 tracking-wider">Top Performing Regions</h4>
                    <div className="space-y-3">
                        {stateDistribution.sort((a, b) => b.count - a.count).slice(0, 5).map((item, idx) => (
                            <div
                                key={item.state}
                                onClick={() => onStateClick(item.state)}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${selectedState === item.state ? 'bg-green-100 border border-green-200 shadow-sm' : 'hover:bg-white'}`}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor(item.count) }} />
                                    <span className="text-xs font-semibold text-gray-700 truncate">{item.state}</span>
                                </div>
                                <span className="text-xs font-bold text-gray-900">{item.count}</span>
                            </div>
                        ))}
                        {stateDistribution.length === 0 && (
                            <p className="text-[10px] text-gray-400 italic">No region-wise data available yet</p>
                        )}
                    </div>

                    {/* Scale */}
                    <div className="mt-8">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Order Frequency</p>
                        <div className="flex h-1 w-full rounded-full overflow-hidden mb-2">
                            <div className="flex-1 bg-[#dcfce7]" />
                            <div className="flex-1 bg-[#bbf7d0]" />
                            <div className="flex-1 bg-[#86efac]" />
                            <div className="flex-1 bg-[#4ade80]" />
                            <div className="flex-1 bg-[#22c55e]" />
                        </div>
                        <div className="flex justify-between text-[8px] text-gray-400 font-bold">
                            <span>LOW</span>
                            <span>HIGH</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IndiaMap;
