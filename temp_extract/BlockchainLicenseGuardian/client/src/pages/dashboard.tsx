import { useQuery } from "@tanstack/react-query";
import StatsCard from "@/components/dashboard/stats-card";
import BlockchainTable from "@/components/dashboard/blockchain-table";
import AiMonitoring from "@/components/dashboard/ai-monitoring";
import AssetManagement from "@/components/dashboard/asset-management";
import LicenseManagement from "@/components/dashboard/license-management";
import { Skeleton } from "@/components/ui/skeleton";
import { Statistics } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<Statistics>({
    queryKey: ['/api/statistics'],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true
  });

  return (
    <>
      <header className="bg-white shadow">
        <div className="flex justify-between items-center px-6 py-4">
          <h2 className="text-xl font-semibold text-neutral-dark">Dashboard</h2>
          <div className="flex items-center space-x-4">
            <button className="text-neutral-medium hover:text-neutral-dark">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button className="text-neutral-medium hover:text-neutral-dark">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">System Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <Skeleton className="h-12 w-12 rounded-full mr-4" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))
            ) : (
              <>
                <StatsCard
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  label="Active Licenses"
                  value={stats?.activeLicenses || 0}
                  change={{ value: 12, isPositive: true }}
                  bgColor="bg-blue-100"
                  textColor="text-blue-600"
                />
                
                <StatsCard
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  }
                  label="Ledger Entries"
                  value={stats?.ledgerEntries || 0}
                  change={{ value: 24, isPositive: true }}
                  bgColor="bg-green-100"
                  textColor="text-green-600"
                />
                
                <StatsCard
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  }
                  label="Protected Assets"
                  value={stats?.protectedAssets || 0}
                  change={{ value: 8, isPositive: true }}
                  bgColor="bg-purple-100"
                  textColor="text-purple-600"
                />
                
                <StatsCard
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  }
                  label="Violation Attempts"
                  value={stats?.violationAttempts || 0}
                  change={{ value: 3, isPositive: false }}
                  bgColor="bg-red-100"
                  textColor="text-red-600"
                />
              </>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <BlockchainTable />
          <AiMonitoring />
        </div>
        
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AssetManagement />
          <LicenseManagement />
        </div>
      </div>
    </>
  );
}
