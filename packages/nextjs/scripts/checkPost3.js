const { createPublicClient, http, parseAbiItem } = require('viem');
const { baseSepolia } = require('viem/chains');

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://base-sepolia.g.alchemy.com/v2/demo'),
});

// Contract addresses and details
const POST_ADDRESS = "0x984de3deA53c726CE8235CD7FC4A69f5BdC70F49";
const CREATOR_ADDRESS = "0xb843a2d0d4b9e628500d2e0f6f0382e063c14a95";
const FACTORY_ADDRESS = "0xcc71abcc15da45dde1fdb4dff29785c028de8f0b";

// Event definition
const POST_CREATED_EVENT = parseAbiItem('event PostCreated(uint256 indexed postId, address indexed author, string title, address coinAddress, string metadataURI)');

async function checkPost() {
  try {
    console.log('Checking post details...\n');

    // Get the current block
    const currentBlock = await publicClient.getBlockNumber();
    console.log('Current block:', currentBlock.toString());

    // Start from a recent block (last 1000 blocks should be enough for recent posts)
    const startBlock = currentBlock - 1000n;
    
    console.log('Searching for PostCreated events...');
    const postEvents = await publicClient.getLogs({
      address: FACTORY_ADDRESS,
      event: POST_CREATED_EVENT,
      fromBlock: startBlock,
      toBlock: currentBlock,
    });

    console.log(`Found ${postEvents.length} recent posts\n`);

    // 2. Get specific post details
    if (postEvents.length > 0) {
      for (const event of postEvents) {
        console.log('Post Event Details:');
        console.log('- Post ID:', event.args.postId.toString());
        console.log('- Author:', event.args.author);
        console.log('- Title:', event.args.title);
        console.log('- Coin Address:', event.args.coinAddress);
        console.log('- Block Number:', event.blockNumber.toString());
        console.log('- Transaction Hash:', event.transactionHash);
        console.log('-------------------\n');
      }
    }

    // 3. Check contract deployment
    console.log('Checking contract deployment...');
    const code = await publicClient.getBytecode({
      address: POST_ADDRESS,
    });
    console.log('Contract is deployed:', code !== undefined && code !== '0x');

    // 4. Check if your address has any posts
    console.log('\nChecking posts by your address:', CREATOR_ADDRESS);
    const yourPosts = postEvents.filter(event => 
      event.args.author.toLowerCase() === CREATOR_ADDRESS.toLowerCase()
    );
    console.log('Your posts found:', yourPosts.length);
    
    if (yourPosts.length > 0) {
      console.log('\nYour post details:');
      yourPosts.forEach(post => {
        console.log('Title:', post.args.title);
        console.log('Coin Address:', post.args.coinAddress);
        console.log('Transaction:', post.transactionHash);
      });
    }

  } catch (error) {
    console.error('Error checking post:', error.message);
    if (error.details) {
      console.error('Error details:', error.details);
    }
  }
}

checkPost();