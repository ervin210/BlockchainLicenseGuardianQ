import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, 
  Shield, 
  ShieldAlert, 
  Laptop, 
  Globe, 
  EyeOff, 
  Eye, 
  Network, 
  MonitorSmartphone,
  Map,
  UserX,
  AlertTriangle,
  FileLock2,
  Camera,
  Radio,
  Terminal,
  Smartphone,
  Clock,
  LockKeyhole,
  History,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { 
  captureDeviceSnapshot,
  scanForRemoteConnections,
  backtraceRemoteConnection, 
  executeRemoteCountermeasures,
  RemoteAccessType,
  DeviceSnapshot
} from '@/lib/quantum-device-detection';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function TraceHacker() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [selectedTab, setSelectedTab] = useState('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [isTracing, setIsTracing] = useState(false);
  const [isCountermeasuring, setIsCountermeasuring] = useState(false);
  const [deviceSnapshot, setDeviceSnapshot] = useState<DeviceSnapshot | null>(null);
  const [traceResults, setTraceResults] = useState<{
    success: boolean;
    originDevice?: any;
    originIp?: string;
    originLocation?: string;
    originUser?: string;
    traceLog: string[];
  } | null>(null);
  const [countermeasureResults, setCountermeasureResults] = useState<{
    success: boolean;
    actionsPerformed: string[];
    devicesBlacklisted: number;
    attackerIpBlocked: boolean;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  
  // Fetch ledger entries for security events
  const { data: ledgerEntries } = useQuery({
    queryKey: ['/api/ledger'],
    refetchInterval: 10000
  });

  const runDeviceScan = async () => {
    setIsScanning(true);
    setProgress(0);
    
    // Simulated progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 400);
    
    try {
      // Start fake progress first
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Capture device snapshot
      const snapshot = await captureDeviceSnapshot();
      setDeviceSnapshot(snapshot);
      
      toast({
        title: snapshot.remoteStatus.isRemoteAccess ? "Remote Access Detected!" : "Device Scan Complete",
        description: snapshot.remoteStatus.isRemoteAccess 
          ? `Detected ${snapshot.remoteStatus.remoteType} remote connection` 
          : "No suspicious remote connections detected",
        variant: snapshot.remoteStatus.isRemoteAccess ? "destructive" : "default",
      });
      
      // Switch to trace tab if remote access detected
      if (snapshot.remoteStatus.isRemoteAccess) {
        setSelectedTab('trace');
      }
    } catch (error) {
      console.error("Device scan failed:", error);
      toast({
        title: "Scan Failed",
        description: "Failed to complete the device scan",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setIsScanning(false);
        setProgress(0);
      }, 1000);
    }
  };
  
  const runConnectionTrace = async () => {
    if (!deviceSnapshot || !deviceSnapshot.remoteStatus.isRemoteAccess) {
      toast({
        title: "No Remote Connection",
        description: "No remote connection has been detected to trace",
        variant: "destructive",
      });
      return;
    }
    
    setIsTracing(true);
    setProgress(0);
    
    // Simulated progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 500);
    
    try {
      // Run the backtrace
      const results = await backtraceRemoteConnection(deviceSnapshot.remoteStatus.connectionChain);
      setTraceResults(results);
      
      toast({
        title: results.success ? "Origin Traced Successfully" : "Trace Partially Completed",
        description: results.success 
          ? `Origin identified: ${results.originLocation}` 
          : "Could not trace connection to its origin",
        variant: results.success ? "default" : "destructive",
      });
      
      // Switch to countermeasures tab if trace was successful
      if (results.success) {
        setSelectedTab('countermeasures');
      }
    } catch (error) {
      console.error("Connection trace failed:", error);
      toast({
        title: "Trace Failed",
        description: "Failed to trace remote connection",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setIsTracing(false);
        setProgress(0);
      }, 1000);
    }
  };
  
  const runCountermeasures = async () => {
    if (!deviceSnapshot || !deviceSnapshot.remoteStatus.isRemoteAccess) {
      toast({
        title: "No Remote Connection",
        description: "No remote connection has been detected to block",
        variant: "destructive",
      });
      return;
    }
    
    setIsCountermeasuring(true);
    setProgress(0);
    
    // Simulated progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 12;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 300);
    
    try {
      // Execute countermeasures
      const results = await executeRemoteCountermeasures(deviceSnapshot.remoteStatus);
      setCountermeasureResults(results);
      
      toast({
        title: "Countermeasures Complete",
        description: `Performed ${results.actionsPerformed.length} security actions`,
        variant: "default",
      });
      
      if (results.attackerIpBlocked) {
        setTimeout(() => {
          toast({
            title: "Attacker Blocked",
            description: "Malicious IP addresses have been blocked",
            variant: "default",
          });
        }, 1000);
      }
      
      if (results.devicesBlacklisted > 0) {
        setTimeout(() => {
          toast({
            title: "Devices Blacklisted",
            description: `${results.devicesBlacklisted} devices added to security blacklist`,
            variant: "default",
          });
        }, 2000);
      }
    } catch (error) {
      console.error("Countermeasures failed:", error);
      toast({
        title: "Countermeasures Failed",
        description: "Failed to execute security countermeasures",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setIsCountermeasuring(false);
        setProgress(0);
      }, 1000);
    }
  };
  
  // Helper function to determine node badge variant
  const getNodeBadgeVariant = (nodeType: RemoteAccessType) => {
    switch (nodeType) {
      case RemoteAccessType.DIRECT:
        return "outline";
      case RemoteAccessType.VPN:
      case RemoteAccessType.PROXY:
      case RemoteAccessType.TOR:
        return "secondary";
      case RemoteAccessType.RDP:
      case RemoteAccessType.SSH:
      case RemoteAccessType.TEAM_VIEWER:
      case RemoteAccessType.ANY_DESK:
        return "destructive";
      default:
        return "destructive";
    }
  };
  
  // Format a remote access type for display
  const formatRemoteType = (type: RemoteAccessType) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };
  
  return (
    <div className="container py-8">
      <div className="space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Advanced Remote Access Tracker</h1>
          <p className="text-muted-foreground">
            Detect, trace, and block unauthorized remote connections through VPNs, proxies, and remote desktop tools
          </p>
        </div>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full md:w-[600px]">
            <TabsTrigger value="scan">
              <Laptop className="mr-2 h-4 w-4" /> 
              Device Scan
            </TabsTrigger>
            <TabsTrigger value="trace">
              <Network className="mr-2 h-4 w-4" /> 
              Connection Trace
            </TabsTrigger>
            <TabsTrigger value="countermeasures">
              <Shield className="mr-2 h-4 w-4" /> 
              Countermeasures
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="scan" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MonitorSmartphone className="mr-2 h-5 w-5 text-primary" />
                    Device Security Scan
                  </CardTitle>
                  <CardDescription>
                    Detect unauthorized remote connections and access patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className={isScanning ? "pb-2" : ""}>
                  {isScanning ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Scanning device and connections...</span>
                          <span>{Math.floor(progress)}%</span>
                        </div>
                        <Progress value={progress} />
                      </div>
                      <div className="space-y-1 text-sm">
                        {progress > 10 && <p>✓ Capturing device fingerprint...</p>}
                        {progress > 30 && <p>✓ Analyzing network traffic patterns...</p>}
                        {progress > 50 && <p>✓ Checking for virtualization and remote desktop...</p>}
                        {progress > 70 && <p>✓ Inspecting connection routing...</p>}
                        {progress > 85 && <p>✓ Verifying IP address origins...</p>}
                        {progress > 95 && <p>✓ Generating security report...</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert>
                        <Laptop className="h-4 w-4" />
                        <AlertTitle>Device Scanning</AlertTitle>
                        <AlertDescription>
                          This tool can detect if someone is accessing your system through remote access tools, VPNs, or TOR, even if they're using multiple hops to hide their origin.
                        </AlertDescription>
                      </Alert>
                      
                      {deviceSnapshot ? (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="font-medium">Remote Access Detected:</span>
                              {deviceSnapshot.remoteStatus.isRemoteAccess ? (
                                <Badge variant="destructive">Yes - {formatRemoteType(deviceSnapshot.remoteStatus.remoteType)}</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">No</Badge>
                              )}
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="font-medium">Device Trust Score:</span>
                              <div className="flex items-center">
                                <span className="mr-2">{deviceSnapshot.remoteStatus.deviceTrustScore}/100</span>
                                <div className="w-20">
                                  <Progress 
                                    value={deviceSnapshot.remoteStatus.deviceTrustScore} 
                                    className={
                                      deviceSnapshot.remoteStatus.deviceTrustScore > 70 ? "bg-green-100" : 
                                      deviceSnapshot.remoteStatus.deviceTrustScore > 40 ? "bg-yellow-100" : 
                                      "bg-red-100"
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <Separator className="my-2" />
                            
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="font-medium">VPN Detected:</span>
                                <Badge variant={deviceSnapshot.remoteStatus.vpnDetected ? "secondary" : "outline"}>
                                  {deviceSnapshot.remoteStatus.vpnDetected ? "Yes" : "No"}
                                </Badge>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="font-medium">TOR Network:</span>
                                <Badge variant={deviceSnapshot.remoteStatus.torDetected ? "destructive" : "outline"}>
                                  {deviceSnapshot.remoteStatus.torDetected ? "Yes" : "No"}
                                </Badge>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="font-medium">Proxy Server:</span>
                                <Badge variant={deviceSnapshot.remoteStatus.proxyDetected ? "secondary" : "outline"}>
                                  {deviceSnapshot.remoteStatus.proxyDetected ? "Yes" : "No"}
                                </Badge>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="font-medium">Remote Desktop:</span>
                                <Badge variant={deviceSnapshot.remoteStatus.rdpDetected ? "destructive" : "outline"}>
                                  {deviceSnapshot.remoteStatus.rdpDetected ? "Yes" : "No"}
                                </Badge>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="font-medium">Remote Control Software:</span>
                                <Badge variant={deviceSnapshot.remoteStatus.teamViewerDetected || deviceSnapshot.remoteStatus.anyDeskDetected ? "destructive" : "outline"}>
                                  {deviceSnapshot.remoteStatus.teamViewerDetected || deviceSnapshot.remoteStatus.anyDeskDetected ? "Yes" : "No"}
                                </Badge>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="font-medium">Known Malicious Source:</span>
                                <Badge variant={deviceSnapshot.remoteStatus.knownMaliciousIp ? "destructive" : "outline"}>
                                  {deviceSnapshot.remoteStatus.knownMaliciousIp ? "Yes" : "No"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {deviceSnapshot.remoteStatus.isRemoteAccess && (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>Remote Access Detected</AlertTitle>
                              <AlertDescription>
                                Your session is being accessed remotely through {formatRemoteType(deviceSnapshot.remoteStatus.remoteType)}. 
                                This may indicate unauthorized access to your system.
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          {deviceSnapshot.remoteStatus.securityRecommendations.length > 0 && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-medium">Security Recommendations:</h3>
                              <ul className="space-y-1 text-sm">
                                {deviceSnapshot.remoteStatus.securityRecommendations.map((recommendation, i) => (
                                  <li key={i} className="flex items-start">
                                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-yellow-500" />
                                    <span>{recommendation}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
                          <MonitorSmartphone className="h-16 w-16 text-muted-foreground" />
                          <h3 className="text-lg font-medium">No Device Scan</h3>
                          <p className="text-sm text-muted-foreground">
                            Click the "Scan Device" button to check for remote access and vulnerabilities
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={runDeviceScan}
                    disabled={isScanning}
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Scan Device
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileLock2 className="mr-2 h-5 w-5 text-primary" />
                    Device Snapshot Details
                  </CardTitle>
                  <CardDescription>
                    Detailed information about the current device and connection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {deviceSnapshot ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium flex items-center">
                            <Laptop className="mr-2 h-4 w-4" />
                            Device Info
                          </h3>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Device Name:</span>
                              <span>{deviceSnapshot.device.deviceName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">OS:</span>
                              <span>{deviceSnapshot.systemInfo?.operatingSystem}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Browser:</span>
                              <span>{deviceSnapshot.device.metadata.browser}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Screen:</span>
                              <span>{deviceSnapshot.screenResolution}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Timezone:</span>
                              <span>{deviceSnapshot.timezone}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium flex items-center">
                            <Globe className="mr-2 h-4 w-4" />
                            Connection Info
                          </h3>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">IP Address:</span>
                              <span>{deviceSnapshot.ipAddress || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Location:</span>
                              <span>{deviceSnapshot.geoLocation?.country || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">ISP:</span>
                              <span>{deviceSnapshot.networkInfo?.isp || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Connection:</span>
                              <span>{deviceSnapshot.networkInfo?.connectionType || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">First Seen:</span>
                              <span>{deviceSnapshot.device.firstSeen?.toLocaleDateString() || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          Security Status
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center space-x-2">
                            {deviceSnapshot.securityStatus?.malwareDetected ? (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            ) : (
                              <Shield className="h-4 w-4 text-green-500" />
                            )}
                            <span>Malware: {deviceSnapshot.securityStatus?.malwareDetected ? 'Detected' : 'None'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {deviceSnapshot.securityStatus?.rootedDevice ? (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            ) : (
                              <Shield className="h-4 w-4 text-green-500" />
                            )}
                            <span>Rooted: {deviceSnapshot.securityStatus?.rootedDevice ? 'Yes' : 'No'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {deviceSnapshot.securityStatus?.outdatedSoftware ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <Shield className="h-4 w-4 text-green-500" />
                            )}
                            <span>Software: {deviceSnapshot.securityStatus?.outdatedSoftware ? 'Outdated' : 'Updated'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {deviceSnapshot.securityStatus?.firewallActive ? (
                              <Shield className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            <span>Firewall: {deviceSnapshot.securityStatus?.firewallActive ? 'Active' : 'Disabled'}</span>
                          </div>
                        </div>
                      </div>
                      
                      {deviceSnapshot.securityStatus?.suspiciousProcesses.length ? (
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-red-500 flex items-center">
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Suspicious Processes Detected
                          </h3>
                          <ul className="text-sm space-y-1">
                            {deviceSnapshot.securityStatus.suspiciousProcesses.map((process, i) => (
                              <li key={i} className="flex items-center space-x-2">
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                                <span>{process}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
                      <Camera className="h-16 w-16 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No Device Snapshot</h3>
                      <p className="text-sm text-muted-foreground">
                        Run a device scan first to capture detailed system information
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Network className="mr-2 h-5 w-5 text-primary" />
                  Connection Chain Analysis
                </CardTitle>
                <CardDescription>
                  Analysis of remote connection routing pattern through networks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deviceSnapshot && deviceSnapshot.remoteStatus.connectionChain.length > 0 ? (
                  <div className="space-y-4">
                    <div className="relative flex flex-col space-y-8 items-start">
                      {/* Connection path line */}
                      <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-border" />
                      
                      {deviceSnapshot.remoteStatus.connectionChain.map((node, index) => (
                        <div key={index} className="relative flex items-start ml-8">
                          <div className="absolute -left-8 flex items-center justify-center w-8 h-8">
                            <div className={`w-4 h-4 rounded-full ${
                              node.isBlacklisted 
                                ? "bg-red-500" 
                                : index === 0 
                                  ? "bg-green-500" 
                                  : "bg-blue-500"
                            }`} />
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-medium">
                                {index === 0 
                                  ? "Origin" 
                                  : index === deviceSnapshot.remoteStatus.connectionChain.length - 1 
                                    ? "Current Connection" 
                                    : `Proxy Node ${index}`}
                              </h3>
                              <Badge variant={getNodeBadgeVariant(node.connectionType)}>
                                {formatRemoteType(node.connectionType)}
                              </Badge>
                              {node.isBlacklisted && (
                                <Badge variant="destructive">
                                  Blacklisted
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-1">
                                  <Globe className="h-3 w-3 text-muted-foreground" />
                                  <span>{node.ipAddress || 'Unknown IP'}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Map className="h-3 w-3 text-muted-foreground" />
                                  <span>{node.geoLocation || 'Unknown Location'}</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-1">
                                  <Radio className="h-3 w-3 text-muted-foreground" />
                                  <span>{node.isp || 'Unknown ISP'}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span>{node.timestamp.toLocaleTimeString()}</span>
                                </div>
                              </div>
                            </div>
                            
                            {node.packetAnalysis && (
                              (node.packetAnalysis.inconsistentHeaders || 
                               node.packetAnalysis.timeDelayAnomalies || 
                               node.packetAnalysis.tunnelIndicators) ? (
                                <div className="flex text-xs text-red-500 items-center space-x-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>
                                    {[
                                      node.packetAnalysis.inconsistentHeaders ? 'inconsistent headers' : null,
                                      node.packetAnalysis.timeDelayAnomalies ? 'time delay anomalies' : null,
                                      node.packetAnalysis.tunnelIndicators ? 'tunnel indicators' : null
                                    ].filter(Boolean).join(', ')}
                                  </span>
                                </div>
                              ) : null
                            )}
                            
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground">Trust Score:</span>
                              <Progress value={node.trustScore} className="h-1.5 w-20" />
                              <span className="text-xs">{node.trustScore}/100</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <Network className="h-16 w-16 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No Connection Chain</h3>
                    <p className="text-sm text-muted-foreground">
                      {deviceSnapshot 
                        ? "No suspicious connection routing detected"
                        : "Run a device scan first to analyze connection routing"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trace" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Search className="mr-2 h-5 w-5 text-primary" />
                    Connection Trace
                  </CardTitle>
                  <CardDescription>
                    Trace remote connections back to their origin
                  </CardDescription>
                </CardHeader>
                <CardContent className={isTracing ? "pb-2" : ""}>
                  {isTracing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Tracing connection origin...</span>
                          <span>{Math.floor(progress)}%</span>
                        </div>
                        <Progress value={progress} />
                      </div>
                      <div className="space-y-1 text-sm">
                        {progress > 10 && <p>✓ Analyzing network routing patterns...</p>}
                        {progress > 25 && <p>✓ Tracing through proxy layers...</p>}
                        {progress > 40 && <p>✓ Bypassing VPN obfuscation...</p>}
                        {progress > 55 && <p>✓ Analyzing packet timing signatures...</p>}
                        {progress > 70 && <p>✓ Geolocating connection nodes...</p>}
                        {progress > 85 && <p>✓ Identifying origin device...</p>}
                        {progress > 95 && <p>✓ Generating trace report...</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert>
                        <Search className="h-4 w-4" />
                        <AlertTitle>Connection Tracing</AlertTitle>
                        <AlertDescription>
                          This tool can trace remote connections back to their origin, even through multiple proxies, VPNs, or Tor networks.
                        </AlertDescription>
                      </Alert>
                      
                      {deviceSnapshot ? (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Remote Access:</span>
                            {deviceSnapshot.remoteStatus.isRemoteAccess ? (
                              <Badge variant="destructive">Detected</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">Not Detected</Badge>
                            )}
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="font-medium">Connection Type:</span>
                            <Badge variant={deviceSnapshot.remoteStatus.isRemoteAccess ? "secondary" : "outline"}>
                              {deviceSnapshot.remoteStatus.isRemoteAccess 
                                ? formatRemoteType(deviceSnapshot.remoteStatus.remoteType) 
                                : "Direct"}
                            </Badge>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="font-medium">Nodes in Chain:</span>
                            <span>{deviceSnapshot.remoteStatus.connectionChain.length}</span>
                          </div>
                          
                          {deviceSnapshot.remoteStatus.isRemoteAccess ? (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>Remote Access Detected</AlertTitle>
                              <AlertDescription>
                                Click "Trace Connection" to identify the origin of this remote access
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <Alert className="bg-green-50 dark:bg-green-900/20">
                              <Shield className="h-4 w-4 text-green-500" />
                              <AlertTitle>No Remote Access</AlertTitle>
                              <AlertDescription>
                                No suspicious remote connections have been detected
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-4 space-y-3">
                          <Search className="h-12 w-12 text-muted-foreground" />
                          <h3 className="text-lg font-medium">No Device Scan</h3>
                          <p className="text-sm text-muted-foreground">
                            Run a device scan first to detect remote connections
                          </p>
                        </div>
                      )}
                      
                      {traceResults && (
                        <div className="space-y-4 border rounded-lg p-4">
                          <h3 className="text-sm font-medium flex items-center">
                            <Search className="mr-2 h-4 w-4 text-primary" />
                            Trace Results
                          </h3>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Trace Status:</span>
                              <Badge variant={traceResults.success ? "outline" : "secondary"}>
                                {traceResults.success ? "Complete" : "Partial"}
                              </Badge>
                            </div>
                            
                            {traceResults.originIp && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Origin IP:</span>
                                <span>{traceResults.originIp}</span>
                              </div>
                            )}
                            
                            {traceResults.originLocation && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Origin Location:</span>
                                <span>{traceResults.originLocation}</span>
                              </div>
                            )}
                            
                            {traceResults.originUser && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Origin User:</span>
                                <span>{traceResults.originUser}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={runConnectionTrace}
                    disabled={isTracing || !deviceSnapshot || !deviceSnapshot.remoteStatus.isRemoteAccess}
                  >
                    {isTracing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Tracing...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Trace Connection
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Terminal className="mr-2 h-5 w-5 text-primary" />
                    Trace Log
                  </CardTitle>
                  <CardDescription>
                    Detailed log of the connection tracing process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {traceResults && traceResults.traceLog.length > 0 ? (
                    <div className="font-mono text-xs space-y-1 bg-black text-green-400 p-4 rounded-md h-[400px] overflow-y-auto">
                      {traceResults.traceLog.map((log, index) => (
                        <div key={index}>{log}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
                      <Terminal className="h-16 w-16 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No Trace Log</h3>
                      <p className="text-sm text-muted-foreground">
                        Run a connection trace to generate a detailed log
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserX className="mr-2 h-5 w-5 text-primary" />
                  Origin Device Details
                </CardTitle>
                <CardDescription>
                  Information about the device at the origin of the remote connection
                </CardDescription>
              </CardHeader>
              <CardContent>
                {traceResults && traceResults.success && traceResults.originDevice ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium flex items-center">
                          <Laptop className="mr-2 h-4 w-4" />
                          Origin Device
                        </h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Device ID:</span>
                            <span>{traceResults.originDevice.deviceId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Device Name:</span>
                            <span>{traceResults.originDevice.deviceName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">OS:</span>
                            <span>{traceResults.originDevice.metadata.operatingSystem}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Browser:</span>
                            <span>{traceResults.originDevice.metadata.browser}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">First Seen:</span>
                            <span>{traceResults.originDevice.firstSeen?.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium flex items-center text-red-500">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Security Status
                        </h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Trust Score:</span>
                            <div className="flex items-center">
                              <span className="mr-2">{traceResults.originDevice.trustScore}/100</span>
                              <Progress value={traceResults.originDevice.trustScore} className="w-20" />
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Blacklisted:</span>
                            <Badge variant={traceResults.originDevice.isBlacklisted ? "destructive" : "outline"}>
                              {traceResults.originDevice.isBlacklisted ? "Yes" : "No"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Remote Access:</span>
                            <Badge variant={traceResults.originDevice.metadata.isRemote ? "secondary" : "outline"}>
                              {traceResults.originDevice.metadata.isRemote ? "Yes" : "No"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Anomaly Score:</span>
                            <span>{traceResults.originDevice.metadata.anomalyScore}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Blacklist Reason:</span>
                            <span>{traceResults.originDevice.metadata.blacklistReason || "None"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Suspicious Origin Device</AlertTitle>
                      <AlertDescription>
                        This device has been identified as the source of a suspicious remote connection.
                        The device has been blacklisted to prevent further unauthorized access.
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <UserX className="h-16 w-16 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No Origin Device</h3>
                    <p className="text-sm text-muted-foreground">
                      {traceResults 
                        ? "Could not identify the origin device of the connection" 
                        : "Complete a connection trace to identify the origin device"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="countermeasures" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LockKeyhole className="mr-2 h-5 w-5 text-primary" />
                    Security Countermeasures
                  </CardTitle>
                  <CardDescription>
                    Block unauthorized access and secure your system
                  </CardDescription>
                </CardHeader>
                <CardContent className={isCountermeasuring ? "pb-2" : ""}>
                  {isCountermeasuring ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Executing countermeasures...</span>
                          <span>{Math.floor(progress)}%</span>
                        </div>
                        <Progress value={progress} />
                      </div>
                      <div className="space-y-1 text-sm">
                        {progress > 10 && <p>✓ Preparing security response...</p>}
                        {progress > 30 && <p>✓ Terminating unauthorized connections...</p>}
                        {progress > 50 && <p>✓ Blacklisting malicious devices...</p>}
                        {progress > 70 && <p>✓ Blocking suspicious IP addresses...</p>}
                        {progress > 85 && <p>✓ Securing account access...</p>}
                        {progress > 95 && <p>✓ Finalizing security lockdown...</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertTitle>Automatic Response</AlertTitle>
                        <AlertDescription>
                          This tool can automatically respond to unauthorized remote access by blocking connections and securing your account.
                        </AlertDescription>
                      </Alert>
                      
                      {deviceSnapshot ? (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Remote Access:</span>
                            {deviceSnapshot.remoteStatus.isRemoteAccess ? (
                              <Badge variant="destructive">Detected</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">Not Detected</Badge>
                            )}
                          </div>
                          
                          {deviceSnapshot.remoteStatus.isRemoteAccess && (
                            <>
                              <div className="flex justify-between">
                                <span className="font-medium">Origin Traced:</span>
                                <Badge variant={traceResults?.success ? "outline" : "secondary"}>
                                  {traceResults?.success ? "Yes" : "No"}
                                </Badge>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="font-medium">Security Risk:</span>
                                <div className="flex items-center">
                                  <span className="mr-2">High</span>
                                  <Progress value={80} className="w-20" />
                                </div>
                              </div>
                            </>
                          )}
                          
                          {deviceSnapshot.remoteStatus.isRemoteAccess ? (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>Security Threat Detected</AlertTitle>
                              <AlertDescription>
                                Click "Execute Countermeasures" to block the unauthorized access and secure your account
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <Alert className="bg-green-50 dark:bg-green-900/20">
                              <Shield className="h-4 w-4 text-green-500" />
                              <AlertTitle>No Security Threat</AlertTitle>
                              <AlertDescription>
                                No unauthorized access has been detected
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-4 space-y-3">
                          <Shield className="h-12 w-12 text-muted-foreground" />
                          <h3 className="text-lg font-medium">No Threats Detected</h3>
                          <p className="text-sm text-muted-foreground">
                            Run a device scan first to check for security threats
                          </p>
                        </div>
                      )}
                      
                      {countermeasureResults && (
                        <div className="space-y-4 border rounded-lg p-4">
                          <h3 className="text-sm font-medium flex items-center">
                            <Shield className="mr-2 h-4 w-4 text-primary" />
                            Countermeasure Results
                          </h3>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status:</span>
                              <Badge variant={countermeasureResults.success ? "outline" : "secondary"}>
                                {countermeasureResults.success ? "Completed" : "Failed"}
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Devices Blacklisted:</span>
                              <span>{countermeasureResults.devicesBlacklisted}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Attacker IP Blocked:</span>
                              <Badge variant={countermeasureResults.attackerIpBlocked ? "destructive" : "outline"}>
                                {countermeasureResults.attackerIpBlocked ? "Yes" : "No"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={runCountermeasures}
                    disabled={isCountermeasuring || !deviceSnapshot || !deviceSnapshot.remoteStatus.isRemoteAccess}
                    variant={deviceSnapshot?.remoteStatus.isRemoteAccess ? "destructive" : "outline"}
                  >
                    {isCountermeasuring ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Execute Countermeasures
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5 text-primary" />
                    Actions Performed
                  </CardTitle>
                  <CardDescription>
                    Security actions taken to protect your system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {countermeasureResults && countermeasureResults.actionsPerformed.length > 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Security Actions:</h3>
                        <ul className="space-y-2">
                          {countermeasureResults.actionsPerformed.map((action, i) => (
                            <li key={i} className="flex items-start space-x-2 p-2 rounded bg-secondary/20">
                              <Shield className="h-4 w-4 mt-0.5 text-primary" />
                              <span className="text-sm">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {countermeasureResults.attackerIpBlocked && (
                        <Alert className="bg-green-50 dark:bg-green-900/20">
                          <Shield className="h-4 w-4 text-green-500" />
                          <AlertTitle>Attacker Blocked</AlertTitle>
                          <AlertDescription>
                            The malicious IP address has been successfully blocked from accessing your account
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
                      <Shield className="h-16 w-16 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No Actions Performed</h3>
                      <p className="text-sm text-muted-foreground">
                        Execute countermeasures to see security actions
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="mr-2 h-5 w-5 text-primary" />
                  Security Event History
                </CardTitle>
                <CardDescription>
                  Recent security events and countermeasures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ledgerEntries && Array.isArray(ledgerEntries) && ledgerEntries.filter((entry: any) => 
                    entry.action.includes('remote_') || 
                    entry.action.includes('countermeasure') || 
                    entry.action.includes('_scan') ||
                    entry.action.includes('backtrace') ||
                    entry.action.includes('snapshot')
                  ).slice(0, 10).map((entry: any, index: number) => (
                    <div key={index} className="flex items-start space-x-4">
                      {entry.action.includes('remote_countermeasures') ? (
                        <Shield className="h-5 w-5 mt-0.5 text-green-500" />
                      ) : entry.action.includes('remote_connection_scan') && entry.status === 'alert' ? (
                        <ShieldAlert className="h-5 w-5 mt-0.5 text-destructive" />
                      ) : entry.action.includes('device_snapshot') ? (
                        <Camera className="h-5 w-5 mt-0.5 text-primary" />
                      ) : entry.action.includes('backtrace') ? (
                        <Search className="h-5 w-5 mt-0.5 text-primary" />
                      ) : (
                        <Shield className="h-5 w-5 mt-0.5 text-primary" />
                      )}
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {entry.action.replace(/_/g, ' ').replace(/^(.)|\s+(.)/g, (c: string) => c.toUpperCase())}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.metadata && entry.metadata.timestamp 
                            ? new Date(entry.metadata.timestamp).toLocaleString() 
                            : new Date().toLocaleString()}
                        </p>
                        
                        {entry.status && (
                          <Badge 
                            variant={
                              entry.status === 'completed' 
                                ? 'outline' 
                                : entry.status === 'alert' 
                                  ? 'destructive' 
                                  : 'secondary'
                            } 
                            className="mt-1"
                          >
                            {entry.status}
                          </Badge>
                        )}
                        
                        {entry.metadata && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {entry.metadata.isRemoteAccess && (
                              <span className="flex items-center">
                                <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                                Remote {entry.metadata.remoteType && entry.metadata.remoteType.replace(/_/g, ' ')} access detected
                              </span>
                            )}
                            
                            {entry.metadata.actionsPerformed && Array.isArray(entry.metadata.actionsPerformed) && (
                              <span>Actions: {entry.metadata.actionsPerformed.length}</span>
                            )}
                            
                            {entry.metadata.devicesBlacklisted > 0 && (
                              <span className="flex items-center">
                                <UserX className="h-3 w-3 mr-1 text-red-500" />
                                Blacklisted {entry.metadata.devicesBlacklisted} devices
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {(!ledgerEntries || !Array.isArray(ledgerEntries) || ledgerEntries.filter((entry: any) => 
                    entry.action.includes('remote_') || 
                    entry.action.includes('countermeasure') || 
                    entry.action.includes('_scan')
                  ).length === 0) && (
                    <div className="flex flex-col items-center justify-center text-center p-4 space-y-3">
                      <History className="h-16 w-16 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No Security Events</h3>
                      <p className="text-sm text-muted-foreground">
                        No security events have been recorded yet
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}