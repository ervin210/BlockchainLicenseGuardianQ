import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Violation, Asset } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { analyzeUsagePattern } from "@/lib/ai-monitor";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const VIOLATION_TYPES = [
  { key: 'duplication', color: '#ef4444' },
  { key: 'suspicious_pattern', color: '#f97316' },
  { key: 'unauthorized_access', color: '#8b5cf6' },
  { key: 'license_misuse', color: '#06b6d4' },
  { key: 'content_scraping', color: '#ec4899' },
  { key: 'api_abuse', color: '#14b8a6' },
  { key: 'temporal_anomaly', color: '#f59e0b' }
];

// Sample data for demonstration purposes
const dailyUsageData = [
  { day: 'Mon', authorizedAccess: 42, unauthorizedAttempts: 3 },
  { day: 'Tue', authorizedAccess: 53, unauthorizedAttempts: 2 },
  { day: 'Wed', authorizedAccess: 49, unauthorizedAttempts: 5 },
  { day: 'Thu', authorizedAccess: 65, unauthorizedAttempts: 4 },
  { day: 'Fri', authorizedAccess: 58, unauthorizedAttempts: 2 },
  { day: 'Sat', authorizedAccess: 32, unauthorizedAttempts: 1 },
  { day: 'Sun', authorizedAccess: 27, unauthorizedAttempts: 0 },
];

const usagePatternData = [
  { hour: '00', usage: 5 },
  { hour: '02', usage: 3 },
  { hour: '04', usage: 2 },
  { hour: '06', usage: 7 },
  { hour: '08', usage: 18 },
  { hour: '10', usage: 25 },
  { hour: '12', usage: 32 },
  { hour: '14', usage: 37 },
  { hour: '16', usage: 30 },
  { hour: '18', usage: 25 },
  { hour: '20', usage: 15 },
  { hour: '22', usage: 8 },
];

