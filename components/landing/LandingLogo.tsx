export function LandingLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className="rounded-lg"
      aria-hidden="true"
    >
      <rect x="0" y="0" width="512" height="512" rx="115" fill="#000000" stroke="#3f2d00" strokeWidth="4" />
      <path
        d="M256,80 L303.02,205.28 L436.71,211.29 L332.09,294.72 L367.68,423.71 L256,350 L144.32,423.71 L179.91,294.72 L75.29,211.29 L208.98,205.28 Z"
        fill="#facc15"
      />
    </svg>
  )
}
