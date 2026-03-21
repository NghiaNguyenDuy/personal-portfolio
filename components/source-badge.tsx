interface SourceBadgeProps {
  label: string;
}

export function SourceBadge({ label }: SourceBadgeProps) {
  return <span className="source-badge">{label}</span>;
}
