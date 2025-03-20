import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Lock, 
  Unlock, 
  Database,
  Cpu, 
  ExternalLink,
  Link2Off,
  Clock,
  AlertCircle,
  Tablet as DeviceTablet,
  ShieldAlert,
  Eye,
  Loader2,
  TestTube as BeakerIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  getCurrentDeviceSecurity, 
  scanConnectedDevices, 
  blockSuspiciousDevice,
  clearDeviceFromBlacklist,
  runFullSecurityScan,
  forceBlockRemoteConnection,
  getDeviceActivityHistory,
  generateDeviceVerificationQRCode,
  exportDeviceConfiguration
} from "@/lib/quantum-security";
import { verifyBlockchainTransaction, createLicenseOnBlockchain } from "@/lib/blockchain";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function QuantumSecurity() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [securityInfo, setSecurityInfo] = useState<Awaited<ReturnType<typeof getCurrentDeviceSecurity>> | null>(null);
  const [connectedInfo, setConnectedInfo] = useState<Awaited<ReturnType<typeof scanConnectedDevices>> | null>(null);
  const [fullScanResults, setFullScanResults] = useState<Awaited<ReturnType<typeof runFullSecurityScan>> | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState<string>("");
  const [isBlacklistDialogOpen, setIsBlacklistDialogOpen] = useState(false);
  const [isProcessingTestRemote, setIsProcessingTestRemote] = useState(false);
  const [deviceActivities, setDeviceActivities] = useState<Awaited<ReturnType<typeof getDeviceActivityHistory>> | null>(null);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [verificationQRCode, setVerificationQRCode] = useState<Awaited<ReturnType<typeof generateDeviceVerificationQRCode>> | null>(null);
  const [isGeneratingQRCode, setIsGeneratingQRCode] = useState(false);
  const [deviceExportData, setDeviceExportData] = useState<Awaited<ReturnType<typeof exportDeviceConfiguration>> | null>(null);
  const [isExportingDevice, setIsExportingDevice] = useState(false);

  useEffect(() => {
    async function loadSecurityData() {
      try {
        setIsLoading(true);
        // Load device security info
        const deviceSecurity = await getCurrentDeviceSecurity();
        setSecurityInfo(deviceSecurity);
        
        // Load connected devices and alerts
        const connectedData = await scanConnectedDevices();
        setConnectedInfo(connectedData);
      } catch (error) {
        console.error("Error loading security data:", error);
        toast({
          title: "Error Loading Security Data",
          description: "Could not load security information. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadSecurityData();
  }, [toast]);
  
  const refreshSecurityInfo = async () => {
    try {
      setIsLoading(true);
      const deviceSecurity = await getCurrentDeviceSecurity();
      setSecurityInfo(deviceSecurity);
      toast({
        title: "Security Info Updated",
        description: "Device security information has been refreshed",
      });
    } catch (error) {
      console.error("Error refreshing security info:", error);
      toast({
        title: "Refresh Failed",
        description: "Could not refresh security information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshConnectedDevices = async () => {
    try {
      setIsLoading(true);
      const connectedData = await scanConnectedDevices();
      setConnectedInfo(connectedData);
      toast({
        title: "Connected Devices Scan Complete",
        description: `Found ${connectedData.connectedDevices.length} devices, ${connectedData.securityNotifications.length} alerts`,
      });
    } catch (error) {
      console.error("Error scanning connected devices:", error);
      toast({
        title: "Scan Failed",
        description: "Could not scan connected devices",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBlockDevice = async (deviceId: string) => {
    if (!blockReason) {
      toast({
        title: "Block Reason Required",
        description: "Please provide a reason for blacklisting this device",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const result = await blockSuspiciousDevice(deviceId, blockReason);
      
      if (result.success) {
        // Record the security action on the blockchain
        const transactionId = await verifyBlockchainTransaction();
        console.log("Device block action recorded on blockchain:", transactionId);
        
        toast({
          title: "Device Blocked",
          description: result.message,
        });
        
        // Add blockchain record notification
        toast({
          title: "Security Event Recorded",
          description: "This security action has been recorded on the blockchain ledger",
        });
        
        // Refresh connected devices after blocking
        await refreshConnectedDevices();
      } else {
        toast({
          title: "Block Failed",
          description: result.message,
          variant: "destructive",
        });
      }
      
      // Close dialog and reset state
      setIsBlacklistDialogOpen(false);
      setSelectedDevice(null);
      setBlockReason("");
    } catch (error) {
      console.error("Error blocking device:", error);
      toast({
        title: "Block Failed",
        description: "An error occurred while trying to block the device",
        variant: "destructive",
      });
    }
  };
  
  const handleUnblockDevice = async (deviceId: string) => {
    try {
      const result = await clearDeviceFromBlacklist(deviceId);
      
      if (result.success) {
        // Record the security action on the blockchain
        const transactionId = await verifyBlockchainTransaction();
        console.log("Device unblock action recorded on blockchain:", transactionId);
        
        toast({
          title: "Device Unblocked",
          description: result.message,
        });
        
        // Add blockchain record notification
        toast({
          title: "Security Event Recorded",
          description: "This security action has been recorded on the blockchain ledger",
        });
        
        // Refresh connected devices after unblocking
        await refreshConnectedDevices();
      } else {
        toast({
          title: "Unblock Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error unblocking device:", error);
      toast({
        title: "Unblock Failed",
        description: "An error occurred while trying to unblock the device",
        variant: "destructive",
      });
    }
  };
  
  const handleTestRemoteBlock = async () => {
    try {
      setIsProcessingTestRemote(true);
      toast({
        title: "Testing Remote Connection Blocking",
        description: "Simulating a remote connection and testing auto-block feature...",
      });
      
      const result = await forceBlockRemoteConnection();
      
      if (result.success) {
        toast({
          title: "Test Successful",
          description: `${result.message}. Transaction ID: ${result.transactionId?.substring(0, 10)}...`,
        });
        
        // Add a ledger entry notification
        toast({
          title: "Security Event Recorded",
          description: "A new security event has been recorded in the blockchain ledger",
          variant: "default",
        });
        
        // Refresh connected devices to show the new blocked device
        await refreshConnectedDevices();
      } else {
        toast({
          title: "Test Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error testing remote blocking:", error);
      toast({
        title: "Test Failed",
        description: "An error occurred while testing remote connection blocking",
        variant: "destructive",
      });
    } finally {
      setIsProcessingTestRemote(false);
    }
  };
  
  const performFullScan = async () => {
    try {
      setIsScanning(true);
      toast({
        title: "Full Security Scan Started",
        description: "Running quantum AI security analysis. This may take a moment...",
      });
      
      // Perform full security scan
      const scanResults = await runFullSecurityScan();
      setFullScanResults(scanResults);
      
      // Record this security event in the blockchain ledger
      const transactionId = await verifyBlockchainTransaction();
      console.log("Security scan recorded on blockchain:", transactionId);
      
      toast({
        title: "Security Scan Complete",
        description: `Overall security score: ${scanResults.overallSecurityScore}/100`,
      });
      
      toast({
        title: "Security Event Recorded",
        description: "Scan results have been recorded on the blockchain ledger",
      });
    } catch (error) {
      console.error("Error performing full scan:", error);
      toast({
        title: "Scan Failed",
        description: "Could not complete the security scan",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };
  
  // Load device activity history
  const loadDeviceActivityHistory = async () => {
    try {
      setIsLoadingActivities(true);
      const activities = await getDeviceActivityHistory();
      setDeviceActivities(activities);
      
      // Record this security event in the blockchain ledger
      const transactionId = await verifyBlockchainTransaction();
      console.log("Activity history access recorded on blockchain:", transactionId);
      
      if (activities.activities.length > 0) {
        toast({
          title: "Activity History Loaded",
          description: `Found ${activities.activities.length} device activities`,
        });
      } else {
        toast({
          title: "No Activities Found",
          description: "No device activities were found in the history",
        });
      }
    } catch (error) {
      console.error("Error loading device activities:", error);
      toast({
        title: "Error Loading Activities",
        description: "Could not load device activity history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingActivities(false);
    }
  };
  
  // Generate QR code for device verification
  const generateVerificationQR = async () => {
    try {
      setIsGeneratingQRCode(true);
      const qrCodeData = await generateDeviceVerificationQRCode();
      setVerificationQRCode(qrCodeData);
      
      // Record security event in blockchain
      const transactionId = await verifyBlockchainTransaction();
      console.log("QR verification code generation recorded on blockchain:", transactionId);
      
      if (qrCodeData.success) {
        toast({
          title: "QR Code Generated",
          description: "Verification QR code generated successfully",
        });
      } else {
        toast({
          title: "QR Code Generation Failed",
          description: "Could not generate verification QR code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast({
        title: "QR Code Error",
        description: "An error occurred while generating the QR code",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQRCode(false);
    }
  };
  
  // Export device configuration
  const exportDevice = async () => {
    try {
      setIsExportingDevice(true);
      const exportData = await exportDeviceConfiguration();
      setDeviceExportData(exportData);
      
      // Record this security event in the blockchain ledger
      const transactionId = await verifyBlockchainTransaction();
      console.log("Device configuration export recorded on blockchain:", transactionId);
      
      if (exportData.success) {
        toast({
          title: "Device Configuration Exported",
          description: "Device configuration exported successfully",
        });
      } else {
        toast({
          title: "Export Failed",
          description: "Could not export device configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error exporting device configuration:", error);
      toast({
        title: "Export Error",
        description: "An error occurred while exporting the device configuration",
        variant: "destructive",
      });
    } finally {
      setIsExportingDevice(false);
    }
  };
  
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-500";
    return "text-red-600";
  };
  
  const getScoreProgressClass = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-600";
  };
  
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return "bg-red-100 text-red-800 hover:bg-red-200";
      case 'high': return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case 'medium': return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case 'low': return "bg-green-100 text-green-800 hover:bg-green-200";
      default: return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    }
  };
  
  return (
    <>
      <header className="bg-white shadow">
        <div className="flex justify-between items-center px-6 py-4">
          <h2 className="text-xl font-semibold text-neutral-dark">Quantum AI Security</h2>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="flex items-center" 
              disabled={isLoading || isScanning}
              onClick={refreshSecurityInfo}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Security
            </Button>
            
            <Button 
              variant="default" 
              disabled={isScanning}
              onClick={performFullScan}
            >
              <Shield className="h-4 w-4 mr-2" />
              Run Full Security Scan
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Security Policy Alerts */}
        {!isLoading && securityInfo && (
          <>
            {/* Single Device Policy Alert */}
            <Alert className="bg-blue-50 text-blue-800 border-blue-200 mb-4">
              <Shield className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-800 font-semibold">
                Enhanced Security Mode Active
              </AlertTitle>
              <AlertDescription className="mt-2">
                <p>Single device mode is enabled. Only one device may access your account at a time.</p>
                <div className="mt-2">
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Remote connections: <span className="font-semibold text-red-600">Automatically blocked</span></li>
                    <li>Multiple devices: <span className="font-semibold text-red-600">Automatically blocked</span></li>
                    <li>Security score threshold: <span className="font-semibold">30/100</span> (devices below this are blocked)</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
        
            {/* Remote Connection Alert */}
            {securityInfo.isRemote && (
              <Alert className="bg-red-50 text-red-800 border-red-200 mb-4">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-800 font-semibold">
                  Remote Connection Detected - Security Policy Violation
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p>This system only accepts direct connections. Remote connections are automatically detected and may be blocked.</p>
              <div className="mt-2">
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Remote connection type: <span className="font-mono">{securityInfo.potentialThreats.join(', ')}</span></li>
                  <li>Security score: <span className="font-semibold">{securityInfo.securityScore}/100</span></li>
                  <li>Auto-blacklist: {securityInfo.securityScore < 30 ? 
                    <span className="text-red-600 font-semibold">Enabled (scammer detection active)</span> : 
                    <span className="text-amber-600">Warning only</span>}
                  </li>
                </ul>
              </div>
              <div className="mt-3 flex space-x-3">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => blockSuspiciousDevice(securityInfo.deviceId, "Manual block of remote connection by security policy")}
                >
                  <Lock className="h-3 w-3 mr-1" />
                  Block This Device
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={refreshSecurityInfo}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh Status
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        </>
        )}
        
        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Device Security Score */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Device Security Score</CardTitle>
              <CardDescription>Current device security status</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : securityInfo ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Security Score</span>
                    <span className={`text-2xl font-bold ${getScoreColorClass(securityInfo.securityScore)}`}>
                      {securityInfo.securityScore}/100
                    </span>
                  </div>
                  
                  <Progress 
                    value={securityInfo.securityScore} 
                    max={100} 
                    className={getScoreProgressClass(securityInfo.securityScore)} 
                  />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Device ID</span>
                      <span className="font-mono text-xs">{securityInfo.deviceId}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Remote Connection</span>
                      <span>
                        {securityInfo.isRemote ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700">
                            <Wifi className="h-3 w-3 mr-1" />
                            Remote
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <WifiOff className="h-3 w-3 mr-1" />
                            Direct
                          </Badge>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Blacklist Status</span>
                      <span>
                        {securityInfo.isBlacklisted ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            <Lock className="h-3 w-3 mr-1" />
                            Blacklisted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <Unlock className="h-3 w-3 mr-1" />
                            Clear
                          </Badge>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Could not load security information</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              {!isLoading && securityInfo && (
                <>
                  {securityInfo.potentialThreats.length > 0 ? (
                    <Alert className="w-full bg-amber-50 text-amber-800 border-amber-200">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Potential Security Threats</AlertTitle>
                      <AlertDescription>
                        {securityInfo.potentialThreats.length} potential threats detected
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="w-full bg-green-50 text-green-800 border-green-200">
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>No Threats Detected</AlertTitle>
                      <AlertDescription>
                        Your device appears to be secure
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardFooter>
          </Card>
          
          {/* Connected Devices */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Connected Devices</CardTitle>
                  <CardDescription>Devices connected to your account</CardDescription>
                </div>
                {securityInfo && (
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                      <DeviceTablet className="h-3 w-3 mr-1" />
                      {securityInfo.totalDevices || connectedInfo?.connectedDevices.length || 0} Total
                    </Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                      <ShieldAlert className="h-3 w-3 mr-1" />
                      {securityInfo.blacklistedDevices || connectedInfo?.blacklistedDevices.length || 0} Blocked
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : connectedInfo ? (
                <div className="space-y-4">
                  {connectedInfo.connectedDevices.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No devices connected</p>
                  ) : (
                    <div className="space-y-3">
                      {connectedInfo.connectedDevices.map((device) => {
                        const isBlacklisted = connectedInfo.blacklistedDevices.some(
                          bd => bd.deviceId === device.id || bd.fingerprint === device.fingerprint
                        );
                        
                        return (
                          <div key={device.id} className="flex items-center justify-between p-3 border rounded-md relative">
                            {/* Highlight suspicious devices */}
                            {device.anomalyScore > 0.6 && (
                              <div className="absolute -top-2 -right-2">
                                <Badge className="bg-red-500 text-white border-red-500">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Suspicious
                                </Badge>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-3">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                isBlacklisted 
                                  ? 'bg-red-100' 
                                  : device.anomalyScore > 0.6 
                                    ? 'bg-amber-100' 
                                    : 'bg-blue-100'
                              }`}>
                                {isBlacklisted ? (
                                  <XCircle className="h-5 w-5 text-red-600" />
                                ) : device.isRemote ? (
                                  <ExternalLink className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <Database className="h-5 w-5 text-blue-600" />
                                )}
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium">
                                  {device.id}
                                  {device.id === securityInfo?.deviceId && (
                                    <Badge className="ml-2 bg-blue-100 text-blue-800">Current</Badge>
                                  )}
                                </h4>
                                <div className="flex space-x-2 text-xs text-muted-foreground">
                                  <span>
                                    {device.isRemote ? 'Remote' : 'Direct'} • 
                                  </span>
                                  <span>
                                    Trust: {device.trustScore}/100
                                  </span>
                                  <span>
                                    Last seen: {new Date(device.lastSeen).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Badge 
                                className={`text-xs ${
                                  device.anomalyScore > 0.6 
                                    ? 'bg-red-100 text-red-800' 
                                    : device.anomalyScore > 0.3 
                                      ? 'bg-amber-100 text-amber-800' 
                                      : 'bg-green-100 text-green-800'
                                }`}
                              >
                                Risk: {(device.anomalyScore * 100).toFixed(0)}%
                              </Badge>
                              
                              {isBlacklisted ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs border-green-200 text-green-700 hover:bg-green-50"
                                  onClick={() => handleUnblockDevice(device.id)}
                                >
                                  <Unlock className="h-3 w-3 mr-1" />
                                  Unblock
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs border-red-200 text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setSelectedDevice(device.id);
                                    setIsBlacklistDialogOpen(true);
                                  }}
                                >
                                  <Lock className="h-3 w-3 mr-1" />
                                  Block
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Could not load connected devices</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0 flex justify-between">
              <div>
                {!isLoading && connectedInfo && connectedInfo.securityNotifications.length > 0 && (
                  <Alert className="w-full bg-red-50 text-red-800 border-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Security Alerts</AlertTitle>
                    <AlertDescription>
                      {connectedInfo.securityNotifications.length} active security alerts
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto"
                disabled={isLoading}
                onClick={refreshConnectedDevices}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Scan Devices
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Security Alerts and Blacklist */}
        <Tabs defaultValue="my-device" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="my-device">
              My Device
              {securityInfo?.isBlacklisted ? (
                <Badge className="ml-2 bg-red-100 text-red-800">
                  Blocked
                </Badge>
              ) : securityInfo?.isRemote ? (
                <Badge className="ml-2 bg-amber-100 text-amber-800">
                  Remote
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="alerts">
              Security Alerts
              {connectedInfo?.securityNotifications.length ? (
                <Badge className="ml-2 bg-red-100 text-red-800">
                  {connectedInfo.securityNotifications.length}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="blacklist">
              Blacklisted Devices
              {connectedInfo?.blacklistedDevices.length ? (
                <Badge className="ml-2 bg-red-100 text-red-800">
                  {connectedInfo.blacklistedDevices.length}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="scan" disabled={!fullScanResults}>
              Scan Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-device">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>My Device</CardTitle>
                  <CardDescription>
                    Details about your current device and its security status
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadDeviceActivityHistory}
                    disabled={isLoadingActivities}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {isLoadingActivities ? 'Loading...' : 'View History'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : securityInfo ? (
                  <div className="space-y-6">
                    {/* Current Device Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Device Security Score</span>
                            <span className={`text-2xl font-bold ${getScoreColorClass(securityInfo.securityScore)}`}>
                              {securityInfo.securityScore}/100
                            </span>
                          </div>
                          
                          <Progress 
                            value={securityInfo.securityScore} 
                            max={100} 
                            className={getScoreProgressClass(securityInfo.securityScore)} 
                          />
                        </div>

                        <div className="mt-6 space-y-4 pt-4 border-t">
                          <h3 className="text-base font-medium">Device Information</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span>Device ID</span>
                              <span className="font-mono text-xs">{securityInfo.deviceId}</span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span>Fingerprint</span>
                              <span className="font-mono text-xs">{securityInfo.fingerprint.substring(0, 16)}...</span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span>First Seen</span>
                              <span>{securityInfo.firstSeen ? new Date(securityInfo.firstSeen).toLocaleString() : 'N/A'}</span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span>Last Activity</span>
                              <span>{securityInfo.lastSeen ? new Date(securityInfo.lastSeen).toLocaleString() : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-base font-medium">Security Status</h3>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="p-4 border rounded-md flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`p-2 rounded-full ${securityInfo.isRemote ? 'bg-amber-100' : 'bg-green-100'}`}>
                                {securityInfo.isRemote ? (
                                  <Wifi className="h-4 w-4 text-amber-600" />
                                ) : (
                                  <WifiOff className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium">Connection</p>
                                <p className="text-xs text-muted-foreground">
                                  {securityInfo.isRemote ? 'Remote Access' : 'Direct Connection'}
                                </p>
                              </div>
                            </div>
                            {securityInfo.isRemote && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700">
                                Policy Violation
                              </Badge>
                            )}
                          </div>

                          <div className="p-4 border rounded-md flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`p-2 rounded-full ${securityInfo.isBlacklisted ? 'bg-red-100' : 'bg-green-100'}`}>
                                {securityInfo.isBlacklisted ? (
                                  <Lock className="h-4 w-4 text-red-600" />
                                ) : (
                                  <Unlock className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium">Access Status</p>
                                <p className="text-xs text-muted-foreground">
                                  {securityInfo.isBlacklisted ? 'Device Blocked' : 'Access Granted'}
                                </p>
                              </div>
                            </div>
                            {securityInfo.isBlacklisted ? (
                              <Badge variant="outline" className="bg-red-50 text-red-700">
                                Blacklisted
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                Authorized
                              </Badge>
                            )}
                          </div>

                          <div className="p-4 border rounded-md flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="p-2 rounded-full bg-blue-100">
                                <DeviceTablet className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium">Device Type</p>
                                <p className="text-xs text-muted-foreground">
                                  {(securityInfo.metadata && (securityInfo.metadata as any).deviceType) || 'Desktop Browser'}
                                </p>
                              </div>
                            </div>
                            {securityInfo.isCurrentDevice && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                Current Device
                              </Badge>
                            )}
                          </div>
                        </div>

                        {securityInfo.isBlacklisted && (
                          <Alert className="bg-red-50 border-red-200 text-red-800 mt-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Device Blocked</AlertTitle>
                            <AlertDescription>
                              This device has been blocked due to security policy violations. Contact your administrator for assistance.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>

                    {/* Actions Section */}
                    <div className="pt-4 border-t">
                      <h3 className="text-base font-medium mb-3">Device Actions</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={refreshSecurityInfo}
                          disabled={isLoading}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh Device Status
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={generateVerificationQR}
                          disabled={isGeneratingQRCode}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {isGeneratingQRCode ? 'Generating...' : 'Generate Verification QR'}
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={exportDevice}
                          disabled={isExportingDevice}
                        >
                          <Database className="h-4 w-4 mr-2" />
                          {isExportingDevice ? 'Exporting...' : 'Export Device Config'}
                        </Button>

                        {securityInfo.isRemote && !securityInfo.isBlacklisted && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            disabled={isLoading}
                          >
                            <ShieldAlert className="h-4 w-4 mr-2" />
                            Report False Remote Detection
                          </Button>
                        )}

                        {securityInfo.isBlacklisted && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                            disabled={isLoading}
                            onClick={() => {
                              if (securityInfo.id) {
                                handleUnblockDevice(securityInfo.deviceId);
                              }
                            }}
                          >
                            <Unlock className="h-4 w-4 mr-2" />
                            Request Unblock
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Device Activity History */}
                    {deviceActivities && deviceActivities.activities.length > 0 && (
                      <div className="pt-4 border-t">
                        <h3 className="text-base font-medium mb-3">Device Activity History</h3>
                        <div className="space-y-4">
                          {deviceActivities.activities.map((activity) => (
                            <div key={activity.id} className="p-3 border rounded-md">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <div className={`p-2 rounded-full ${
                                    activity.isSuccessful ? 'bg-green-100' : 'bg-red-100'
                                  }`}>
                                    {activity.isSuccessful ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    )}
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium">
                                      {activity.activityType.split('_').map(word => 
                                        word.charAt(0).toUpperCase() + word.slice(1)
                                      ).join(' ')}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Unknown time'}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant="outline" className={`
                                  ${activity.isSuccessful 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : 'bg-red-50 text-red-700 border-red-200'}
                                `}>
                                  {activity.status}
                                </Badge>
                              </div>
                              {activity.details && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                  {activity.details}
                                </div>
                              )}
                              {activity.location && (
                                <div className="mt-1 text-xs text-muted-foreground flex items-center">
                                  <Wifi className="h-3 w-3 mr-1" />
                                  {activity.location} {activity.ipAddress ? `(${activity.ipAddress})` : ''}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Device Verification QR Code */}
                    {verificationQRCode && verificationQRCode.success && (
                      <div className="pt-4 border-t">
                        <h3 className="text-base font-medium mb-3">Device Verification</h3>
                        <div className="bg-white p-4 rounded-lg border flex flex-col items-center">
                          {/* QR Code would be displayed here */}
                          <div className="border-4 border-blue-200 rounded-lg p-6 text-center mb-3">
                            <div className="font-mono text-lg font-bold text-blue-800 mb-2">
                              {verificationQRCode.verificationCode}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Scan this code with your authorized device
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Expires: {new Date(verificationQRCode.expiresAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Device Export Data */}
                    {deviceExportData && deviceExportData.success && (
                      <div className="pt-4 border-t">
                        <h3 className="text-base font-medium mb-3">Export Configuration</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium">Configuration Export</span>
                            <span className="text-xs text-muted-foreground">
                              Generated: {new Date(deviceExportData.exportTimestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="border rounded-md p-3 bg-white">
                            <pre className="text-xs font-mono overflow-auto max-h-[200px]">
                              {deviceExportData.exportData}
                            </pre>
                          </div>
                          <div className="mt-3">
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-3 w-3 mr-2" />
                              Download Configuration
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                      <AlertTriangle className="h-8 w-8 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">Device Information Unavailable</h3>
                    <p className="text-muted-foreground">Unable to retrieve your device information</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Security Alerts</CardTitle>
                <CardDescription>
                  Active security issues detected by quantum AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : connectedInfo?.securityNotifications.length ? (
                  <div className="space-y-4">
                    {connectedInfo.securityNotifications.map((alert) => (
                      <div key={alert.id} className="p-4 border rounded-md space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-full ${
                              alert.severity === 'critical' ? 'bg-red-100' :
                              alert.severity === 'high' ? 'bg-orange-100' :
                              alert.severity === 'medium' ? 'bg-amber-100' : 'bg-blue-100'
                            }`}>
                              <AlertCircle className={`h-5 w-5 ${
                                alert.severity === 'critical' ? 'text-red-600' :
                                alert.severity === 'high' ? 'text-orange-600' :
                                alert.severity === 'medium' ? 'text-amber-600' : 'text-blue-600'
                              }`} />
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium">
                                {alert.type.split('_').map(word => 
                                  word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ')}
                              </h4>
                              <p className="text-sm text-muted-foreground">{alert.message}</p>
                            </div>
                          </div>
                          
                          <Badge className={getSeverityBadgeClass(alert.severity)}>
                            {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center pt-2 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 mr-1.5" />
                            <span>{new Date(alert.createdAt || Date.now()).toLocaleString()}</span>
                          </div>
                          
                          <div>
                            <Button variant="outline" size="sm" className="text-xs">
                              Investigate
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs ml-2 border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() => {
                                // If metadata contains deviceId, use it for blocking
                                if (alert.metadata && alert.metadata.deviceId) {
                                  setSelectedDevice(String(alert.metadata.deviceId));
                                  setBlockReason(`Automatic block due to ${alert.type} alert`);
                                  setIsBlacklistDialogOpen(true);
                                }
                              }}
                            >
                              <Lock className="h-3 w-3 mr-1" />
                              Block Device
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No Alerts</h3>
                    <p className="text-muted-foreground">No security alerts detected</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="blacklist">
            <Card>
              <CardHeader>
                <CardTitle>Blacklisted Devices</CardTitle>
                <CardDescription>
                  Devices that have been blocked due to suspicious activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : connectedInfo?.blacklistedDevices.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Device ID</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Blacklisted On</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {connectedInfo.blacklistedDevices.map((device) => (
                        <TableRow key={device.deviceId}>
                          <TableCell className="font-mono text-xs">{device.deviceId}</TableCell>
                          <TableCell>{device.reason}</TableCell>
                          <TableCell>{new Date(device.timestamp).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {device.expirationDate 
                              ? new Date(device.expirationDate).toLocaleDateString() 
                              : 'Never (Permanent)'}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs border-green-200 text-green-700 hover:bg-green-50"
                              onClick={() => handleUnblockDevice(device.deviceId)}
                            >
                              <Unlock className="h-3 w-3 mr-1" />
                              Unblock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                      <Unlock className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No Blacklisted Devices</h3>
                    <p className="text-muted-foreground">No devices have been blacklisted</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="scan">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Full Security Scan Results</CardTitle>
                    <CardDescription>
                      Detailed quantum AI security analysis results
                    </CardDescription>
                  </div>
                  
                  {fullScanResults && (
                    <div className="text-right">
                      <h3 className={`text-2xl font-bold ${getScoreColorClass(fullScanResults.overallSecurityScore)}`}>
                        {fullScanResults.overallSecurityScore}/100
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Scan ID: {fullScanResults.scanId}
                      </p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isScanning ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mb-4" />
                    <h3 className="text-lg font-medium mb-1">Scanning in Progress</h3>
                    <p className="text-muted-foreground">Running quantum AI security analysis...</p>
                  </div>
                ) : fullScanResults ? (
                  <div className="space-y-6">
                    {/* Vulnerabilities */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Vulnerabilities</h3>
                      <div className="space-y-3">
                        {fullScanResults.vulnerabilities.map((vuln, index) => (
                          <div key={index} className="p-3 border rounded-md flex justify-between items-center">
                            <div>
                              <h4 className="text-sm font-medium">
                                {vuln.type.split('_').map(word => 
                                  word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ')}
                              </h4>
                              <p className="text-sm text-muted-foreground">{vuln.description}</p>
                            </div>
                            <Badge className={getSeverityBadgeClass(vuln.severity)}>
                              {vuln.severity.charAt(0).toUpperCase() + vuln.severity.slice(1)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Quantum Analysis Results */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Quantum Analysis Results</h3>
                      <div className="space-y-3">
                        {fullScanResults.quantumAnalysisResults.map((result, index) => (
                          <div key={index} className="p-3 border rounded-md">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-2">
                                {result.passed ? (
                                  <div className="bg-green-100 p-2 rounded-full">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </div>
                                ) : (
                                  <div className="bg-red-100 p-2 rounded-full">
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  </div>
                                )}
                                <h4 className="text-sm font-medium">
                                  {result.passed ? 'Passed' : 'Failed'}
                                </h4>
                              </div>
                              
                              <Badge variant="outline">
                                Confidence: {(result.confidence * 100).toFixed(0)}%
                              </Badge>
                            </div>
                            
                            <p className="mt-2 text-sm text-muted-foreground pl-8">
                              {result.details}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Connected Devices Summary */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Connected Devices Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Database className="h-5 w-5 text-blue-600" />
                                <h4 className="text-sm font-medium">Total Devices</h4>
                              </div>
                              <span className="text-2xl font-bold">
                                {fullScanResults.connectedDevices.connectedDevices.length}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                                <h4 className="text-sm font-medium">Security Alerts</h4>
                              </div>
                              <span className="text-2xl font-bold">
                                {fullScanResults.connectedDevices.securityNotifications.length}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Lock className="h-5 w-5 text-red-600" />
                                <h4 className="text-sm font-medium">Blacklisted</h4>
                              </div>
                              <span className="text-2xl font-bold">
                                {fullScanResults.connectedDevices.blacklistedDevices.length}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                      <Cpu className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No Scan Results</h3>
                    <p className="text-muted-foreground mb-4">Run a full security scan to see results</p>
                    <Button onClick={performFullScan}>
                      <Shield className="h-4 w-4 mr-2" />
                      Run Security Scan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Security Testing Section */}
      <div className="p-6 mt-2 bg-gray-50 border border-gray-100 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Security Testing Tools</h3>
            <p className="text-sm text-gray-500">Advanced tools to test security systems and responses</p>
          </div>
          <div>
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
              <BeakerIcon className="h-3 w-3 mr-1" />
              Testing Mode
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Remote Connection Blocking</CardTitle>
              <CardDescription>Test how the system detects and blocks remote connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  This test simulates a remote connection attempt and verifies that it's properly detected
                  and blocked according to the security policy. It also creates a security log entry on the blockchain.
                </p>
                
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Test Information</AlertTitle>
                  <AlertDescription className="text-blue-700 text-sm">
                    Running this test will simulate a security violation and create a blockchain entry for demonstration purposes.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                variant="default" 
                disabled={isProcessingTestRemote}
                onClick={handleTestRemoteBlock}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isProcessingTestRemote ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <BeakerIcon className="mr-2 h-4 w-4" />
                    Test Remote Blocking
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Blockchain Security Logging</CardTitle>
              <CardDescription>Verify all security events are properly recorded on the blockchain</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Security events are logged permanently on the blockchain ledger for transparency and audit purposes.
                  All violations and suspicious activities are automatically tracked.
                </p>
                
                <div className="flex justify-between items-center border-t pt-4">
                  <span className="text-sm text-gray-600">View Security Events:</span>
                  <Link href="/blockchain" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    View Blockchain Ledger
                  </Link>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-xs text-gray-500">All security events are immutable once recorded</div>
              <Button variant="outline" asChild>
                <Link href="/blockchain" className="flex items-center">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open Ledger
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Block Device Dialog */}
      <Dialog open={isBlacklistDialogOpen} onOpenChange={setIsBlacklistDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Block Suspicious Device</DialogTitle>
            <DialogDescription>
              Add this device to the blacklist to prevent unauthorized access
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="deviceId" className="text-sm font-medium">
                Device ID
              </label>
              <input
                id="deviceId"
                value={selectedDevice || ''}
                readOnly
                className="w-full p-2 border rounded-md bg-muted font-mono text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="blockReason" className="text-sm font-medium">
                Reason for Blocking
              </label>
              <textarea
                id="blockReason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full p-2 border rounded-md min-h-[80px] text-sm"
                placeholder="Enter reason for blacklisting this device..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsBlacklistDialogOpen(false);
                setSelectedDevice(null);
                setBlockReason("");
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedDevice && handleBlockDevice(selectedDevice)}
            >
              <Lock className="h-4 w-4 mr-2" />
              Block Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}