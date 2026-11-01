/**
 * Role-based access control for company staff.
 *
 * This is the single source of truth for what each role may do in the UI.
 * The same rules are enforced server-side by firebase/database.rules.json, which is what
 * actually protects the data. The UI uses this only to hide actions a user cannot perform.
 */
export type Role = 'owner' | 'manager' | 'evaluator';

export type Permission =
  | 'tests:read'
  | 'tests:write' // create, edit, publish, delete assessments and questions
  | 'invites:manage' // create/revoke candidate links
  | 'submissions:read'
  | 'submissions:grade' // score written answers
  | 'branding:edit'
  | 'members:manage'; // add/remove staff and change their roles

export const ROLES: Role[] = ['owner', 'manager', 'evaluator'];

const MATRIX: Record<Role, ReadonlySet<Permission>> = {
  owner: new Set<Permission>([
    'tests:read',
    'tests:write',
    'invites:manage',
    'submissions:read',
    'submissions:grade',
    'branding:edit',
    'members:manage',
  ]),
  manager: new Set<Permission>([
    'tests:read',
    'tests:write',
    'invites:manage',
    'submissions:read',
    'submissions:grade',
  ]),
  evaluator: new Set<Permission>(['tests:read', 'submissions:read', 'submissions:grade']),
};

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  manager: 'Manager',
  evaluator: 'Evaluator',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: 'Full access, including branding and team members.',
  manager: 'Create and publish assessments, invite candidates, review results.',
  evaluator: 'View assessments and score submissions. Cannot change tests.',
};

/** A missing/unknown role has no permissions (deny by default). */
export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return MATRIX[role]?.has(permission) ?? false;
}

export function isRole(value: unknown): value is Role {
  return value === 'owner' || value === 'manager' || value === 'evaluator';
}

/**
 * Firebase Realtime Database keys cannot contain '.', so emails are stored with '.' as ','.
 * The security rules compute the same key from the signed-in user's verified email.
 */
export function emailKey(email: string): string {
  return email.trim().toLowerCase().replace(/\./g, ',');
}
