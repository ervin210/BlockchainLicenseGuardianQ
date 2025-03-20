/**
 * Ethereum Integration for DRM Platform
 * This module provides integration with Ethereum blockchain using ethers.js
 * Browser-compatible implementation that avoids Node.js buffer usage
 * 
 * SECURITY NOTICE:
 * This module has been updated to enable REAL blockchain connections
 * All blockchain functionality is now active
 */

// Import ethers browser version explicitly to avoid Buffer usage
import { ethers } from 'ethers/dist/ethers.esm.min.js';
import type { MetaMaskInpageProvider } from '@metamask/providers';
import { apiRequest } from './queryClient';
import { MAX_AVAILABLE_TOKENS } from './blockchain-direct';

// Static wallet addresses to use when blockchain connections are prevented
export const SENDER_WALLET_ADDRESS = "0x3C143E98bE8986eDe8FAc9F674103c933B68B9BA";
export const RECEIVER_WALLET_ADDRESS = "0x7A912D9B19e74aA34F56A4df9C3AA5F4aa785d0F";

// Declare global ethereum provider for TypeScript
declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider;
  }
}

/**
 * Ethereum service for interacting with the blockchain
 */
// Custom network type with properties we need
interface ExtendedNetwork {
  chainId: number;
  name: string;
  isTestnet?: boolean;
  ensAddress?: string;
  _defaultProvider?: any;
}

export class EthereumService {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  public isInitialized = false; // Changed to public to allow access in processRealTokenWithdrawalTransaction
  public network: ExtendedNetwork | null = null;

