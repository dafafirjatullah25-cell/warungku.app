import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, BarChart2, LogOut, Menu, X, Sun, Moon, UserCog } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/products',  icon: Package,         label: 'Produk' },
  { to: '/admin/orders',    icon: ShoppingBag,     label: 'Pesanan' },
  { to: '/admin/customers', icon: Users,           label: 'Pelanggan' },
  { to: '/admin/reports',   icon: BarChart2,       label: 'Laporan' },
  { to: '/admin/profile',   icon: UserCog,         label: 'Profil Admin' },
];

function SidebarContent({ user, onLogout, onClose, dark, toggleDark }) {
  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm'
        : 'text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-gray-700'
    }`;

  return (
    <>
      {/* Header sidebar */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">🛍️ Warungku</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Admin Panel</p>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{user?.name}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={navClass} onClick={onClose}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>

      {/* Tombol dark mode + Keluar */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
        <button
          onClick={toggleDark}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {dark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
          {dark ? 'Mode Terang' : 'Mode Gelap'}
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
        >
          <LogOut size={18} /> Keluar
        </button>
      </div>
    </>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { dark, toggle: toggleDark } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">

      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-gray-800 shadow-sm flex-col flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
        <SidebarContent user={user} onLogout={handleLogout} onClose={null} dark={dark} toggleDark={toggleDark} />
      </aside>

      {/* ── OVERLAY + DRAWER SIDEBAR MOBILE ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <aside
            className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent
              user={user}
              onLogout={handleLogout}
              onClose={() => setSidebarOpen(false)}
              dark={dark}
              toggleDark={toggleDark}
            />
          </aside>
        </div>
      )}

      {/* ── AREA KANAN ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar mobile */}
        <header className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 h-14 flex items-center gap-3 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Menu size={20} />
          </button>
          <span className="font-extrabold text-transparent bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text flex-1">🛍️ Warungku</span>
          {/* Tombol dark mode di topbar mobile */}
          <button
            onClick={toggleDark}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title={dark ? 'Mode Terang' : 'Mode Gelap'}
          >
            {dark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
          </button>
        </header>

        {/* Konten halaman */}
        <main className="flex-1 overflow-auto p-4 md:p-6 text-gray-900 dark:text-gray-100">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
