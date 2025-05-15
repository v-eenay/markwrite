function DocxIcon({ className = '', width = 24, height = 24 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="DOCX Document"
      role="img"
    >
      {/* Document outline with improved contrast */}
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2" />
      <polyline points="14 2 14 8 20 8" strokeWidth="2" />

      {/* Subtle highlight for better visibility */}
      <rect x="4" y="11" width="16" height="7" rx="1" fill="currentColor" fillOpacity="0.1" stroke="none" />

      {/* W letter for Word with better visibility */}
      <path
        d="M8.5 12l1.5 5 1.5-5 1.5 5 1.5-5"
        strokeWidth="1.5"
        fill="none"
        stroke="currentColor"
      />

      {/* DOCX text indicator */}
      <path
        d="M8 19h8"
        strokeWidth="1.5"
        stroke="currentColor"
      />
    </svg>
  );
}

export default DocxIcon;
