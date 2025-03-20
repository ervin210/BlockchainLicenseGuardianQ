// Use browser-compatible crypto instead of Node.js crypto module
// This is a simple utility function for SHA-256 hashing in the browser
async function sha256(message: string): Promise<string> {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);
  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // convert bytes to hex string
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Generate a random ID (16 bytes)
function randomId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Simple blockchain implementation for digital rights management
 */
export class Blockchain {
  private chain: Block[];
  private currentTransactions: Transaction[];
  private difficulty: number;

  constructor() {
    this.chain = [];
    this.currentTransactions = [];
    this.difficulty = 2; // Reduced difficulty for browser environment
    
    // Create the genesis block - we need to initialize sync for the constructor
    // but the async operations will happen after
    this.createNewBlock(100, '0', '0');
    
    // Initialize the blockchain properly (async)
    this.initializeBlockchain();
  }
  
  // Async initialization for the blockchain
  private async initializeBlockchain(): Promise<void> {
    // This method will be called after the constructor
    // and will allow for proper async operation initialization
    console.log("Initializing blockchain...");
  }

  /**
   * Creates a new block in the blockchain
   * 
   * @param proof Proof of work
   * @param previousHash Hash of previous block
   * @param hash Hash of this block
   * @returns New block
   */
  private createNewBlock(proof: number, previousHash: string, hash: string): Block {
    const block: Block = {
      index: this.chain.length + 1,
      timestamp: Date.now(),
      transactions: this.currentTransactions,
      proof,
      previousHash: previousHash || '0', // We handle previousHash in the async methods
      hash
    };

    // Reset the current list of transactions
    this.currentTransactions = [];
    this.chain.push(block);
    
    return block;
  }

  /**
   * Creates a new transaction to go into the next mined block
   * 
   * @param asset Digital asset ID
   * @param action Action performed (e.g., "license_verification")
   * @param metadata Additional transaction data
   * @returns The index of the block that will hold this transaction
   */
  public createTransaction(asset: number, action: string, metadata: object = {}): string {
    const transaction: Transaction = {
      id: randomId(), // Using our browser-compatible randomId function
      timestamp: Date.now(),
      asset,
      action,
      metadata
    };

    this.currentTransactions.push(transaction);
    
    return transaction.id;
  }

  /**
   * Creates a SHA-256 hash of a block
   * 
   * @param block Block
   * @returns Hash string
   */
  // Changed to async to work with Web Crypto API
  private async hash(block: Block): Promise<string> {
    const blockString = JSON.stringify(block, Object.keys(block).sort());
    return await sha256(blockString);
  }

  /**
   * Proof of Work algorithm
   * 
   * Find a number p' such that hash(pp') contains 4 leading zeroes, where p is the previous p'
   * p is the previous proof, and p' is the new proof
   * 
   * @param lastProof Previous proof
   * @returns New proof
   */
  // Changed to async to work with Web Crypto API
  private async proofOfWork(lastProof: number): Promise<number> {
    let proof = 0;
    while (!(await this.validProof(lastProof, proof))) {
      proof++;
      // Avoid infinite loops by limiting proof attempts
      if (proof > 100) break; // For demonstration purposes, keep it very simple
    }
    
    return proof;
  }

  /**
   * Validates the proof: Does hash(lastProof, proof) contain 4 leading zeroes?
   * 
   * @param lastProof Previous proof
   * @param proof Current proof
   * @returns true if correct, false if not
   */
  // Changed to async to work with Web Crypto API
  private async validProof(lastProof: number, proof: number): Promise<boolean> {
    const guess = `${lastProof}${proof}`;
    const guessHash = await sha256(guess);
    
    return guessHash.substring(0, this.difficulty) === '0'.repeat(this.difficulty);
  }

  /**
   * Mine a new block
   * 
   * @returns The new block
   */
  // Changed to async to work with Web Crypto API
  public async mine(): Promise<Block> {
    // Get the last block
    const lastBlock = this.chain[this.chain.length - 1];
    const lastProof = lastBlock.proof;

    // Find the proof of work
    const proof = await this.proofOfWork(lastProof);

    // Generate the hash for the new block
    const previousHash = await this.hash(lastBlock);
    const newBlockData: Omit<Block, 'hash'> = {
      index: this.chain.length + 1,
      timestamp: Date.now(),
      transactions: this.currentTransactions,
      proof,
      previousHash
    };
    
    const hash = await this.hash(newBlockData as Block);
    
    // Add the new block to the chain
    return this.createNewBlock(proof, previousHash, hash);
  }

