import React from 'react';

interface AcornLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const AcornLogo: React.FC<AcornLogoProps> = ({ 
  className = '', 
  size = 48,
  showText = true 
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Acorn body - orange gradient */}
        <defs>
          <linearGradient id="acornGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5A623" />
            <stop offset="50%" stopColor="#D4915C" />
            <stop offset="100%" stopColor="#4A7BA7" />
          </linearGradient>
          <linearGradient id="arrowGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4915C" />
            <stop offset="50%" stopColor="#6B9DC4" />
            <stop offset="100%" stopColor="#1B4D7A" />
          </linearGradient>
        </defs>
        
        {/* Acorn cap/top */}
        <path 
          d="M25 45 Q20 35 30 30 Q40 25 45 35" 
          stroke="#F5A623" 
          strokeWidth="3" 
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Acorn body */}
        <path 
          d="M25 45 Q15 55 25 70 Q35 85 45 70 Q55 55 45 45" 
          stroke="#F5A623" 
          strokeWidth="3" 
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Growth stem/arrow base */}
        <path 
          d="M45 35 Q55 30 60 40 Q65 50 70 45" 
          stroke="url(#acornGradient)" 
          strokeWidth="3" 
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Arrow shaft going up */}
        <path 
          d="M70 45 Q75 35 78 25 L85 15" 
          stroke="url(#arrowGradient)" 
          strokeWidth="3" 
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Arrow head */}
        <path 
          d="M78 8 L85 15 L92 22" 
          stroke="#1B4D7A" 
          strokeWidth="3" 
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path 
          d="M85 15 L90 8" 
          stroke="#1B4D7A" 
          strokeWidth="3" 
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      
      {showText && (
        <span 
          className="font-bold text-[#1B2D45] tracking-tight"
          style={{ fontSize: size * 0.5 }}
        >
          Acorn
        </span>
      )}
    </div>
  );
};

export const AcornIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 32, 
  className = '' 
}) => (
  <AcornLogo size={size} showText={false} className={className} />
);

export default AcornLogo;
