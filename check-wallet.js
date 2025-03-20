// Simple script to check the connected Ethereum wallet address

async function checkWalletAddress() {
  console.log('Checking for Ethereum provider...');
  
  if (typeof window.ethereum !== 'undefined') {
    console.log('Ethereum provider detected');
    
    try {
      // Request access to the user's accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // The first account is the currently connected wallet address
      const walletAddress = accounts[0];
      
      console.log('Connected wallet address:', walletAddress);
      
      // You can use this wallet address for further operations
      return walletAddress;
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      return null;
    }
  } else {
    console.error('No Ethereum provider found. Please install MetaMask or another wallet provider.');
    return null;
  }
}

// Call the function to check wallet address
checkWalletAddress().then(address => {
  if (address) {
    console.log('Successfully retrieved wallet address:', address);
    // You can perform additional operations here
  } else {
    console.log('Failed to retrieve wallet address');
  }
});