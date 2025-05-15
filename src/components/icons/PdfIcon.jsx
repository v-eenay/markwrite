function PdfIcon({ className = '', width = 24, height = 24 }) {
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
      aria-label="PDF Document"
      role="img"
    >
      {/* Document outline with improved contrast */}
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2" />
      <polyline points="14 2 14 8 20 8" strokeWidth="2" />

      {/* PDF text with better visibility */}
      <g fill="currentColor" stroke="currentColor" strokeWidth="0.5">
        {/* P letter */}
        <path d="M8.5 12.5v4h1v-1.5h1a1.5 1.5 0 0 0 0-3h-2z" strokeWidth="1.5" />
        <path d="M9.5 13.5h.5a.5.5 0 0 1 0 1h-.5z" />

        {/* D letter */}
        <path d="M12 12.5h1.5a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1.5z" strokeWidth="1.5" />

        {/* F letter */}
        <path d="M16 12.5h2.5m-2.5 2h1.5" strokeWidth="1.5" />
        <path d="M16 12.5v4" strokeWidth="1.5" />
      </g>

      {/* Subtle highlight for better visibility */}
      <rect x="4" y="11" width="16" height="7" rx="1" fill="currentColor" fillOpacity="0.1" stroke="none" />
    </svg>
  );
}

export default PdfIcon;
