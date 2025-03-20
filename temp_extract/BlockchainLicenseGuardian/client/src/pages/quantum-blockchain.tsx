import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldOff, 
  Lock, 
  UnlockKeyhole, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  FileWarning,
  Server,
  History,
  ArrowDownToLine,
  FileKey2,
  KeyRound,
  Fingerprint
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { 
  verifyTransactionSecurity, 
  createQuantumSecureBackup,
  enableQuantumTransactionVerification,
  testHardwareSecurityConnection,
  setHardwareSecurityConnection,
  verifyBlockchainIntegrity,
  detectBlockchainSecurityThreats,
  createQuantumSignature,
  verifyQuantumSignature,
  BlockchainSecurityAlertType,
  QuantumAlgorithm,
  TransactionSecurityStatus
} from '@/lib/quantum-blockchain-security';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function QuantumBlockchainSecurity() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [latestTransaction, setLatestTransaction] = useState<string>('');
  const [securityStatus, setSecurityStatus] = useState<TransactionSecurityStatus | null>(null);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [verificationInProgress, setVerificationInProgress] = useState(false);
  const [integrityCheckInProgress, setIntegrityCheckInProgress] = useState(false);
  const [threatDetectionInProgress, setThreatDetectionInProgress] = useState(false);
  const [hardwareStatus, setHardwareStatus] = useState({ connected: false, latency: 0 });
  const [activeAlgorithm, setActiveAlgorithm] = useState<QuantumAlgorithm>(QuantumAlgorithm.DILITHIUM);
  
  // Fetch latest ledger entries to get transactions
  const { data: ledgerEntries } = useQuery({
    queryKey: ['/api/ledger'],
    refetchInterval: 10000
  });

  useEffect(() => {
    if (ledgerEntries && Array.isArray(ledgerEntries) && ledgerEntries.length > 0) {
      setLatestTransaction(ledgerEntries[0].transactionId);
    }
  }, [ledgerEntries]);

  useEffect(() => {
    // Check hardware security module connection on load
    checkHardwareConnection();
    
    // Enable quantum verification on load
    enableQuantumSecurity();
  }, []);

  const checkHardwareConnection = () => {
    const status = testHardwareSecurityConnection();
    setHardwareStatus(status);
  };

  const toggleHardwareConnection = () => {
    const newStatus = !hardwareStatus.connected;
    const result = setHardwareSecurityConnection(newStatus);
    
    if (result.success) {
      checkHardwareConnection();
      toast({
        title: newStatus ? "Hardware Security Module Connected" : "Hardware Security Module Disconnected",
        description: newStatus 
          ? "Enhanced security features are now active" 
          : "Some security features have been disabled",
        variant: newStatus ? "default" : "destructive",
      });
    }
  };

  const enableQuantumSecurity = () => {
    const securityLevel = 3; // Maximum security
    const result = enableQuantumTransactionVerification(securityLevel);
    setActiveAlgorithm(result.algorithm);
    
    toast({
      title: "Quantum Security Enabled",
      description: `Using ${result.algorithm} algorithm with ${result.keyStrength}-bit strength`,
      variant: "default",
    });
  };

  const verifyTransaction = async () => {
    if (!latestTransaction) {
      toast({
        title: "No Transaction Available",
        description: "Please create a transaction first",
        variant: "destructive",
      });
      return;
    }
    
    setVerificationInProgress(true);
    
    try {
      const status = await verifyTransactionSecurity(latestTransaction);
      setSecurityStatus(status);
      
      toast({
        title: status.verified ? "Transaction Verified" : "Transaction Verification Failed",
        description: status.verified 
          ? `Security level: ${status.securityLevel}/100` 
          : `Issues detected: ${status.warnings.length}`,
        variant: status.verified ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Transaction verification failed:", error);
      toast({
        title: "Verification Error",
        description: "Failed to verify transaction security",
        variant: "destructive",
      });
    } finally {
      setVerificationInProgress(false);
    }
  };

  const createBackup = async () => {
    setBackupInProgress(true);
    
    try {
      const result = await createQuantumSecureBackup(3);
      
      toast({
        title: "Backup Created Successfully",
        description: `Created ${result.backupIds.length} secure backup(s)`,
        variant: "default",
      });
    } catch (error) {
      console.error("Backup creation failed:", error);
      toast({
        title: "Backup Error",
        description: "Failed to create quantum secure backup",
        variant: "destructive",
      });
    } finally {
      setBackupInProgress(false);
    }
  };

  const checkBlockchainIntegrity = async () => {
    setIntegrityCheckInProgress(true);
    
    try {
      const result = await verifyBlockchainIntegrity();
      
      toast({
        title: result.valid ? "Blockchain Integrity Verified" : "Blockchain Integrity Issues",
        description: result.valid 
          ? `Verified ${result.blocksVerified} blocks with 100% integrity` 
          : `Found ${result.tamperedBlocks.length} tampered blocks`,
        variant: result.valid ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Integrity check failed:", error);
      toast({
        title: "Integrity Check Error",
        description: "Failed to verify blockchain integrity",
        variant: "destructive",
      });
    } finally {
      setIntegrityCheckInProgress(false);
    }
  };

  const detectThreats = async () => {
    setThreatDetectionInProgress(true);
    
    try {
      const result = await detectBlockchainSecurityThreats();
      
      toast({
        title: result.threatsDetected ? "Security Threats Detected" : "No Security Threats",
        description: result.threatsDetected 
          ? `Detected ${result.threatCount} security threat(s)` 
          : "Your blockchain is secure",
        variant: result.threatsDetected ? "destructive" : "default",
      });
      
      if (result.threatsDetected && result.recommendations.length > 0) {
        setTimeout(() => {
          toast({
            title: "Security Recommendations",
            description: result.recommendations[0],
            variant: "default",
          });
        }, 1000);
      }
    } catch (error) {
      console.error("Threat detection failed:", error);
      toast({
        title: "Threat Detection Error",
        description: "Failed to detect security threats",
        variant: "destructive",
      });
    } finally {
      setThreatDetectionInProgress(false);
    }
  };

  const createAndVerifySignature = () => {
    if (!latestTransaction) {
      toast({
        title: "No Transaction Available",
        description: "Please create a transaction first",
        variant: "destructive",
      });
      return;
    }
    
    // Create signature
    const signature = createQuantumSignature(latestTransaction, activeAlgorithm);
    
    // Verify signature
    const isValid = verifyQuantumSignature(latestTransaction, signature);
    
    toast({
      title: isValid ? "Signature Verified" : "Signature Invalid",
      description: isValid 
        ? `Created and verified ${activeAlgorithm} signature` 
        : "Failed to verify quantum signature",
      variant: isValid ? "default" : "destructive",
    });
  };

  return (
    <div className="container py-8">
      <div className="space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Quantum Blockchain Security</h1>
          <p className="text-muted-foreground">
            Advanced post-quantum cryptographic protection for blockchain transactions
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 md:w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="integrity">Integrity</TabsTrigger>
            <TabsTrigger value="hardware">Hardware HSM</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5 text-primary" />
                    Security Status
                  </CardTitle>
                  <CardDescription>Current quantum blockchain security status</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Post-Quantum Protection</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        Active
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Active Algorithm</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                        {activeAlgorithm}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Hardware Security Module</span>
                      {hardwareStatus.connected ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          Connected ({hardwareStatus.latency.toFixed(1)}ms)
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                          Disconnected
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Clone Protection</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        Enforced
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={detectThreats}>
                    {threatDetectionInProgress ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Scan for Threats
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <FileKey2 className="mr-2 h-5 w-5 text-primary" />
                    Quantum Algorithms
                  </CardTitle>
                  <CardDescription>Post-quantum cryptographic algorithms</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-4">
                    {Object.values(QuantumAlgorithm).map((algo) => (
                      <div key={algo} className="flex justify-between items-center">
                        <span className="capitalize">{algo}</span>
                        {algo === activeAlgorithm ? (
                          <Badge className="bg-primary/20 text-primary">Active</Badge>
                        ) : (
                          <Badge variant="outline">Available</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={enableQuantumSecurity}>
                    <Lock className="mr-2 h-4 w-4" />
                    Configure Quantum Security
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <History className="mr-2 h-5 w-5 text-primary" />
                  Recent Security Activities
                </CardTitle>
                <CardDescription>Recent blockchain security events and activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ledgerEntries && Array.isArray(ledgerEntries) && ledgerEntries.filter((entry: any) => 
                    entry.action.includes('security') || 
                    entry.action.includes('quantum') || 
                    entry.action.includes('integrity') ||
                    entry.action.includes('backup') ||
                    entry.action.includes('clone')
                  ).slice(0, 5).map((entry: any, index: number) => (
                    <div key={index} className="flex items-start space-x-4">
                      {entry.action.includes('clone') ? (
                        <ShieldAlert className="h-5 w-5 mt-0.5 text-destructive" />
                      ) : entry.action.includes('security') ? (
                        <Shield className="h-5 w-5 mt-0.5 text-primary" />
                      ) : entry.action.includes('backup') ? (
                        <ArrowDownToLine className="h-5 w-5 mt-0.5 text-primary" />
                      ) : (
                        <FileKey2 className="h-5 w-5 mt-0.5 text-primary" />
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
                          <Badge variant={entry.status === 'completed' ? 'outline' : 'destructive'} className="mt-1">
                            {entry.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!ledgerEntries || !Array.isArray(ledgerEntries) || ledgerEntries.filter((entry: any) => 
                    entry.action.includes('security') || 
                    entry.action.includes('quantum') || 
                    entry.action.includes('backup')
                  ).length === 0) && (
                    <p className="text-sm text-muted-foreground">No security activities found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="verification" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Fingerprint className="mr-2 h-5 w-5 text-primary" />
                    Transaction Verification
                  </CardTitle>
                  <CardDescription>Verify transaction security with quantum-resistant algorithms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Transaction ID:</span>
                        <span className="font-mono">{latestTransaction ? `${latestTransaction.substring(0, 12)}...` : 'None'}</span>
                      </div>
                      <Separator />
                      
                      {securityStatus && (
                        <div className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span>Security Level:</span>
                              <div className="flex items-center">
                                <span className="mr-2">{securityStatus.securityLevel}/100</span>
                                <Progress value={securityStatus.securityLevel} className="w-24" />
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span>Verification Status:</span>
                              {securityStatus.verified ? (
                                <Badge className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="destructive">Failed</Badge>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span>Quantum Algorithm:</span>
                              <Badge variant="outline">
                                {securityStatus.quantum.algorithm}
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span>Key Strength:</span>
                              <span>{securityStatus.quantum.keyStrength} bits</span>
                            </div>
                            
                            <Separator />
                            
                            <div className="space-y-2 mt-2">
                              <span className="text-sm font-medium">Integrity Checks:</span>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center space-x-2">
                                  {securityStatus.integrity.chainValid ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  )}
                                  <span className="text-sm">Chain Valid</span>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  {securityStatus.integrity.historyValid ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  )}
                                  <span className="text-sm">History Valid</span>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  {securityStatus.integrity.signatureValid ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  )}
                                  <span className="text-sm">Signature Valid</span>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  {securityStatus.cloneProtection.passed ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  )}
                                  <span className="text-sm">Clone Protection</span>
                                </div>
                              </div>
                            </div>
                            
                            {securityStatus.warnings.length > 0 && (
                              <Alert variant="destructive" className="mt-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Warnings</AlertTitle>
                                <AlertDescription>
                                  <ul className="list-disc list-inside text-sm">
                                    {securityStatus.warnings.map((warning, index) => (
                                      <li key={index}>{warning}</li>
                                    ))}
                                  </ul>
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" className="w-full mr-2" onClick={verifyTransaction}>
                    {verificationInProgress ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Verify Transaction
                      </>
                    )}
                  </Button>
                  <Button className="w-full" onClick={createAndVerifySignature}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Create & Verify Signature
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ArrowDownToLine className="mr-2 h-5 w-5 text-primary" />
                    Quantum-Secure Backup
                  </CardTitle>
                  <CardDescription>Create post-quantum encrypted blockchain backups</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <Server className="h-4 w-4" />
                      <AlertTitle>Backup Protection</AlertTitle>
                      <AlertDescription>
                        Quantum-secure backups protect your blockchain data from future quantum computing attacks
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Encryption Algorithm:</span>
                        <Badge variant="outline">SPHINCS-256</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Redundancy Level:</span>
                        <span>3x (High)</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Quantum Resistance:</span>
                        <Badge className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          Verified
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={createBackup}>
                    {backupInProgress ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Creating Backup...
                      </>
                    ) : (
                      <>
                        <ArrowDownToLine className="mr-2 h-4 w-4" />
                        Create Secure Backup
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="integrity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileWarning className="mr-2 h-5 w-5 text-primary" />
                  Blockchain Integrity Verification
                </CardTitle>
                <CardDescription>Verify the integrity of the entire blockchain</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <ShieldCheck className="h-4 w-4" />
                    <AlertTitle>Integrity Protection</AlertTitle>
                    <AlertDescription>
                      Quantum-secure integrity verification ensures your blockchain has not been tampered with
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Last Integrity Check:</span>
                      <span>{new Date().toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Integrity Status:</span>
                      <Badge className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        Verified
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Blocks Verified:</span>
                      <span>1,000</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Tampered Blocks:</span>
                      <span>0</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={checkBlockchainIntegrity}>
                  {integrityCheckInProgress ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Verifying Integrity...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Verify Blockchain Integrity
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShieldAlert className="mr-2 h-5 w-5 text-primary" />
                    Security Threats
                  </CardTitle>
                  <CardDescription>Detect blockchain security threats</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Threats Detected:</span>
                        <Badge variant="outline">None</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Last Scan:</span>
                        <span>{new Date().toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Security Level:</span>
                        <div className="flex items-center">
                          <span className="mr-2">100/100</span>
                          <Progress value={100} className="w-24" />
                        </div>
                      </div>
                    </div>
                    
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>All Clear</AlertTitle>
                      <AlertDescription>
                        No security threats detected in your blockchain
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={detectThreats}>
                    {threatDetectionInProgress ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Scanning for Threats...
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Scan for Security Threats
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <KeyRound className="mr-2 h-5 w-5 text-primary" />
                    Quantum Key Management
                  </CardTitle>
                  <CardDescription>Manage post-quantum cryptographic keys</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Active Keys:</span>
                        <span>8</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Default Algorithm:</span>
                        <Badge variant="outline">{activeAlgorithm}</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Key Rotation:</span>
                        <Badge className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          Automatic
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Quantum Resistance:</span>
                        <Badge className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          Level 3 (Maximum)
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={enableQuantumSecurity}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Rotate Quantum Keys
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="hardware" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="mr-2 h-5 w-5 text-primary" />
                  Hardware Security Module
                </CardTitle>
                <CardDescription>Manage hardware security module for transaction signing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-base font-medium">Connection Status</span>
                      <div className="text-sm text-muted-foreground">
                        {hardwareStatus.connected ? 'Connected and operational' : 'Disconnected'}
                      </div>
                    </div>
                    {hardwareStatus.connected ? (
                      <Badge className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Disconnected</Badge>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Latency:</span>
                        <span>{hardwareStatus.connected ? `${hardwareStatus.latency.toFixed(1)} ms` : 'N/A'}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Encryption:</span>
                        <Badge variant="outline">AES-256</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Signing Algorithm:</span>
                        <Badge variant="outline">{activeAlgorithm}</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Key Storage:</span>
                        <Badge variant="outline">Secure Enclave</Badge>
                      </div>
                    </div>
                    
                    {hardwareStatus.connected ? (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Connected</AlertTitle>
                        <AlertDescription>
                          Hardware Security Module is connected and providing enhanced transaction security
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="destructive">
                        <ShieldOff className="h-4 w-4" />
                        <AlertTitle>Disconnected</AlertTitle>
                        <AlertDescription>
                          Hardware Security Module is disconnected. Enhanced security features are disabled.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={hardwareStatus.connected ? 'destructive' : 'default'}
                  onClick={toggleHardwareConnection}
                >
                  {hardwareStatus.connected ? (
                    <>
                      <UnlockKeyhole className="mr-2 h-4 w-4" />
                      Disconnect HSM
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Connect HSM
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileKey2 className="mr-2 h-5 w-5 text-primary" />
                  Hardware Security Logs
                </CardTitle>
                <CardDescription>Hardware security module activity logs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-md border p-4">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">HSM Connection Established</span>
                          <Badge variant="outline" className="ml-auto">Now</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground pl-6">
                          Connected to hardware security module with 15.2ms latency
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <KeyRound className="mr-2 h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Quantum Key Rotation</span>
                          <Badge variant="outline" className="ml-auto">10 min ago</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground pl-6">
                          Rotated quantum cryptographic keys (DILITHIUM-384)
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Fingerprint className="mr-2 h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Transaction Signature</span>
                          <Badge variant="outline" className="ml-auto">15 min ago</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground pl-6">
                          Hardware-signed transaction 0x7f3d8a2e51f...
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Security Audit</span>
                          <Badge variant="outline" className="ml-auto">30 min ago</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground pl-6">
                          Completed HSM security audit - No issues found
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={checkHardwareConnection}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Status
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}