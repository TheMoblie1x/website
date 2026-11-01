import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EyeOff } from 'lucide-react';
import {
  WatermarkParts,
  blockedShortcutReason,
  isClipboardShortcut,
  isEditableTarget,
  watermarkBackground,
} from '../utils/contentProtection';

/**
 * Discourages capturing the test and makes leaks traceable. It CANNOT stop OS screenshots, screen recording or a
 * phone camera; see utils/contentProtection.ts. While enabled:
 *  - the questions are hidden whenever the window loses focus or the tab is hidden;
 *  - copy, cut, select-all, drag, print and the context menu are blocked outside answer fields;
 *  - PrintScreen / print / save shortcuts are intercepted (best effort) and briefly hide the questions;
 *  - a visible watermark (name, email, attempt, time) is tiled over the page.
 */
export function useContentProtection(enabled: boolean) {
  const [hidden, setHidden] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setHidden(false);
      setNotice(null);
      return;
    }

    const flash = (msg: string) => {
      setNotice(msg);
      window.clearTimeout(noticeTimer.current);
      noticeTimer.current = window.setTimeout(() => setNotice(null), 4000);
    };
    const hideNow = () => setHidden(true);
    const showIfFocused = () => {
      if (!document.hidden && document.hasFocus()) setHidden(false);
    };
    const onVisibility = () => (document.hidden ? hideNow() : showIfFocused());

    const onCopyLike = (e: ClipboardEvent) => {
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      flash('Copying the questions is not permitted.');
    };
    const onBlock = (e: Event) => {
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
    };
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      flash('The context menu is disabled during this test.');
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const reason = blockedShortcutReason(e);
      if (reason) {
        e.preventDefault();
        hideNow();
        window.setTimeout(showIfFocused, 1500);
        flash(`${reason} is not permitted. This attempt is watermarked.`);
        return;
      }
      if (isClipboardShortcut(e) && !isEditableTarget(e.target)) {
        e.preventDefault();
        flash('Copying the questions is not permitted.');
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      // Some browsers only deliver PrintScreen on keyup; wipe the clipboard image where permitted.
      if (e.key === 'PrintScreen') {
        hideNow();
        window.setTimeout(showIfFocused, 1500);
        navigator.clipboard?.writeText('').catch(() => undefined);
        flash('Screen capture is not permitted. This attempt is watermarked.');
      }
    };
    const onBeforePrint = () => hideNow();
    const onAfterPrint = () => showIfFocused();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', hideNow);
    window.addEventListener('focus', showIfFocused);
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    document.addEventListener('copy', onCopyLike);
    document.addEventListener('cut', onCopyLike);
    document.addEventListener('selectstart', onBlock);
    document.addEventListener('dragstart', onBlock);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('keyup', onKeyUp, true);
    document.documentElement.classList.add('tmt-protected');
    if (document.hidden || !document.hasFocus()) hideNow();

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', hideNow);
      window.removeEventListener('focus', showIfFocused);
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
      document.removeEventListener('copy', onCopyLike);
      document.removeEventListener('cut', onCopyLike);
      document.removeEventListener('selectstart', onBlock);
      document.removeEventListener('dragstart', onBlock);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('keyup', onKeyUp, true);
      document.documentElement.classList.remove('tmt-protected');
      window.clearTimeout(noticeTimer.current);
    };
  }, [enabled]);

  return { hidden: enabled && hidden, notice: enabled ? notice : null };
}

/** Watermark + "hidden" cover + notice. Render once, near the root of the test screen. */
export const ProtectionLayer: React.FC<{
  enabled: boolean;
  hidden: boolean;
  notice: string | null;
  watermark: WatermarkParts;
}> = ({ enabled, hidden, notice, watermark }) => {
  const bg = useMemo(
    () => (enabled ? watermarkBackground(watermark) : ''),
    [enabled, watermark.name, watermark.email, watermark.attemptId]
  );
  if (!enabled) return null;
  return (
    <>
      <div aria-hidden="true" className="tmt-watermark fixed inset-0 z-[45] pointer-events-none" style={{ backgroundImage: bg }} />
      {hidden && (
        <div
          role="alert"
          className="fixed inset-0 z-[60] bg-ink text-white flex flex-col items-center justify-center gap-3 p-6 text-center"
        >
          <EyeOff className="w-8 h-8" aria-hidden="true" />
          <p className="text-lg font-semibold">The test is hidden</p>
          <p className="text-sm text-white/80 max-w-sm">
            Click this window to continue. The questions are hidden while the window is not in focus. The timer keeps running.
          </p>
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] bg-ink text-white text-sm px-4 py-2.5 rounded-lg shadow-lg max-w-[90vw]"
        >
          {notice}
        </div>
      )}
    </>
  );
};
