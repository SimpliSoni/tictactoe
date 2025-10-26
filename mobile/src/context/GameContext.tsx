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
  const [gameOverTimeout, setGameOverTimeout] = useState<NodeJS.Timeout | null>(null);

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
      
      // Determine my symbol by comparing socket ID to avoid race condition with user state
      // The socketInstance.id is always available and doesn't suffer from stale closure issues
      if (socketInstance.id === game.players.X.socketId) {
        console.log('Determined mySymbol: X (Socket ID: ' + socketInstance.id + ')');
        setMySymbol('X');
      } else if (socketInstance.id === game.players.O.socketId) {
        console.log('Determined mySymbol: O (Socket ID: ' + socketInstance.id + ')');
        setMySymbol('O');
      } else {
        // This should not happen, but good to have a check
        console.error('Match found but my socket ID is not in the game object!');
        console.error('My Socket ID:', socketInstance.id);
        console.error('Player X Socket ID:', game.players.X.socketId);
        console.error('Player O Socket ID:', game.players.O.socketId);
        setError('Error joining match: Player not found in game.');
      }
    });

    // Game events
    socketInstance.on('gameUpdate', (state: GameState) => {
      console.log('Game updated');
      setCurrentGame(state);
    });

    socketInstance.on('opponentMove', (data: { position: number; board: Board; nextTurn: PlayerSymbol }) => {
      console.log('Opponent moved:', data.position);
      // Use functional setState to avoid stale closure
      setCurrentGame((prevGame) => {
        if (!prevGame) {
          console.warn('Received opponentMove but currentGame is null');
          return prevGame;
        }
        return {
          ...prevGame,
          board: data.board,
          currentTurn: data.nextTurn,
        };
      });
    });

    socketInstance.on('gameOver', (result: { winner: PlayerSymbol | 'draw'; stats: UserStats | null; eloChange: number }) => {
      console.log('Game over:', result.winner);
      
      // Use functional setState to avoid stale closure
      // Only update stats if provided (not null for forfeit/leave scenarios)
      if (result.stats) {
        setUser((prevUser) => {
          if (!prevUser) {
            console.warn('Received gameOver but user is null');
            return prevUser;
          }
          return {
            ...prevUser,
            stats: result.stats!,
            elo: prevUser.elo + result.eloChange,
          };
        });
      }
      
      // Show game result with cleanup
      // Clear any existing timeout first
      if (gameOverTimeout) {
        clearTimeout(gameOverTimeout);
      }
      
      const timeout = setTimeout(() => {
        setCurrentGame(null);
        setMySymbol(null);
        setGameOverTimeout(null);
      }, 3000); // Show result for 3 seconds
      
      setGameOverTimeout(timeout);
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

  const cleanupSocketListeners = (socketInstance: Socket) => {
    // Remove all listeners to prevent memory leaks
    socketInstance.off('connect');
    socketInstance.off('disconnect');
    socketInstance.off('connect_error');
    socketInstance.off('authenticated');
    socketInstance.off('queueStatus');
    socketInstance.off('matchFound');
    socketInstance.off('gameUpdate');
    socketInstance.off('opponentMove');
    socketInstance.off('gameOver');
    socketInstance.off('opponentDisconnected');
    socketInstance.off('opponentReconnected');
    socketInstance.off('error');
    console.log('Socket listeners cleaned up');
  };

  const connect = () => {
    const socketInstance = socketService.connect();
    setSocket(socketInstance);
    setupSocketListeners(socketInstance);
  };

  const disconnect = () => {
    // Clean up timeout if exists
    if (gameOverTimeout) {
      clearTimeout(gameOverTimeout);
      setGameOverTimeout(null);
    }
    
    // Clean up listeners before disconnecting
    if (socket) {
      cleanupSocketListeners(socket);
    }
    
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
    // Use functional setState to avoid potential stale state
    setUser((prevUser) => {
      if (!prevUser) {
        console.warn('Attempted to set username but user is null');
        return prevUser;
      }
      return { ...prevUser, username };
    });
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
    
    // Optimistically update UI using functional setState
    setCurrentGame((prevGame) => {
      if (!prevGame || !mySymbol) return prevGame;
      
      const newBoard = [...prevGame.board] as Board;
      newBoard[position] = mySymbol;
      const nextTurn: PlayerSymbol = mySymbol === 'X' ? 'O' : 'X';
      return {
        ...prevGame,
        board: newBoard,
        currentTurn: nextTurn,
      };
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
