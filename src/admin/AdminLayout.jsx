import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiBriefcase,
  FiCalendar,
  FiFile,
  FiDollarSign,
  FiClock,
  FiCheckSquare,
  FiMenu,
  FiX,
  FiLogOut,
  FiArrowLeft,
  FiBox,
} from 'react-icons/fi';
import { useAuth } from './AdminRoute';

const LayoutWrapper = styled.div`
  min-height: 100vh;
  background: var(--bg);
`;

const Sidebar = styled.aside`
  position: fixed;
  top: 0;
  left: 0;
  width: 240px;
  height: 100vh;
  background: linear-gradient(180deg, #0a1628, #060e1a);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  @media (max-width: 768px) {
    transform: translateX(${({ $open }) => ($open ? '0' : '-100%')});
    transition: transform 0.3s ease;
  }
`;

const SidebarOverlay = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: ${({ $open }) => ($open ? 'block' : 'none')};
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
  }
`;

const SidebarLogo = styled.img`
  height: 40px;
  width: auto;
  filter: brightness(0) invert(1);
  margin: 28px 24px 32px;
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`;

const SidebarLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s, background 0.2s, border-left 0.2s;
  border-left: 3px solid transparent;

  &:hover {
    color: rgba(255, 255, 255, 0.85);
    background: rgba(255, 255, 255, 0.04);
  }

  &.active {
    color: var(--accent);
    border-left-color: var(--accent);
    background: rgba(240, 165, 0, 0.06);
  }
`;

const MainArea = styled.div`
  margin-left: 240px;
  min-height: 100vh;

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const TopBar = styled.div`
  height: 60px;
  background: white;
  border-bottom: 1px solid #eee;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Hamburger = styled.button`
  display: none;
  background: none;
  border: none;
  color: var(--text);
  font-size: 1.3rem;
  cursor: pointer;
  padding: 4px;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
  }
`;

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const BackLink = styled(Link)`
  font-size: 0.85rem;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    color: var(--primary-dark);
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.2s, color 0.2s;

  &:hover {
    border-color: #c62828;
    color: #c62828;
  }
`;

const adminNavItems = [
  { to: '/admin/dashboard', icon: FiHome, label: 'Dashboard' },
  { to: '/admin/leads', icon: FiUsers, label: 'Leads' },
  { to: '/admin/quotes', icon: FiFileText, label: 'Quotes' },
  { to: '/admin/jobs', icon: FiBriefcase, label: 'Jobs' },
  { to: '/admin/schedule', icon: FiCalendar, label: 'Schedule' },
  { to: '/admin/invoices', icon: FiFile, label: 'Invoices' },
  { to: '/admin/finances', icon: FiDollarSign, label: 'Finances' },
  { to: '/admin/timesheet', icon: FiClock, label: 'Timesheet' },
  { to: '/admin/approve', icon: FiCheckSquare, label: 'Approve Time' },
  { to: '/admin/inventory', icon: FiBox, label: 'Inventory' },
];

const managerNavItems = [
  { to: '/admin/timesheet', icon: FiClock, label: 'Timesheet' },
  { to: '/admin/inventory', icon: FiBox, label: 'Inventory' },
];

const payrollNavItems = [
  { to: '/admin/approve', icon: FiCheckSquare, label: 'Approve Time' },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role } = useAuth();
  const navItems =
    role === 'manager' ? managerNavItems
    : role === 'payroll' ? payrollNavItems
    : adminNavItems;

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_role');
    navigate('/admin/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <LayoutWrapper>
      <SidebarOverlay $open={sidebarOpen} onClick={closeSidebar} />
      <Sidebar $open={sidebarOpen}>
        <SidebarLogo
          src={`${process.env.PUBLIC_URL}/nextlevellogo.png`}
          alt="NextLevel"
        />
        <Nav>
          {navItems.map(({ to, icon: Icon, label }) => (
            <SidebarLink key={to} to={to} onClick={closeSidebar}>
              <Icon size={18} />
              {label}
            </SidebarLink>
          ))}
        </Nav>
      </Sidebar>

      <MainArea>
        <TopBar>
          <TopBarLeft>
            <Hamburger onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <FiX /> : <FiMenu />}
            </Hamburger>
          </TopBarLeft>
          <TopBarRight>
            <BackLink to="/">
              <FiArrowLeft size={14} />
              Back to Site
            </BackLink>
            <LogoutButton onClick={handleLogout}>
              <FiLogOut size={14} />
              Logout
            </LogoutButton>
          </TopBarRight>
        </TopBar>
        <Outlet />
      </MainArea>
    </LayoutWrapper>
  );
};

export default AdminLayout;