  /**
   * Initialize the Ethereum service by connecting to provider
   * This method now enables REAL blockchain connections
   */
  public async initialize(): Promise<boolean> {
    console.log("SECURITY NOTICE: External blockchain connections have been enabled");
    
    try {
      // Check if MetaMask is available
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }
      
      // Create a Web3 provider from the Ethereum object
      this.provider = new ethers.providers.Web3Provider(window.ethereum as any);
      
      // Request access to the user's accounts
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Get a signer for transactions
      this.signer = this.provider.getSigner();
      
      // Get the network information
      const network = await this.provider.getNetwork();
      
      // Determine network name
      let networkName: string;
      let isTestnet: boolean = false;
      
      switch (network.chainId) {
        case 1:
          networkName = 'mainnet';
          break;
        case 5:
          networkName = 'goerli';
          isTestnet = true;
          break;
        case 11155111:
          networkName = 'sepolia';
          isTestnet = true;
          break;
        default:
          networkName = 'unknown';
          isTestnet = network.chainId !== 1;
      }
      
      // Store network information
      this.network = { 
        chainId: network.chainId, 
        name: networkName,
        isTestnet,
        ensAddress: network.ensAddress,
        _defaultProvider: undefined
      };
      
      // Mark as initialized and ready for blockchain transactions
      this.isInitialized = true;
      console.log(`Ethereum service enabled - connected to ${networkName} (Chain ID: ${network.chainId})`);
      
      return true;
    } catch (error) {
      console.error("Error initializing Ethereum service:", error);
      this.provider = null;
      this.signer = null;
      this.isInitialized = false;
      
      // Default to mainnet for fallback
      this.network = { 
        chainId: 1, 
        name: 'mainnet',
        isTestnet: false
      };
      
      return false;
    }
  }

  /**
   * Check if MetaMask is installed and accessible
   * This method now actually checks for MetaMask availability
   */
  public isMetaMaskInstalled(): boolean {
    console.log("Checking for MetaMask availability");
    // Check if ethereum object exists in window
    return !!window.ethereum;
  }

  /**
   * Get the current account address
   * This method now connects to the blockchain to get the real account
   */
  public async getAccount(): Promise<string | null> {
    if (!this.isInitialized || !this.provider || !this.signer) {
      // Try to initialize if not already done
      const success = await this.initialize();
      if (!success) {
        console.warn("Ethereum service not initialized, using default address");
        return SENDER_WALLET_ADDRESS;
      }
    }
    
    try {
      // Get the actual account address from the signer
      const address = await this.signer!.getAddress();
      console.log(`Using wallet address: ${address}`);
      return address;
    } catch (error) {
      console.error("Error getting account address:", error);
      return null;
    }
  }

  /**
   * Get the network name (mainnet, rinkeby, etc.)
   */
  public getNetworkName(): string {
    return this.network?.name || 'unknown';
  }

  /**
   * Get balance of the current account
   * This method now connects to the blockchain to get the actual balance
   * 
   * @returns The actual account balance in ETH
   */
  public async getBalance(): Promise<string | null> {
    if (!this.isInitialized || !this.provider) {
      // Try to initialize if not already done
      const success = await this.initialize();
      if (!success) {
        console.warn("Ethereum service not initialized, returning default balance");
        return "0.000000";
      }
    }
    
    try {
      // Get the account address
      const address = await this.getAccount();
      if (!address) {
        throw new Error("No account address available");
      }
      
      // Get the balance from the provider
      const balance = await this.provider!.getBalance(address);
      
      // Convert balance from wei to ETH (1 ETH = 10^18 wei)
      const balanceInEth = ethers.utils.formatEther(balance);
      console.log(`Account balance: ${balanceInEth} ETH`);
      
      return balanceInEth;
    } catch (error) {
      console.error("Error getting account balance:", error);
      return null;
    }
  }
  
  /**
   * Check if the account has sufficient ETH for gas fees
   * 
   * @param estimatedGasInETH Estimated gas needed for transaction in ETH
   * @returns Object containing check result and details
   */
  public async hasEnoughETHForGas(estimatedGasInETH: number = 0.001): Promise<{
    hasEnough: boolean;
    currentBalance: string;
    requiredAmount: string;
    shortageAmount: string;
  }> {
    try {
      const balance = await this.getBalance();
      if (!balance) {
        throw new Error("Couldn't get balance");
      }
      
      const balanceNum = parseFloat(balance);
      const hasEnough = balanceNum >= estimatedGasInETH;
      const shortageAmount = hasEnough ? "0" : (estimatedGasInETH - balanceNum).toFixed(6);
      
      return {
        hasEnough,
        currentBalance: balanceNum.toFixed(6),
        requiredAmount: estimatedGasInETH.toFixed(6),
        shortageAmount
      };
    } catch (error) {
      console.error("Error checking ETH balance for gas:", error);
      return {
        hasEnough: false,
        currentBalance: "0",
        requiredAmount: estimatedGasInETH.toFixed(6),
        shortageAmount: estimatedGasInETH.toFixed(6)
      };
    }
  }

  /**
   * Transfer ETH to the specified address
   * This method now performs a real blockchain transaction
   * 
   * @param to Recipient address
   * @param amount Amount in ETH
   * @returns Transaction hash
   */
  public async transferETH(to: string, amount: string): Promise<string> {
    if (!this.isInitialized || !this.signer) {
      // Try to initialize if not already done
      const success = await this.initialize();
      if (!success) {
        throw new Error("Ethereum service not initialized");
      }
    }
    
    try {
      // Validate the recipient address
      if (!ethers.utils.isAddress(to)) {
        throw new Error(`Invalid Ethereum address: ${to}`);
      }
      
      // Convert ETH amount to wei
      const valueInWei = ethers.utils.parseEther(amount);
      
      // Check if we have enough balance
      const balance = await this.getBalance();
      if (!balance) {
        throw new Error("Couldn't get balance");
      }
      
      const balanceInWei = ethers.utils.parseEther(balance);
      if (balanceInWei.lt(valueInWei)) {
        throw new Error(`Insufficient balance. Have ${balance} ETH, need ${amount} ETH`);
      }
      
      // Create transaction
      const tx = await this.signer!.sendTransaction({
        to,
        value: valueInWei
      });
      
      console.log(`Transaction sent: ${tx.hash}`);
      console.log(`Sending ${amount} ETH to ${to}`);
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      
      return tx.hash;
    } catch (error: any) {
      console.error("Error sending transaction:", error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Get a link to the transaction on Etherscan
   * @param txHash Transaction hash
   * @returns Etherscan URL
   */
  public getEtherscanLink(txHash: string): string {
    const baseUrl = this.network?.name === 'mainnet' 
      ? 'https://etherscan.io' 
      : `https://${this.network?.name}.etherscan.io`;
    
    return `${baseUrl}/tx/${txHash}`;
  }
}

// Export a singleton instance
export const ethereumService = new EthereumService();

/**
 * Convert DRM tokens to ETH for token withdrawal with detailed information
 * 
 * Uses the fixed conversion rate of 10 DRM tokens = 1 ETH (0.1 ETH per token)
 * as specified in the business requirements
 * 
 * @param tokens Number of DRM tokens
 * @returns Object containing the ETH amount and USD value with formatted strings
 */
export function convertTokensToETH(tokens: number): { 
  ethAmount: string; 
  usdValue: string;
  ethFormatted: string;
  usdFormatted: string;
  conversionRate: string;
  tokenValue: number;
  ethValue: number;
  equivalentETH: string;
} {
  // Using our fixed conversion rate of 10 tokens = 1 ETH
  const TOKEN_TO_ETH_RATE = 0.1; // 10 DRM tokens = 1 ETH (0.1 ETH per token)
  const ethAmount = tokens * TOKEN_TO_ETH_RATE;
  
  // Current ETH to USD rate (would be fetched from an API in production)
  const ETH_TO_USD_RATE = 3500; // Example rate, would be updated dynamically
  const usdValue = ethAmount * ETH_TO_USD_RATE;
  
  // Calculate how many ETH the user will receive
  const equivalentETH = (tokens / 10).toFixed(2);
  
  // Calculate the token value in USD
  const tokenValue = TOKEN_TO_ETH_RATE * ETH_TO_USD_RATE;
  
  return {
    ethAmount: ethAmount.toFixed(6),
    usdValue: usdValue.toFixed(2),
    ethFormatted: `${ethAmount.toFixed(6)} ETH`,
    usdFormatted: `$${usdValue.toFixed(2)} USD`,
    conversionRate: `10 Tokens = 1 ETH (${TOKEN_TO_ETH_RATE} ETH per token) = $${tokenValue.toFixed(2)} per token`,
    tokenValue: tokenValue,
    ethValue: ETH_TO_USD_RATE,
    equivalentETH: equivalentETH
  };
}

/**
 * Process a token withdrawal to a real Ethereum wallet with automatic token conversion
 * This function now performs actual blockchain transactions
 * 
 * @param walletAddress The Ethereum wallet address
 * @param tokenAmount The amount of tokens to withdraw (max 110)
 * @returns Transaction details including hash and conversion information
 */
export async function processRealTokenWithdrawalTransaction(
  walletAddress: string = RECEIVER_WALLET_ADDRESS, 
  tokenAmount: number
): Promise<{ 
  txHash: string; 
  etherscanLink: string; 
  conversionDetails: {
    tokenAmount: number;
    ethAmount: string;
    usdValue: string;
    conversionRate: string;
    equivalentETH?: string;
    networkName?: string;
  }
}> {
  console.log("BLOCKCHAIN NOTICE: Preparing real blockchain transaction");
  
  try {
    // Enforce the 110 token limit
    if (tokenAmount > MAX_AVAILABLE_TOKENS) {
      throw new Error(`Token amount exceeds the maximum allowed (${MAX_AVAILABLE_TOKENS})`);
    }
    
    // Validate the recipient address
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new Error(`Invalid Ethereum address: ${walletAddress}`);
    }
    
    // Convert tokens to ETH
    const conversion = convertTokensToETH(tokenAmount);
    console.log(`Converting ${tokenAmount} tokens to ${conversion.ethFormatted}`);
    
    // Initialize Ethereum service if needed
    // Since isInitialized is now public, we can access it directly
    if (!ethereumService.isInitialized) {
      const initialized = await ethereumService.initialize();
      if (!initialized) {
        throw new Error("Failed to initialize Ethereum service");
      }
    }
    
    // Get the network name
    const networkName = ethereumService.getNetworkName();
    
    // Record the transaction in the ledger before sending
    const pendingLedgerEntry = {
      transactionId: "tx_pending_" + Date.now(),
      action: "token_withdrawal_pending",
      assetId: 0,
      licenseId: null,
      status: "pending",
      metadata: {
        amount: tokenAmount,
        ethAmount: conversion.ethAmount,
        usdValue: conversion.usdValue,
        timestamp: new Date().toISOString(),
        recipient: walletAddress,
        network: networkName
      }
    };
    
    try {
      await apiRequest('POST', '/api/ledger', pendingLedgerEntry);
    } catch (ledgerError) {
      console.error("Failed to record pending transaction:", ledgerError);
    }
    
    // Execute the actual ETH transfer on the blockchain
    const txHash = await ethereumService.transferETH(
      walletAddress, 
      conversion.ethAmount
    );
    
    // Get Etherscan link
    const etherscanLink = ethereumService.getEtherscanLink(txHash);
    
    // Record the successful transaction in the ledger
    const successLedgerEntry = {
      transactionId: txHash,
      action: "token_withdrawal_success",
      assetId: 0,
      licenseId: null,
      status: "completed",
      metadata: {
        amount: tokenAmount,
        ethAmount: conversion.ethAmount,
        usdValue: conversion.usdValue,
        timestamp: new Date().toISOString(),
        recipient: walletAddress,
        txHash,
        etherscanLink,
        network: networkName
      }
    };
    
    try {
      await apiRequest('POST', '/api/ledger', successLedgerEntry);
    } catch (ledgerError) {
      console.error("Failed to record successful transaction:", ledgerError);
    }
    
    // Return transaction details
    return {
      txHash,
      etherscanLink,
      conversionDetails: {
        tokenAmount,
        ethAmount: conversion.ethAmount,
        usdValue: conversion.usdValue,
        conversionRate: conversion.conversionRate,
        equivalentETH: conversion.equivalentETH,
        networkName
      }
    };
  } catch (error: any) {
    console.error("Direct blockchain token withdrawal failed:", error);
    
    // Record the failed transaction in the ledger
    const failedLedgerEntry = {
      transactionId: "tx_failed_" + Date.now(),
      action: "token_withdrawal_failed",
      assetId: 0,
      licenseId: null,
      status: "failed",
      metadata: {
        amount: tokenAmount,
        timestamp: new Date().toISOString(),
        errorMessage: error.message,
        attemptedRecipient: walletAddress
      }
    };
    
    try {
      await apiRequest('POST', '/api/ledger', failedLedgerEntry);
    } catch (ledgerError) {
      console.error("Failed to record failed transaction:", ledgerError);
    }
    
    throw new Error(`Token withdrawal failed: ${error.message}`);
  }
}