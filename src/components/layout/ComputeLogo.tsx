"use client";

export interface ComputeLogoProps {
  size?: number;
  className?: string;
}

export function ComputeLogo({ size = 22, className = "" }: ComputeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <rect
        width="64"
        height="64"
        rx="14"
        fill="#0A0B0D"
      />
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="12"
        stroke="#23272F"
        strokeWidth="2"
      />
      <path
        d="M24 8V14M40 8V14M24 50V56M40 50V56M8 24H14M8 40H14M50 24H56M50 40H56"
        stroke="#3B82F6"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <rect
        x="14"
        y="14"
        width="36"
        height="36"
        rx="8"
        fill="#111317"
        stroke="#3B82F6"
        strokeWidth="2.5"
      />
      <path
        d="M39.5 24.5C37.6 22.3 34.9 21 31.8 21C25.8 21 21 25.9 21 32C21 38.1 25.8 43 31.8 43C34.9 43 37.6 41.7 39.5 39.5"
        stroke="#F3F4F6"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <circle cx="32.5" cy="32" r="4.2" fill="#3B82F6" />
      <circle cx="41.5" cy="24" r="2.6" fill="#10B981" />
      <circle cx="41.5" cy="40" r="2.6" fill="#10B981" />
      <line
        x1="36.2"
        y1="29.6"
        x2="39.6"
        y2="25.8"
        stroke="#10B981"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.85"
      />
      <line
        x1="36.2"
        y1="34.4"
        x2="39.6"
        y2="38.2"
        stroke="#10B981"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}