export default function AiMonitoring() {
  const [activeTab, setActiveTab] = useState("violations");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: violations, isLoading: isLoadingViolations } = useQuery<Violation[]>({
    queryKey: ['/api/violations'],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true
  });

  const { data: assets, isLoading: isLoadingAssets } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true
  });

  // Filter violations based on search term and selected asset
  const filteredViolations = violations?.filter(violation => {
    const matchesSearch = 
      violation.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      violation.severity.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAsset = selectedAsset ? 
      violation.assetId === parseInt(selectedAsset) : 
      true;
    
    return matchesSearch && matchesAsset;
  });

  // Count violations by type for pie chart
  const violationsByType = violations?.reduce((acc: any, violation) => {
    acc[violation.type] = (acc[violation.type] || 0) + 1;
    return acc;
  }, {});

  const pieChartData = violationsByType ? 
    Object.keys(violationsByType).map(type => ({
      name: type.replace(/_/g, ' '),
      value: violationsByType[type]
    })) : [];

  // Function to run AI analysis on a specific asset
  const runAiAnalysis = async () => {
    if (!selectedAsset) {
      toast({
        title: "Error",
        description: "Please select an asset to analyze",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await analyzeUsagePattern(parseInt(selectedAsset));
      
      toast({
        title: "Analysis Complete",
        description: result.message,
        variant: result.anomalies.length > 0 ? "destructive" : "default",
      });
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getViolationTitle = (type: string) => {
    switch(type) {
      case 'duplication':
        return 'Unauthorized Duplication Attempt';
      case 'suspicious_pattern':
        return 'Suspicious Usage Pattern';
      case 'unauthorized_access':
        return 'Unauthorized Access Attempt';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  const getViolationIcon = (severity: string) => {
    switch(severity) {
      case 'high':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        );
      case 'medium':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getViolationDescription = (violation: Violation) => {
    switch(violation.type) {
      case 'duplication':
        return 'Multiple simultaneous access from different locations detected';
      case 'suspicious_pattern':
        return 'Unusual API call frequency or access patterns detected';
      case 'unauthorized_access':
        return 'Attempt to access without proper authorization detected';
      case 'license_misuse':
        return 'Violation of license terms or usage outside permitted regions';
      case 'content_scraping':
        return 'Automated content extraction or high volume data transfers';
      case 'api_abuse':
        return 'Excessive API calls or attempted rate limit circumvention';
      case 'temporal_anomaly':
        return 'Access during unusual hours or deviation from normal time patterns';
      default:
        return 'Unknown violation type';
    }
  };

  const getSeverityBgColor = (severity: string) => {
    switch(severity) {
      case 'high':
        return 'bg-red-50';
      case 'medium':
        return 'bg-yellow-50';
      case 'low':
        return 'bg-blue-50';
      default:
        return 'bg-gray-50';
    }
  };

  const getSeverityIconBgColor = (severity: string) => {
    switch(severity) {
      case 'high':
        return 'bg-white text-red-600';
      case 'medium':
        return 'bg-white text-yellow-600';
      case 'low':
        return 'bg-white text-blue-600';
      default:
        return 'bg-white text-gray-600';
    }
  };

  return (
    <>
      <header className="bg-white shadow">
        <div className="flex justify-between items-center px-6 py-4">
          <h2 className="text-xl font-semibold text-neutral-dark">AI Monitoring</h2>
          <Button onClick={runAiAnalysis}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Run AI Analysis
          </Button>
        </div>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-base">AI System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Real-time Monitoring</span>
                  <span className="text-sm font-medium text-green-600 flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-600 mr-1.5"></span>
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Anomaly Detection</span>
                  <span className="text-sm font-medium text-green-600 flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-600 mr-1.5"></span>
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pattern Learning</span>
                  <span className="text-sm font-medium text-green-600 flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-600 mr-1.5"></span>
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Model Update</span>
                  <span className="text-sm font-medium">12 hours ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Detection Accuracy</span>
                  <span className="text-sm font-medium">97.8%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Daily Usage Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyUsageData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="authorizedAccess" name="Authorized Access" fill="#0ea5e9" />
                    <Bar dataKey="unauthorizedAttempts" name="Unauthorized Attempts" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Violation Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-60">
                {isLoadingViolations ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-full w-full rounded" />
                  </div>
                ) : violations && violations.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={VIOLATION_TYPES.find(t => t.key === entry.name.replace(' ', '_'))?.color || '#8884d8'} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No violation data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Usage Pattern Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usagePatternData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Access Count', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="usage" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="border-b border-gray-200">
            <CardTitle>AI Detection Results</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="violations">Violations</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="violations" className="mt-0">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Input 
                      type="text" 
                      placeholder="Search violations..." 
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute left-3 top-2.5 text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="w-full sm:w-64">
                    <select 
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={selectedAsset || ""}
                      onChange={(e) => setSelectedAsset(e.target.value || null)}
                    >
                      <option value="">All Assets</option>
                      {assets?.map(asset => (
                        <option key={asset.id} value={asset.id.toString()}>
                          {asset.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  {isLoadingViolations ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex items-start p-4 bg-gray-50 rounded-lg">
                        <Skeleton className="h-8 w-8 rounded-full mr-4" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-1/2 mb-2" />
                          <Skeleton className="h-4 w-1/3 mb-2" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                    ))
                  ) : filteredViolations && filteredViolations.length > 0 ? (
                    filteredViolations.map(violation => (
                      <div 
                        key={violation.id} 
                        className={`flex items-start p-4 rounded-lg ${getSeverityBgColor(violation.severity)}`}
                      >
                        <div className={`p-2 rounded-full mr-3 ${getSeverityIconBgColor(violation.severity)}`}>
                          {getViolationIcon(violation.severity)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {getViolationTitle(violation.type)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Asset #{violation.assetId} • {new Date(violation.timestamp!).toLocaleString()}
                          </p>
                          <p className="text-xs mt-1">{getViolationDescription(violation)}</p>
                          <div className="mt-3 flex justify-between items-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${ 
                              violation.severity === 'high' ? 'bg-red-100 text-red-800' : 
                              violation.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {violation.severity.toUpperCase()} Severity
                            </span>
                            <div>
                              {!violation.isResolved && (
                                <Button variant="outline" size="sm" className="mr-2 h-7 text-xs">
                                  Mark as Resolved
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" className="h-7 text-xs">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="rounded-full bg-blue-50 p-3 text-blue-600 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium">No violations found</h3>
                      <p className="text-muted-foreground mt-1">
                        All clear! No violations have been detected by the AI monitoring system.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">AI Detection Confidence</CardTitle>
                      <CardDescription className="text-xs">Enhanced ML confidence scores by violation type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={[
                              { name: 'Suspicious Pattern', confidence: 78 },
                              { name: 'Duplication', confidence: 92 },
                              { name: 'License Misuse', confidence: 90 },
                              { name: 'Content Scraping', confidence: 82 },
                              { name: 'API Abuse', confidence: 95 },
                              { name: 'Temporal Anomaly', confidence: 80 },
                              { name: 'Unauthorized Access', confidence: 85 }
                            ]}
                            margin={{ top: 20, right: 20, bottom: 20, left: 70 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={90} />
                            <YAxis label={{ value: 'Confidence %', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Bar dataKey="confidence" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">ML Feature Importance</CardTitle>
                      <CardDescription className="text-xs">Key factors in advanced detection model</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart outerRadius={90} width={500} height={250} data={[
                            { feature: "Temporal", value: 82 },
                            { feature: "Location", value: 94 },
                            { feature: "Behavior", value: 87 },
                            { feature: "Device", value: 76 },
                            { feature: "User Trust", value: 65 },
                            { feature: "Content", value: 79 },
                            { feature: "Network", value: 88 }
                          ]}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="feature" />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} />
                            <Radar name="ML Feature Importance" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                            <Tooltip />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card className="col-span-1">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">ML Model Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Model Name</span>
                          <span className="font-medium">QuantumAI Neural Detection v2.3</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Model Type</span>
                          <span className="font-medium">Hybrid Neural Network</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Accuracy</span>
                          <span className="font-medium">97.8%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">False Positive Rate</span>
                          <span className="font-medium">0.032%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Last Training</span>
                          <span className="font-medium">12 hours ago</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Training Samples</span>
                          <span className="font-medium">5.2M data points</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Active Features</span>
                          <span className="font-medium">47</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Advanced ML Learning Progress</CardTitle>
                      <CardDescription className="text-xs">Training progress by feature category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Temporal Pattern Recognition</span>
                            <span className="text-sm font-medium">92%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '92%' }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Geographic Anomaly Detection</span>
                            <span className="text-sm font-medium">94%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '94%' }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Context-Aware Behavioral Analysis</span>
                            <span className="text-sm font-medium">84%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '84%' }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Device Fingerprint Analysis</span>
                            <span className="text-sm font-medium">86%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '86%' }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">User Behavior Prediction</span>
                            <span className="text-sm font-medium">79%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '79%' }}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Detection Capabilities</CardTitle>
                    <CardDescription className="text-xs">Enhanced ML capabilities with specialized detection modules</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          title: "Impossible Travel Detection",
                          description: "Identifies access from geographically distant locations in improbable timeframes",
                          status: "Active"
                        },
                        {
                          title: "Device Fingerprinting",
                          description: "Analyzes hardware and software signatures to identify unique devices",
                          status: "Active"
                        },
                        {
                          title: "Behavioral Biometrics",
                          description: "Analyzes typing patterns, mouse movements and interaction habits",
                          status: "Active"
                        },
                        {
                          title: "Time-Based Anomaly Detection",
                          description: "Identifies access during unusual hours based on historical patterns",
                          status: "Active"
                        },
                        {
                          title: "Network Traffic Analysis",
                          description: "Monitors data transfer patterns and API request frequencies",
                          status: "Active"
                        },
                        {
                          title: "Credential Sharing Detection",
                          description: "Identifies multiple users sharing the same account credentials",
                          status: "Active"
                        },
                        {
                          title: "Content Exfiltration Prevention",
                          description: "Detects and prevents automated content scraping attempts",
                          status: "Active"
                        },
                        {
                          title: "Geofencing Enforcement",
                          description: "Restricts access based on geographical boundaries defined in licenses",
                          status: "Active"
                        },
                        {
                          title: "Bot Detection",
                          description: "Identifies automated systems and scripts attempting to access content",
                          status: "Active"
                        }
                      ].map((capability, i) => (
                        <div key={i} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-sm font-medium">{capability.title}</h3>
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              {capability.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{capability.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
