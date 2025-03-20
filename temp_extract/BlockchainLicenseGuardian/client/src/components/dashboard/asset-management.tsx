import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Asset } from "@shared/schema";
import { useState } from "react";

export default function AssetManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: assets, isLoading } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true
  });

  const filteredAssets = assets?.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'document':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'software':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      case 'music':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
        );
    }
  };
  
  const getAssetBgColor = (type: string) => {
    switch (type) {
      case 'document':
        return 'bg-blue-100';
      case 'software':
        return 'bg-purple-100';
      case 'music':
        return 'bg-green-100';
      default:
        return 'bg-gray-100';
    }
  };
  
  const getAssetTextColor = (type: string) => {
    switch (type) {
      case 'document':
        return 'text-blue-600';
      case 'software':
        return 'text-purple-600';
      case 'music':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-gray-200 p-4 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Protected Digital Assets</CardTitle>
        <Button size="sm" className="text-muted-foreground hover:text-muted-foreground px-3 py-1 border border-gray-200 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Asset
        </Button>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="mb-4">
          <div className="relative">
            <Input 
              type="text" 
              placeholder="Search assets..." 
              className="w-full pl-10 pr-4 py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3 flex items-center">
                <Skeleton className="h-10 w-10 rounded mr-3" />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-3 w-48 mt-1" />
                </div>
              </div>
            ))
          ) : filteredAssets && filteredAssets.length > 0 ? (
            filteredAssets.map(asset => (
              <div key={asset.id} className="border border-gray-100 rounded-lg p-3 flex items-center">
                <div className={`${getAssetBgColor(asset.type)} p-3 rounded mr-3 ${getAssetTextColor(asset.type)}`}>
                  {getAssetIcon(asset.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">{asset.name}</p>
                    <span className={`text-xs ${
                      asset.status === 'active' ? 'bg-green-100 text-green-600' : 
                      asset.status === 'inactive' ? 'bg-gray-100 text-gray-600' : 
                      'bg-yellow-100 text-yellow-600'
                    } px-2 py-0.5 rounded-full`}>
                      {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {/* In a real app, we'd get the actual license count */}
                    {Math.floor(Math.random() * 100) + 10} active licenses • Last updated {
                      new Date(asset.updatedAt!).toLocaleDateString('en-US', { 
                        day: 'numeric', 
                        month: 'long'
                      })
                    }
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              No assets found
            </div>
          )}
        </div>
        
        <div className="mt-4 text-center">
          <Button variant="link" className="text-primary hover:text-primary-dark text-sm font-medium">
            View All Assets
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
