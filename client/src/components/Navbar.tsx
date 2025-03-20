import React from 'react';
import { Link, useLocation } from 'wouter';
import { Shield, Code, Key } from 'lucide-react';

const Navbar: React.FC = () => {
  const [location] = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Shield },
    { path: '/license-management', label: 'License Management', icon: Key },
    { path: '/code-immutability', label: 'Code Integrity', icon: Code },
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <a className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                  Blockchain DRM
                </span>
              </a>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link key={path} href={path}>
                  <a 
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      location === path
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-1.5 h-4 w-4" />
                    {label}
                  </a>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex md:hidden">
            <button
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;