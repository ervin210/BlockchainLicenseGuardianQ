import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Flame,
  Key,
  Lock,
  RefreshCw,
  Shield,
  ShieldAlert,
  User,
  UserCheck,
  Video,
  File
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

import { BurnTransaction, performBurnTransaction, startBurnTransactionRecovery, completeFaceLiveVerification, getBurnedTransactions } from '../lib/burn-recovery';
import { initializeQuantumAgiSecurity, analyzeDeviceWithAgi, SecurityMode } from '../lib/quantum-agi-security';
import { verifyBlockchainTransaction } from '../lib/blockchain';

export default function BurnTransactionPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("burn");
  const [burnedTransactions, setBurnedTransactions] = useState<BurnTransaction[]>([]);
  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<BurnTransaction | null>(null);
  const [recoveryKey, setRecoveryKey] = useState<string>("");
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [recoverySessionId, setRecoverySessionId] = useState<string | null>(null);
  const [isFaceScanActive, setIsFaceScanActive] = useState<boolean>(false);
  const [verificationProgress, setVerificationProgress] = useState<number>(0);
  const [securityMode, setSecurityMode] = useState<SecurityMode>(SecurityMode.STANDARD);
  
  // Burn transaction form states
  const [burnAmount, setBurnAmount] = useState<number>(1000);
  const [burnReason, setBurnReason] = useState<string>("");
  const [burnAssetId, setBurnAssetId] = useState<string>("");
  
  // Recovery form states
  const [recoveryTransactionId, setRecoveryTransactionId] = useState<string>("");
  const [inputRecoveryKey, setInputRecoveryKey] = useState<string>("");
  
  // FaceLive verification dialog states
  const [isFaceLiveDialogOpen, setIsFaceLiveDialogOpen] = useState<boolean>(false);
  const [faceScanStage, setFaceScanStage] = useState<number>(0);
  
  // Initialize quantum AGI security and load burned transactions
  useEffect(() => {
    const initializeSecurity = async () => {
      try {
        setIsLoading(true);
        // Initialize quantum AGI security
        const securityInit = await initializeQuantumAgiSecurity();
        if (securityInit.success) {
          setSecurityMode(securityInit.mode);
          console.log("Quantum AGI Security initialized:", securityInit.mode);
          
          toast({
            title: "Quantum AGI Security Active",
            description: `Security initialized in ${securityInit.mode} mode`,
          });
        }
        
        // Load burned transactions
        const transactions = await getBurnedTransactions();
        if (transactions.success) {
          setBurnedTransactions(transactions.transactions);
        }
      } catch (error) {
        console.error("Error initializing burn transaction page:", error);
        toast({
          title: "Initialization Error",
          description: "There was an error loading the security module",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeSecurity();
  }, [toast]);
  
  // Handle burning a transaction
  const handleBurnTransaction = async () => {
    if (!burnReason) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for burning this transaction",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsBurning(true);
      
      // Convert asset ID to number if provided
      const assetId = burnAssetId ? parseInt(burnAssetId, 10) : undefined;
      
      // Perform the burn transaction
      const result = await performBurnTransaction(
        burnAmount,
        assetId,
        undefined, // No license ID for this example
        burnReason
      );
      
      if (result.success) {
        toast({
          title: "Transaction Burned Successfully",
          description: "The transaction has been secured on the blockchain. Keep your recovery key safe.",
        });
        
        // Show recovery key in a more secure/prominent way
        toast({
          title: "IMPORTANT: Save Your Recovery Key",
          description: result.recoveryKey,
          variant: "default",
          duration: 10000, // Show for longer
        });
        
        // Reset form
        setBurnAmount(1000);
        setBurnReason("");
        setBurnAssetId("");
        
        // Refresh burned transactions list
        const transactions = await getBurnedTransactions();
        if (transactions.success) {
          setBurnedTransactions(transactions.transactions);
        }
        
        // Switch to recovery tab
        setActiveTab("recovery");
      } else {
        toast({
          title: "Burn Transaction Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error burning transaction:", error);
      toast({
        title: "Transaction Error",
        description: "An error occurred while processing your request",
        variant: "destructive",
      });
    } finally {
      setIsBurning(false);
    }
  };
  
  // Start the recovery process
  const handleStartRecovery = async () => {
    if (!recoveryTransactionId || !inputRecoveryKey) {
      toast({
        title: "Missing Information",
        description: "Please provide both transaction ID and recovery key",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsRecovering(true);
      
      // Start the recovery process
      const result = await startBurnTransactionRecovery(
        recoveryTransactionId,
        inputRecoveryKey
      );
      
      if (result.success) {
        setRecoverySessionId(result.verificationSessionId || null);
        setVerificationStatus("pending");
        
        toast({
          title: "Recovery Process Initiated",
          description: "Please complete the FaceLive ID verification process",
        });
        
        // Open FaceLive verification dialog
        setIsFaceLiveDialogOpen(true);
        
        // Record the recovery attempt on blockchain
        const txId = await verifyBlockchainTransaction();
        console.log("Recovery attempt recorded on blockchain:", txId);
      } else {
        toast({
          title: "Recovery Failed",
          description: result.message,
          variant: "destructive",
        });
        setVerificationStatus("failed");
      }
    } catch (error) {
      console.error("Error starting recovery:", error);
      toast({
        title: "Recovery Error",
        description: "An error occurred while processing your request",
        variant: "destructive",
      });
      setVerificationStatus("error");
    } finally {
      setIsRecovering(false);
    }
  };
  
  // Simulate FaceLive verification process
  const simulateFaceLiveVerification = async () => {
    if (!recoverySessionId) return;
    
    setIsFaceScanActive(true);
    setFaceScanStage(1);
    
    // Simulated face scanning process
    for (let i = 0; i < 100; i += 5) {
      setVerificationProgress(i);
      
      // Update scan stage at certain points
      if (i === 25) setFaceScanStage(2);
      if (i === 50) setFaceScanStage(3);
      if (i === 75) setFaceScanStage(4);
      
      // Artificial delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    setVerificationProgress(100);
    setFaceScanStage(5);
    
    // Final verification with blockchain
    try {
      const verificationResult = await completeFaceLiveVerification(
        recoverySessionId,
        recoveryTransactionId,
        { /* simulated biometric data */ }
      );
      
      if (verificationResult.success) {
        toast({
          title: "Verification Successful",
          description: `Identity verified with score: ${verificationResult.verificationScore}/100`,
        });
        
        // Blockchain notification
        toast({
          title: "Blockchain Recovery Confirmed",
          description: `Recovery transaction has been recorded on the blockchain: ${verificationResult.recoveryTransactionId?.substring(0, 10)}...`,
        });
        
        setVerificationStatus("success");
        
        // Allow some time to see the success state before closing
        setTimeout(() => {
          setIsFaceLiveDialogOpen(false);
          
          // Refresh burned transactions
          getBurnedTransactions().then(result => {
            if (result.success) {
              setBurnedTransactions(result.transactions);
            }
          });
          
          // Reset form
          setRecoveryTransactionId("");
          setInputRecoveryKey("");
          setRecoverySessionId(null);
        }, 3000);
      } else {
        toast({
          title: "Verification Failed",
          description: verificationResult.message,
          variant: "destructive",
        });
        setVerificationStatus("failed");
      }
    } catch (error) {
      console.error("Error completing verification:", error);
      toast({
        title: "Verification Error",
        description: "An error occurred during identity verification",
        variant: "destructive",
      });
      setVerificationStatus("error");
    } finally {
      setIsFaceScanActive(false);
    }
  };
  
  // Load burned transaction details
  const handleSelectTransaction = (transaction: BurnTransaction) => {
    setSelectedTransaction(transaction);
    setRecoveryTransactionId(transaction.id);
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };
  
  // Get status badge for a transaction
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'burned':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <Flame className="h-3 w-3 mr-1" />
            Burned
          </Badge>
        );
      case 'recovery_pending':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Recovery Pending
          </Badge>
        );
      case 'recovered':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Recovered
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };
  
  return (
    <>
      <header className="bg-white shadow">
        <div className="flex justify-between items-center px-6 py-4">
          <h2 className="text-xl font-semibold text-neutral-dark">Burn Transaction Recovery</h2>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
              <Shield className="h-3 w-3 mr-1" />
              Quantum Protected
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
              <Database className="h-3 w-3 mr-1" />
              Blockchain Secured
            </Badge>
          </div>
        </div>
      </header>
      
      <div className="p-6">
        <Tabs defaultValue="burn" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="burn" disabled={isBurning || isRecovering}>
              <Flame className="h-4 w-4 mr-2" />
              Burn Transaction
            </TabsTrigger>
            <TabsTrigger value="recovery" disabled={isBurning || isRecovering}>
              <Key className="h-4 w-4 mr-2" />
              Recovery
            </TabsTrigger>
          </TabsList>
          
          {/* Burn Transaction Tab */}
          <TabsContent value="burn" className="space-y-4 mt-4">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <AlertTitle className="text-amber-800">Important Security Notice</AlertTitle>
              <AlertDescription className="text-amber-700">
                <p>Burning a transaction makes it inaccessible until recovered with FaceLive ID verification. This is a security measure to prevent unauthorized access.</p>
                <p className="mt-2 font-medium">Make sure to save your recovery key in a secure location!</p>
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardHeader>
                <CardTitle>Burn Transaction</CardTitle>
                <CardDescription>
                  Permanently secure your tokens or assets with quantum-resistant encryption
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount to Burn</Label>
                  <Input
                    id="amount"
                    placeholder="Amount"
                    type="number"
                    value={burnAmount}
                    onChange={(e) => setBurnAmount(parseInt(e.target.value))}
                    min={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    This amount will be secured until recovery verification is complete
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="assetId">Asset ID (Optional)</Label>
                  <Input
                    id="assetId"
                    placeholder="Asset ID"
                    value={burnAssetId}
                    onChange={(e) => setBurnAssetId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    If you want to burn access to a specific asset, enter its ID
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Burning</Label>
                  <Input
                    id="reason"
                    placeholder="Security reason for burning this transaction"
                    value={burnReason}
                    onChange={(e) => setBurnReason(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide a reason to help identify this transaction during recovery
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleBurnTransaction} 
                  disabled={isBurning || !burnReason}
                  className="w-full"
                >
                  {isBurning ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Flame className="h-4 w-4 mr-2" />
                      Burn Transaction
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Recovery Tab */}
          <TabsContent value="recovery" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Burned Transactions List */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Burned Transactions</CardTitle>
                  <CardDescription>
                    Select a transaction to recover
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : burnedTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No burned transactions found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {burnedTransactions.map((transaction) => (
                        <div 
                          key={transaction.id}
                          className={`p-3 border rounded-md cursor-pointer hover:bg-slate-50 transition-colors ${selectedTransaction?.id === transaction.id ? 'border-blue-500 bg-blue-50' : ''}`}
                          onClick={() => handleSelectTransaction(transaction)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium">
                                {transaction.burnedAmount.toLocaleString()} Tokens
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(transaction.timestamp)}
                              </p>
                            </div>
                            <div>
                              {getStatusBadge(transaction.recoveryStatus)}
                            </div>
                          </div>
                          <p className="text-xs mt-2 text-muted-foreground truncate">
                            Reason: {transaction.metadata.reason || "Not specified"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Recovery Form */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Transaction Recovery</CardTitle>
                  <CardDescription>
                    Restore access with FaceLive ID verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="transactionId">Transaction ID</Label>
                    <Input
                      id="transactionId"
                      placeholder="Enter transaction ID"
                      value={recoveryTransactionId}
                      onChange={(e) => setRecoveryTransactionId(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recoveryKey">Recovery Key</Label>
                    <Input
                      id="recoveryKey"
                      placeholder="Enter your recovery key"
                      value={inputRecoveryKey}
                      onChange={(e) => setInputRecoveryKey(e.target.value)}
                      type="password"
                    />
                    <p className="text-xs text-muted-foreground">
                      This is the key you received when burning the transaction
                    </p>
                  </div>
                  
                  <Alert className="mt-4 bg-blue-50 border-blue-200">
                    <User className="h-5 w-5 text-blue-600" />
                    <AlertTitle className="text-blue-800">FaceLive ID Verification Required</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      To recover this transaction, you'll need to complete identity verification 
                      to confirm you're the original owner.
                    </AlertDescription>
                  </Alert>
                  
                  {/* Transaction Details */}
                  {selectedTransaction && (
                    <div className="mt-4 p-4 border rounded-md bg-slate-50">
                      <h4 className="text-sm font-medium mb-2">Selected Transaction Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transaction ID:</span>
                          <span className="font-mono text-xs">{selectedTransaction.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Burned Amount:</span>
                          <span>{selectedTransaction.burnedAmount.toLocaleString()} Tokens</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span>{formatDate(selectedTransaction.timestamp)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span>{getStatusBadge(selectedTransaction.recoveryStatus)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleStartRecovery} 
                    disabled={isRecovering || !recoveryTransactionId || !inputRecoveryKey}
                    className="w-full"
                  >
                    {isRecovering ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Begin Recovery & Verification
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* FaceLive Verification Dialog */}
      <Dialog open={isFaceLiveDialogOpen} onOpenChange={setIsFaceLiveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Video className="h-5 w-5 mr-2 text-blue-600" />
              FaceLive ID Verification
            </DialogTitle>
            <DialogDescription>
              Please complete the identity verification process to recover your transaction.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            {/* Verification screen */}
            <div className="relative h-64 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 mb-4">
              {/* Face scan visualization */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                {verificationStatus === "success" ? (
                  <div className="text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-2" />
                    <p className="text-green-700 font-medium">Verification Successful</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Your identity has been confirmed and transaction recovered
                    </p>
                  </div>
                ) : verificationStatus === "failed" || verificationStatus === "error" ? (
                  <div className="text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-2" />
                    <p className="text-red-700 font-medium">Verification Failed</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {verificationStatus === "error" 
                        ? "An error occurred during verification" 
                        : "Your identity could not be verified"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    {isFaceScanActive ? (
                      <>
                        <div className="relative w-32 h-32 mx-auto mb-3 bg-blue-50 rounded-full overflow-hidden border-2 border-blue-200">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <User className="h-16 w-16 text-blue-300" />
                          </div>
                          
                          {/* Scanning animation */}
                          <div 
                            className="absolute top-0 h-1 bg-blue-500 transition-all duration-500"
                            style={{ 
                              width: '100%', 
                              transform: `translateY(${Math.min(32 * (verificationProgress / 100), 32)}px)`,
                              opacity: 0.7 
                            }}
                          />
                        </div>
                        <p className="text-blue-700 font-medium">
                          {faceScanStage === 1 && "Initializing scan..."}
                          {faceScanStage === 2 && "Capturing facial features..."}
                          {faceScanStage === 3 && "Analyzing biometric data..."}
                          {faceScanStage === 4 && "Verifying identity..."}
                          {faceScanStage === 5 && "Completing verification..."}
                        </p>
                        <Progress 
                          value={verificationProgress} 
                          className="mt-3 h-2"
                        />
                      </>
                    ) : (
                      <>
                        <User className="h-16 w-16 text-blue-300 mx-auto mb-2" />
                        <p className="text-blue-700 font-medium">Ready for Verification</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Please ensure your face is clearly visible and click Start
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start">
                <div className="mr-2">
                  <File className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Your biometric data is secured with quantum-resistant encryption and will not be stored longer than necessary for verification.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-2">
                  <Lock className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Verification is secured by blockchain technology for additional security and auditability.</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant={isFaceScanActive ? "secondary" : "default"}
              onClick={simulateFaceLiveVerification}
              disabled={
                isFaceScanActive || 
                verificationStatus === "success" ||
                !recoverySessionId
              }
            >
              {isFaceScanActive ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : verificationStatus === "success" ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completed
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  Start Face Verification
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsFaceLiveDialogOpen(false);
                setVerificationStatus(null);
                setVerificationProgress(0);
                setFaceScanStage(0);
              }}
              disabled={isFaceScanActive && verificationStatus !== "success"}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}