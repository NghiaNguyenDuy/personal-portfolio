export function formatDate(input: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(input));
}

export function byDateDesc<T extends { publishedAt?: string; generatedAt?: string; analyzedAt?: string; importedAt?: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const left = new Date(a.publishedAt ?? a.generatedAt ?? a.analyzedAt ?? a.importedAt ?? 0).getTime();
    const right = new Date(b.publishedAt ?? b.generatedAt ?? b.analyzedAt ?? b.importedAt ?? 0).getTime();
    return right - left;
  });
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function uniqueBy<T>(items: T[], keyFn: (item: T) => string) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
