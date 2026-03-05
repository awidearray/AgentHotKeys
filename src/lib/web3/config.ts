import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia,
} from 'wagmi/chains';
import { http } from 'wagmi';
import { env, validateEnvironment } from '@/lib/env';

const { isValid, errors } = validateEnvironment();

if (!isValid) {
  console.warn('⚠️  Web3 configuration issues:', errors);
}

// Create transport URLs with validation
function createTransportUrl(network: string): string {
  const url = `https://${network}-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_ID}`;
  
  // Log transport creation for debugging
  console.log(`[Web3] Creating transport for ${network}:`, {
    alchemyId: env.NEXT_PUBLIC_ALCHEMY_ID.substring(0, 8) + '...',
    url: url.substring(0, 50) + '...'
  });
  
  return url;
}

export const config = getDefaultConfig({
  appName: 'HotKeys.ai Marketplace',
  projectId: env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  chains: [
    mainnet, 
    polygon, 
    optimism, 
    arbitrum, 
    base, 
    ...(process.env.NODE_ENV === 'development' ? [sepolia] : [])
  ],
  transports: {
    [mainnet.id]: http(createTransportUrl('eth')),
    [polygon.id]: http(createTransportUrl('polygon')),
    [optimism.id]: http(createTransportUrl('opt')),
    [arbitrum.id]: http(createTransportUrl('arb')),
    [base.id]: http(createTransportUrl('base')),
    [sepolia.id]: http(createTransportUrl('eth-sepolia')),
  },
  ssr: true,
});

// Web3 health check
export async function checkWeb3Health(): Promise<{ healthy: boolean; error?: string }> {
  try {
    // In a real implementation, we'd check if we can connect to the RPC
    // For now, just validate configuration
    if (env.NEXT_PUBLIC_ALCHEMY_ID.includes('placeholder')) {
      return { healthy: false, error: 'Alchemy configuration not set' };
    }
    
    if (env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID.includes('placeholder')) {
      return { healthy: false, error: 'WalletConnect configuration not set' };
    }
    
    return { healthy: true };
  } catch (error) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown Web3 error' 
    };
  }
}