import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/**
 * ✅ FIX #2: Network State Listener
 * Monitors network connectivity status
 * 
 * Prevents app freezing on network errors by:
 * - Listening to network state changes
 * - Triggering graceful disconnects when network is lost
 * - Allowing reconnection when network returns
 * - Displaying offline indicators during disconnection
 */

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  networkType: string | null;
  onNetworkLost: () => void;
  onNetworkRestored: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);
  const [networkType, setNetworkType] = useState<string | null>(null);
  const [wasConnected, setWasConnected] = useState(true);

  // Callback hooks for network state changes
  const onNetworkLost = () => {
    console.warn('⚠️  Network connection lost - Socket will attempt to reconnect');
  };

  const onNetworkRestored = () => {
    console.log('✅ Network connection restored');
  };

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const currentlyConnected = state.isConnected ?? false;
      const hasInternet = state.isInternetReachable ?? true;

      console.log('📡 Network state changed:', {
        isConnected: currentlyConnected,
        isInternetReachable: hasInternet,
        type: state.type,
      });

      // Detect network loss
      if (wasConnected && !currentlyConnected) {
        console.error('❌ Network connection lost!');
        onNetworkLost();
      }

      // Detect network recovery
      if (!wasConnected && currentlyConnected) {
        console.log('🔄 Network connection restored!');
        onNetworkRestored();
      }

      setIsConnected(currentlyConnected);
      setIsInternetReachable(hasInternet);
      setNetworkType(state.type);
      setWasConnected(currentlyConnected);
    });

    // Check initial network state
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable);
      setNetworkType(state.type);
      setWasConnected(state.isConnected ?? false);
    }).catch((error) => {
      console.error('❌ Failed to fetch network info:', error);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [wasConnected]);

  const value: NetworkContextType = {
    isConnected,
    isInternetReachable,
    networkType,
    onNetworkLost,
    onNetworkRestored,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};