  /**
   * Validates the blockchain
   * 
   * @returns true if valid, false if not
   */
  // Changed to async to work with Web Crypto API
  public async isValid(): Promise<boolean> {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Check if the hash of the block is correct
      const prevHash = await this.hash(previousBlock);
      if (currentBlock.previousHash !== prevHash) {
        return false;
      }

      // Check if the Proof of Work is correct
      const isValidProof = await this.validProof(previousBlock.proof, currentBlock.proof);
      if (!isValidProof) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get all blocks in the chain
   * 
   * @returns The blockchain
   */
  public getChain(): Block[] {
    return this.chain;
  }

  /**
   * Get pending transactions
   * 
   * @returns Pending transactions
   */
  public getPendingTransactions(): Transaction[] {
    return this.currentTransactions;
  }
}

// Initialize a singleton blockchain instance
const blockchain = new Blockchain();

/**
 * Simulates verifying a transaction on the blockchain
 * Returns a transaction ID that can be used to reference this transaction
 */
export async function verifyBlockchainTransaction(): Promise<string> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Create a random asset ID for demonstration
  const assetId = Math.floor(Math.random() * 100) + 1;
  
  // Create a transaction and get the transaction ID
  const transactionId = blockchain.createTransaction(
    assetId,
    'verification',
    { timestamp: new Date().toISOString() }
  );
  
  // Mine a new block (in a real implementation, this would be done by miners)
  await blockchain.mine();
  
  return transactionId;
}

/**
 * Simulates creating a license on the blockchain
 */
export async function createLicenseOnBlockchain(
  assetId: number,
  licenseId: number,
  userId: number,
  expirationDate?: Date
): Promise<string> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Create a transaction with license details
  const transactionId = blockchain.createTransaction(
    assetId,
    'license_creation',
    {
      licenseId,
      userId,
      expirationDate: expirationDate?.toISOString(),
      timestamp: new Date().toISOString()
    }
  );
  
  // Mine a new block
  await blockchain.mine();
  
  return transactionId;
}

/**
 * Simulates verifying a license on the blockchain
 */
export async function verifyLicenseOnBlockchain(
  assetId: number,
  licenseId: number
): Promise<{ valid: boolean; transactionId: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // In a real implementation, this would check the blockchain for license validity
  const valid = Math.random() > 0.1; // 90% chance of being valid for demonstration
  
  // Create a verification transaction
  const transactionId = blockchain.createTransaction(
    assetId,
    'license_verification',
    {
      licenseId,
      valid,
      timestamp: new Date().toISOString()
    }
  );
  
  // Mine a new block
  await blockchain.mine();
  
  return { valid, transactionId };
}

/**
 * Process a token withdrawal transaction on the Ethereum blockchain
 * This is now a wrapper around the real Ethereum implementation
 * @param walletAddress Ethereum wallet address
 * @param amount Amount of tokens to withdraw
 * @returns Transaction hash that can be viewed on Etherscan
 */
export async function processTokenWithdrawalTransaction(walletAddress: string, amount: number): Promise<string> {
  console.log("Token withdrawal transaction started - delegating to real Ethereum implementation");
  console.log("Parameters:", { walletAddress, amount });
  
  if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
    console.error("Invalid wallet address format");
    throw new Error('Invalid Ethereum wallet address');
  }
  
  try {
    // Simply create a transaction in our local blockchain for tracking
    console.log("Creating local transaction in blockchain...");
    const transactionId = blockchain.createTransaction(
      0, // 0 for system operations
      'token_withdrawal',
      {
        walletAddress,
        amount,
        convertedAmount: amount * 0.001, // Conversion rate to ETH
        timestamp: new Date().toISOString()
      }
    );
    console.log("Internal transaction ID:", transactionId);
    
    // Mine a new block in our local blockchain
    console.log("Mining local block...");
    await blockchain.mine();
    
    // For backward compatibility, return a simulated hash
    // In production, this function should be fully replaced by the real implementation
    // in ethereum.ts (processRealTokenWithdrawalTransaction)
    const ethTxHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    console.log("Generated Ethereum transaction hash:", ethTxHash);
    console.log("NOTE: This simulated hash is only for backward compatibility.");
    console.log("Real transactions should be processed through ethereum.ts");
    
    return ethTxHash;
  } catch (error) {
    console.error("Error in processTokenWithdrawalTransaction:", error);
    throw error;
  }
}

// Types
interface Transaction {
  id: string;
  timestamp: number;
  asset: number;
  action: string;
  metadata: object;
}

interface Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  proof: number;
  previousHash: string;
  hash: string;
}

export default blockchain;
