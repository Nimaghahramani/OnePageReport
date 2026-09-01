import React from 'react';

interface LoicoLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  isAnimated?: boolean;
  className?: string;
  id?: string;
}

export const LoicoLogo: React.FC<LoicoLogoProps> = ({
  size = 'md',
  isAnimated = true,
  className = '',
  id = 'loico-logo-emblem'
}) => {
  // Determine pixel dimension bounds
  const getDimensions = () => {
    if (typeof size === 'number') {
      return { height: size, width: Math.round(size * (150 / 215)) };
    }
    switch (size) {
      case 'xs':
        return { height: 26, width: 18 };
      case 'sm':
        return { height: 32, width: 22 };
      case 'lg':
        return { height: 54, width: 38 };
      case 'xl':
        return { height: 72, width: 50 };
      case 'md':
      default:
        return { height: 40, width: 28 };
    }
  };

  const { width, height } = getDimensions();

  return (
    <div
      id={id}
      className={`inline-flex items-center justify-center select-none shrink-0 relative ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
      title="LOICO - Oil & Gas Executive Management"
    >
      <svg
        viewBox="0 0 150 215"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Flame Gradients */}
          <linearGradient id="loicoFlameRedGrad" x1="0%" y1="100%" x2="40%" y2="0%">
            <stop offset="0%" stopColor="#C41616" />
            <stop offset="35%" stopColor="#E62314" />
            <stop offset="70%" stopColor="#FF3B20" />
            <stop offset="100%" stopColor="#FF5E3A" />
          </linearGradient>

          <linearGradient id="loicoFlameOrangeGrad" x1="0%" y1="100%" x2="60%" y2="0%">
            <stop offset="0%" stopColor="#E65100" />
            <stop offset="30%" stopColor="#FF8F00" />
            <stop offset="70%" stopColor="#FFA726" />
            <stop offset="100%" stopColor="#FFD54F" />
          </linearGradient>

          <linearGradient id="loicoFlameCoreGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FF9800" />
            <stop offset="60%" stopColor="#FFE082" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          {/* Blue Hemisphere Gradient & Gloss */}
          <radialGradient id="loicoBlueShine" cx="35%" cy="35%" r="70%" fx="25%" fy="25%">
            <stop offset="0%" stopColor="#2980ff" />
            <stop offset="50%" stopColor="#0062e3" />
            <stop offset="85%" stopColor="#0047a8" />
            <stop offset="100%" stopColor="#003380" />
          </radialGradient>

          {/* Bevel Highlights */}
          <linearGradient id="loicoBlackRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2c3038" />
            <stop offset="45%" stopColor="#111317" />
            <stop offset="75%" stopColor="#000000" />
            <stop offset="100%" stopColor="#1e2229" />
          </linearGradient>

          <linearGradient id="loicoPillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#252930" />
            <stop offset="35%" stopColor="#111315" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>

          {/* Flame Glow Filter */}
          <filter id="loicoFlameGlowFilter" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 1
                0 0.4 0 0 0.35
                0 0 0 0 0.1
                0 0 0 0.7 0"
              result="coloredBlur"
            />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Keyframe Styles */}
          <style>{`
            @keyframes loicoFlameSwayOuter {
              0% {
                transform: rotate(0deg) skewX(0deg) scale(1, 1);
              }
              25% {
                transform: rotate(1.2deg) skewX(-1.5deg) scale(0.99, 1.02);
              }
              50% {
                transform: rotate(-1.5deg) skewX(1.8deg) scale(1.01, 0.98);
              }
              75% {
                transform: rotate(0.8deg) skewX(-0.9deg) scale(0.98, 1.03);
              }
              100% {
                transform: rotate(0deg) skewX(0deg) scale(1, 1);
              }
            }

            @keyframes loicoFlameSwayInner {
              0% {
                transform: rotate(0deg) skewX(0deg) scale(1, 1);
                opacity: 0.92;
              }
              30% {
                transform: rotate(-2deg) skewX(2.5deg) scale(1.02, 1.04);
                opacity: 1;
              }
              65% {
                transform: rotate(2.2deg) skewX(-2deg) scale(0.97, 0.98);
                opacity: 0.88;
              }
              100% {
                transform: rotate(0deg) skewX(0deg) scale(1, 1);
                opacity: 0.92;
              }
            }

            @keyframes loicoFlamePulseGlow {
              0%, 100% {
                opacity: 0.45;
                transform: scale(0.95, 0.95);
              }
              50% {
                opacity: 0.85;
                transform: scale(1.06, 1.06);
              }
            }

            .loico-anim-flame-outer {
              transform-origin: 75px 64px;
              animation: loicoFlameSwayOuter 3.2s ease-in-out infinite;
            }

            .loico-anim-flame-inner {
              transform-origin: 75px 64px;
              animation: loicoFlameSwayInner 2.4s ease-in-out infinite;
            }

            .loico-anim-glow {
              transform-origin: 75px 40px;
              animation: loicoFlamePulseGlow 2.8s ease-in-out infinite alternate;
            }

            @media print {
              .loico-anim-flame-outer,
              .loico-anim-flame-inner,
              .loico-anim-glow {
                animation: none !important;
                transform: none !important;
                filter: none !important;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .loico-anim-flame-outer,
              .loico-anim-flame-inner,
              .loico-anim-glow {
                animation: none !important;
                transform: none !important;
              }
            }
          `}</style>
        </defs>

        {/* ======================================================== */}
        {/* SECTION 1: ANIMATED / STATIC FLAME (TOP OF TORCH)         */}
        {/* ======================================================== */}
        <g id="loico-flame-layer" className={isAnimated ? '' : 'no-anim'}>
          {/* Subtle Ambient Glow Aura behind Flame */}
          {isAnimated && (
            <ellipse
              cx="75"
              cy="34"
              rx="24"
              ry="32"
              fill="#FF6A00"
              opacity="0.25"
              filter="blur(10px)"
              className="loico-anim-glow pointer-events-none"
            />
          )}

          {/* Outer Crimson / Red Flame Tongue */}
          <path
            d="M 74 64
               C 66 60, 57 48, 57 36
               C 57 20, 72 8, 97 10
               C 85 18, 80 25, 84 34
               C 87 40, 93 45, 93 52
               C 93 58, 84 62, 74 64 Z"
            fill="url(#loicoFlameRedGrad)"
            filter={isAnimated ? "url(#loicoFlameGlowFilter)" : undefined}
            className={isAnimated ? "loico-anim-flame-outer" : ""}
          />

          {/* Inner Golden-Orange Flame Tongue */}
          <path
            d="M 74 64
               C 70 59, 69 49, 72 40
               C 75 30, 84 21, 98 18
               C 91 26, 88 34, 91 42
               C 93 47, 91 55, 74 64 Z"
            fill="url(#loicoFlameOrangeGrad)"
            className={isAnimated ? "loico-anim-flame-inner" : ""}
          />

          {/* Core White-Yellow Ignition Sparkle at Torch Neck */}
          <ellipse
            cx="75"
            cy="59"
            rx="5"
            ry="4"
            fill="url(#loicoFlameCoreGrad)"
            opacity="0.85"
          />
        </g>

        {/* ======================================================== */}
        {/* SECTION 2: CIRCULAR EMBLEM & TORCH SHAFT (STABLE)        */}
        {/* ======================================================== */}
        <g id="loico-circular-emblem">
          {/* White Background of the Right Hemisphere */}
          <path
            d="M 75 60
               A 52 52 0 0 1 127 112
               A 52 52 0 0 1 75 164
               Z"
            fill="#FFFFFF"
          />

          {/* Blue Left Hemisphere with Organic Notches */}
          <path
            d="M 75 60
               A 52 52 0 0 0 23 112
               A 52 52 0 0 0 75 164
               L 75 149
               C 66 149, 58 143, 58 136
               C 58 130, 66 126, 75 125
               L 75 106
               C 61 106, 53 96, 54 84
               C 55 74, 63 69, 75 67
               Z"
            fill="url(#loicoBlueShine)"
          />

          {/* 3D Highlight Creases on the Blue Side */}
          <path
            d="M 52 143 C 58 145, 68 144, 75 142"
            stroke="#002d6b"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 55 124 C 62 125, 70 123, 75 121"
            stroke="#002d6b"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 46 86 C 54 90, 65 89, 75 84"
            stroke="#002d6b"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Outer Black Circular Ring */}
          <path
            d="M 64 61
               A 54 54 0 1 0 86 61
               L 86 68
               A 46 46 0 1 1 64 68
               Z"
            fill="url(#loicoBlackRingGrad)"
          />

          {/* Gloss Ring Highlight Edge */}
          <path
            d="M 63 61 A 54 54 0 0 0 21 112 A 54 54 0 0 0 75 166"
            fill="none"
            stroke="#4b5563"
            strokeWidth="1"
            opacity="0.4"
          />

          {/* Center Black Torch Spine / Vertical Shaft */}
          <path
            d="M 72 54
               L 78 54
               L 77 165
               L 73 165
               Z"
            fill="#050608"
          />

          {/* Right Hemisphere Black Calligraphy Emblem (Wing / Ribbon Flame) */}
          <path
            d="M 75 97
               C 84 97, 102 91, 104 84
               C 101 89, 87 101, 75 106
               C 84 107, 104 112, 104 125
               C 104 136, 88 148, 75 149
               C 84 146, 95 137, 95 126
               C 95 119, 84 114, 75 114
               Z"
            fill="#08090C"
          />

          {/* Torch Burner Top Cap (Supports the Flame) */}
          <path
            d="M 67 60
               C 67 56, 83 56, 83 60
               L 80 65
               L 70 65
               Z"
            fill="#12151B"
          />
        </g>

        {/* ======================================================== */}
        {/* SECTION 3: LOICO BOTTOM PILL BADGE                       */}
        {/* ======================================================== */}
        <g id="loico-bottom-pill">
          {/* Black Pill Container with Sleek Rounded Corners */}
          <rect
            x="15"
            y="172"
            width="120"
            height="32"
            rx="9"
            fill="url(#loicoPillGrad)"
            stroke="#374151"
            strokeWidth="1.2"
          />

          {/* Subtle Inner Highlight Border */}
          <rect
            x="17"
            y="174"
            width="116"
            height="28"
            rx="7"
            fill="none"
            stroke="#4b5563"
            strokeWidth="0.6"
            opacity="0.5"
          />

          {/* Pure White Bold Sans-Serif "LOICO" Typography */}
          <text
            x="75"
            y="194.5"
            fill="#FFFFFF"
            fontFamily="'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif"
            fontSize="18"
            fontWeight="900"
            letterSpacing="3.5"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            LOICO
          </text>
        </g>
      </svg>
    </div>
  );
};
