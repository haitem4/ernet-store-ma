// ============================================================
// ERNET STORE — Logo officiel & emblème haute technologie
// ============================================================
export default function Logo({
  size = 'md',
  withText = false,
  variant = 'default', // default, light, dark, compact
  className = '',
}) {
  // Dimensions de l'icône SVG
  const iconDimensions = {
    sm: { w: 28, h: 28 },
    md: { w: 36, h: 36 },
    lg: { w: 44, h: 44 },
    xl: { w: 54, h: 54 },
  };

  const currentDim = iconDimensions[size] || iconDimensions.md;

  const isLight = variant === 'light';

  const logoIcon = (
    <svg
      width={currentDim.w}
      height={currentDim.h}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`ernet-logo-icon ${className}`}
      aria-label="ERNET STORE Logo"
    >
      <defs>
        {/* Dégradé principal Cyber Blue to Royal Indigo */}
        <linearGradient id="ernetGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>

        {/* Dégradé Accent Électrique */}
        <linearGradient id="ernetGradAccent" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>

        {/* Glow Shadow */}
        <filter id="ernetGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2563eb" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Hexagone moderne / Bouclier technologique */}
      <path
        d="M24 3L42 13.5V34.5L24 45L6 34.5V13.5L24 3Z"
        fill="url(#ernetGradPrimary)"
        filter="url(#ernetGlow)"
      />

      {/* Surface intérieure facettée */}
      <path
        d="M24 5.5L39.5 14.5V33.5L24 42.5L8.5 33.5V14.5L24 5.5Z"
        fill="#0f172a"
        fillOpacity="0.3"
      />

      {/* Structure stylisée E & N (Network Nodes & Circuits) */}
      <path
        d="M16 16H32M16 24H28M16 32H32"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Connecteur vertical réseau */}
      <path
        d="M16 16V32"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Ligne diagonale dynamique N */}
      <path
        d="M23 16L32 32"
        stroke="url(#ernetGradAccent)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Nœuds de connexion (Network Pulse Nodes) */}
      <circle cx="32" cy="16" r="2.5" fill="#38bdf8" />
      <circle cx="28" cy="24" r="2.2" fill="#60a5fa" />
      <circle cx="32" cy="32" r="2.5" fill="#a855f7" />
      <circle cx="16" cy="16" r="2.2" fill="#ffffff" />
      <circle cx="16" cy="32" r="2.2" fill="#ffffff" />
    </svg>
  );

  if (!withText) {
    return logoIcon;
  }

  return (
    <div className={`ernet-brand-wrapper ${variant}`}>
      {logoIcon}
      <div className="ernet-brand-text">
        <div className="ernet-brand-title">
          <span className="ernet-brand-name">ERNET</span>
          <span className="ernet-brand-badge">STORE</span>
        </div>
        <span className="ernet-brand-tagline">
          {isLight ? 'IT Solutions & Hardware' : 'Distribution & Solutions IT'}
        </span>
      </div>
    </div>
  );
}