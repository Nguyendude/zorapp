import { NextResponse } from 'next/server';
import { getOnchainCoinDetails } from '@zoralabs/coins-sdk';
import { baseSepolia } from 'viem/chains';
import { createPublicClient, http, parseEther, formatEther } from 'viem';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coinAddress = searchParams.get('coinAddress');
  const amount = searchParams.get('amount');
  const isBuying = searchParams.get('isBuying') === 'true';

  if (!coinAddress || !amount) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    });

    const coinDetails = await getOnchainCoinDetails({
      coin: coinAddress as `0x${string}`,
      publicClient,
    });

    const amountBigInt = parseEther(amount);
    
    // Return the coin details and input amount for the frontend to calculate
    return NextResponse.json({
      success: true,
      details: coinDetails,
      input: {
        amount: formatEther(amountBigInt),
        isBuying
      }
    });

    return NextResponse.json({ error: 'Failed to get trade quote' }, { status: 500 });
  } catch (error) {
    console.error('Error getting trade quote:', error);
    return NextResponse.json({ error: 'Failed to get trade quote' }, { status: 500 });
  }
}