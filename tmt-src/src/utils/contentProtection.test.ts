import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  blockedShortcutReason,
  isClipboardShortcut,
  isEditableTarget,
  watermarkBackground,
  watermarkLines,
} from './contentProtection';

const key = (k: string, o: Partial<{ ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }> = {}) => ({
  key: k,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  ...o,
});

test('PrintScreen, print and save shortcuts are blocked', () => {
  assert.ok(blockedShortcutReason(key('PrintScreen')));
  assert.ok(blockedShortcutReason(key('p', { ctrlKey: true })));
  assert.ok(blockedShortcutReason(key('s', { metaKey: true })));
  assert.ok(blockedShortcutReason(key('4', { metaKey: true, shiftKey: true })));
});

test('ordinary typing is not blocked', () => {
  assert.equal(blockedShortcutReason(key('a')), null);
  assert.equal(blockedShortcutReason(key('p')), null);
  assert.equal(blockedShortcutReason(key('4', { shiftKey: true })), null);
});

test('clipboard shortcuts detected', () => {
  assert.ok(isClipboardShortcut(key('c', { ctrlKey: true })));
  assert.ok(isClipboardShortcut(key('x', { metaKey: true })));
  assert.ok(!isClipboardShortcut(key('c')));
  assert.ok(!isClipboardShortcut(key('v', { ctrlKey: true })));
});

test('editable targets are recognised, others are not', () => {
  assert.equal(isEditableTarget({ tagName: 'TEXTAREA' } as unknown as EventTarget), true);
  assert.equal(isEditableTarget({ tagName: 'INPUT' } as unknown as EventTarget), true);
  assert.equal(isEditableTarget({ tagName: 'DIV', isContentEditable: true } as unknown as EventTarget), true);
  assert.equal(isEditableTarget({ tagName: 'P' } as unknown as EventTarget), false);
  assert.equal(isEditableTarget(null), false);
});

test('watermark carries identity and is XML-escaped', () => {
  const parts = { name: 'A <b> & "C"', email: 'a@b.co', attemptId: 'att_1' };
  const lines = watermarkLines(parts, new Date('2026-11-01T10:30:00Z'));
  assert.deepEqual(lines, ['A <b> & "C"', 'a@b.co', 'Attempt att_1', '2026-11-01 10:30 UTC']);
  const bg = decodeURIComponent(watermarkBackground(parts, new Date('2026-11-01T10:30:00Z')));
  assert.ok(bg.includes('A &lt;b&gt; &amp; &quot;C&quot;'));
  assert.ok(!bg.includes('<b>'));
  assert.ok(bg.includes('Attempt att_1'));
});
