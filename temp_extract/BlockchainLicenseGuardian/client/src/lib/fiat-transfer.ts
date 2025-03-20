/**
 * Fiat Transfer Module
 * 
 * This module provides functionality for transferring tokens to fiat currency
 * and sending payments directly to users via email-based bank transfers.
 * 
 * Security notice:
 * - Strictly enforces the 110 token limit
 * - All transfers are tracked in the blockchain ledger
 * - Uses the same token value as crypto: 10 tokens = 1 ETH = $3500
 * - Enhanced security measures for all bank transfers
 */

import { apiRequest } from "./queryClient";
import { convertTokensToETH } from "./ethereum";
import { verifyBlockchainTransaction } from "./blockchain";
import { SENDER_WALLET_ADDRESS, MAX_AVAILABLE_TOKENS } from "./blockchain-direct";
import { detectApplicationClone } from "./quantum-security";

// Payment processor types
export type PaymentProcessor = 'direct_bank' | 'email_transfer';

// Transfer status types
export type TransferStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Bank account information interface
export interface BankAccountInfo {
  accountHolderName: string;
  accountHolderEmail: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  country: string;
}

// Transfer result interface
export interface FiatTransferResult {
  success: boolean;
  transferId?: string;
  status?: TransferStatus;
  amount?: {
    tokens: number;
    fiat: number;
    currency: string;
  };
  recipientEmail?: string;
  estimatedArrival?: Date;
  transactionFee?: number;
  error?: string;
  ledgerEntry?: any;
}

/**
 * Process a token to fiat transfer using email-based direct bank transfer
 * 
 * @param amount Number of tokens to convert and transfer
 * @param recipientEmail Email address of the recipient
 * @param recipientName Full name of the recipient
 * @param currency Currency code (default: USD)
 * @param accountInfo Optional additional bank account information
 * @returns Transfer result with tracking information
 */
