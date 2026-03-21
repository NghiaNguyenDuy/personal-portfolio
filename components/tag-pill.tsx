import Link from "next/link";

interface TagPillProps {
  label: string;
  href?: string;
  isActive?: boolean;
  count?: number;
}

export function TagPill({ label, href, isActive = false, count }: TagPillProps) {
  const className = `tag-pill${isActive ? " is-active" : ""}`;
  const content = (
    <>
      <span>{label}</span>
      {typeof count === "number" ? <small>{count}</small> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <span className={className}>{content}</span>;
}
