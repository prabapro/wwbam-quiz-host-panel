// src/pages/db/components/JsonDisplay.jsx

/**
 * JsonDisplay
 * Renders JSON with lightweight token-based syntax highlighting.
 * No external libraries — regex tokeniser + inline spans.
 *
 * Props:
 *   data  {unknown}  — any value; will be JSON.stringify'd
 */

const TOKEN_PATTERNS = [
  // Keys (anything before a colon inside quotes)
  { type: 'key', regex: /"([^"]+)"(?=\s*:)/g },
  // String values
  { type: 'string', regex: /:\s*("(?:[^"\\]|\\.)*")/g },
  // Numbers
  { type: 'number', regex: /:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g },
  // Booleans
  { type: 'boolean', regex: /:\s*(true|false)/g },
  // Null
  { type: 'null', regex: /:\s*(null)/g },
];

const TOKEN_CLASS = {
  key: 'text-sky-400',
  string: 'text-emerald-400',
  number: 'text-amber-400',
  boolean: 'text-purple-400',
  null: 'text-rose-400',
};

/**
 * Tokenise a raw JSON string into an array of { text, type } segments.
 * We walk character by character, marking spans that match known token
 * positions so we can wrap them in <span> elements.
 */
function tokenise(jsonStr) {
  // Collect all match ranges with their types
  const ranges = [];

  TOKEN_PATTERNS.forEach(({ type, regex }) => {
    // Use the capture group (index 1) position when available
    let match;
    const r = new RegExp(regex.source, 'g');

    while ((match = r.exec(jsonStr)) !== null) {
      // Group 1 is the actual value token; group 0 is the full match
      const hasGroup = match[1] !== undefined;
      const start = hasGroup
        ? match.index + match[0].indexOf(match[1])
        : match.index;
      const end = start + (hasGroup ? match[1].length : match[0].length);

      // For keys, the range is the whole quoted key (match[0])
      if (type === 'key') {
        ranges.push({
          start: match.index,
          end: match.index + match[0].length,
          type,
        });
      } else {
        ranges.push({ start, end, type });
      }
    }
  });

  // Sort by start position; discard overlaps (first-come wins)
  ranges.sort((a, b) => a.start - b.start);

  const tokens = [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.start < cursor) continue; // skip overlapping

    if (range.start > cursor) {
      tokens.push({ text: jsonStr.slice(cursor, range.start), type: null });
    }
    tokens.push({
      text: jsonStr.slice(range.start, range.end),
      type: range.type,
    });
    cursor = range.end;
  }

  if (cursor < jsonStr.length) {
    tokens.push({ text: jsonStr.slice(cursor), type: null });
  }

  return tokens;
}

export function JsonDisplay({ data }) {
  if (data === null || data === undefined) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-muted-foreground italic">
        No data in this node
      </div>
    );
  }

  const jsonStr = JSON.stringify(data, null, 2);
  const tokens = tokenise(jsonStr);

  return (
    <pre className="text-xs leading-relaxed font-mono whitespace-pre overflow-auto p-4 rounded-md bg-zinc-950 dark:bg-black border border-border text-zinc-300">
      {tokens.map((token, i) =>
        token.type ? (
          <span key={i} className={TOKEN_CLASS[token.type]}>
            {token.text}
          </span>
        ) : (
          <span key={i}>{token.text}</span>
        ),
      )}
    </pre>
  );
}
