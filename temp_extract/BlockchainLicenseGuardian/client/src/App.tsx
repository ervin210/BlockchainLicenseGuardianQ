import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Licenses from "@/pages/licenses";
import BlockchainLedger from "@/pages/blockchain";
import AiMonitoring from "@/pages/ai-monitoring";
import AccessControl from "@/pages/access-control";
import QuantumSecurity from "@/pages/quantum-security";
import BurnTransaction from "@/pages/burn-transaction";
import QuantumBlockchainSecurity from "@/pages/quantum-blockchain";
import TraceHacker from "@/pages/trace-hacker";
import AgiSecurity from "@/pages/agi-security";
import CommunityGovernance from "@/pages/community-governance";
import CodeImmutability from "@/pages/code-immutability";
import DeviceSecurity from "@/pages/device-security";
import Sidebar from "@/components/ui/sidebar";
import { useAuth } from "./hooks/useAuth";

// Protected route component
function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // If still loading auth status, show loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If not authenticated, show login button instead of redirect
  // This helps avoid redirect loops when auth state is inconsistent
  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center max-w-md px-6">
          <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-500 to-purple-600 text-transparent bg-clip-text">
            BlockSecure DRM Platform
          </h1>
          <p className="mb-4 text-gray-600">Your session has expired or you need to log in</p>
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6 text-yellow-800">
            <p className="text-sm">For security reasons, your session may have expired. Please log in to continue.</p>
          </div>
          <a 
            href="/api/login"
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium transition-all hover:shadow-lg inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Log in with Replit
          </a>
        </div>
      </div>
    );
  }
  
  // If authenticated, render the component
  return <Component {...rest} />;
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {(isAuthenticated || isLoading) && <Sidebar />}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <Switch>
          {/* Public route for login */}
          <Route path="/login">
            {isAuthenticated ? (
              <Redirect to="/" />
            ) : (
              <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                  <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-500 to-purple-600 text-transparent bg-clip-text">
                    DRM Security Platform
                  </h1>
                  <p className="mb-6 text-gray-600">Please log in to continue</p>
                  <a 
                    href="/api/login"
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium transition-all hover:shadow-lg"
                  >
                    Log in with Replit
                  </a>
                </div>
              </div>
            )}
          </Route>
          
          {/* Protected routes */}
          <Route path="/">
            <ProtectedRoute component={Dashboard} />
          </Route>
          <Route path="/licenses">
            <ProtectedRoute component={Licenses} />
          </Route>
          <Route path="/blockchain">
            <ProtectedRoute component={BlockchainLedger} />
          </Route>
          <Route path="/ai-monitoring">
            <ProtectedRoute component={AiMonitoring} />
          </Route>
          <Route path="/access-control">
            <ProtectedRoute component={AccessControl} />
          </Route>
          <Route path="/quantum-security">
            <ProtectedRoute component={QuantumSecurity} />
          </Route>
          <Route path="/burn-transaction">
            <ProtectedRoute component={BurnTransaction} />
          </Route>
          <Route path="/quantum-blockchain">
            <ProtectedRoute component={QuantumBlockchainSecurity} />
          </Route>
          <Route path="/trace-hacker">
            <ProtectedRoute component={TraceHacker} />
          </Route>
          <Route path="/agi-security">
            <ProtectedRoute component={AgiSecurity} />
          </Route>
          <Route path="/community-governance">
            <ProtectedRoute component={CommunityGovernance} />
          </Route>
          <Route path="/code-immutability">
            <ProtectedRoute component={CodeImmutability} />
          </Route>
          <Route path="/device-security">
            <ProtectedRoute component={DeviceSecurity} />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
