import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useGame } from '../context/GameContext';
import Config from '../config/config';

export const MatchmakingScreen = ({ navigation }: any) => {
  const { 
    isInQueue, 
    queuePosition, 
    currentGame,
    joinQueue, 
    leaveQueue 
  } = useGame();

  useEffect(() => {
    // Auto-join queue when entering screen
    if (!isInQueue && !currentGame) {
      joinQueue();
    }

    return () => {
      // Leave queue when leaving screen
      if (isInQueue) {
        leaveQueue();
      }
    };
  }, []);

  useEffect(() => {
    // Navigate to game when match is found
    if (currentGame) {
      navigation.replace('Game');
    }
  }, [currentGame]);

  const handleCancel = () => {
    leaveQueue();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Config.COLORS.primary} />
          
          <Text style={styles.title}>Finding Opponent</Text>
          
          {queuePosition !== null && (
            <View style={styles.queueInfo}>
              <Text style={styles.queueText}>
                Queue Position: {queuePosition + 1}
              </Text>
            </View>
          )}

          <View style={styles.dotsContainer}>
            <Text style={styles.dots}>• • •</Text>
          </View>

          <Text style={styles.subtitle}>
            Searching for a player at your skill level
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Config.COLORS.text,
    marginTop: 30,
    marginBottom: 20,
  },
  queueInfo: {
    backgroundColor: Config.COLORS.card,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 20,
  },
  queueText: {
    fontSize: 16,
    fontWeight: '600',
    color: Config.COLORS.primary,
  },
  dotsContainer: {
    marginVertical: 20,
  },
  dots: {
    fontSize: 32,
    color: Config.COLORS.primary,
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Config.COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  cancelButton: {
    backgroundColor: Config.COLORS.danger,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Config.COLORS.text,
  },
});
