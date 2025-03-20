import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Line } from "recharts";
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Violation } from "@shared/schema";

const usageData = [
  { name: 'Mon', value: 30 },
  { name: 'Tue', value: 45 },
  { name: 'Wed', value: 38 },
  { name: 'Thu', value: 65 },
  { name: 'Fri', value: 35 },
  { name: 'Sat', value: 25 },
  { name: 'Sun', value: 40 }
];

export default function AiMonitoring() {
  const { data: violations, isLoading } = useQuery<Violation[]>({
    queryKey: ['/api/violations'],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true
  });

  return (
    <Card>
      <CardHeader className="border-b border-gray-200 p-4 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">AI Monitoring Insights</CardTitle>
        <Button variant="ghost" size="sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </Button>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">Usage Pattern Analysis</p>
          <div className="h-40 mb-4 bg-gray-50 rounded">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usageData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#805ad5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground">
            AI has detected {violations?.filter(v => !v.isResolved).length || 0} unusual access patterns in the last 24 hours
          </p>
        </div>
        
        <div className="mb-6">
          <p className="text-sm font-medium mb-2">Recent Violation Attempts</p>
          
          {isLoading ? (
            <div className="space-y-3">
              {Array(2).fill(0).map((_, i) => (
                <div key={i} className="flex items-start p-3 bg-gray-50 rounded-lg">
                  <Skeleton className="p-2 h-8 w-8 rounded-full mr-3" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-1" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : violations && violations.length > 0 ? (
            <div className="space-y-3">
              {violations.slice(0, 2).map(violation => (
                <div 
                  key={violation.id} 
                  className={`flex items-start p-3 rounded-lg ${
                    violation.severity === 'high' ? 'bg-red-50' : 
                    violation.severity === 'medium' ? 'bg-yellow-50' : 'bg-blue-50'
                  }`}
                >
                  <div className={`p-2 bg-white rounded-full mr-3 ${
                    violation.severity === 'high' ? 'text-red-600' : 
                    violation.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                  }`}>
                    {violation.severity === 'high' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    ) : violation.severity === 'medium' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {violation.type === 'duplication' ? 'Unauthorized Duplication Attempt' : 
                       violation.type === 'suspicious_pattern' ? 'Suspicious Usage Pattern' : 
                       'Unauthorized Access'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Asset #{violation.assetId} • {new Date(violation.timestamp!).toLocaleTimeString()}
                    </p>
                    <p className="text-xs mt-1">
                      {violation.type === 'duplication' ? 'Multiple simultaneous access from different locations' :
                       violation.type === 'suspicious_pattern' ? 'Unusual API call frequency detected' :
                       'Unauthorized access attempt'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              No violations detected
            </div>
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium mb-2">AI Protection Status</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Real-time Monitoring</span>
            <span className="text-xs font-medium text-green-600">Active</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Anomaly Detection</span>
            <span className="text-xs font-medium text-green-600">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Usage Pattern Learning</span>
            <span className="text-xs font-medium text-green-600">Active</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
