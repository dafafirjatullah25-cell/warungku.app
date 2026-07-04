import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, ClipboardList, User, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import HelpModal from '../pages/customer/HelpPage';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { dark, toggle: toggleDark } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const desktopNavClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`;

  const bottomNavClass = ({ isActive }) =>
    `flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors flex-1 ${
      isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* ── HEADER DESKTOP ── */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20 hidden md:block border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-extrabold text-xl bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">🛍️ Warungku</span>
          <nav className="flex items-center gap-2">
            <NavLink to="/shop" className={desktopNavClass}>
              <ShoppingBag size={16} /> Produk
            </NavLink>
            <NavLink to="/cart" className={desktopNavClass}>
              <ShoppingCart size={16} />
              Keranjang
              {itemCount > 0 && (
                <span className="bg-emerald-600 text-white text-xs rounded-full px-1.5 py-0.5">{itemCount}</span>
              )}
            </NavLink>
            <NavLink to="/orders" className={desktopNavClass}>
              <ClipboardList size={16} /> Pesanan
            </NavLink>
            <NavLink to="/profile" className={desktopNavClass}>
              <User size={16} /> Profil
            </NavLink>
            <HelpModal />
          </nav>
          <div className="flex items-center gap-3">
            {/* Tombol dark mode desktop */}
            <button
              onClick={toggleDark}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={dark ? 'Mode Terang' : 'Mode Gelap'}
            >
              {dark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300">Halo, {user?.name}</span>
            <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400">
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </div>
      </header>

      {/* ── HEADER MOBILE ── */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20 md:hidden border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 h-14 flex items-center justify-between">
          <span className="font-extrabold text-lg bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">🛍️ Warungku</span>
          <div className="flex items-center gap-1">
            <HelpModal />
            {/* Tombol dark mode mobile header */}
            <button
              onClick={toggleDark}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {dark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ── DRAWER MENU MOBILE ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute right-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header drawer */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{user?.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Isi drawer */}
            <div className="flex-1 p-4 space-y-1">
              {[
                { to: '/shop', icon: ShoppingBag, label: 'Produk' },
                { to: '/cart', icon: ShoppingCart, label: 'Keranjang', badge: itemCount },
                { to: '/orders', icon: ClipboardList, label: 'Pesanan' },
                { to: '/profile', icon: User, label: 'Profil' },
              ].map(({ to, icon: Icon, label, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                  {badge > 0 && (
                    <span className="ml-auto bg-emerald-600 text-white text-xs rounded-full px-2 py-0.5">{badge}</span>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Tombol dark mode + keluar */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
              <button
                onClick={() => { toggleDark(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {dark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
                {dark ? 'Mode Terang' : 'Mode Gelap'}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                <LogOut size={18} /> Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── KONTEN HALAMAN ── */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-28 md:pb-6 text-gray-900 dark:text-gray-100">
        <Outlet />
      </main>

      {/* ── BOTTOM NAVIGATION BAR (HP) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden">
        <div className="flex items-center px-2 py-1 safe-area-bottom">
          <NavLink to="/shop" className={bottomNavClass}>
            <ShoppingBag size={22} />
            <span>Produk</span>
          </NavLink>
          <NavLink to="/cart" className={bottomNavClass}>
            <div className="relative">
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </div>
            <span>Keranjang</span>
          </NavLink>
          <NavLink to="/orders" className={bottomNavClass}>
            <ClipboardList size={22} />
            <span>Pesanan</span>
          </NavLink>
          <NavLink to="/profile" className={bottomNavClass}>
            <User size={22} />
            <span>Profil</span>
          </NavLink>
        </div>
      </nav>

    </div>
  );
}
