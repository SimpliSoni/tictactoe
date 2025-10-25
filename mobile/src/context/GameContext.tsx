import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { socketService } from '../services/socket';
import { getDeviceId } from '../utils/device';
import { GameState, UserProfile, UserStats, Board, PlayerSymbol } from '../types/game';
import { Socket } from 'socket.io-client';

interface GameContextType {
  // Connection
  isConnected: boolean;
  isAuthenticated: boolean;
  
  // User
  user: UserProfile | null;
  
  // Game state
  currentGame: GameState | null;
  mySymbol: PlayerSymbol | null;
  isMyTurn: boolean;
  
  // Matchmaking
  isInQueue: boolean;
  queuePosition: number | null;
  
  // Opponent status
  isOpponentDisconnected: boolean;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  setUsername: (username: string) => void;
  joinQueue: () => void;
  leaveQueue: () => void;
  makeMove: (position: number) => void;
  leaveGame: () => void;
  forfeit: () => void;
  
  // Error
  error: string | null;
  clearError: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentGame, setCurrentGame] = useState<GameState | null>(null);
  const [mySymbol, setMySymbol] = useState<PlayerSymbol | null>(null);
  const [isInQueue, setIsInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [isOpponentDisconnected, setIsOpponentDisconnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const setupSocketListeners = (socketInstance: Socket) => {
    // Connection events
    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      
      // Auto-authenticate on connection
      const deviceId = getDeviceId();
      socketService.authenticate(deviceId);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
      setIsAuthenticated(false);
    });

    socketInstance.on('connect_error', (err: Error) => {
      console.error('Connection error:', err.message);
      setError(`Connection error: ${err.message}`);
    });

    // Auth events
    socketInstance.on('authenticated', (data: { userId: string; username: string; stats: UserStats; elo: number }) => {
      console.log('Authenticated:', data.username);
      setIsAuthenticated(true);
      setUser({
        userId: data.userId,
        username: data.username,
        stats: data.stats,
        elo: data.elo,
      });
    });

    // Matchmaking events
    socketInstance.on('queueStatus', (data: { position: number }) => {
      console.log('Queue position:', data.position);
      setQueuePosition(data.position);
    });

    socketInstance.on('matchFound', (game: GameState) => {
      console.log('Match found!', game.gameId);
      setIsInQueue(false);
      setQueuePosition(null);
      setCurrentGame(game);
      
      // Determine my symbol - ADD LOGGING HERE
      if (user) {
        let symbol: PlayerSymbol | null = null; // Variable to hold the symbol
        if (game.players.X.userId === user.userId) {
          symbol = 'X';
        } else if (game.players.O.userId === user.userId) { // Added explicit check
          symbol = 'O';
        }
        console.log(`Determined mySymbol: ${symbol} (User ID: ${user.userId}, X ID: ${game.players.X.userId}, O ID: ${game.players.O.userId})`); // Log determination
        setMySymbol(symbol); // Set the symbol
      } else {
        console.error('Match found but user data is missing!'); // Log if user is missing
        setError('User data missing when match found.');
      }
    });

    // Game events
    socketInstance.on('gameUpdate', (state: GameState) => {
      console.log('Game updated');
      setCurrentGame(state);
    });

    socketInstance.on('opponentMove', (data: { position: number; board: Board; nextTurn: PlayerSymbol }) => {
      console.log('Opponent moved:', data.position);
      if (currentGame) {
        setCurrentGame({
          ...currentGame,
          board: data.board,
          currentTurn: data.nextTurn,
        });
      }
    });

    socketInstance.on('gameOver', (result: { winner: PlayerSymbol | 'draw'; stats: UserStats; eloChange: number }) => {
      console.log('Game over:', result.winner);
      
      // Update user stats
      if (user) {
        setUser({
          ...user,
          stats: result.stats,
          elo: user.elo + result.eloChange,
        });
      }
      
      // Show game result
      setTimeout(() => {
        setCurrentGame(null);
        setMySymbol(null);
      }, 3000); // Show result for 3 seconds
    });

    socketInstance.on('opponentDisconnected', (data: { timeoutSeconds: number }) => {
      console.log('Opponent disconnected');
      setIsOpponentDisconnected(true);
      setError(`Opponent disconnected. Waiting ${data.timeoutSeconds}s...`);
    });

    socketInstance.on('opponentReconnected', () => {
      console.log('Opponent reconnected');
      setIsOpponentDisconnected(false);
      setError(null);
    });

    // Error events
    socketInstance.on('error', (data: { message: string }) => {
      console.error('Server error:', data.message);
      setError(data.message);
    });
  };

  const connect = () => {
    const socketInstance = socketService.connect();
    setSocket(socketInstance);
    setupSocketListeners(socketInstance);
  };

  const disconnect = () => {
    socketService.disconnect();
    setIsConnected(false);
    setIsAuthenticated(false);
    setUser(null);
    setCurrentGame(null);
    setMySymbol(null);
    setIsInQueue(false);
    setSocket(null);
  };

  const setUsername = (username: string) => {
    if (user) {
      setUser({ ...user, username });
    }
  };

  const joinQueue = () => {
    socketService.joinQueue();
    setIsInQueue(true);
  };

  const leaveQueue = () => {
    socketService.leaveQueue();
    setIsInQueue(false);
    setQueuePosition(null);
  };

  const makeMove = (position: number) => {
    if (!currentGame || !mySymbol) return;
    if (currentGame.currentTurn !== mySymbol) {
      setError("It's not your turn!");
      return;
    }
    if (currentGame.board[position] !== null) {
      setError('Cell already occupied!');
      return;
    }
    
    socketService.makeMove(position);
    
    // Optimistically update UI
    const newBoard = [...currentGame.board] as Board;
    newBoard[position] = mySymbol;
    const nextTurn = mySymbol === 'X' ? 'O' : 'X';
    setCurrentGame({
      ...currentGame,
      board: newBoard,
      currentTurn: nextTurn,
    });
  };

  const leaveGame = () => {
    socketService.leaveGame();
    setCurrentGame(null);
    setMySymbol(null);
  };

  const forfeit = () => {
    socketService.forfeit();
    setCurrentGame(null);
    setMySymbol(null);
  };

  const clearError = () => {
    setError(null);
  };

  const isMyTurn = currentGame && mySymbol ? currentGame.currentTurn === mySymbol : false;

  const value: GameContextType = {
    isConnected,
    isAuthenticated,
    user,
    currentGame,
    mySymbol,
    isMyTurn,
    isInQueue,
    queuePosition,
    isOpponentDisconnected,
    connect,
    disconnect,
    setUsername,
    joinQueue,
    leaveQueue,
    makeMove,
    leaveGame,
    forfeit,
    error,
    clearError,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
