import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import Config from '../config/config';

export const StatsScreen = ({ navigation }: any) => {
  const { user } = useGame();

  if (!user) {
    return null;
  }

  const totalGames = user.stats.wins + user.stats.losses + user.stats.draws;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 My Stats</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Info */}
        <View style={styles.card}>
          <Text style={styles.username}>{user.username}</Text>
          <View style={styles.eloContainer}>
            <Text style={styles.elo}>{user.elo}</Text>
            <Text style={styles.eloLabel}>ELO Rating</Text>
          </View>
        </View>

        {/* Win/Loss Record */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Record</Text>
          <View style={styles.recordGrid}>
            <View style={styles.recordItem}>
              <Text style={[styles.recordValue, styles.winColor]}>
                {user.stats.wins}
              </Text>
              <Text style={styles.recordLabel}>Wins</Text>
            </View>
            <View style={styles.recordItem}>
              <Text style={[styles.recordValue, styles.lossColor]}>
                {user.stats.losses}
              </Text>
              <Text style={styles.recordLabel}>Losses</Text>
            </View>
            <View style={styles.recordItem}>
              <Text style={[styles.recordValue, styles.drawColor]}>
                {user.stats.draws}
              </Text>
              <Text style={styles.recordLabel}>Draws</Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Games</Text>
            <Text style={styles.statValue}>{totalGames}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Win Rate</Text>
            <Text style={styles.statValue}>{user.stats.winRate}%</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Current Streak</Text>
            <Text style={styles.statValue}>
              {user.stats.currentStreak > 0 ? '🔥 ' : ''}{user.stats.currentStreak}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Longest Streak</Text>
            <Text style={styles.statValue}>
              {user.stats.longestStreak > 0 ? '⭐ ' : ''}{user.stats.longestStreak}
            </Text>
          </View>
        </View>

        {/* Performance Breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Performance</Text>
          {totalGames > 0 ? (
            <>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressSegment, 
                    styles.winSegment,
                    { width: `${(user.stats.wins / totalGames) * 100}%` }
                  ]} 
                />
                <View 
                  style={[
                    styles.progressSegment, 
                    styles.drawSegment,
                    { width: `${(user.stats.draws / totalGames) * 100}%` }
                  ]} 
                />
                <View 
                  style={[
                    styles.progressSegment, 
                    styles.lossSegment,
                    { width: `${(user.stats.losses / totalGames) * 100}%` }
                  ]} 
                />
              </View>
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.winSegment]} />
                  <Text style={styles.legendText}>
                    Wins ({Math.round((user.stats.wins / totalGames) * 100)}%)
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.drawSegment]} />
                  <Text style={styles.legendText}>
                    Draws ({Math.round((user.stats.draws / totalGames) * 100)}%)
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.lossSegment]} />
                  <Text style={styles.legendText}>
                    Losses ({Math.round((user.stats.losses / totalGames) * 100)}%)
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.noDataText}>Play some games to see your performance!</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.COLORS.background,
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
  placeholder: {
    width: 60,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: Config.COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Config.COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  eloContainer: {
    alignItems: 'center',
  },
  elo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Config.COLORS.primary,
  },
  eloLabel: {
    fontSize: 16,
    color: Config.COLORS.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Config.COLORS.text,
    marginBottom: 16,
  },
  recordGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  recordItem: {
    alignItems: 'center',
  },
  recordValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recordLabel: {
    fontSize: 14,
    color: Config.COLORS.textSecondary,
  },
  winColor: {
    color: Config.COLORS.secondary,
  },
  lossColor: {
    color: Config.COLORS.danger,
  },
  drawColor: {
    color: Config.COLORS.warning,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statLabel: {
    fontSize: 16,
    color: Config.COLORS.text,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Config.COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Config.COLORS.border,
  },
  progressBar: {
    height: 30,
    flexDirection: 'row',
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: Config.COLORS.background,
    marginBottom: 16,
  },
  progressSegment: {
    height: '100%',
  },
  winSegment: {
    backgroundColor: Config.COLORS.secondary,
  },
  drawSegment: {
    backgroundColor: Config.COLORS.warning,
  },
  lossSegment: {
    backgroundColor: Config.COLORS.danger,
  },
  legendContainer: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: Config.COLORS.textSecondary,
  },
  noDataText: {
    fontSize: 16,
    color: Config.COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
