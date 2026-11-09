export default function ResearchArtwork({
  variant = "botanical",
}: {
  variant?: string;
}) {
  return (
    <svg
      viewBox="0 0 600 420"
      role="img"
      aria-label={
        variant === "neural"
          ? "Conceptual neural network illustration, not paper data"
          : "Conceptual illustration of quantum effects in living systems, not paper data"
      }
      className="research-art"
    >
      <defs>
        <radialGradient id={`glow-${variant}`}>
          <stop stopColor="#e3e9b9" />
          <stop offset="1" stopColor="#e8eddf" />
        </radialGradient>
        <pattern
          id={`grid-${variant}`}
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r=".8" fill="#6c8456" opacity=".23" />
        </pattern>
      </defs>
      <rect width="600" height="420" fill={`url(#glow-${variant})`} />
      <rect width="600" height="420" fill={`url(#grid-${variant})`} />
      <g fill="none" stroke="#78916b" strokeWidth="1" opacity=".5">
        <ellipse
          cx="310"
          cy="205"
          rx="164"
          ry="96"
          transform="rotate(-35 310 205)"
        />
        <ellipse
          cx="310"
          cy="205"
          rx="164"
          ry="96"
          transform="rotate(35 310 205)"
        />
        <circle cx="310" cy="205" r="144" strokeDasharray="3 8" />
        <path d="M80 205H520M310 32V380" strokeDasharray="4 8" />
      </g>
      {variant === "neural" ? (
        <g>
          {Array.from({ length: 25 }, (_, i) => {
            const x = 140 + (i % 5) * 80,
              y = 70 + Math.floor(i / 5) * 70;
            return (
              <g key={i}>
                <path
                  d={`M${x} ${y}L${300} ${210}`}
                  stroke="#8c9d6d"
                  opacity=".5"
                />
                <circle cx={x} cy={y} r={7 + (i % 3) * 3} fill="#71864e" />
                <circle cx={x} cy={y} r="4" fill="#dce5b9" />
              </g>
            );
          })}
        </g>
      ) : (
        <g>
          <path
            d="M303 352 Q324 224 300 102"
            stroke="#496440"
            strokeWidth="5"
            fill="none"
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <g
              key={i}
              transform={`translate(306 ${140 + i * 35}) rotate(${i % 2 ? 25 : -20})`}
            >
              <path
                d={
                  i % 2
                    ? "M0 0Q-110 -90 -130 -25Q-82 22 0 0"
                    : "M0 0Q110 -100 125 -35Q90 18 0 0"
                }
                fill={i % 2 ? "#8da469" : "#647f50"}
              />
              <path
                d={i % 2 ? "M0 0L-115 -30" : "M0 0L112 -35"}
                stroke="#e0e7c2"
                fill="none"
              />
            </g>
          ))}
          <circle cx="302" cy="100" r="17" fill="#c6a64c" />
          <circle cx="302" cy="100" r="30" stroke="#a9b88a" fill="none" />
        </g>
      )}
      <g fill="#52654b" fontFamily="monospace" fontSize="10">
        <text x="32" y="35">
          FIG. 01 /{" "}
          {variant === "neural" ? "CONNECTED INTELLIGENCE" : "LIVING SYSTEMS"}
        </text>
        <text x="32" y="393">
          SCIENCE AT THE INTERSECTIONS
        </text>
        <text x="470" y="393">
          ATLAS / 001
        </text>
      </g>
      <g fill="#d3a84d">
        <circle cx="174" cy="145" r="6" />
        <circle cx="447" cy="249" r="5" />
        <circle cx="361" cy="65" r="4" />
      </g>
    </svg>
  );
}
