import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { LedgerEntry } from "@shared/schema";

export default function BlockchainTable() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: ledgerEntries, isLoading } = useQuery<LedgerEntry[]>({
    queryKey: ['/api/ledger', refreshKey],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Card className="col-span-2">
      <CardHeader className="border-b border-gray-200 p-4 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Blockchain Ledger Activity</CardTitle>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
          <Button variant="ghost" size="sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                  </tr>
                ))
              ) : (
                ledgerEntries?.map((entry) => (
                  <tr key={entry.id} className="border-t border-gray-100 text-sm">
                    <td className="py-3 px-4 font-mono text-xs">{entry.transactionId.substring(0, 10)}...</td>
                    <td className="py-3 px-4">
                      {entry.metadata && (entry.metadata as any).assetName ? 
                        (entry.metadata as any).assetName : 
                        `Asset #${entry.assetId}`}
                    </td>
                    <td className="py-3 px-4">{entry.action.replace('_', ' ')}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Unknown'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        entry.status === 'verified' || entry.status === 'confirmed' 
                          ? 'bg-green-100 text-green-600' 
                          : entry.status === 'rejected' 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-center">
          <Button variant="link" className="text-primary hover:text-primary-dark text-sm font-medium">
            View All Transactions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
