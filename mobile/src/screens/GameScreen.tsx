import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { Board } from '../components/Board';
import Config from '../config/config';
import { PlayerSymbol } from '../types/game';

export const GameScreen = ({ navigation }: any) => {
  const { 
    currentGame, 
    mySymbol, 
    isMyTurn,
    user,
    makeMove, 
    forfeit,
    leaveGame,
    isOpponentDisconnected
  } = useGame();

  const [winner, setWinner] = useState<PlayerSymbol | 'draw' | null>(null);

  // 🔍 DEBUG LOGGING
  console.log(`🎮 GameScreen Render - currentGame: ${!!currentGame}, mySymbol: ${mySymbol}, user: ${!!user}`);
  if (currentGame) {
    console.log(`🎮 GameScreen - currentGame.board:`, currentGame.board);
    console.log(`🎮 GameScreen - currentGame.winner:`, currentGame.winner);
  }

  useEffect(() => {
    // Navigate back if no game
    if (!currentGame) {
      console.log('🎮 GameScreen - No currentGame, navigating to Home');
      navigation.replace('Home');
      return;
    }

    // Check for winner
    if (currentGame.winner) {
      console.log('🎮 GameScreen - Winner detected:', currentGame.winner);
      setWinner(currentGame.winner);
      
      // Show result and navigate back
      const timeout = setTimeout(() => {
        const isWin = currentGame.winner === mySymbol;
        const isDraw = currentGame.winner === 'draw';
        
        console.log('🎮 GameScreen - Showing alert: isWin=' + isWin + ', isDraw=' + isDraw);
        Alert.alert(
          isDraw ? 'Draw!' : isWin ? 'You Win! 🎉' : 'You Lose 😢',
          isDraw ? 'The game ended in a draw' : isWin ? 'Congratulations!' : 'Better luck next time!',
          [{ 
            text: 'OK', 
            onPress: () => {
              console.log('🎮 GameScreen - Alert dismissed, calling leaveGame()');
              leaveGame(); // Clean up game context state
              navigation.replace('Home');
            }
          }]
        );
      }, 1000);
      
      // Cleanup timeout on unmount
      return () => clearTimeout(timeout);
    }
  }, [currentGame, mySymbol, navigation, leaveGame]); // ✅ Added all dependencies

  const handleCellPress = (position: number) => {
    if (!isMyTurn || winner) return;
    makeMove(position);
  };

  const handleForfeit = () => {
    Alert.alert(
      'Forfeit Game?',
      'Are you sure you want to forfeit? You will lose ELO points.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Forfeit', 
          style: 'destructive',
          onPress: () => {
            forfeit();
            navigation.replace('Home');
          }
        }
      ]
    );
  };

  if (!currentGame || !mySymbol || !user) {
    console.log('GameScreen rendering null because data is missing.'); // Log why it's blank
    return null;
  }

  const opponent = currentGame.players[mySymbol === 'X' ? 'O' : 'X'];
  const isXTurn = currentGame.currentTurn === 'X';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{opponent.username}</Text>
            <Text style={[styles.symbol, styles.oSymbol]}>
              {mySymbol === 'X' ? 'O' : 'X'}
            </Text>
            {!isMyTurn && !winner && (
              <View style={styles.turnIndicator}>
                <Text style={styles.turnText}>Their turn</Text>
              </View>
            )}
          </View>

          {isOpponentDisconnected && (
            <View style={styles.disconnectedBanner}>
              <Text style={styles.disconnectedText}>
                ⚠️ Opponent disconnected
              </Text>
            </View>
          )}
        </View>

        {/* Game Board */}
        <View style={styles.boardContainer}>
          <Board
            board={currentGame.board}
            onCellPress={handleCellPress}
            disabled={!isMyTurn || !!winner}
            mySymbol={mySymbol}
            winningPattern={currentGame.winningPattern || null}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.playerInfo}>
            {isMyTurn && !winner && (
              <View style={styles.turnIndicator}>
                <Text style={styles.turnText}>Your turn</Text>
              </View>
            )}
            <Text style={[styles.symbol, styles.xSymbol]}>
              {mySymbol}
            </Text>
            <Text style={styles.playerName}>{user.username} (You)</Text>
          </View>

          <TouchableOpacity
            style={styles.forfeitButton}
            onPress={handleForfeit}
          >
            <Text style={styles.forfeitButtonText}>Forfeit</Text>
          </TouchableOpacity>
        </View>

        {/* Game status */}
        {winner && (
          <View style={styles.resultOverlay}>
            <View style={styles.resultCard}>
              <Text style={styles.resultText}>
                {winner === 'draw' 
                  ? "It's a Draw!" 
                  : winner === mySymbol 
                    ? 'You Win! 🎉' 
                    : 'You Lose 😢'}
              </Text>
            </View>
          </View>
        )}
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
  header: {
    marginBottom: 30,
  },
  playerInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  playerName: {
    fontSize: 20,
    fontWeight: '600',
    color: Config.COLORS.text,
    marginBottom: 8,
  },
  symbol: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  xSymbol: {
    color: Config.COLORS.xColor,
  },
  oSymbol: {
    color: Config.COLORS.oColor,
  },
  turnIndicator: {
    backgroundColor: Config.COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  turnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Config.COLORS.text,
  },
  disconnectedBanner: {
    backgroundColor: Config.COLORS.warning,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disconnectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: Config.COLORS.text,
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    marginTop: 30,
  },
  forfeitButton: {
    backgroundColor: Config.COLORS.danger,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  forfeitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Config.COLORS.text,
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: {
    backgroundColor: Config.COLORS.card,
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Config.COLORS.text,
  },
});
