type CreatorClashMarkProps = {
  compact?: boolean
}

export function CreatorClashMark({ compact = false }: CreatorClashMarkProps) {
  return (
    <span className="brand-lockup">
      <svg
        aria-hidden="true"
        className="brand-symbol"
        fill="none"
        viewBox="0 0 40 40"
      >
        <path
          d="M20 2.75 36.5 12.28v15.44L20 37.25 3.5 27.72V12.28L20 2.75Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M23.5 12.5h-5.25a6.25 6.25 0 1 0 0 12.5h5.25M16.5 17.5h7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.25"
        />
      </svg>
      {!compact && (
        <span className="brand-name">
          CREATOR <span>CLASH</span>
        </span>
      )}
    </span>
  )
}
