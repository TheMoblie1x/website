import { CandidateAttempt, Organization, Test } from '../types/testforge';
import { DEFAULT_ORGANIZATIONS, INITIAL_TESTS, SAMPLE_CANDIDATE_ATTEMPTS } from './seedData';

const STORAGE_KEYS = {
  ORGANIZATIONS: 'testforge_organizations_v1',
  ACTIVE_ORG_ID: 'testforge_active_org_id_v1',
  TESTS: 'testforge_tests_v1',
  ATTEMPTS: 'testforge_attempts_v1',
  ACTIVE_ATTEMPT_ID: 'testforge_active_attempt_id_v1',
};

// Simple DJB2 cryptographic hash checksum to verify payload integrity
export function computePayloadSignature(payload: string): string {
  let hash = 5381;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash * 33) ^ payload.charCodeAt(i);
  }
  return 'sig_' + (hash >>> 0).toString(16);
}

export function getOrganizations(): Organization[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORGANIZATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ORGANIZATIONS, JSON.stringify(DEFAULT_ORGANIZATIONS));
      return DEFAULT_ORGANIZATIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_ORGANIZATIONS;
  }
}

export function saveOrganizations(orgs: Organization[]) {
  localStorage.setItem(STORAGE_KEYS.ORGANIZATIONS, JSON.stringify(orgs));
}

export function getActiveOrganization(): Organization {
  const orgs = getOrganizations();
  const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ORG_ID);
  const found = orgs.find((o) => o.id === activeId);
  return found || orgs[0];
}

export function setActiveOrganization(orgId: string) {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_ORG_ID, orgId);
}

export function getTests(): Test[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TESTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(INITIAL_TESTS));
      return INITIAL_TESTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_TESTS;
  }
}

export function saveTests(tests: Test[]) {
  localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests));
}

export function getTestById(testId: string): Test | undefined {
  const tests = getTests();
  return tests.find((t) => t.id === testId);
}

export function getAttempts(): CandidateAttempt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(SAMPLE_CANDIDATE_ATTEMPTS));
      return SAMPLE_CANDIDATE_ATTEMPTS;
    }
    const parsed: CandidateAttempt[] = JSON.parse(raw);
    const existingIds = new Set(parsed.map((a) => a.id));
    const missingSeeds = SAMPLE_CANDIDATE_ATTEMPTS.filter((s) => !existingIds.has(s.id));
    if (missingSeeds.length > 0) {
      const merged = [...parsed, ...missingSeeds];
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch (e) {
    return SAMPLE_CANDIDATE_ATTEMPTS;
  }
}

export function saveAttempt(attempt: CandidateAttempt) {
  const attempts = getAttempts();
  const index = attempts.findIndex((a) => a.id === attempt.id);
  if (index >= 0) {
    attempts[index] = attempt;
  } else {
    attempts.unshift(attempt);
  }
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));

  // Redundant signature cache in case of disconnect
  const checksum = computePayloadSignature(JSON.stringify(attempt));
  localStorage.setItem(`testforge_offline_backup_${attempt.id}`, JSON.stringify({ attempt, checksum, savedAt: Date.now() }));
}

export function getAttemptById(attemptId: string): CandidateAttempt | undefined {
  const attempts = getAttempts();
  return attempts.find((a) => a.id === attemptId);
}
