const { createPublicClient, http, parseAbiItem } = require('viem');
const { baseSepolia } = require('viem/chains');

// Using Alchemy's endpoint
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
});

// Your post details
const POST_ADDRESS = "0x984de3deA53c726CE8235CD7FC4A69f5BdC70F49";
const CREATOR_ADDRESS = "0xb843a2d0d4b9e628500d2e0f6f0382e063c14a95";
const FACTORY_ADDRESS = "0xcc71abcc15da45dde1fdb4dff29785c028de8f0b";

// Event definition
const POST_CREATED_EVENT = parseAbiItem('event PostCreated(uint256 indexed postId, address indexed author, string title, address coinAddress, string metadataURI)');

async function checkPost() {
  try {
    console.log('Checking post details...');
    
    // 1. Check contract deployment status
    console.log('\nChecking contract deployment status...');
    const bytecode = await publicClient.getBytecode({
      address: POST_ADDRESS,
    });
    console.log('Contract is deployed:', bytecode !== undefined && bytecode !== '0x');

    // 2. Check specific transaction that created your post
    const tx = await publicClient.getTransaction({
      hash: '0x710cbe4edba4764d7f242c28bc0ae6100243ab3c12da822e6d43a77f187f9af7'
    });
    
    if (tx) {
      console.log('\nTransaction details:');
      console.log('From:', tx.from);
      console.log('To:', tx.to);
      console.log('Block number:', tx.blockNumber?.toString());
      console.log('Gas used:', tx.gas?.toString());
    }

    // 3. Get the block information
    if (tx.blockNumber) {
      const block = await publicClient.getBlock({
        blockNumber: tx.blockNumber
      });
      console.log('\nBlock details:');
      console.log('Timestamp:', new Date(Number(block.timestamp) * 1000).toISOString());
      console.log('Hash:', block.hash);
    }

    // 4. Check contract token details
    try {
      const symbol = await publicClient.readContract({
        address: POST_ADDRESS,
        abi: [{
          type: 'function',
          name: 'symbol',
          inputs: [],
          outputs: [{ type: 'string' }],
          stateMutability: 'view'
        }],
        functionName: 'symbol',
      });
      console.log('\nToken symbol:', symbol);
    } catch (error) {
      console.log('\nCould not read token symbol:', error.message);
    }

    console.log('\nFound posts:', postEvents.length);
    
    for (const event of postEvents) {
      console.log('\nPost details:');
      console.log('Post ID:', event.args.postId);
      console.log('Author:', event.args.author);
      console.log('Title:', event.args.title);
      console.log('Coin Address:', event.args.coinAddress);
      console.log('Block Number:', event.blockNumber);
    }

    // 2. Check contract details
    console.log('\nChecking contract:', POST_ADDRESS);
    const code = await publicClient.getBytecode({
      address: POST_ADDRESS,
    });
    console.log('Contract deployed:', code !== undefined && code !== '0x');

    // 3. Check creator's transaction history
    const txCount = await publicClient.getTransactionCount({
      address: CREATOR_ADDRESS,
    });
    console.log('Creator transaction count:', txCount);

    // 4. Try to read token data
    try {
      const symbol = await publicClient.readContract({
        address: POST_ADDRESS,
        abi: [{
          type: 'function',
          name: 'symbol',
          inputs: [],
          outputs: [{ type: 'string' }],
          stateMutability: 'view'
        }],
        functionName: 'symbol',
      });
      console.log('Token symbol:', symbol);
    } catch (error) {
      console.log('Could not read token symbol:', error.message);
    }

  } catch (error) {
    console.error('Error checking post:', error);
  }
}

checkPost();