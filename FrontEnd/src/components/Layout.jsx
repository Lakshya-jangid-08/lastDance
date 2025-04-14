import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ClipboardList, Home, BarChart3, LogOut, Bell, User, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/dashboard" className="flex items-center">
                <ClipboardList className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Jigyasa</span>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  <Home className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
                <Link
                  to="/dashboard/surveys"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  <ClipboardList className="h-4 w-4 mr-1" />
                  All Surveys
                </Link>
                <Link
                  to="/dashboard/organization-surveys"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Organization Surveys
                </Link>
                <Link
                  to="/dashboard/survey-analyzer"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Open Analyzer
                </Link>
                <Link
                  to="/dashboard/saved-analyses"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Saved Analyses
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/notifications" className="text-gray-500 hover:text-gray-700">
                <Bell className="h-6 w-6" />
              </Link>
              <Link to="/dashboard/profile" className="text-gray-500 hover:text-gray-700">
                <div className="flex items-center">
                  <div className="bg-indigo-100 rounded-full p-1">
                    <User className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;