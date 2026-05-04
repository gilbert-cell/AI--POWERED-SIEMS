import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  BarChart as AnalyticsIcon,
  Tune as TuneIcon,
  Timeline as BehaviorIcon,
  Layers as LogsIcon,
  Memory as AIIcon,
  Security as AdminIcon,
  Monitor as MonitorIcon,
} from '@mui/icons-material';
import { canAccessPath, getStoredRole, ROLE_CHANGE_EVENT } from '../../utils/rbac';

const DRAWER_WIDTH = 260;

const menuItems = [
  { label: 'Dashboard',       icon: DashboardIcon, path: '/dashboard'  },
  { label: 'Alerts & Logs',   icon: LogsIcon,      path: '/logs'        },
  { label: 'Log Viewer',      icon: MonitorIcon,   path: '/log-viewer'  },
  { label: 'Behavior Analysis', icon: BehaviorIcon, path: '/behavior'  },
  { label: 'Rules & Thresholds', icon: TuneIcon,   path: '/rules'       },
  { label: 'AI Decisions',    icon: AIIcon,        path: '/ai-decisions'},
  { label: 'Analytics',       icon: AnalyticsIcon, path: '/analytics'  },
  { label: 'RBAC Admin',      icon: AdminIcon,     path: '/admin'       },
];

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentRole, setCurrentRole] = React.useState(getStoredRole());

  React.useEffect(() => {
    const handleRoleChange = (event) => {
      setCurrentRole(event.detail || getStoredRole());
    };

    window.addEventListener(ROLE_CHANGE_EVENT, handleRoleChange);
    window.addEventListener('storage', handleRoleChange);

    return () => {
      window.removeEventListener(ROLE_CHANGE_EVENT, handleRoleChange);
      window.removeEventListener('storage', handleRoleChange);
    };
  }, []);

  const handleMenuClick = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        height: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#f5f5f5',
        borderRight: '1px solid #e0e0e0',
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
          Menu
        </Typography>
      </Box>
      <Divider />

      <List>
        {menuItems.filter((item) => canAccessPath(currentRole, item.path)).map((item) => {
          const IconComponent = item.icon || DashboardIcon;
          const isActive = location.pathname === item.path;

          return (
            <ListItemButton
              key={item.path}
              onClick={() => handleMenuClick(item.path)}
              sx={{
                backgroundColor: isActive ? '#e3f2fd' : 'transparent',
                borderLeft: isActive ? '4px solid #1a237e' : '4px solid transparent',
                '&:hover': {
                  backgroundColor: '#f0f0f0',
                },
              }}
            >
              <ListItemIcon
                sx={{ color: isActive ? '#1a237e' : '#666', minWidth: 40 }}
              >
                <IconComponent />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                sx={{
                  color: isActive ? '#1a237e' : '#333',
                  fontWeight: isActive ? 'bold' : 'normal',
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
};

export default Sidebar;
