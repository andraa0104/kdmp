interface LogoProps {
  size?: number;
}

const Logo = ({ size = 40 }: LogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Circle */}
      <circle cx="50" cy="50" r="48" fill="url(#gradient)" />
      
      {/* Handshake/Unity Symbol */}
      <path
        d="M30 45 L35 40 L40 45 L45 40 L50 45 L55 40 L60 45 L65 40 L70 45"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* People/Community Circle */}
      <circle cx="35" cy="60" r="6" fill="white" />
      <circle cx="50" cy="60" r="6" fill="white" />
      <circle cx="65" cy="60" r="6" fill="white" />
      
      {/* Connection Lines */}
      <path
        d="M35 66 L35 75 M50 66 L50 75 M65 66 L65 75"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* Base/Foundation */}
      <rect x="25" y="75" width="50" height="4" rx="2" fill="white" />
      
      {/* Star accent */}
      <path
        d="M50 20 L52 26 L58 26 L53 30 L55 36 L50 32 L45 36 L47 30 L42 26 L48 26 Z"
        fill="#FCD34D"
      />
      
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DC2626" />
          <stop offset="50%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Logo;
