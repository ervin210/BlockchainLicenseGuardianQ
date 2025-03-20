import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { License } from "@shared/schema";
import { useState } from "react";

export default function LicenseManagement() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  const { data: licenses, isLoading } = useQuery<License[]>({
    queryKey: ['/api/licenses', activeFilter],
    queryFn: async ({ queryKey }) => {
      const [_, filter] = queryKey;
      const url = filter ? `/api/licenses?status=${filter}` : '/api/licenses';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch licenses');
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true
  });

  return (
    <Card>
      <CardHeader className="border-b border-gray-200 p-4 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">License Management</CardTitle>
        <Button size="sm" className="text-muted-foreground hover:text-muted-foreground px-3 py-1 border border-gray-200 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Issue License
        </Button>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="flex space-x-2 mb-4">
          <Button 
            variant={activeFilter === null ? "default" : "ghost"} 
            className="px-3 py-1.5 text-sm"
            onClick={() => setActiveFilter(null)}
          >
            All
          </Button>
          <Button 
            variant={activeFilter === "active" ? "default" : "ghost"} 
            className="px-3 py-1.5 text-sm"
            onClick={() => setActiveFilter("active")}
          >
            Active
          </Button>
          <Button 
            variant={activeFilter === "expiring" ? "default" : "ghost"} 
            className="px-3 py-1.5 text-sm"
            onClick={() => setActiveFilter("expiring")}
          >
            Expiring
          </Button>
          <Button 
            variant={activeFilter === "revoked" ? "default" : "ghost"} 
            className="px-3 py-1.5 text-sm"
            onClick={() => setActiveFilter("revoked")}
          >
            Revoked
          </Button>
        </div>
        
        <div className="space-y-3">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3">
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-3 w-24 mr-3" />
                  <Skeleton className="h-3 w-32 mr-3" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            ))
          ) : licenses && licenses.length > 0 ? (
            licenses.map(license => {
              // Calculate expiry information
              let expiryText = 'No expiration';
              if (license.expiresAt) {
                const now = new Date();
                const expiryDate = new Date(license.expiresAt);
                const diffTime = expiryDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays < 0) {
                  expiryText = `Expired ${Math.abs(diffDays)} days ago`;
                } else {
                  expiryText = `Expires in ${diffDays} days`;
                }
              }
              
              const licensee = license.metadata && (license.metadata as any).licensee ? 
                (license.metadata as any).licensee : 'Unknown User';
                
              return (
                <div key={license.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium">{license.licenseCode}</span>
                      <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${
                        license.status === 'active' ? 'bg-green-100 text-green-600' : 
                        license.status === 'expiring' ? 'bg-yellow-100 text-yellow-600' : 
                        'bg-red-100 text-red-600'
                      }`}>
                        {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </Button>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span className="mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {licensee}
                    </span>
                    <span className="mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Asset #{license.assetId}
                    </span>
                    <span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {expiryText}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              No licenses found
            </div>
          )}
        </div>
        
        <div className="mt-4 text-center">
          <Button variant="link" className="text-primary hover:text-primary-dark text-sm font-medium">
            View All Licenses
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
