import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { supabaseAdmin } from '@/lib/supabase/client';
import { ethers } from 'ethers';
import { z } from 'zod';

const CryptoCheckoutSchema = z.object({
  hotkey_id: z.string().uuid(),
  payment_method: z.enum(['eth', 'matic', 'usdc']),
  transaction_hash: z.string(),
  wallet_address: z.string(),
});

const PLATFORM_WALLETS = {
  eth: process.env.PLATFORM_ETH_WALLET!,
  matic: process.env.PLATFORM_MATIC_WALLET!,
  usdc: process.env.PLATFORM_USDC_WALLET!,
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = CryptoCheckoutSchema.parse(body);

    const { data: hotkey } = await supabaseAdmin
      .from('hotkeys')
      .select('*')
      .eq('id', validatedData.hotkey_id)
      .single();

    if (!hotkey) {
      return NextResponse.json({ error: 'Hotkey not found' }, { status: 404 });
    }

    const { data: existingPurchase } = await supabaseAdmin
      .from('purchases')
      .select('id')
      .eq('buyer_id', session.user.id)
      .eq('hotkey_id', validatedData.hotkey_id)
      .single();

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'Already purchased' },
        { status: 400 }
      );
    }

    const provider = new ethers.JsonRpcProvider(
      `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`
    );

    const tx = await provider.getTransaction(validatedData.transaction_hash);
    
    if (!tx) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 400 }
      );
    }

    if (tx.to?.toLowerCase() !== PLATFORM_WALLETS[validatedData.payment_method].toLowerCase()) {
      return NextResponse.json(
        { error: 'Invalid recipient address' },
        { status: 400 }
      );
    }

    const expectedAmount = hotkey.price_crypto?.[validatedData.payment_method];
    if (!expectedAmount) {
      return NextResponse.json(
        { error: 'Crypto price not set for this payment method' },
        { status: 400 }
      );
    }

    const actualAmount = ethers.formatEther(tx.value);
    if (parseFloat(actualAmount) < expectedAmount * 0.99) {
      return NextResponse.json(
        { error: 'Insufficient payment amount' },
        { status: 400 }
      );
    }

    const { data: purchase, error } = await supabaseAdmin
      .from('purchases')
      .insert({
        buyer_id: session.user.id,
        hotkey_id: validatedData.hotkey_id,
        transaction_hash: validatedData.transaction_hash,
        amount_crypto: {
          [validatedData.payment_method]: actualAmount,
        },
        payment_method: validatedData.payment_method,
        status: 'completed',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabaseAdmin
      .from('hotkeys')
      .update({ downloads: hotkey.downloads + 1 })
      .eq('id', validatedData.hotkey_id);

    await supabaseAdmin
      .from('users')
      .update({ wallet_address: validatedData.wallet_address })
      .eq('id', session.user.id);

    return NextResponse.json({
      success: true,
      purchase_id: purchase.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Crypto checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hotkey_id = searchParams.get('hotkey_id');
  
  if (!hotkey_id) {
    return NextResponse.json({ error: 'Hotkey ID required' }, { status: 400 });
  }

  const { data: hotkey } = await supabaseAdmin
    .from('hotkeys')
    .select('price_crypto, price_usd')
    .eq('id', hotkey_id)
    .single();

  if (!hotkey) {
    return NextResponse.json({ error: 'Hotkey not found' }, { status: 404 });
  }

  const provider = new ethers.JsonRpcProvider(
    `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`
  );

  const blockNumber = await provider.getBlockNumber();
  const gasPrice = await provider.getFeeData();

  return NextResponse.json({
    prices: hotkey.price_crypto,
    usd_price: hotkey.price_usd,
    payment_addresses: PLATFORM_WALLETS,
    network_info: {
      block_number: blockNumber,
      gas_price: gasPrice.gasPrice?.toString(),
    },
  });
}