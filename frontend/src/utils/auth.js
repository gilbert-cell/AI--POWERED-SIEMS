import { DEFAULT_ROLE, ROLE_STORAGE_KEY } from './rbac';

export const AUTH_TOKEN_KEY = 'auth_token';
export const AUTH_USER_KEY = 'siem_auth_user';
export const AUTH_USERS_KEY = 'siem_registered_users';
export const AUTH_CHANGE_EVENT = 'siem-auth-change';

const defaultUsers = [
  {
    id: 1,
    name: 'Grace Admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: DEFAULT_ROLE,
    phone: '+1 (555) 010-1000',
    department: 'Security Operations (SOC)',
    status: 'active',
    createdAt: '2026-01-12T08:00:00.000Z',
    lastLoginAt: '2026-05-04T09:15:00.000Z',
  },
];

const getUsers = () => {
  const storedUsers = localStorage.getItem(AUTH_USERS_KEY);
  if (!storedUsers) {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }

  try {
    const users = JSON.parse(storedUsers);
    return Array.isArray(users) ? users : defaultUsers;
  } catch {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
};

const saveUsers = (users) => {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
};

export const getRegisteredUsers = () => getUsers();

const emitAuthChange = () => {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const getCurrentUser = () => {
  const user = localStorage.getItem(AUTH_USER_KEY);
  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => Boolean(localStorage.getItem(AUTH_TOKEN_KEY) && getCurrentUser());

export const loginUser = ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getUsers();
  const user = users.find((item) => item.email.toLowerCase() === normalizedEmail);

  if (!user || user.password !== password) {
    throw new Error('Invalid email or password.');
  }

  const lastLoginAt = new Date().toISOString();
  const updatedUsers = users.map((item) => (
    item.id === user.id ? { ...item, lastLoginAt, status: 'active' } : item
  ));
  saveUsers(updatedUsers);

  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || DEFAULT_ROLE,
    phone: user.phone || '',
    department: user.department || '',
    status: 'active',
    lastLoginAt,
    sessionStartedAt: lastLoginAt,
  };

  localStorage.setItem(AUTH_TOKEN_KEY, `local-session-${Date.now()}`);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(sessionUser));
  localStorage.setItem(ROLE_STORAGE_KEY, sessionUser.role);
  emitAuthChange();
  return sessionUser;
};

export const registerUser = ({ name, email, password, role }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getUsers();

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    throw new Error('An account with this email already exists.');
  }

  const createdAt = new Date().toISOString();
  const user = {
    id: Date.now(),
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: role || DEFAULT_ROLE,
    phone: '',
    department: 'Security Operations (SOC)',
    status: 'active',
    createdAt,
    lastLoginAt: createdAt,
  };

  saveUsers([...users, user]);
  return user;
};

export const updateUser = (id, updates) => {
  const users = getUsers();
  const userIndex = users.findIndex((user) => user.id === id);

  if (userIndex === -1) {
    throw new Error('User account was not found.');
  }

  const normalizedEmail = updates.email?.trim().toLowerCase();
  if (
    normalizedEmail &&
    users.some((user) => user.id !== id && user.email.toLowerCase() === normalizedEmail)
  ) {
    throw new Error('An account with this email already exists.');
  }

  const nextUser = {
    ...users[userIndex],
    ...updates,
    name: updates.name?.trim() || users[userIndex].name,
    email: normalizedEmail || users[userIndex].email,
    role: updates.role || users[userIndex].role,
  };

  if (!updates.password) {
    nextUser.password = users[userIndex].password;
  }

  users[userIndex] = nextUser;
  saveUsers(users);
  return nextUser;
};

export const deleteUser = (id) => {
  const users = getUsers();
  saveUsers(users.filter((user) => user.id !== id));
};

export const registerAndLogin = ({ name, email, password, role }) => {
  const user = registerUser({ name, email, password, role });
  return loginUser({ email: user.email, password });
};

export const resetPassword = ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getUsers();
  const userIndex = users.findIndex((user) => user.email.toLowerCase() === normalizedEmail);

  if (userIndex === -1) {
    throw new Error('No account was found for that email.');
  }

  users[userIndex] = { ...users[userIndex], password };
  saveUsers(users);
  return true;
};

export const logoutUser = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  emitAuthChange();
};
