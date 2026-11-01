import { Test } from '../types/testforge';
import { INITIAL_TESTS } from '../utils/seedData';
import { normalizeTest } from './transform';

/** Before assessments moved to Firebase they lived in this browser under this key. */
export const LEGACY_TESTS_KEY = 'testforge_tests_v1';

/**
 * Assessments saved only in this browser by the old version, excluding the untouched built-in sample, that are not
 * already in the company. Pure: takes the raw stored text so it can be tested.
 */
export function findLegacyTests(raw: string | null, existingIds: Set<string>): Test[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const sampleById = new Map(INITIAL_TESTS.map((t) => [t.id, JSON.stringify(t)]));
  return parsed
    .filter((t): t is Test => !!t && typeof t === 'object' && typeof (t as Test).id === 'string' && Array.isArray((t as Test).sections))
    .filter((t) => !existingIds.has(t.id) && sampleById.get(t.id) !== JSON.stringify(t))
    .map((t) => normalizeTest(t));
}

/** A fresh, unpublished copy of the built-in sample for a company that has nothing yet. */
export function sampleAssessmentFor(companyId: string, authorId: string, now: Date = new Date()): Test {
  const src = INITIAL_TESTS[0];
  const stamp = now.getTime().toString(36);
  const idMap = new Map<string, string>();
  const newId = (old: string) => {
    if (!idMap.has(old)) idMap.set(old, `${old}_${stamp}`);
    return idMap.get(old)!;
  };
  const testId = newId(src.id);
  return normalizeTest({
    ...src,
    id: testId,
    orgId: companyId,
    authorId,
    title: `${src.title} (sample)`,
    isPublished: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    sections: src.sections.map((s) => ({
      ...s,
      id: newId(s.id),
      testId,
      questions: s.questions.map((q) => ({ ...q, id: newId(q.id), sectionId: newId(s.id) })),
    })),
  });
}
