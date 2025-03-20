import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const isActive = (path: string) => {
    return location === path;
  };
  
  // Get first letter of username for avatar
  const getInitial = () => {
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <aside className="bg-primary w-full md:w-64 flex-shrink-0 md:h-screen overflow-y-auto">
      <div className="p-4 flex items-center border-b border-primary-light">
        <div className="bg-white p-1 rounded mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h1 className="text-white text-xl font-semibold">BlockSecure DRM</h1>
      </div>
      
      <nav className="p-2">
        <div className="mb-4">
          <p className="text-primary-light uppercase text-xs font-semibold tracking-wider mb-2 px-2">Main</p>
          <Link 
            href="/"
            className={cn(
              "flex items-center rounded p-2 mb-1",
              isActive("/") 
                ? "text-white bg-primary-light" 
                : "text-primary-light hover:text-white hover:bg-primary-light"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Dashboard</span>
          </Link>
          <Link 
            href="/licenses"
            className={cn(
              "flex items-center rounded p-2 mb-1",
              isActive("/licenses") 
                ? "text-white bg-primary-light" 
                : "text-primary-light hover:text-white hover:bg-primary-light"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Licenses</span>
          </Link>
          <Link 
            href="/blockchain"
            className={cn(
              "flex items-center rounded p-2 mb-1",
              isActive("/blockchain") 
                ? "text-white bg-primary-light" 
                : "text-primary-light hover:text-white hover:bg-primary-light"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Blockchain Ledger</span>
          </Link>
          <Link 
            href="/ai-monitoring"
            className={cn(
              "flex items-center rounded p-2 mb-1",
              isActive("/ai-monitoring") 
                ? "text-white bg-primary-light" 
                : "text-primary-light hover:text-white hover:bg-primary-light"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>AI Monitoring</span>
          </Link>
        </div>
        
        <div className="mb-4">
          <p className="text-primary-light uppercase text-xs font-semibold tracking-wider mb-2 px-2">Management</p>
          <Link 
            href="/access-control"
            className={cn(
              "flex items-center rounded p-2 mb-1",
              isActive("/access-control") 
                ? "text-white bg-primary-light" 
                : "text-primary-light hover:text-white hover:bg-primary-light"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Access Control</span>
          </Link>
          <Link 
            href="/quantum-security"
            className={cn(
              "flex items-center rounded p-2 mb-1",
              isActive("/quantum-security") 
                ? "text-white bg-primary-light" 
                : "text-primary-light hover:text-white hover:bg-primary-light"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span>Quantum Security</span>
          </Link>
          <Link 
            href="/burn-transaction"
            className={cn(
              "flex items-center rounded p-2 mb-1",
              isActive("/burn-transaction") 
                ? "text-white bg-primary-light" 
                : "text-primary-light hover:text-white hover:bg-primary-light"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
            <span>Burn Transaction</span>
          </Link>
          <Link 
            href="/quantum-blockchain"
            className={cn(
              "flex items-center rounded p-2 mb-1",
              isActive("/quantum-blockchain") 
                ? "text-white bg-primary-light" 
                : "text-primary-light hover:text-white hover:bg-primary-light"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Quantum Blockchain</span>
          </Link>
          <Link 
            href="/trace-hacker"
            className={cn(
              "flex items-center rounded p-2 mb-1",
              isActive("/trace-hacker") 
                ? "text-white bg-primary-light" 
                : "text-primary-light hover:text-white hover:bg-primary-light"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Trace Hacker</span>
          </Link>
          <Link 
            href="/agi-security"
            className={cn(
              "flex items-center rounded p-2 mb-1",
              isActive("/agi-security") 
                ? "text-white bg-primary-light" 
                : "text-primary-light hover:text-white hover:bg-primary-light"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>AGI Security</span>
          </Link>
          <Link 
            href="/community-governance"
            className={cn(
              "flex items-center rounded p-2 mb-1",
              isActive("/community-governance") 
                ? "text-white bg-primary-light" 
                : "text-primary-light hover:text-white hover:bg-primary-light"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Community Governance</span>
          </Link>
          <Link 
            href="/device-security"
            className={cn(
              "flex items-center rounded p-2 mb-1",
              isActive("/device-security") 
                ? "text-white bg-primary-light" 
                : "text-red-100 hover:text-white hover:bg-red-700 bg-red-600"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>DEVICE SECURITY ⚠️</span>
          </Link>
          
          <Link 
            href="/code-immutability"
            className={cn(
              "flex items-center rounded p-2 mb-1",
              isActive("/code-immutability") 
                ? "text-white bg-primary-light" 
                : "text-primary-light hover:text-white hover:bg-primary-light"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>Code Immutability</span>
          </Link>
          <a href="#" className="flex items-center text-primary-light hover:text-white hover:bg-primary-light rounded p-2 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Reports</span>
          </a>
          <a href="#" className="flex items-center text-primary-light hover:text-white hover:bg-primary-light rounded p-2 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </a>
        </div>
      </nav>
      
      <div className="mt-auto p-4 border-t border-primary-light">
        {isAuthenticated && user ? (
          <div className="flex flex-col text-white">
            <div className="flex items-center mb-3">
              <div className="rounded-full w-10 h-10 mr-3 bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {getInitial()}
              </div>
              <div>
                <p className="text-sm font-medium">{user.username || user.email || 'User'}</p>
                <p className="text-xs text-primary-light">
                  {user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name}` 
                    : user.profile_image_url 
                      ? 'Replit User' 
                      : 'Authenticated User'}
                </p>
              </div>
            </div>
            
            <a 
              href="/api/logout" 
              className="flex items-center text-primary-light hover:text-white transition-colors duration-200 mt-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </a>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <a 
              href="/api/login"
              className="flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium transition-all hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Log in with Replit
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}
