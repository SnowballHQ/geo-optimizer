import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { 
  BarChart3, 
  Globe, 
  FileText, 
  Settings, 
  LogOut, 
  Link as LinkIcon,
  Activity,
  Calendar,
  Building2
} from 'lucide-react';

import DomainAnalysis from './DomainAnalysis';
import { apiService } from '../utils/api';
import { getUserName, isSuperuser } from '../utils/auth';

const DomainAnalysisDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState(getUserName());
  const [activeSection, setActiveSection] = useState('domain-analysis');
  const [userBrands, setUserBrands] = useState([]);

  // Regular users can access their brand dashboard - no superuser check needed

  // Fetch user brands for navigation
  useEffect(() => {
    const fetchUserBrands = async () => {
      try {
        const response = await apiService.getUserBrands();
        setUserBrands(response.data.brands || []);
      } catch (error) {
        console.error('Error fetching user brands:', error);
      }
    };
    
    fetchUserBrands();
  }, []);

  const handleLogout = () => {
    apiService.logout();
  };

  const handleNavigate = (path, section = null) => {
    if (section) {
      setActiveSection(section);
    }
    if (path && path !== window.location.pathname) {
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-[#ffffff] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#ffffff]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <span className="text-lg font-semibold text-[#4a4a6a]">Snowball</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => handleNavigate('/dashboard', 'dashboard')}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleNavigate('/dashboard', 'blog')}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20"
          >
            <FileText className="w-4 h-4" />
            <span>Blog Analysis</span>
          </button>

          {isSuperuser() && (
            <button
              onClick={() => handleNavigate('/dashboard', 'domain')}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20"
            >
              <Globe className="w-4 h-4" />
              <span>Domain Analysis</span>
            </button>
          )}

          {!isSuperuser() && (
            <button
              onClick={() => handleNavigate('/domain-analysis', 'domain-analysis')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeSection === 'domain-analysis'
                  ? 'nav-active'
                  : 'text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Brand Dashboard</span>
            </button>
          )}

          {isSuperuser() && (
            <button
              onClick={() => handleNavigate('/dashboard', 'link')}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20"
            >
              <LinkIcon className="w-4 h-4" />
              <span>Link Analysis</span>
            </button>
          )}

          {/* <button
            onClick={() => handleNavigate('/dashboard', 'content-calendar')}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20"
          >
            <Calendar className="w-4 h-4" />
            <span>Content Calendar</span>
          </button> */}

          {/* <button
            onClick={() => window.location.href = '/shopify-integration'}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20"
          >
            <Building2 className="w-4 h-4" />
            <span>Shopify Interation</span>
          </button> */}

          {/* <button
            onClick={() => handleNavigate('/history', 'history')}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20"
          >
            <Activity className="w-4 h-4" />
            <span>History</span>
          </button> */}

          {/* <button
            onClick={() => handleNavigate('/dashboard', 'settings')}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button> */}

          {/* Playground - Only visible to super users */}
          {isSuperuser() && (
            <button
              onClick={() => navigate('/playground')}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20"
            >
              <Globe className="w-4 h-4" />
              <span>Playground</span>
            </button>
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[#ffffff]">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="bg-gray-50 border-b border-[#ffffff] px-8 py-3 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-[#000000]">
                Domain Analysis Dashboard
              </h1>
              <p className="text-[#000000] mt-1">
                Complete brand analysis and competitive intelligence
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 overflow-y-auto min-h-0 bg-white">
          <DomainAnalysis onClose={() => navigate('/dashboard')} />
        </main>
      </div>
    </div>
  );
};

export default DomainAnalysisDashboard;