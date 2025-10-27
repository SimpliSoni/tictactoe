import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { useNetwork } from '../context/NetworkContext';
import Config from '../config/config';

export const HomeScreen = ({ navigation }: any) => {
  const { 
    isConnected, 
    isAuthenticated, 
    user, 
    connect, 
    error,
    clearError 
  } = useGame();

  // ✅ FIX #2: Added network status hook
  const { isConnected: isNetworkConnected, isInternetReachable } = useNetwork();
  const hasTriedConnectRef = React.useRef(false);

  useEffect(() => {
    // Auto-connect only once when screen loads
    if (!isConnected && !hasTriedConnectRef.current) {
      hasTriedConnectRef.current = true;
      connect();
    }
  }, []); // Empty deps - only run once

  // Reset connection attempt flag when connected
  useEffect(() => {
    if (isConnected) {
      hasTriedConnectRef.current = false;
    }
  }, [isConnected]);

  useEffect(() => {
    // Show errors
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Config.COLORS.primary} />
          <Text style={styles.loadingText}>Connecting to server...</Text>
          <Text style={styles.subtitle}>
            Make sure the server is running
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Config.COLORS.primary} />
          <Text style={styles.loadingText}>Authenticating...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Tic-Tac-Toe</Text>
          <Text style={styles.subtitle}>Multiplayer Battle</Text>
        </View>

        <View style={styles.userCard}>
          <Text style={styles.username}>{user.username}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.elo}</Text>
              <Text style={styles.statLabel}>ELO Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.stats.wins}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.stats.losses}</Text>
              <Text style={styles.statLabel}>Losses</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.stats.winRate}%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('Matchmaking')}
          >
            <Text style={styles.buttonText}>🎮 Find Match</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <Text style={styles.buttonText}>🏆 Leaderboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('Stats')}
          >
            <Text style={styles.buttonText}>📊 My Stats</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.statusIndicator}>
            <View style={[
              styles.dot, 
              isConnected && isNetworkConnected ? styles.connectedDot : styles.disconnectedDot
            ]} />
            <Text style={styles.statusText}>
              {!isNetworkConnected 
                ? '📡 No Network'
                : isInternetReachable === false
                ? '⚠️ No Internet'
                : isConnected
                ? 'Connected'
                : 'Connecting...'}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Config.COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Config.COLORS.textSecondary,
  },
  loadingText: {
    fontSize: 18,
    color: Config.COLORS.text,
    marginTop: 20,
  },
  userCard: {
    backgroundColor: Config.COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Config.COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Config.COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Config.COLORS.textSecondary,
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Config.COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: Config.COLORS.card,
    borderWidth: 2,
    borderColor: Config.COLORS.border,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Config.COLORS.text,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  connectedDot: {
    backgroundColor: Config.COLORS.secondary,
  },
  disconnectedDot: {
    backgroundColor: Config.COLORS.danger,
  },
  statusText: {
    fontSize: 14,
    color: Config.COLORS.textSecondary,
  },
});
