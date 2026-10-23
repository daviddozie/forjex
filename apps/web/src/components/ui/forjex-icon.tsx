import type { SVGProps } from 'react';

export function ForjexIcon({ className = 'w-6 h-6', ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M12 2.5L2.5 7.5V17.5L12 22.5L21.5 17.5V7.5L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 2.5L12 12.5L21.5 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M2.5 7.5L12 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M17 10L17 15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 12.5V22.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
