export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  BDM: 'bdm',
  AGENT: 'agent',
  TELECALLER: 'telecaller',
  LEGAL: 'legal',
  ACCOUNTS: 'accounts',
};

export const roleNav = {
  [ROLES.SUPER_ADMIN]: ['dashboard', 'users', 'societies', 'members', 'calls', 'notices', 'payments'],
  [ROLES.BDM]: ['dashboard', 'societies', 'members', 'notices'],
  [ROLES.AGENT]: ['dashboard', 'members'],
  [ROLES.TELECALLER]: ['dashboard', 'members', 'calls'],
  [ROLES.LEGAL]: ['dashboard', 'members', 'notices'],
  [ROLES.ACCOUNTS]: ['dashboard', 'payments', 'members'],
};

export function canAccess(role, page) {
  if (!role || !roleNav[role]) return false;
  return roleNav[role].includes(page);
}

export const pageTitles = {
  dashboard: 'Dashboard',
  users: 'Users',
  societies: 'Societies',
  members: 'Members',
  calls: 'Calls',
  notices: 'Notices',
  payments: 'Payments',
};
