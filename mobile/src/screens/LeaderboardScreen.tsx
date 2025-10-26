import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Config from '../config/config';
import { LeaderboardEntry } from '../types/game';

export const LeaderboardScreen = ({ navigation }: any) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${Config.SERVER_URL}${Config.API.LEADERBOARD}?limit=50`);
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.data);
      } else {
        setError('Failed to load leaderboard');
      }
    } catch (err) {
      setError('Network error. Make sure server is running.');
      console.error('Leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rank = index + 1;
    const isTrophyRank = rank <= 3;

    return (
      <View style={[styles.item, isTrophyRank && styles.trophyItem]}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rank, isTrophyRank && styles.trophyRank]}>
            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
          </Text>
        </View>

        <View style={styles.playerInfo}>
          <Text style={styles.username} numberOfLines={1}>
            {item.username}
          </Text>
          <Text style={styles.stats}>
            {item.stats.wins}W {item.stats.losses}L {item.stats.draws}D
          </Text>
        </View>

        <View style={styles.eloContainer}>
          <Text style={styles.elo}>{item.elo}</Text>
          <Text style={styles.eloLabel}>ELO</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Config.COLORS.primary} />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLeaderboard}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <TouchableOpacity onPress={fetchLeaderboard} style={styles.refreshButton}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={leaderboard}
        renderItem={renderItem}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No players yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.COLORS.background,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Config.COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: Config.COLORS.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Config.COLORS.text,
  },
  refreshButton: {
    padding: 8,
  },
  refreshText: {
    fontSize: 24,
    color: Config.COLORS.primary,
  },
  loadingText: {
    fontSize: 16,
    color: Config.COLORS.text,
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: Config.COLORS.danger,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Config.COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Config.COLORS.text,
  },
  list: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Config.COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  trophyItem: {
    borderWidth: 2,
    borderColor: Config.COLORS.primary,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Config.COLORS.text,
  },
  trophyRank: {
    fontSize: 24,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: Config.COLORS.text,
    marginBottom: 4,
  },
  stats: {
    fontSize: 14,
    color: Config.COLORS.textSecondary,
  },
  eloContainer: {
    alignItems: 'center',
    marginLeft: 12,
  },
  elo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Config.COLORS.primary,
  },
  eloLabel: {
    fontSize: 12,
    color: Config.COLORS.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Config.COLORS.textSecondary,
  },
});
