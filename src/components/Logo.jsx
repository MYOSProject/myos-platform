import React from 'react';

export default function Logo({ className = "h-9", light = true }) {
  const primaryColor = "#1d7eae"; // Pantone 640 C
  const textColor = light ? "#ffffff" : "#231f20"; // Pantone Process Black
  const subtextColor = light ? "#98dae9" : "#64748b";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Símbolo Antena Emisora Oficial (O concéntrico) */}
      <svg viewBox="0 0 100 100" className="w-9 h-9 shrink-0 drop-shadow-sm" fill="none">
        {/* Círculo exterior / onda externa */}
        <circle cx="50" cy="50" r="44" stroke={primaryColor} strokeWidth="7" fill="none" opacity="0.95" />
        {/* Onda intermedia */}
        <circle cx="50" cy="50" r="29" stroke={light ? "#98dae9" : "#0032a0"} strokeWidth="6" fill="none" />
        {/* Núcleo de la antena */}
        <circle cx="50" cy="50" r="14" fill={primaryColor} />
        {/* Punto central emisor */}
        <circle cx="50" cy="50" r="5" fill="#ffffff" />
      </svg>

      <div className="flex flex-col leading-tight select-none">
        <div className="flex items-center font-extrabold tracking-tight text-xl font-heading">
          <span style={{ color: textColor }}>I</span>
          {/* O estilizada como antena integrada */}
          <span style={{ color: primaryColor }} className="mx-0.5">O</span>
          <span style={{ color: textColor }}>T</span>
          <span className="ml-1 tracking-wider text-base font-bold" style={{ color: primaryColor }}>
            TECHNOLOGIES
          </span>
        </div>
        <span 
          className="text-[9px] tracking-[0.22em] uppercase font-semibold block"
          style={{ color: subtextColor }}
        >
          Business Innovation Solutions
        </span>
      </div>
    </div>
  );
}
