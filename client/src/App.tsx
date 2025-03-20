import React from 'react';
import { Route, Router, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import pages
import CodeImmutabilityPage from './pages/code-immutability';
import LicenseManagementPage from './pages/license-management';

// Import components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Create a client
const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Navbar />
          <main className="flex-1">
            <Switch>
              <Route path="/" component={LicenseManagementPage} />
              <Route path="/code-immutability" component={CodeImmutabilityPage} />
              <Route path="/license-management" component={LicenseManagementPage} />
            </Switch>
          </main>
          <Footer />
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;