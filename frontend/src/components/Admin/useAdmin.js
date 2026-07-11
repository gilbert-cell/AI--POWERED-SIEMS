import { useState, useEffect } from 'react';
import { getStoredRole, normalizeRole, setStoredRole } from '../../utils/rbac';
import { deleteUser, getCurrentUser, getRegisteredUsers, registerUser, updateUser } from '../../utils/auth';
import { formatDate, formatDateTime, formatTime } from '../../utils/helpers';

const formatShortDate = (v) => {
  return formatDate(v, 'Never');
};

const createHealthSnapshot = (count) => ({
  status: 'healthy',
  uptime: `${14 + count}d ${8 + (count % 5)}h ${12 + (count % 40)}m`,
  cpuUsage: Math.min(72, 24 + count * 3),
  memoryUsage: Math.min(78, 38 + count * 4),
  diskUsage: Math.min(68, 28 + count * 2),
  activeConnections: Math.max(6, count * 4),
});

export const buildAuditLogs = (users, sessionUser) => {
  const now = Date.now();
  const actions = ['Signed in to RBAC dashboard', 'Reviewed permissions matrix', 'Viewed audit history', 'Validated account status'];
  const resources = ['Admin Console', 'User Directory', 'Audit Logs', 'User Directory'];
  return users.slice(0, 4).map((user, i) => ({
    id: user.id, user: user.email, action: actions[i], resource: resources[i],
    timestamp: formatDateTime(now - i * 20 * 60000),
    status: user.email === sessionUser?.email || i < 3 ? 'success' : 'info',
  }));
};

export const useAdmin = () => {
  const sessionUser = getCurrentUser();
  const [currentRole, setCurrentRole] = useState(getStoredRole());
  const [users, setUsers] = useState([]);
  const [systemHealth, setSystemHealth] = useState(() => createHealthSnapshot(0));
  const [lastRefresh, setLastRefresh] = useState(formatTime(new Date()));
  const [userLoadError, setUserLoadError] = useState('');

  useEffect(() => {
    let active = true;
    getRegisteredUsers().then((stored) => {
      if (!active) return;
      setUsers(stored.map((u) => ({ id: u.id, name: u.name, email: u.email, role: normalizeRole(u.role), status: u.status || 'active', lastLogin: formatShortDate(u.lastLoginAt) })));
      setSystemHealth(createHealthSnapshot(stored.length));
      setUserLoadError('');
    }).catch((err) => { if (active) setUserLoadError(err.message || 'Unable to load users.'); });
    return () => { active = false; };
  }, []);

  const handleActiveRoleChange = (role) => setCurrentRole(setStoredRole(role));

  const handleRefresh = () => {
    setSystemHealth((prev) => ({
      ...prev,
      cpuUsage: Math.min(99, Math.max(5, prev.cpuUsage + (Math.random() * 10 - 5))),
      memoryUsage: Math.min(99, Math.max(10, prev.memoryUsage + (Math.random() * 12 - 6))),
      diskUsage: Math.min(99, Math.max(15, prev.diskUsage + (Math.random() * 8 - 4))),
      activeConnections: Math.max(1, Math.round(prev.activeConnections + (Math.random() * 8 - 4))),
    }));
    setLastRefresh(formatTime(new Date()));
  };

  const saveUser = async (formData, selectedUser, onError) => {
    if (selectedUser) {
      try {
        const updated = await updateUser(selectedUser.id, { name: formData.name, email: formData.email, role: formData.role, password: formData.password || undefined });
        setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { id: updated.id, name: updated.name, email: updated.email, role: normalizeRole(updated.role), status: updated.status || 'active', lastLogin: formatShortDate(updated.lastLoginAt) } : u));
      } catch (err) { onError(err.message); return false; }
    } else {
      try {
        const created = await registerUser({ name: formData.name, email: formData.email, password: formData.password, role: formData.role });
        setUsers((prev) => [...prev, { id: created.id, name: created.name, email: created.email, role: normalizeRole(created.role), status: created.status, lastLogin: formatShortDate(created.lastLoginAt) }]);
        setSystemHealth(createHealthSnapshot(users.length + 1));
      } catch (err) { onError(err.message); return false; }
    }
    return true;
  };

  const removeUser = async (user) => {
    try {
      await deleteUser(user.id);
      const next = users.filter((u) => u.id !== user.id);
      setUsers(next);
      setSystemHealth(createHealthSnapshot(next.length));
    } catch (err) { setUserLoadError(err.message || 'Unable to delete user.'); }
  };

  return { sessionUser, currentRole, users, systemHealth, lastRefresh, userLoadError, handleActiveRoleChange, handleRefresh, saveUser, removeUser };
};
