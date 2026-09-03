import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogOut, User, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between shadow-md">
      <Link to="/" className="flex items-center space-x-3 text-cyan-400 font-bold text-xl hover:text-cyan-300 transition">
        <ShieldAlert className="h-7 w-7 text-cyan-400" />
        <span>ShieldAPI</span>
        <span className="text-xs bg-cyan-900/60 text-cyan-300 font-medium px-2.5 py-0.5 rounded-full border border-cyan-700/50">
          Phase 1
        </span>
      </Link>

      <div className="flex items-center space-x-6">
        {isAuthenticated ? (
          <>
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 text-slate-300 hover:text-white transition font-medium"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <div className="flex items-center space-x-2 bg-slate-700/50 border border-slate-600 px-3 py-1.5 rounded-lg text-sm text-slate-200">
              <User className="h-4 w-4 text-cyan-400" />
              <span>{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 text-rose-400 hover:text-rose-300 transition text-sm font-medium bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/50 px-3 py-1.5 rounded-lg"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-slate-300 hover:text-white transition font-medium text-sm"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-cyan-900/30"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
