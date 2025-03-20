import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { LedgerEntry, Asset } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, ChevronRight, Cpu, ExternalLink, KeySquare, Shield, Wallet, CheckCircle, LockKeyhole, Mail, CreditCard } from "lucide-react";
import { verifyBlockchainTransaction } from "@/lib/blockchain";
import { 
  WALLET_ADDRESS, 
  addTokensDirectBlockchain, 
  withdrawTokensDirectBlockchain,
  getEtherscanLink as getDirectEtherscanLink,
  isMetaMaskInstalled,
  getUserAddress,
  checkWalletETHBalance
} from "@/lib/blockchain-direct";
import { ethereumService } from "@/lib/ethereum";
import { transferTokensToFiat, checkFiatTransferStatus, cancelFiatTransfer } from "@/lib/fiat-transfer";

export default function BlockchainLedger() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<LedgerEntry | null>(null);
  const [transactionVerification, setTransactionVerification] = useState<{
    isVerifying: boolean;
    verificationDetails?: {
      isValid: boolean;
      integrity: {
        addressesMatch: boolean;
        validHash: boolean;
        validAction: boolean;
        securityScore: number;
        errors?: string[];
      };
    };
  }>({ isVerifying: false });
  const [walletBalance, setWalletBalance] = useState(4750); // Starting balance in tokens
  const [tokenAmount, setTokenAmount] = useState(""); 
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [ethTxHash, setEthTxHash] = useState<string | null>(null);
  const [metamaskStatus, setMetamaskStatus] = useState<'connected'|'not_connected'|'not_detected'>(
    typeof window !== 'undefined' && window.ethereum ? 'not_connected' : 'not_detected'
  );
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
  const [networkInfo, setNetworkInfo] = useState<{ id: string | null, name: string | null }>({ id: null, name: null });
  // State for Skrill fiat transfers
  const [isFiatTransferring, setIsFiatTransferring] = useState(false);
  const [fiatAmount, setFiatAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [fiatTransferId, setFiatTransferId] = useState<string | undefined>(undefined);
  const [fiatTransferStatus, setFiatTransferStatus] = useState<'idle'|'pending'|'success'|'error'>('idle');
  const [activeWithdrawalTab, setActiveWithdrawalTab] = useState("metamask");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkMetaMaskConnection = async () => {
      try {
        // Use the direct blockchain integration to check MetaMask status
        const isMMInstalled = isMetaMaskInstalled();
        
        if (!isMMInstalled) {
          setMetamaskStatus('not_detected');
          return;
        }
        
        // Try to get the current account to determine connection
        const address = await getUserAddress();
        
        if (address && address !== WALLET_ADDRESS) {
          setMetamaskStatus('connected');
          setConnectedAccount(address);
          
          // Initialize Ethereum service to get network information
          await ethereumService.initialize();
          
          // Get network info with safe fallbacks
          let networkName = "Ethereum Mainnet";
          let networkId = "1";
          
          try {
            if (typeof ethereumService.getNetworkName === 'function') {
              networkName = ethereumService.getNetworkName();
            }
            
            if (ethereumService.network && typeof ethereumService.network === 'object') {
              if ('chainId' in ethereumService.network) {
                networkId = String(ethereumService.network.chainId);
              }
            }
          } catch (err) {
            console.log("Using fallback network information", err);
          }
          
          setNetworkInfo({
            id: networkId,
            name: networkName
          });
        } else {
          setMetamaskStatus('not_connected');
          setConnectedAccount(null);
        }
      } catch (error) {
        console.error("Error checking MetaMask connection:", error);
        setMetamaskStatus('not_connected');
        setConnectedAccount(null);
      }
    };
    
    checkMetaMaskConnection();
    
    // Listen for account changes in MetaMask
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: any) => {
        const addressList = accounts as string[];
        if (addressList.length > 0) {
          setMetamaskStatus('connected');
          setConnectedAccount(addressList[0]);
          checkMetaMaskConnection(); // Re-check to get updated network info
        } else {
          setMetamaskStatus('not_connected');
          setConnectedAccount(null);
          setNetworkInfo({ id: null, name: null });
        }
      });
      
      // Listen for chain/network changes
      window.ethereum.on('chainChanged', () => {
        // When the network changes, refresh connection data
        checkMetaMaskConnection();
      });
    }
    
    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  // Handle MetaMask disconnection
  const disconnectMetaMask = async () => {
    try {
      // For security purposes, disconnecting from MetaMask requires the user to 
      // disconnect directly from the MetaMask UI since there's no direct API method
      
      // We can simulate a disconnect by forgetting the connection in our app
      setMetamaskStatus('not_connected');
      setConnectedAccount(null);
      setNetworkInfo({ id: null, name: null });
      
      toast({
        title: "MetaMask Disconnected",
        description: "Your MetaMask wallet has been disconnected from this application.",
      });
      
      // Note to the user about complete disconnection
      toast({
        title: "Manage Connections in MetaMask",
        description: "For complete security, also disconnect this site in your MetaMask wallet settings.",
        duration: 6000,
      });
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast({
        title: "Disconnection Error",
        description: "Could not disconnect MetaMask. Try again or disconnect manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Blockchain Wallet</h1>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsWalletDialogOpen(true)}
                className="relative"
              >
                {walletBalance > 0 && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full px-2 py-0.5">
                    {walletBalance}
                  </div>
                )}
                <Wallet className="w-4 h-4 mr-2" />
                My Wallet
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Wallet Dialog */}
      <Dialog 
        open={isWalletDialogOpen} 
        onOpenChange={setIsWalletDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Wallet</DialogTitle>
          </DialogHeader>
          
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium">Your Wallet</h3>
                  <p className="text-sm text-muted-foreground">Current Balance: {walletBalance} tokens</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center border rounded-lg p-3">
                <div className="mr-3">
                  <svg width="32" height="32" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.4999 32.0863C25.3366 32.0863 32.5 24.923 32.5 16.0863C32.5 7.24962 25.3366 0.0862732 16.4999 0.0862732C7.66323 0.0862732 0.499939 7.24962 0.499939 16.0863C0.499939 24.923 7.66323 32.0863 16.4999 32.0863Z" fill="#F3F3F4"/>
                    <path d="M9.44106 13.8313L7.58398 16.7609L14.4711 17.0764L14.2479 9.70557L9.44106 13.8313Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M23.5532 13.8313L18.6694 9.61323L18.6694 17.0764L25.5103 16.7609L23.5532 13.8313Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.81213 27.421L14.0632 25.4103L10.4278 22.4934L9.81213 27.421Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.9326 25.4103L23.1837 27.421L22.5679 22.4934L18.9326 25.4103Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium">MetaMask</h4>
                  <p className="text-xs text-muted-foreground">Connect your MetaMask wallet for withdrawals</p>
                </div>
              </div>
              <div>
                {metamaskStatus === 'connected' ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Connected
                  </Badge>
                ) : metamaskStatus === 'not_detected' ? (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Not Installed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Not Connected
                  </Badge>
                )}
              </div>
            </div>

            <div className="mt-4">
              {metamaskStatus === 'connected' && (
                <div className="bg-slate-50 p-4 rounded-md">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium">Connected Account</h4>
                      <p className="text-xs font-mono mt-1">{connectedAccount}</p>
                    </div>
                    {networkInfo.name && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                        {networkInfo.name}
                      </Badge>
                    )}
                  </div>
                  
                  {networkInfo.name === 'Ethereum Mainnet' && (
                    <div className="mt-2 text-xs text-amber-600 flex items-center">
                      <AlertTriangle className="h-3 w-3 inline mr-1 flex-shrink-0" />
                      <span>Warning: Using Ethereum Mainnet. This is a real network with real value.</span>
                    </div>
                  )}
                  
                  <div className="pt-2 mt-2 border-t border-slate-200">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={disconnectMetaMask}
                    >
                      Disconnect MetaMask
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {metamaskStatus === 'not_detected' && (
              <div className="bg-slate-50 p-4 rounded-md">
                <p className="text-sm mb-3">MetaMask extension is not detected in your browser.</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  onClick={() => window.open('https://metamask.io/download/', '_blank')}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  Install MetaMask
                </Button>
              </div>
            )}
            
            {metamaskStatus === 'not_connected' && window.ethereum && (
              <div className="bg-slate-50 p-4 rounded-md">
                <p className="text-sm mb-3">Connect to MetaMask to access blockchain features.</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    try {
                      // Check if MetaMask is available
                      if (!window.ethereum) {
                        toast({
                          title: "MetaMask Not Available",
                          description: "Please install MetaMask extension and reload the page.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      // Request account access
                      await window.ethereum.request({ method: 'eth_requestAccounts' });
                      
                      // Initialize our Ethereum service
                      await ethereumService.initialize();
                      
                      // Get connected account
                      const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
                      if (accounts && accounts.length > 0) {
                        setConnectedAccount(accounts[0]);
                        setMetamaskStatus('connected');
                        
                        // Get network information
                        const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
                        const networkName = ethereumService.getNetworkName();
                        
                        setNetworkInfo({
                          id: chainId,
                          name: networkName
                        });
                        
                        toast({
                          title: "MetaMask Connected",
                          description: "Your MetaMask wallet is now connected to the application.",
                        });
                      }
                    } catch (error: any) {
                      console.error("MetaMask connection error:", error);
                      toast({
                        title: "Connection Error",
                        description: error.message || "Could not connect to MetaMask.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Connect MetaMask
                </Button>
              </div>
            )}

            <div className="mt-4 border-t border-border">
              <h4 className="text-sm font-medium mb-3 mt-4">Withdraw Tokens</h4>
              
              <Tabs value={activeWithdrawalTab} onValueChange={setActiveWithdrawalTab}>
                <TabsList className="grid grid-cols-2 w-full mb-4">
                  <TabsTrigger value="metamask" className="flex items-center justify-center">
                    <Wallet className="w-4 h-4 mr-2" />
                    MetaMask
                  </TabsTrigger>
                  <TabsTrigger value="skrill" className="flex items-center justify-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Transfer
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="metamask">
                  {metamaskStatus !== 'connected' ? (
                    <div className="bg-muted p-3 rounded text-sm text-muted-foreground">
                      Connect MetaMask first to withdraw your tokens.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1.5">Amount to withdraw:</p>
                        <Input 
                          type="number"
                          placeholder="Enter token amount" 
                          value={tokenAmount}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!value || Number(value) > 0) {
                              if (!value || Number(value) <= walletBalance) {
                                setTokenAmount(value);
                              } else {
                                toast({
                                  title: "Invalid Amount",
                                  description: "Amount cannot exceed your current balance.",
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                        />
                      </div>

                      <Button 
                        className="w-full"
                        disabled={isWithdrawing}
                        onClick={async () => {
                          // Validate amount
                          const amount = Number(tokenAmount);
                          if (!amount || isNaN(amount) || amount <= 0) {
                            toast({
                              title: "Invalid Amount",
                              description: "Please enter a valid amount greater than zero.",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          if (amount > walletBalance) {
                            toast({
                              title: "Insufficient Balance",
                              description: "You don't have enough tokens for this withdrawal.",
                              variant: "destructive",
                            });
                            return;
                          }

                          try {
                            setIsWithdrawing(true);
                            
                            // Check if user has enough ETH for gas fees before proceeding
                            const ethBalanceCheck = await checkWalletETHBalance(0.002); // Estimate 0.002 ETH for gas
                            
                            if (!ethBalanceCheck.hasEnoughETH && ethBalanceCheck.isMetaMaskConnected) {
                              toast({
                                title: "Insufficient ETH for Gas",
                                description: `You need at least ${ethBalanceCheck.requiredGas} ETH for transaction fees. Current balance: ${ethBalanceCheck.balance} ETH. Please add ${ethBalanceCheck.shortageAmount} ETH to your wallet.`,
                                variant: "destructive",
                              });
                              setIsWithdrawing(false);
                              return;
                            }

                            // Get user's MetaMask wallet address
                            const walletAddress = await getUserAddress();
                            
                            if (!walletAddress) {
                              toast({
                                title: "MetaMask Not Connected",
                                description: "Could not get your MetaMask address. Please connect MetaMask and try again.",
                                variant: "destructive",
                              });
                              setIsWithdrawing(false);
                              return;
                            }

                            // Execute withdrawal transaction
                            const result = await withdrawTokensDirectBlockchain(
                              amount, 
                              walletAddress !== WALLET_ADDRESS ? walletAddress : undefined
                            );
                            
                            if (!result.success) {
                              throw new Error(result.error || "Transaction failed on the blockchain");
                            }
                            
                            // Update UI
                            setEthTxHash(result.txHash);
                            setWalletBalance(prev => prev - amount);
                            setTokenAmount("");
                            
                            // Show success message
                            toast({
                              title: "Withdrawal Successful",
                              description: `${amount} tokens have been converted and withdrawn to your MetaMask wallet.`,
                            });

                            // Refresh ledger data
                            queryClient.invalidateQueries({ queryKey: ['/api/ledger'] });
                          } catch (error: any) {
                            console.error("Withdrawal failed:", error);
                            toast({
                              title: "Withdrawal Failed",
                              description: error.message || "Failed to process withdrawal.",
                              variant: "destructive",
                            });
                          } finally {
                            setIsWithdrawing(false);
                          }
                        }}
                      >
                        {isWithdrawing ? (
                          <>
                            <span className="animate-spin mr-2">⚡</span>
                            Processing...
                          </>
                        ) : (
                          "Withdraw to MetaMask"
                        )}
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="skrill">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1.5">Amount to transfer:</p>
                      <Input 
                        type="number"
                        placeholder="Enter token amount" 
                        value={fiatAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value || Number(value) > 0) {
                            if (!value || Number(value) <= walletBalance) {
                              setFiatAmount(value);
                            } else {
                              toast({
                                title: "Invalid Amount",
                                description: "Amount cannot exceed your current balance.",
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                      />
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1.5">Recipient Name:</p>
                      <Input 
                        placeholder="Full name of recipient"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                      />
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1.5">Recipient Email:</p>
                      <Input 
                        type="email"
                        placeholder="Email address for transfer"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                      />
                    </div>

                    <Button
                      className="w-full"
                      onClick={async () => {
                        const amount = Number(fiatAmount);
                        if (!amount || isNaN(amount) || amount <= 0) {
                          toast({
                            title: "Invalid Amount",
                            description: "Please enter a valid amount greater than zero.",
                            variant: "destructive",
                          });
                          return;
                        }

                        if (amount > walletBalance) {
                          toast({
                            title: "Insufficient Balance",
                            description: "You don't have enough tokens for this transfer.",
                            variant: "destructive",
                          });
                          return;
                        }

                        if (!recipientEmail || !recipientName) {
                          toast({
                            title: "Missing Information",
                            description: "Please provide both recipient name and email.",
                            variant: "destructive",
                          });
                          return;
                        }

                        try {
                          setIsFiatTransferring(true);
                          setFiatTransferStatus('pending');

                          // Process the fiat transfer
                          const result = await transferTokensToFiat(
                            amount,
                            recipientEmail,
                            recipientName,
                            'USD'
                          );

                          if (result.success) {
                            setFiatTransferId(result.transferId);
                            setFiatTransferStatus('success');
                            setWalletBalance(prev => prev - amount);
                            setFiatAmount("");
                            setRecipientEmail("");
                            setRecipientName("");

                            toast({
                              title: "Transfer Initiated",
                              description: `${amount} tokens are being converted and transferred to ${recipientEmail}. They should receive the funds within 1-2 business days.`,
                            });

                            // Refresh the ledger data
                            queryClient.invalidateQueries({ queryKey: ['/api/ledger'] });
                          } else {
                            throw new Error(result.error || "Transfer failed");
                          }
                        } catch (error: any) {
                          setFiatTransferStatus('error');
                          toast({
                            title: "Transfer Failed",
                            description: error.message || "An error occurred during the transfer.",
                            variant: "destructive",
                          });
                        } finally {
                          setIsFiatTransferring(false);
                        }
                      }}
                      disabled={isFiatTransferring}
                    >
                      {isFiatTransferring ? (
                        <>
                          <span className="animate-spin mr-2">⚡</span>
                          Processing...
                        </>
                      ) : (
                        "Send Email Transfer"
                      )}
                    </Button>

                    {fiatTransferId && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-800">Transfer Details</h3>
                        <p className="text-xs mt-1 text-blue-600">Transfer ID: {fiatTransferId}</p>
                        <p className="text-xs mt-1 text-blue-600">Status: Processing</p>
                        <p className="text-xs mt-1 text-blue-600">
                          We'll notify you when the transfer is complete.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {ethTxHash && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800">Latest Blockchain Transaction</h3>
                <p className="text-xs font-mono mt-1 break-all text-blue-600">{ethTxHash}</p>
                <div className="mt-2">
                  <a 
                    href={getDirectEtherscanLink(ethTxHash)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-800 flex items-center hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View on Etherscan
                  </a>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Recent Transactions</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">License Sale</p>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                  <span className="text-green-600 font-medium">+250 tokens</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">Token Withdrawal</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                  <span className="text-red-600 font-medium">-1000 tokens</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">License Sale</p>
                    <p className="text-xs text-muted-foreground">1 week ago</p>
                  </div>
                  <span className="text-green-600 font-medium">+500 tokens</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}