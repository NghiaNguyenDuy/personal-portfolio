interface CleanTextOptions {
  maxLength?: number;
  fallback?: string;
}

const UNSAFE_BLOCK_PATTERN =
  /<(script|style|noscript|template|svg|canvas|iframe|object|embed|picture)\b[\s\S]*?<\/\1>/gi;
const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/g;
const TAG_PATTERN = /<[^>]+>/g;
const LEAKED_IMAGE_SCRIPT_PATTERN =
  /\b(?:const|let|var)\s+\w+\s*=\s*["']undefined["']\s*!=\s*typeof\s+HTMLImageElement\s*&&\s*["']loading["']\s*in\s*HTMLImageElement\.prototype;?[\s\S]*?data-placeholder-image[\s\S]*?(?:\}\}\}?;?|\)\})/gi;
const LEAKED_DOM_SCRIPT_PATTERN =
  /\bdocument\.(?:querySelector|querySelectorAll|getElementById)\([^)]*\)[\s\S]{0,1600}?(?:dataset|setAttribute|removeAttribute|style\.opacity)[\s\S]{0,1600}?(?:\}\}\}?;?|\)\})/gi;

export function stripUnsafeHtmlBlocks(value: string) {
  return value
    .replace(HTML_COMMENT_PATTERN, " ")
    .replace(UNSAFE_BLOCK_PATTERN, " ");
}

export function stripHtmlToText(value: string, options: CleanTextOptions = {}) {
  return cleanDisplayText(
    stripUnsafeHtmlBlocks(value)
      .replace(TAG_PATTERN, " "),
    options
  );
}

export function cleanDisplayText(value: string | null | undefined, options: CleanTextOptions = {}) {
  const fallback = options.fallback ?? "";
  const maxLength = options.maxLength ?? 1000;
  const decoded = decodeHtmlEntities(String(value ?? ""));
  const cleaned = removeLeakedScripts(decoded)
    .replace(HTML_COMMENT_PATTERN, " ")
    .replace(UNSAFE_BLOCK_PATTERN, " ")
    .replace(TAG_PATTERN, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || !hasReadableCharacters(cleaned) || looksLikeScriptLeak(cleaned)) {
    return fallback;
  }

  return cleaned.slice(0, maxLength).trim();
}

export function decodeHtmlEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, codepoint: string) => String.fromCodePoint(Number.parseInt(codepoint, 16)))
    .replace(/&#(\d+);/g, (_, codepoint: string) => String.fromCodePoint(Number.parseInt(codepoint, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function removeLeakedScripts(value: string) {
  return value
    .replace(LEAKED_IMAGE_SCRIPT_PATTERN, " ")
    .replace(LEAKED_DOM_SCRIPT_PATTERN, " ")
    .replace(/\b__NEXT_DATA__\b[\s\S]{0,1200}/gi, " ")
    .replace(/\bwebpack(?:Jsonp|Chunk)?\b[\s\S]{0,1200}/gi, " ");
}

function looksLikeScriptLeak(value: string) {
  const signals = [
    "HTMLImageElement",
    "querySelectorAll",
    "querySelector",
    "dataset.src",
    "data-placeholder-image",
    "setAttribute",
    "removeAttribute",
    "document.",
    "__NEXT_DATA__",
    "webpack"
  ];
  const signalCount = signals.filter((signal) => value.includes(signal)).length;
  const hasCodePunctuation = /[{}();=]/.test(value);

  return signalCount >= 2 && hasCodePunctuation;
}

function hasReadableCharacters(value: string) {
  return /[\p{L}\p{N}]/u.test(value);
}
