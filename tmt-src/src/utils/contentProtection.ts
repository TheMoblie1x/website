/**
 * Content-protection helpers.
 *
 * IMPORTANT: a web page cannot stop operating-system screenshots, screen recording or a phone pointed at the
 * screen. These measures only DISCOURAGE casual capture and make any leak traceable (visible watermark).
 * Product copy must say "discourages" / "traceable", never "prevents" / "secure".
 */

/** True when the event target is somewhere the candidate legitimately types (answers, code editor). */
export function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== 'string') return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable === true;
}

/** Key combinations that save, print or capture the page. Returns a short reason when blocked. */
export function blockedShortcutReason(e: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}): string | null {
  const k = e.key.toLowerCase();
  if (e.key === 'PrintScreen') return 'Screen capture';
  if ((e.ctrlKey || e.metaKey) && (k === 'p' || k === 's' || k === 'u')) return 'Print, save or view source';
  // macOS screenshot shortcuts (Cmd+Shift+3/4/5) are normally handled by the OS; some browsers still deliver the keydown.
  if (e.metaKey && e.shiftKey && ['3', '4', '5', 's'].includes(k)) return 'Screen capture';
  // Windows Snipping Tool (Win+Shift+S) shows up as metaKey+shift+s and is covered above.
  return null;
}

/** Keys that copy or cut text out of the question area (typing in answer fields is still allowed). */
export function isClipboardShortcut(e: { key: string; ctrlKey: boolean; metaKey: boolean }): boolean {
  const k = e.key.toLowerCase();
  return (e.ctrlKey || e.metaKey) && (k === 'c' || k === 'x' || k === 'a');
}

export interface WatermarkParts {
  name: string;
  email: string;
  attemptId: string;
}

/** Text repeated across the watermark. Includes a timestamp so a photo of the screen can be dated. */
export function watermarkLines(parts: WatermarkParts, now: Date = new Date()): string[] {
  const stamp = now.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  return [parts.name || 'Candidate', parts.email, `Attempt ${parts.attemptId}`, stamp].filter(Boolean);
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** A tiled, rotated SVG as a CSS background-image value. Low opacity so questions stay readable. */
export function watermarkBackground(parts: WatermarkParts, now: Date = new Date()): string {
  const lines = watermarkLines(parts, now);
  const text = lines
    .map((l, i) => `<tspan x="20" dy="${i === 0 ? 0 : 15}">${esc(l)}</tspan>`)
    .join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200">` +
    `<g transform="rotate(-24 160 100)"><text x="20" y="90" font-family="monospace" font-size="12" ` +
    `fill="#072d59" fill-opacity="0.11">${text}</text></g></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}
