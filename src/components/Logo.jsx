import React from 'react';

export default function Logo({ className = "h-9", light = false }) {
  const coral = "#E95349";
  const textColor = light ? "#F1F1F1" : "#1E1E1E";
  const subtextColor = light ? "#E26A69" : "#757575";

  return (
    <div className={`flex items-center gap-2.5 ${className}`} aria-label="Merkatics Growth Operating System">
      <svg viewBox="0 0 100 100" className="w-10 h-10 shrink-0" fill="none" role="img" aria-label="Símbolo Merkatics">
        <circle cx="50" cy="50" r="43" stroke={coral} strokeWidth="6" />
        <path d="M18 64 L34 39 L45 54 L66 25 L61 25 L82 10 L86 35 L79 30 L48 72 L35 57 L25 73 Z" fill={coral} />
        <path d="M17 79 L83 79" stroke={coral} strokeWidth="3" strokeLinecap="round" opacity=".45" />
      </svg>
      <div className="flex flex-col leading-tight select-none">
        <div className="font-extrabold tracking-tight text-xl font-heading" style={{ color: textColor }}>
          Merkatics
        </div>
        <span className="text-[9px] tracking-[0.08em] font-semibold block" style={{ color: subtextColor }}>
          Growth Operating System
        </span>
      </div>
    </div>
  );
}
