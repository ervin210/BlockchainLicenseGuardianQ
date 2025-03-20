import React from 'react';
import { Shield } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center md:flex-row md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <Shield className="h-6 w-6 text-blue-600 mr-2" />
            <span className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              Blockchain DRM
            </span>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-sm text-gray-600">
              © 2025 Ervin Remus Radosavlevici. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Protected by quantum-secure blockchain technology
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;