interface GetCoinsNewParams {
  count?: number;
  after?: string;
}

// Function to fetch new coins from the Zora API
export async function getCoinsNew({ count = 20, after }: GetCoinsNewParams = {}) {
  // The GraphQL query for the Zora API
  const query = `
    query ExploreList($first: Int!, $after: String) {
      exploreList(first: $first, after: $after) {
        edges {
          node {
            id
            name
            symbol
            address
            creatorAddress
            totalSupply
            marketCap
            volume24h
            createdAt
            uniqueHolders
            description
            mediaContent {
              previewImage {
                small
                medium
                large
              }
            }
          }
          cursor
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.zora.co/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          first: count,
          after: after || null,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('GraphQL Errors:', data.errors);
      throw new Error('GraphQL query failed');
    }

    return data;
  } catch (error) {
    console.error('Error fetching coins:', error);
    throw error;
  }
}