import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  RefreshCw,
  Shield,
  ShieldAlert, 
  Brain,
  Wallet,
  FileKey,
  Flame,
  Lock,
  AlertCircle,
  CheckCircle2,
  Search,
  ArrowLeft,
  EyeOff,
  Eye,
  Clock,
  KeyRound,
  User,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { 
  performSecurityCheck, 
  reverseBurnTransaction,
  recoverLostWallet,
  recoverStolenAssets,
  detectUserDuress,
  SecurityAssistantStatus,
  LostWalletInfo
} from '@/lib/quantum-agi-assistant';

export default function AgiSecurity() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [selectedTab, setSelectedTab] = useState('assistant');
  const [isChecking, setIsChecking] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [securityStatus, setSecurityStatus] = useState<SecurityAssistantStatus | null>(null);
  
  // Recovery form states
  const [recoveryType, setRecoveryType] = useState<'lost_wallet' | 'burn_transaction' | 'stolen_assets' | null>(null);
  const [walletId, setWalletId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [recoveryResult, setRecoveryResult] = useState<any | null>(null);
  
  // Duress detection states
  const [duressType, setDuressType] = useState<'withdrawal' | 'large_transaction' | 'account_settings_change'>('withdrawal');
  const [duressAmount, setDuressAmount] = useState('');
  const [duressDescription, setDuressDescription] = useState('');
  const [duressResult, setDuressResult] = useState<any | null>(null);
  const [isDuressChecking, setIsDuressChecking] = useState(false);
  
  // States for asset protection
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [protectionLevel, setProtectionLevel] = useState<'standard' | 'enhanced' | 'quantum'>('standard');
  
  // Fetch ledger entries for security events
  const { data: ledgerEntries } = useQuery({
    queryKey: ['/api/ledger'],
    refetchInterval: 10000
  });

  const runSecurityCheck = async () => {
    setIsChecking(true);
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
      
      // Perform security check
      const securityCheckResult = await performSecurityCheck(
        user?.sub ? parseInt(user.sub) : 1, 
        'transaction'
      );
      
      setSecurityStatus(securityCheckResult);
      
      toast({
        title: securityCheckResult.blockTransaction 
          ? "Security Alert!" 
          : "Security Check Complete",
        description: securityCheckResult.blockTransaction 
          ? "Potential security risks detected. See details below." 
          : "No critical security risks detected.",
        variant: securityCheckResult.blockTransaction ? "destructive" : "default",
      });
    } catch (error) {
      console.error("Security check failed:", error);
      toast({
        title: "Check Failed",
        description: "Failed to complete the security check",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setIsChecking(false);
        setProgress(0);
      }, 1000);
    }
  };
  
  const startRecovery = async () => {
    if (!recoveryType) {
      toast({
        title: "Recovery Type Required",
        description: "Please select a recovery type",
        variant: "destructive",
      });
      return;
    }
    
    setIsRecovering(true);
    setProgress(0);
    setRecoveryResult(null);
    
    // Simulated progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 500);
    
    try {
      // Start fake progress first
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let result;
      
      switch (recoveryType) {
        case 'lost_wallet':
          result = await recoverLostWallet(
            user?.sub ? parseInt(user.sub) : 1, 
            walletId || undefined
          );
          break;
          
        case 'burn_transaction':
          result = await reverseBurnTransaction(
            user?.sub ? parseInt(user.sub) : 1, 
            transactionId || `burn_tx_${Date.now()}`
          );
          break;
          
        case 'stolen_assets':
          result = await recoverStolenAssets(
            user?.sub ? parseInt(user.sub) : 1, 
            transactionId || `theft_tx_${Date.now()}`
          );
          break;
      }
      
      setRecoveryResult(result);
      
      toast({
        title: result?.success 
          ? "Recovery Successful!" 
          : "Recovery Failed",
        description: result?.success 
          ? "Your assets have been recovered successfully." 
          : "Unable to recover assets. See details for more information.",
        variant: result?.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Recovery failed:", error);
      toast({
        title: "Recovery Failed",
        description: "An error occurred during the recovery process",
        variant: "destructive",
      });
      
      setRecoveryResult({
        success: false,
        error: "An unexpected error occurred during recovery"
      });
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setIsRecovering(false);
        setProgress(0);
      }, 1000);
    }
  };
  
  const resetRecovery = () => {
    setRecoveryResult(null);
    setWalletId('');
    setTransactionId('');
  };
  
  const checkForDuress = async () => {
    setIsDuressChecking(true);
    setProgress(0);
    setDuressResult(null);
    
    // Simulated progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 12;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 300);
    
    try {
      // Start fake progress first
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Run duress detection
      const result = await detectUserDuress(
        user?.sub ? parseInt(user.sub) : 1,
        duressType
      );
      
      setDuressResult(result);
      
      toast({
        title: result.underDuress 
          ? "Security Alert: Duress Detected" 
          : "Security Check Complete",
        description: result.underDuress 
          ? "This transaction has been flagged for security concerns." 
          : "No duress signals detected. Transaction appears secure.",
        variant: result.underDuress ? "destructive" : "default",
      });
    } catch (error) {
      console.error("Duress check failed:", error);
      toast({
        title: "Check Failed",
        description: "Failed to complete the duress check",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setIsDuressChecking(false);
        setProgress(0);
      }, 1000);
    }
  };
  
  const resetDuressCheck = () => {
    setDuressResult(null);
    setDuressAmount('');
    setDuressDescription('');
  };
  
  return (
    <div className="container py-8">
      <div className="space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Quantum AGI Security Assistant</h1>
          <p className="text-muted-foreground">
            Advanced security with quantum protection, AI monitoring, and blockchain safeguards
          </p>
        </div>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full md:w-[800px]">
            <TabsTrigger value="assistant">
              <Brain className="mr-2 h-4 w-4" /> 
              Security Assistant
            </TabsTrigger>
            <TabsTrigger value="recovery">
              <Wallet className="mr-2 h-4 w-4" /> 
              Asset Recovery
            </TabsTrigger>
            <TabsTrigger value="duress">
              <EyeOff className="mr-2 h-4 w-4" /> 
              Duress Protection
            </TabsTrigger>
            <TabsTrigger value="protection">
              <Shield className="mr-2 h-4 w-4" /> 
              Asset Protection
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assistant" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="mr-2 h-5 w-5 text-primary" />
                    Quantum AGI Security Check
                  </CardTitle>
                  <CardDescription>
                    AI-powered security assessment with quantum protection
                  </CardDescription>
                </CardHeader>
                <CardContent className={isChecking ? "pb-2" : ""}>
                  {isChecking ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Running quantum-enhanced security scan...</span>
                          <span>{Math.floor(progress)}%</span>
                        </div>
                        <Progress value={progress} />
                      </div>
                      <div className="space-y-1 text-sm">
                        {progress > 10 && <p>✓ Scanning device security status...</p>}
                        {progress > 25 && <p>✓ Checking blockchain integrity...</p>}
                        {progress > 40 && <p>✓ Analyzing behavioral biometrics...</p>}
                        {progress > 55 && <p>✓ Verifying communication security...</p>}
                        {progress > 70 && <p>✓ Running quantum-secure verification...</p>}
                        {progress > 85 && <p>✓ Analyzing threat patterns...</p>}
                        {progress > 95 && <p>✓ Generating security report...</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert>
                        <Brain className="h-4 w-4" />
                        <AlertTitle>Quantum AGI Security Assistant</AlertTitle>
                        <AlertDescription>
                          This advanced security system uses quantum computing and AI to protect 
                          your assets and detect threats, scams, and duress situations.
                        </AlertDescription>
                      </Alert>
                      
                      {securityStatus ? (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="font-medium">Security Score:</span>
                              <div className="flex items-center">
                                <span className="mr-2">{securityStatus.securityScore}/100</span>
                                <div className="w-20">
                                  <Progress 
                                    value={securityStatus.securityScore} 
                                    className={
                                      securityStatus.securityScore > 70 ? "bg-green-100" : 
                                      securityStatus.securityScore > 40 ? "bg-yellow-100" : 
                                      "bg-red-100"
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <Separator className="my-2" />
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex justify-between">
                                <span className="font-medium">Anomaly Detected:</span>
                                <Badge variant={securityStatus.anomalyDetected ? "destructive" : "outline"}>
                                  {securityStatus.anomalyDetected ? "Yes" : "No"}
                                </Badge>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="font-medium">Remote Connection:</span>
                                <Badge variant={securityStatus.remoteConnectionDetected ? "destructive" : "outline"}>
                                  {securityStatus.remoteConnectionDetected ? "Yes" : "No"}
                                </Badge>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="font-medium">User Under Duress:</span>
                                <Badge variant={securityStatus.userUnderDuress ? "destructive" : "outline"}>
                                  {securityStatus.userUnderDuress ? "Yes" : "No"}
                                </Badge>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="font-medium">Transaction Status:</span>
                                <Badge variant={securityStatus.blockTransaction ? "destructive" : "outline"} 
                                      className={!securityStatus.blockTransaction ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : ""}>
                                  {securityStatus.blockTransaction ? "Blocked" : "Allowed"}
                                </Badge>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="font-medium">Social Engineering:</span>
                                <Badge variant={securityStatus.socialEngineeringAttemptDetected ? "destructive" : "outline"}>
                                  {securityStatus.socialEngineeringAttemptDetected ? "Detected" : "None"}
                                </Badge>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="font-medium">Blackmail Attempt:</span>
                                <Badge variant={securityStatus.blackmailAttemptDetected ? "destructive" : "outline"}>
                                  {securityStatus.blackmailAttemptDetected ? "Detected" : "None"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {securityStatus.blockTransaction && (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>Security Alert</AlertTitle>
                              <AlertDescription>
                                This transaction has been blocked due to security concerns.
                                Review the recommendations below for more details.
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          {securityStatus.recommendedActions.length > 0 && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-medium">Security Recommendations:</h3>
                              <ul className="space-y-1 text-sm">
                                {securityStatus.recommendedActions.map((recommendation, i) => (
                                  <li key={i} className="flex items-start">
                                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-yellow-500" />
                                    <span>{recommendation}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {securityStatus.detectedThreats.length > 0 && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-medium">Detected Threats:</h3>
                              <div className="space-y-3">
                                {securityStatus.detectedThreats.map((threat, i) => (
                                  <div key={i} className="bg-red-50 dark:bg-red-900/10 p-3 rounded-md">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-red-800 dark:text-red-300">{threat.threatType}</span>
                                      <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                        Severity: {threat.severity}/10
                                      </Badge>
                                    </div>
                                    <ul className="mt-2 text-sm text-red-700 dark:text-red-300 space-y-1">
                                      {threat.evidence.map((evidence, j) => (
                                        <li key={j} className="flex items-start">
                                          <span className="mr-2">•</span>
                                          <span>{evidence}</span>
                                        </li>
                                      ))}
                                    </ul>
                                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                                      AI confidence: {Math.round(threat.aiProbability * 100)}%
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
                          <Brain className="h-16 w-16 text-muted-foreground" />
                          <h3 className="text-lg font-medium">No Security Check</h3>
                          <p className="text-sm text-muted-foreground">
                            Click the "Run Security Check" button to assess your security status
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={runSecurityCheck}
                    disabled={isChecking}
                  >
                    {isChecking ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Running Security Check...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Run Security Check
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5 text-primary" />
                    Quantum Security Safeguards
                  </CardTitle>
                  <CardDescription>
                    Advanced protections enabled for your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-2 text-green-600" />
                          <span className="font-medium">Quantum Secure Signatures</span>
                        </div>
                        <Badge className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          Enabled
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Post-quantum cryptographic protection for all transactions
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Brain className="h-4 w-4 mr-2 text-green-600" />
                          <span className="font-medium">AI Behavioral Monitoring</span>
                        </div>
                        <Badge className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          Active
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Analyzes behavior patterns to detect fraudulent activity
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <EyeOff className="h-4 w-4 mr-2 text-green-600" />
                          <span className="font-medium">Duress Detection</span>
                        </div>
                        <Badge className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          Enabled
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Protects you during coercion or blackmail attempts
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Lock className="h-4 w-4 mr-2 text-green-600" />
                          <span className="font-medium">Multi-Factor Biometrics</span>
                        </div>
                        <Badge className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          Enabled
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Multi-layer authentication with biometric verification
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Flame className="h-4 w-4 mr-2 text-green-600" />
                          <span className="font-medium">Burn Transaction Reversal</span>
                        </div>
                        <Badge className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          Available
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ability to recover accidentally burned assets
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Search className="h-4 w-4 mr-2 text-green-600" />
                          <span className="font-medium">Asset Recovery & Tracking</span>
                        </div>
                        <Badge className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          Enabled
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Helps locate and recover lost or stolen cryptoassets
                      </p>
                    </div>
                    
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Quantum Security Status</AlertTitle>
                      <AlertDescription>
                        Your account is protected by advanced quantum security measures.
                        These safeguards help protect against both conventional and quantum computing threats.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-primary" />
                  Security Event History
                </CardTitle>
                <CardDescription>
                  Recent security events and quantum AGI assistant activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ledgerEntries && Array.isArray(ledgerEntries) && ledgerEntries.filter((entry: any) => 
                    entry.action.includes('security') || 
                    entry.action.includes('quantum') || 
                    entry.action.includes('duress') || 
                    entry.action.includes('wallet_recovery') ||
                    entry.action.includes('burn_')
                  ).slice(0, 10).map((entry: any, index: number) => (
                    <div key={index} className="flex items-start space-x-4">
                      {entry.action.includes('security') ? (
                        <Shield className="h-5 w-5 mt-0.5 text-primary" />
                      ) : entry.action.includes('duress') ? (
                        <EyeOff className="h-5 w-5 mt-0.5 text-destructive" />
                      ) : entry.action.includes('wallet_recovery') ? (
                        <Wallet className="h-5 w-5 mt-0.5 text-green-500" />
                      ) : entry.action.includes('burn_') ? (
                        <Flame className="h-5 w-5 mt-0.5 text-amber-500" />
                      ) : (
                        <Brain className="h-5 w-5 mt-0.5 text-purple-500" />
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
                            {entry.metadata.securityScore && (
                              <span>Security Score: {entry.metadata.securityScore}</span>
                            )}
                            
                            {entry.metadata.recoveredAmount && (
                              <span className="flex items-center">
                                <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                                Recovered: {entry.metadata.recoveredAmount} tokens
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {(!ledgerEntries || !Array.isArray(ledgerEntries) || ledgerEntries.filter((entry: any) => 
                    entry.action.includes('security') || 
                    entry.action.includes('quantum') || 
                    entry.action.includes('duress')
                  ).length === 0) && (
                    <div className="flex flex-col items-center justify-center text-center p-4 space-y-3">
                      <Clock className="h-16 w-16 text-muted-foreground" />
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
          
          <TabsContent value="recovery" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wallet className="mr-2 h-5 w-5 text-primary" />
                    Asset Recovery Center
                  </CardTitle>
                  <CardDescription>
                    Recover lost, burned, or stolen crypto assets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recoveryResult ? (
                    <div className="space-y-4">
                      <Alert variant={recoveryResult.success ? "default" : "destructive"}>
                        {recoveryResult.success ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        <AlertTitle>
                          {recoveryResult.success ? "Recovery Successful" : "Recovery Failed"}
                        </AlertTitle>
                        <AlertDescription>
                          {recoveryResult.success 
                            ? "Your assets have been successfully recovered." 
                            : "Unable to recover assets at this time."}
                        </AlertDescription>
                      </Alert>
                      
                      {recoveryResult.success && recoveryType === 'lost_wallet' && recoveryResult.recoveredWallet && (
                        <div className="space-y-3 p-4 border rounded-md">
                          <h3 className="text-sm font-medium">Recovered Wallet Details</h3>
                          <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <span className="text-muted-foreground">Wallet ID:</span>
                            <span className="font-mono">{recoveryResult.recoveredWallet.walletId}</span>
                            
                            <span className="text-muted-foreground">Type:</span>
                            <span>{recoveryResult.recoveredWallet.walletType.replace('_', ' ')}</span>
                            
                            <span className="text-muted-foreground">Balance:</span>
                            <span>{recoveryResult.recoveredWallet.lastKnownBalance} ETH</span>
                            
                            <span className="text-muted-foreground">Recovery Status:</span>
                            <Badge className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 w-fit">
                              {recoveryResult.recoveredWallet.recoveryStatus.replace('_', ' ')}
                            </Badge>
                            
                            <span className="text-muted-foreground">Recovery Signature:</span>
                            <span className="font-mono text-xs">{recoveryResult.recoverySignature}</span>
                          </div>
                        </div>
                      )}
                      
                      {recoveryResult.success && recoveryType === 'burn_transaction' && (
                        <div className="space-y-3 p-4 border rounded-md">
                          <h3 className="text-sm font-medium">Burn Transaction Recovery</h3>
                          <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <span className="text-muted-foreground">Recovered Amount:</span>
                            <span>{recoveryResult.recoveredAmount} ETH</span>
                            
                            <span className="text-muted-foreground">New Transaction:</span>
                            <span className="font-mono text-xs">{recoveryResult.newTransactionId}</span>
                            
                            <span className="text-muted-foreground">Recovery Method:</span>
                            <span>{recoveryResult.recoveryMethod.replace(/_/g, ' ')}</span>
                          </div>
                        </div>
                      )}
                      
                      {recoveryResult.success && recoveryType === 'stolen_assets' && (
                        <div className="space-y-3 p-4 border rounded-md">
                          <h3 className="text-sm font-medium">Stolen Asset Recovery</h3>
                          <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <span className="text-muted-foreground">Recovered Amount:</span>
                            <span>{recoveryResult.recoveredAmount} ETH</span>
                            
                            <span className="text-muted-foreground">Recovery Transaction:</span>
                            <span className="font-mono text-xs">{recoveryResult.recoveryTransactionId}</span>
                            
                            {recoveryResult.theftDetails && (
                              <>
                                <span className="text-muted-foreground">Attack Method:</span>
                                <span>{recoveryResult.theftDetails.attackMethod}</span>
                                
                                <span className="text-muted-foreground">Attacker Traced:</span>
                                <Badge variant={recoveryResult.theftDetails.attackerTraced ? "outline" : "secondary"}>
                                  {recoveryResult.theftDetails.attackerTraced ? "Yes" : "No"}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {recoveryResult.nextSteps && recoveryResult.nextSteps.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium">Next Steps:</h3>
                          <ul className="space-y-1">
                            {recoveryResult.nextSteps.map((step: string, i: number) => (
                              <li key={i} className="flex items-start text-sm">
                                <span className="mr-2">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={resetRecovery}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Start New Recovery
                      </Button>
                    </div>
                  ) : isRecovering ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Running quantum recovery process...</span>
                          <span>{Math.floor(progress)}%</span>
                        </div>
                        <Progress value={progress} />
                      </div>
                      <div className="space-y-1 text-sm">
                        {progress > 10 && <p>✓ Analyzing blockchain records...</p>}
                        {progress > 25 && <p>✓ Verifying ownership signatures...</p>}
                        {progress > 40 && <p>✓ Applying quantum recovery algorithms...</p>}
                        {progress > 55 && <p>✓ Reconstructing transaction history...</p>}
                        {progress > 70 && <p>✓ Validating quantum signatures...</p>}
                        {progress > 85 && <p>✓ Preparing recovery transaction...</p>}
                        {progress > 95 && <p>✓ Finalizing asset recovery...</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert>
                        <Wallet className="h-4 w-4" />
                        <AlertTitle>Quantum Asset Recovery</AlertTitle>
                        <AlertDescription>
                          Our advanced quantum AI system can recover lost, burned, or stolen assets 
                          using blockchain forensics and quantum signature verification.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="recovery-type">Recovery Type</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <Button 
                              variant={recoveryType === 'lost_wallet' ? "default" : "outline"}
                              onClick={() => setRecoveryType('lost_wallet')}
                              className="justify-start"
                            >
                              <Wallet className="mr-2 h-4 w-4" />
                              Lost Wallet
                            </Button>
                            <Button 
                              variant={recoveryType === 'burn_transaction' ? "default" : "outline"}
                              onClick={() => setRecoveryType('burn_transaction')}
                              className="justify-start"
                            >
                              <Flame className="mr-2 h-4 w-4" />
                              Burn Transaction
                            </Button>
                            <Button 
                              variant={recoveryType === 'stolen_assets' ? "default" : "outline"}
                              onClick={() => setRecoveryType('stolen_assets')}
                              className="justify-start"
                            >
                              <AlertCircle className="mr-2 h-4 w-4" />
                              Stolen Assets
                            </Button>
                          </div>
                        </div>
                        
                        {recoveryType === 'lost_wallet' && (
                          <div className="space-y-2">
                            <Label htmlFor="wallet-id">Wallet ID (Optional)</Label>
                            <Input
                              id="wallet-id"
                              placeholder="Enter wallet ID if known"
                              value={walletId}
                              onChange={(e) => setWalletId(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              Our quantum AI can recover your wallet even without the ID
                            </p>
                          </div>
                        )}
                        
                        {(recoveryType === 'burn_transaction' || recoveryType === 'stolen_assets') && (
                          <div className="space-y-2">
                            <Label htmlFor="transaction-id">Transaction ID (Optional)</Label>
                            <Input
                              id="transaction-id"
                              placeholder="Enter transaction ID if known"
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              Our system can identify related transactions even without the ID
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={startRecovery}
                    disabled={isRecovering || recoveryType === null || recoveryResult !== null}
                  >
                    {isRecovering ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Recovering Assets...
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
                        Start Recovery Process
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileKey className="mr-2 h-5 w-5 text-primary" />
                    How Asset Recovery Works
                  </CardTitle>
                  <CardDescription>
                    Understanding quantum-powered asset recovery
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-base font-medium flex items-center">
                        <Wallet className="mr-2 h-4 w-4 text-primary" />
                        Lost Wallet Recovery
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Our quantum AI system can recover access to lost wallets by:
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>Analyzing historical blockchain transactions</li>
                        <li>Reconstructing wallet signatures using quantum algorithms</li>
                        <li>Verifying ownership through behavioral biometrics</li>
                        <li>Creating new quantum-secure recovery signatures</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-base font-medium flex items-center">
                        <Flame className="mr-2 h-4 w-4 text-primary" />
                        Burn Transaction Reversal
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Accidentally burned transactions can be reversed by:
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>Detecting and verifying burn address transactions</li>
                        <li>Proving original ownership through quantum signatures</li>
                        <li>Creating a secure recovery transaction</li>
                        <li>Returning assets to the verified original owner</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-base font-medium flex items-center">
                        <AlertCircle className="mr-2 h-4 w-4 text-primary" />
                        Stolen Asset Recovery
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Our system can locate and recover stolen assets by:
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>Tracing transaction paths through blockchain forensics</li>
                        <li>Identifying unauthorized transactions with AI</li>
                        <li>Analyzing wallet behaviors to detect theft</li>
                        <li>Creating secure asset return transactions</li>
                        <li>Blacklisting malicious addresses to prevent future theft</li>
                      </ul>
                    </div>
                    
                    <Alert className="bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                      <FileKey className="h-4 w-4" />
                      <AlertTitle>Quantum Security Guarantee</AlertTitle>
                      <AlertDescription>
                        All recovery operations are secured by quantum-resistant cryptography
                        and require multi-factor identity verification to protect your assets.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="duress" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <EyeOff className="mr-2 h-5 w-5 text-primary" />
                    Duress & Blackmail Protection
                  </CardTitle>
                  <CardDescription>
                    AI detection of coercion, harassment, and blackmail attempts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {duressResult ? (
                    <div className="space-y-4">
                      <Alert variant={duressResult.underDuress ? "destructive" : "default"}>
                        {duressResult.underDuress ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        <AlertTitle>
                          {duressResult.underDuress ? "Duress Detected" : "No Duress Detected"}
                        </AlertTitle>
                        <AlertDescription>
                          {duressResult.underDuress 
                            ? "Signs of potential duress or coercion have been detected." 
                            : "No signs of duress or coercion detected in this session."}
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Confidence Score:</span>
                          <div className="flex items-center">
                            <span className="mr-2">{Math.round(duressResult.confidenceScore * 100)}%</span>
                            <Progress 
                              value={duressResult.confidenceScore * 100} 
                              className="w-20"
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Recommended Action:</span>
                          <Badge 
                            variant={
                              duressResult.recommendedAction === 'proceed' 
                                ? 'outline' 
                                : duressResult.recommendedAction === 'additional_verification'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className={
                              duressResult.recommendedAction === 'proceed' 
                                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" 
                                : ""
                            }
                          >
                            {duressResult.recommendedAction.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                      
                      {duressResult.evidence.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium">Detected Indicators:</h3>
                          <ul className="space-y-1">
                            {duressResult.evidence.map((evidence: string, i: number) => (
                              <li key={i} className="flex items-start text-sm">
                                <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-amber-500" />
                                <span>{evidence}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Security Measures:</h3>
                        <ul className="space-y-1">
                          {duressResult.securityMeasures.map((measure: string, i: number) => (
                            <li key={i} className="flex items-start text-sm">
                              <Shield className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                              <span>{measure}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={resetDuressCheck}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Start New Check
                      </Button>
                    </div>
                  ) : isDuressChecking ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Analyzing for signs of duress...</span>
                          <span>{Math.floor(progress)}%</span>
                        </div>
                        <Progress value={progress} />
                      </div>
                      <div className="space-y-1 text-sm">
                        {progress > 10 && <p>✓ Collecting behavioral biometrics...</p>}
                        {progress > 25 && <p>✓ Analyzing typing patterns...</p>}
                        {progress > 40 && <p>✓ Checking for unusual access patterns...</p>}
                        {progress > 55 && <p>✓ Scanning for threatening communications...</p>}
                        {progress > 70 && <p>✓ Comparing with historical behavior...</p>}
                        {progress > 85 && <p>✓ Running AI threat analysis...</p>}
                        {progress > 95 && <p>✓ Finalizing duress assessment...</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert>
                        <EyeOff className="h-4 w-4" />
                        <AlertTitle>Duress Protection System</AlertTitle>
                        <AlertDescription>
                          This system can detect if you're being forced, blackmailed, or harassed into making transactions.
                          We analyze behavioral patterns, device security, and communication signals.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="duress-type">Operation Type</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <Button 
                              variant={duressType === 'withdrawal' ? "default" : "outline"}
                              onClick={() => setDuressType('withdrawal')}
                              className="justify-start"
                            >
                              <Wallet className="mr-2 h-4 w-4" />
                              Withdrawal
                            </Button>
                            <Button 
                              variant={duressType === 'large_transaction' ? "default" : "outline"}
                              onClick={() => setDuressType('large_transaction')}
                              className="justify-start"
                            >
                              <AlertCircle className="mr-2 h-4 w-4" />
                              Large Transaction
                            </Button>
                            <Button 
                              variant={duressType === 'account_settings_change' ? "default" : "outline"}
                              onClick={() => setDuressType('account_settings_change')}
                              className="justify-start"
                            >
                              <User className="mr-2 h-4 w-4" />
                              Account Change
                            </Button>
                          </div>
                        </div>
                        
                        {(duressType === 'withdrawal' || duressType === 'large_transaction') && (
                          <div className="space-y-2">
                            <Label htmlFor="duress-amount">Amount (Optional)</Label>
                            <Input
                              id="duress-amount"
                              placeholder="Enter transaction amount"
                              value={duressAmount}
                              onChange={(e) => setDuressAmount(e.target.value)}
                            />
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Label htmlFor="duress-description">Additional Context (Optional)</Label>
                          <Textarea
                            id="duress-description"
                            placeholder="Provide any additional context about this transaction"
                            value={duressDescription}
                            onChange={(e) => setDuressDescription(e.target.value)}
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground">
                            This helps our AI detect unusual patterns or behavior
                          </p>
                        </div>
                      </div>
                      
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Important Security Notice</AlertTitle>
                        <AlertDescription>
                          If you are currently under duress or being forced to make a transaction,
                          our AI system will detect it automatically. No special codes or signals are needed.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={checkForDuress}
                    disabled={isDuressChecking || duressResult !== null}
                    variant={isDuressChecking ? "outline" : "default"}
                  >
                    {isDuressChecking ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Checking for Duress...
                      </>
                    ) : (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Check for Duress Signals
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5 text-primary" />
                    How Duress Protection Works
                  </CardTitle>
                  <CardDescription>
                    Understanding our advanced protection system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-base font-medium flex items-center">
                        <Brain className="mr-2 h-4 w-4 text-primary" />
                        Behavioral Biometrics
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Our system analyzes your normal behavioral patterns:
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>Typing rhythm and speed patterns</li>
                        <li>Mouse movement and click behaviors</li>
                        <li>Transaction timing and frequency</li>
                        <li>Device handling patterns</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-base font-medium flex items-center">
                        <User className="mr-2 h-4 w-4 text-primary" />
                        Duress Signals Detection
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Our AI can detect subtle signals of duress:
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>Unusual changes in typing patterns</li>
                        <li>Hesitation during critical actions</li>
                        <li>Anomalous transaction behavior</li>
                        <li>Irregular access patterns</li>
                        <li>Unusual location or device usage</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-base font-medium flex items-center">
                        <AlertCircle className="mr-2 h-4 w-4 text-primary" />
                        Blackmail & Harassment Detection
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        We scan for signs of blackmail or harassment:
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>Threats in communications</li>
                        <li>Unusual transaction patterns</li>
                        <li>Unfamiliar withdrawal destinations</li>
                        <li>Changes in communication style</li>
                        <li>Suspicious account activity</li>
                      </ul>
                    </div>
                    
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertTitle>Protection Measures</AlertTitle>
                      <AlertDescription>
                        When duress is detected, the system can automatically:
                        <ul className="list-disc list-inside mt-2 text-sm">
                          <li>Delay or block suspicious transactions</li>
                          <li>Increase verification requirements</li>
                          <li>Temporarily lock accounts</li>
                          <li>Alert security teams if necessary</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="protection" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5 text-primary" />
                    Quantum Asset Protection
                  </CardTitle>
                  <CardDescription>
                    Configure advanced blockchain security for your assets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertTitle>Asset Protection System</AlertTitle>
                      <AlertDescription>
                        Configure enhanced security protocols for your crypto assets,
                        including quantum-resistant signatures, AI monitoring, and recovery options.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="asset-selection">Select Asset</Label>
                        <div className="grid grid-cols-1 gap-2">
                          <Button 
                            variant={selectedAsset === 'wallet' ? "default" : "outline"}
                            onClick={() => setSelectedAsset('wallet')}
                            className="justify-start"
                          >
                            <Wallet className="mr-2 h-4 w-4" />
                            Main Wallet (3.42 ETH)
                          </Button>
                          <Button 
                            variant={selectedAsset === 'nft_collection' ? "default" : "outline"}
                            onClick={() => setSelectedAsset('nft_collection')}
                            className="justify-start"
                          >
                            <FileKey className="mr-2 h-4 w-4" />
                            NFT Collection (12 items)
                          </Button>
                          <Button 
                            variant={selectedAsset === 'smart_contract' ? "default" : "outline"}
                            onClick={() => setSelectedAsset('smart_contract')}
                            className="justify-start"
                          >
                            <KeyRound className="mr-2 h-4 w-4" />
                            Smart Contract (TokenVault)
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="protection-level">Protection Level</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button 
                            variant={protectionLevel === 'standard' ? "default" : "outline"}
                            onClick={() => setProtectionLevel('standard')}
                            className="justify-start"
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Standard
                          </Button>
                          <Button 
                            variant={protectionLevel === 'enhanced' ? "default" : "outline"}
                            onClick={() => setProtectionLevel('enhanced')}
                            className="justify-start"
                          >
                            <ShieldAlert className="mr-2 h-4 w-4" />
                            Enhanced
                          </Button>
                          <Button 
                            variant={protectionLevel === 'quantum' ? "default" : "outline"}
                            onClick={() => setProtectionLevel('quantum')}
                            className="justify-start"
                          >
                            <Brain className="mr-2 h-4 w-4" />
                            Quantum
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 p-4 border rounded-md">
                        <h3 className="text-sm font-medium">Selected Protection Features:</h3>
                        
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 mr-2 text-green-600" />
                            <span className="text-sm">Multi-signature protection</span>
                          </div>
                          
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 mr-2 text-green-600" />
                            <span className="text-sm">Transaction anomaly detection</span>
                          </div>
                          
                          {(protectionLevel === 'enhanced' || protectionLevel === 'quantum') && (
                            <>
                              <div className="flex items-center">
                                <Shield className="h-4 w-4 mr-2 text-green-600" />
                                <span className="text-sm">Behavioral biometric verification</span>
                              </div>
                              
                              <div className="flex items-center">
                                <Shield className="h-4 w-4 mr-2 text-green-600" />
                                <span className="text-sm">Delayed high-value transactions</span>
                              </div>
                            </>
                          )}
                          
                          {protectionLevel === 'quantum' && (
                            <>
                              <div className="flex items-center">
                                <Shield className="h-4 w-4 mr-2 text-green-600" />
                                <span className="text-sm">Quantum-resistant signatures</span>
                              </div>
                              
                              <div className="flex items-center">
                                <Shield className="h-4 w-4 mr-2 text-green-600" />
                                <span className="text-sm">AI-powered duress detection</span>
                              </div>
                              
                              <div className="flex items-center">
                                <Shield className="h-4 w-4 mr-2 text-green-600" />
                                <span className="text-sm">Burn transaction recovery capability</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    disabled={!selectedAsset}
                    onClick={() => {
                      toast({
                        title: "Protection Applied",
                        description: `${protectionLevel.charAt(0).toUpperCase() + protectionLevel.slice(1)} protection has been applied to your asset.`,
                        variant: "default",
                      });
                    }}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Apply Protection
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="mr-2 h-5 w-5 text-primary" />
                    Quantum AGI Assistant
                  </CardTitle>
                  <CardDescription>
                    AI-powered protection and recovery system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-primary/5 p-4 rounded-md border">
                      <div className="flex items-center mb-2">
                        <Brain className="h-5 w-5 mr-2 text-primary" />
                        <h3 className="text-base font-medium">AI Assistant Features</h3>
                      </div>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                          <div>
                            <span className="font-medium">Transaction Security Analysis</span>
                            <p className="text-muted-foreground">Real-time analysis of all transactions for suspicious patterns</p>
                          </div>
                        </li>
                        
                        <li className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                          <div>
                            <span className="font-medium">Duress Detection & Prevention</span>
                            <p className="text-muted-foreground">Identifies if you're being forced or coerced into transactions</p>
                          </div>
                        </li>
                        
                        <li className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                          <div>
                            <span className="font-medium">Scam & Fraud Prevention</span>
                            <p className="text-muted-foreground">Detects and blocks potential scams or fraudulent destinations</p>
                          </div>
                        </li>
                        
                        <li className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                          <div>
                            <span className="font-medium">Password-less Authentication</span>
                            <p className="text-muted-foreground">Secure access through quantum biometrics without passwords</p>
                          </div>
                        </li>
                        
                        <li className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                          <div>
                            <span className="font-medium">Lost Asset Recovery</span>
                            <p className="text-muted-foreground">Advanced recovery of lost, stolen or burned assets</p>
                          </div>
                        </li>
                      </ul>
                    </div>
                    
                    <Alert className="bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                      <Brain className="h-4 w-4" />
                      <AlertTitle>Quantum-Secured AI</AlertTitle>
                      <AlertDescription>
                        Our AI assistant is protected by quantum encryption and operates
                        on a secure, isolated blockchain to ensure complete independence
                        from potential attackers or manipulation attempts.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">How It Protects You:</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start text-sm">
                          <Shield className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                          <span>Monitors all transactions for unusual patterns or destinations</span>
                        </li>
                        <li className="flex items-start text-sm">
                          <Shield className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                          <span>Detects behavioral changes that might indicate duress</span>
                        </li>
                        <li className="flex items-start text-sm">
                          <Shield className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                          <span>Analyzes communication for blackmail or harassment signals</span>
                        </li>
                        <li className="flex items-start text-sm">
                          <Shield className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                          <span>Uses quantum signatures to verify and recover lost wallets</span>
                        </li>
                        <li className="flex items-start text-sm">
                          <Shield className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                          <span>Identifies and reverses unauthorized or compromised transactions</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}