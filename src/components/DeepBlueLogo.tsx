import React from 'react';

interface DeepBlueLogoProps {
  className?: string;
  size?: number;
}

export const DeepBlueLogo: React.FC<DeepBlueLogoProps> = ({
  className = '',
  size = 36
}) => {
  return (
    <div 
      className={`relative flex items-center justify-center shrink-0 rounded-full shadow-lg overflow-hidden border-2 border-white/90 select-none ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: '#0A1931',
        boxShadow: '0 0 14px rgba(255, 107, 0, 0.4), inset 0 0 10px rgba(10, 25, 49, 0.8)'
      }}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Deep Blue Circular Background */}
        <circle cx="50" cy="50" r="48" fill="#0A1931" />
        
        {/* Subtle Patriotic Accents (Saffron & Green ambient glow) */}
        <circle cx="50" cy="20" r="28" fill="#FF6B00" opacity="0.25" filter="blur(6px)" />
        <circle cx="50" cy="80" r="28" fill="#138808" opacity="0.25" filter="blur(6px)" />

        {/* India Map Silhouette in Center */}
        <path 
          d="M48 18 C50 16 53 19 54 22 C55 24 58 26 56 29 C54 31 52 30 50 33 C49 35 52 38 55 38 C58 39 63 35 66 39 C68 41 65 44 64 47 C65 49 68 51 68 53 C67 56 63 56 61 58 C58 60 56 64 56 67 C55 70 54 74 53 77 C52 79 50 82 49 82 C48 82 46 79 46 76 C45 72 43 68 42 65 C41 62 39 60 38 57 C36 54 34 53 35 50 C36 47 39 46 39 43 C38 41 36 39 37 36 C38 34 40 33 42 30 C43 27 42 24 45 22 Z"
          fill="#FF6B00"
          opacity="0.35"
        />

        {/* Central Protective Shield Outline */}
        <path 
          d="M50 22 L66 30 V48 C66 60 50 72 50 72 C50 72 34 60 34 48 V30 Z" 
          stroke="#FF6B00" 
          strokeWidth="2" 
          fill="#0A1931"
          fillOpacity="0.8"
        />

        {/* Handshake Center Symbol in Crisp White */}
        <g stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M40 50 L46 44 C48 42 51 43 53 45 L58 50" />
          <path d="M60 50 L54 44 C52 42 49 43 47 45 L42 50" />
          <path d="M46 48 L54 48" />
          <path d="M45 52 L55 52" />
        </g>

        {/* Inner Safety Star/Pulse */}
        <circle cx="50" cy="50" r="1.5" fill="#FF6B00" />
      </svg>
    </div>
  );
};
