const { createPublicClient, http, parseAbiItem, formatEther } = require('viem');
const { baseSepolia } = require('viem/chains');
const { getCoinMetrics } = require('@zoralabs/coins-sdk');

// Create a viem public client
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://base-sepolia.g.alchemy.com/v2/o3VW3WRXrsXXMRX3l7jZxLUqhWyZzXBy'), // Using Alchemy's public endpoint
});

// Contract addresses
const FACTORY_ADDRESS = "0xcc71abcc15da45dde1fdb4dff29785c028de8f0b";

// Event definitions
const POST_SUPPORTED_EVENT = parseAbiItem('event PostSupported(uint256 indexed postId, address indexed supporter, uint256 amount, uint256 coinAmount)');
const POST_CREATED_EVENT = parseAbiItem('event PostCreated(uint256 indexed postId, address indexed author, string title, address coinAddress, string metadataURI)');
const POST_MINT_DEPLOYED_EVENT = parseAbiItem('event PostMintDeployed(uint256 indexed instanceId, address indexed contractAddress, address indexed creator, string name)');

async function checkFees() {
  try {
    console.log('=== Admin Revenue ===');
    
    // 1. Get factory balance (deployment fees)
    const factoryBalance = await publicClient.getBalance({
      address: FACTORY_ADDRESS,
    });
    
    console.log('Factory Contract Balance:', formatEther(factoryBalance), 'ETH');

    // 2. Get total instances (deployment fees)
    const totalInstances = await publicClient.readContract({
      address: FACTORY_ADDRESS,
      abi: [{
        type: 'function',
        name: 'totalInstances',
        inputs: [],
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view'
      }],
      functionName: 'totalInstances',
    });

    console.log('Total PostMint Instances:', totalInstances.toString());
    console.log('Total Deployment Fees Collected:', (Number(totalInstances) * 0.001), 'ETH');

    // 3. Get all PostMint instances
    const deployedEvents = await publicClient.getLogs({
      address: FACTORY_ADDRESS,
      event: POST_MINT_DEPLOYED_EVENT,
      fromBlock: 0n,
    });

    const postMintAddresses = deployedEvents.map(event => event.args.contractAddress);
    
    // 4. Track platform fees from all PostMint instances
    let totalPlatformFees = 0n;
    let creatorEarnings = new Map();
    
    console.log('\n=== Processing PostMint Instances ===');
    for (const postMintAddress of postMintAddresses) {
      // Get PostSupported events
      const supportEvents = await publicClient.getLogs({
        address: postMintAddress,
        event: POST_SUPPORTED_EVENT,
        fromBlock: 0n,
      });

      // Calculate platform fees (2.5%) and creator earnings
      for (const event of supportEvents) {
        const amount = event.args.amount;
        const platformFee = (amount * 250n) / 10000n; // 2.5%
        totalPlatformFees += platformFee;

        // Track creator earnings
        const creatorEarning = amount - platformFee;
        const post = await publicClient.readContract({
          address: postMintAddress,
          abi: [{
            type: 'function',
            name: 'posts',
            inputs: [{ type: 'uint256' }],
            outputs: [{
              type: 'tuple',
              components: [
                { name: 'id', type: 'uint256' },
                { name: 'author', type: 'address' },
                { name: 'title', type: 'string' },
                { name: 'content', type: 'string' },
                { name: 'coinAddress', type: 'address' },
                { name: 'createdAt', type: 'uint256' },
                { name: 'totalSupport', type: 'uint256' },
                { name: 'isActive', type: 'bool' }
              ]
            }]
          }],
          functionName: 'posts',
          args: [event.args.postId]
        });

        const author = post.author;
        creatorEarnings.set(
          author, 
          (creatorEarnings.get(author) || 0n) + creatorEarning
        );
      }
    }

    console.log('\n=== Platform Fees ===');
    console.log('Total Platform Fees Collected:', formatEther(totalPlatformFees), 'ETH');

    console.log('\n=== Creator Earnings ===');
    for (const [author, earnings] of creatorEarnings) {
      console.log(`Creator ${author}: ${formatEther(earnings)} ETH`);
    }

    // 5. Get Zora SDK metrics for each coin
    console.log('\n=== Zora Platform Activity ===');
    for (const postMintAddress of postMintAddresses) {
      const posts = await publicClient.getLogs({
        address: postMintAddress,
        event: POST_CREATED_EVENT,
        fromBlock: 0n,
      });

      for (const post of posts) {
        const coinAddress = post.args.coinAddress;
        try {
          const metrics = await getCoinMetrics(coinAddress);
          console.log(`\nCoin ${post.args.title} (${coinAddress}):`);
          console.log('- Volume 24h:', metrics?.volume24h || '0');
          console.log('- Market Cap:', metrics?.marketCap || '0');
          console.log('- Holders:', metrics?.uniqueHolders || '0');
        } catch (error) {
          console.log(`No Zora metrics found for coin ${coinAddress}`);
        }
      }
    }

  } catch (error) {
    console.error('Error checking fees:', error);
  }
}

checkFees();