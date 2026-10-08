import React from 'react';
import '../../styles/cyberLoader.css';

export default function CyberBrowserLoader({ statusText = 'AI CLINICAL TRANSLATION...' }) {
  return (
    <div className="cyber-loader-container">
      <svg id="browser" className="cyber-loader-svg" viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="traceGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00ccff" stopOpacity="0" />
            <stop offset="50%" stopColor="#00ccff" stopOpacity="1" />
            <stop offset="100%" stopColor="#00ffcc" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="traceGradient2" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="traceGradient3" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0" />
            <stop offset="50%" stopColor="#2dd4bf" stopOpacity="1" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="traceGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Browser Frame */}
        <rect className="browser-frame" x="2" y="2" width="396" height="236" rx="12" />

        {/* Browser Top Bar */}
        <rect className="browser-top" x="2" y="2" width="396" height="32" rx="12" />
        <rect fill="#131d2e" x="2" y="22" width="396" height="12" />

        {/* Window Control Dots */}
        <circle cx="20" cy="18" r="4.5" fill="#ef4444" opacity="0.85" />
        <circle cx="34" cy="18" r="4.5" fill="#f59e0b" opacity="0.85" />
        <circle cx="48" cy="18" r="4.5" fill="#10b981" opacity="0.85" />

        {/* Address / Status Bar */}
        <rect x="75" y="10" width="250" height="16" rx="6" fill="#1e293b" opacity="0.7" />
        <text className="loading-text" x="200" y="22" textAnchor="middle">
          {statusText}
        </text>

        {/* Grid Background Lines */}
        <line className="grid-line" x1="10" y1="50" x2="390" y2="50" />
        <line className="grid-line" x1="10" y1="90" x2="390" y2="90" />
        <line className="grid-line" x1="10" y1="130" x2="390" y2="130" />
        <line className="grid-line" x1="10" y1="170" x2="390" y2="170" />
        <line className="grid-line" x1="10" y1="210" x2="390" y2="210" />

        <line className="grid-line" x1="70" y1="40" x2="70" y2="230" />
        <line className="grid-line" x1="150" y1="40" x2="150" y2="230" />
        <line className="grid-line" x1="250" y1="40" x2="250" y2="230" />
        <line className="grid-line" x1="330" y1="40" x2="330" y2="230" />

        {/* Skeleton Card Elements (Slide Preview & Lines) */}
        <rect className="skeleton" x="24" y="52" width="100" height="70" />
        <rect className="skeleton" x="140" y="52" width="235" height="14" />
        <rect className="skeleton" x="140" y="74" width="200" height="12" />
        <rect className="skeleton" x="140" y="94" width="220" height="12" />
        <rect className="skeleton" x="140" y="114" width="160" height="12" />

        <rect className="skeleton" x="24" y="145" width="350" height="18" />
        <rect className="skeleton" x="24" y="172" width="310" height="18" />
        <rect className="skeleton" x="24" y="200" width="260" height="18" />

        {/* Animated Circuit Trace Flows */}
        <path className="trace-flow" d="M 10 50 L 70 50 L 70 130 L 150 130 L 150 210 L 390 210" />
        <path className="trace-flow" d="M 390 90 L 250 90 L 250 170 L 70 170 L 70 230" />
        <path className="trace-flow" d="M 150 40 L 150 90 L 330 90 L 330 170 L 390 170" />
        <path className="trace-flow" d="M 24 140 L 100 140 L 100 220 L 300 220" />
      </svg>
    </div>
  );
}
