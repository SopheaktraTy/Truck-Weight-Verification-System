import React from 'react';

export const CambodiaFlag: React.FC<{ className?: string }> = ({ className = 'w-5 h-3.5' }) => (
  <svg
    viewBox="0 0 750 500"
    className={`inline-block shadow-sm rounded-sm ${className}`}
    aria-label="Cambodia Flag"
  >
    {/* Blue top stripe */}
    <rect width="750" height="125" fill="#032EA6" />
    {/* Red middle stripe */}
    <rect y="125" width="750" height="250" fill="#ED1C24" />
    {/* Blue bottom stripe */}
    <rect y="375" width="750" height="125" fill="#032EA6" />
    {/* Angkor Wat silhouette in white */}
    <g fill="#FFFFFF" transform="translate(190, 160) scale(0.74)">
      {/* Base platform */}
      <rect x="50" y="240" width="400" height="20" rx="3" />
      <rect x="70" y="220" width="360" height="22" rx="3" />
      <rect x="90" y="190" width="320" height="32" rx="3" />
      
      {/* Central Tower */}
      <path d="M 235 20 Q 250 5 265 20 L 275 190 L 225 190 Z" />
      <rect x="238" y="5" width="24" height="25" />
      <polygon points="250,-10 242,5 258,5" />

      {/* Left Tower */}
      <path d="M 160 70 Q 175 55 190 70 L 198 190 L 152 190 Z" />
      <polygon points="175,45 168,58 182,58" />

      {/* Right Tower */}
      <path d="M 310 70 Q 325 55 340 70 L 348 190 L 302 190 Z" />
      <polygon points="325,45 318,58 332,58" />

      {/* Outer Left Tower */}
      <path d="M 100 110 Q 112 95 125 110 L 132 190 L 93 190 Z" />
      <polygon points="112,85 106,98 119,98" />

      {/* Outer Right Tower */}
      <path d="M 375 110 Q 387 95 400 110 L 407 190 L 368 190 Z" />
      <polygon points="387,85 381,98 394,98" />
    </g>
  </svg>
);

export const USFlag: React.FC<{ className?: string }> = ({ className = 'w-5 h-3.5' }) => (
  <svg
    viewBox="0 0 741 390"
    className={`inline-block shadow-sm rounded-sm ${className}`}
    aria-label="United States Flag"
  >
    {/* 13 Red & White stripes */}
    <rect width="741" height="390" fill="#B22234" />
    <rect y="30" width="741" height="30" fill="#FFFFFF" />
    <rect y="90" width="741" height="30" fill="#FFFFFF" />
    <rect y="150" width="741" height="30" fill="#FFFFFF" />
    <rect y="210" width="741" height="30" fill="#FFFFFF" />
    <rect y="270" width="741" height="30" fill="#FFFFFF" />
    <rect y="330" width="741" height="30" fill="#FFFFFF" />
    {/* Blue canton */}
    <rect width="296.4" height="210" fill="#3C3B6E" />
    {/* Stars */}
    <g fill="#FFFFFF" transform="scale(0.85) translate(15, 10)">
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2, 3, 4, 5].map((col) => (
          <circle
            key={`s1-${row}-${col}`}
            cx={col * 50 + 25}
            cy={row * 40 + 20}
            r="6"
          />
        ))
      )}
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3, 4].map((col) => (
          <circle
            key={`s2-${row}-${col}`}
            cx={col * 50 + 50}
            cy={row * 40 + 40}
            r="6"
          />
        ))
      )}
    </g>
  </svg>
);