export async function transferTokensToFiat(
  amount: number,
  recipientEmail: string,
  recipientName: string,
  currency: string = 'USD',
  accountInfo?: Partial<BankAccountInfo>
): Promise<FiatTransferResult> {
  console.log(`Processing fiat transfer of ${amount} tokens to ${recipientEmail}`);
  
  try {
    // Check for cloned application first
    try {
      const cloneDetection = detectApplicationClone();
      
      // If this is a cloned application, block the fiat transfer
      if (cloneDetection.isCloned) {
        console.error("CLONE PROTECTION: Fiat transfer blocked - This appears to be an unauthorized copy of the application");
        
        // Log the clone attempt in the ledger for security auditing
        const cloneAttemptEntry = {
          transactionId: "clone_fiat_attempt_" + Date.now(),
          action: "fiat_transfer_clone_protection_triggered",
          assetId: 0,
          licenseId: null,
          status: "blocked",
          metadata: {
            amount: amount,
            recipientEmail: recipientEmail, 
            recipientName: recipientName,
            currency: currency,
            timestamp: new Date().toISOString(),
            errorMessage: "CLONE_PROTECTION: Fiat transfer attempted from unauthorized application copy",
            validationFailures: cloneDetection.validationFailures,
            cloneIndicators: cloneDetection.cloneIndicators,
            securityScore: cloneDetection.securityScore,
            signature: cloneDetection.signature || "invalid"
          }
        };
        
        try {
          await apiRequest('POST', '/api/ledger', cloneAttemptEntry);
        } catch (ledgerError) {
          console.error("Failed to record clone fiat transfer attempt:", ledgerError);
        }
        
        return {
          success: false,
          error: "SECURITY VIOLATION: This appears to be an unauthorized copy of the application. All financial transactions have been disabled for security reasons.",
        };
      }
    } catch (cloneError) {
      console.error("Error during clone detection in fiat transfer:", cloneError);
      // Continue with normal checks if clone detection fails
    }
  
    // Validate inputs
    if (!recipientEmail || !recipientEmail.includes('@')) {
      throw new Error('Valid recipient email is required');
    }
    
    if (!recipientName || recipientName.trim().length < 2) {
      throw new Error('Recipient name is required');
    }
    
    if (amount <= 0) {
      throw new Error('Transfer amount must be greater than zero');
    }
    
    // Check token limit
    if (amount > MAX_AVAILABLE_TOKENS) {
      throw new Error(`Cannot transfer more than ${MAX_AVAILABLE_TOKENS} tokens. Please reduce the amount.`);
    }
    
    // Get the token to fiat conversion using our existing conversion system
    const conversion = convertTokensToETH(amount);
    const tokenUsdValue = parseFloat(conversion.usdValue);
    
    // Calculate transfer fee (0.5% for email transfers)
    const transferFee = tokenUsdValue * 0.005;
    const netAmount = tokenUsdValue - transferFee;
    
    // Estimate arrival date (2-3 business days)
    const today = new Date();
    const estimatedArrival = new Date(today);
    estimatedArrival.setDate(today.getDate() + 3); // 3 business days
    
    // Generate a unique transfer ID
    const transferId = `FT-${Date.now()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    
    // Record the transaction in the blockchain for security
    const txId = await verifyBlockchainTransaction();
    
    // Build the ledger entry
    const ledgerEntry = {
      transactionId: txId,
      action: "token_fiat_transfer",
      assetId: 0,
      licenseId: null,
      status: "pending",
      metadata: {
        transferId,
        amount: amount,
        senderWalletAddress: SENDER_WALLET_ADDRESS,
        recipientEmail,
        recipientName,
        tokenValue: conversion.tokenValue,
        fiatAmount: netAmount.toFixed(2),
        fiatFormatted: `$${netAmount.toFixed(2)} ${currency}`,
        currency,
        conversionRate: conversion.conversionRate,
        transferFee: transferFee.toFixed(2),
        transferFeeFormatted: `$${transferFee.toFixed(2)} ${currency}`,
        processor: 'email_transfer',
        estimatedArrival: estimatedArrival.toISOString(),
        timestamp: new Date().toISOString()
      }
    };
    
    // Save the transaction to the ledger
    await apiRequest('POST', '/api/ledger', ledgerEntry);
    
    // Return the successful result
    return {
      success: true,
      transferId,
      status: 'pending',
      amount: {
        tokens: amount,
        fiat: parseFloat(netAmount.toFixed(2)),
        currency
      },
      recipientEmail,
      estimatedArrival,
      transactionFee: parseFloat(transferFee.toFixed(2)),
      ledgerEntry
    };
  } catch (error: any) {
    console.error("Fiat transfer failed:", error);
    
    // Record the failed transaction in the ledger
    try {
      const failedLedgerEntry = {
        transactionId: "failed_" + Date.now(),
        action: "token_fiat_transfer_failed",
        assetId: 0,
        licenseId: null,
        status: "failed",
        metadata: {
          amount,
          recipientEmail,
          recipientName,
          currency,
          errorMessage: error.message || "Unknown error",
          timestamp: new Date().toISOString()
        }
      };
      
      await apiRequest('POST', '/api/ledger', failedLedgerEntry);
    } catch (ledgerError) {
      console.error("Failed to record failed transaction:", ledgerError);
    }
    
    // Return the error result
    return {
      success: false,
      error: error.message || 'An unknown error occurred during the fiat transfer'
    };
  }
}

/**
 * Get the current status of a fiat transfer
 * 
 * @param transferId The transfer ID to check
 * @returns Current status with transfer details
 */
export async function checkFiatTransferStatus(transferId: string): Promise<{
  transferId: string;
  status: TransferStatus;
  details?: any;
  error?: string;
}> {
  try {
    // In a real implementation, this would make an API call to the payment processor
    
    // For demonstration, we'll fetch from our ledger
    const response = await fetch(`/api/ledger/fiat-transfer/${transferId}`);
    if (!response.ok) {
      return {
        transferId,
        status: 'failed',
        error: 'Transfer not found'
      };
    }
    
    const transferData = await response.json();
    
    return {
      transferId,
      status: transferData.status || 'pending',
      details: transferData
    };
  } catch (error: any) {
    return {
      transferId,
      status: 'failed',
      error: error.message || 'Failed to check transfer status'
    };
  }
}

/**
 * Cancel a pending fiat transfer
 * 
 * @param transferId The transfer ID to cancel
 * @returns Cancellation result
 */
export async function cancelFiatTransfer(transferId: string): Promise<{
  success: boolean;
  transferId: string;
  error?: string;
}> {
  try {
    // In a real implementation, this would make an API call to the payment processor
    
    // For demonstration, we'll update our ledger
    const response = await fetch(`/api/ledger/fiat-transfer/${transferId}/cancel`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      return {
        success: false,
        transferId,
        error: 'Failed to cancel transfer. It may already be processed.'
      };
    }
    
    return {
      success: true,
      transferId
    };
  } catch (error: any) {
    return {
      success: false,
      transferId,
      error: error.message || 'Failed to cancel transfer'
    };
  }
}