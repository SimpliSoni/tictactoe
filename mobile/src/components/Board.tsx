import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { Board as BoardType, CellValue, PlayerSymbol } from '../types/game';
import Config from '../config/config';

interface BoardProps {
  board: BoardType;
  onCellPress: (position: number) => void;
  disabled: boolean;
  mySymbol: PlayerSymbol | null;
  winningPattern?: number[] | null;
}

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 40, 400);
// Calculate CELL_SIZE for text sizing only (not for cell dimensions)
const CELL_SIZE = BOARD_SIZE / 3;

// 🔍 DEBUG LOG
console.log(`🎮 Board.tsx - Window Width: ${width}, BOARD_SIZE: ${BOARD_SIZE}, CELL_SIZE: ${CELL_SIZE}`);

export const Board: React.FC<BoardProps> = ({ 
  board, 
  onCellPress, 
  disabled,
  mySymbol,
  winningPattern 
}) => {
  // 🔍 DEBUG LOG - Check what board data is received
  console.log('🎮 Board.tsx - Rendering with board prop:', board);
  console.log('🎮 Board.tsx - winningPattern:', winningPattern);
  
  const renderCell = (value: CellValue, index: number) => {
    const isWinningCell = winningPattern?.includes(index);
    const isDisabled = disabled || value !== null;
    const isRightColumn = (index + 1) % 3 === 0;
    const isBottomRow = index >= 6;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.cell,
          !isRightColumn && styles.cellBorderRight,
          !isBottomRow && styles.cellBorderBottom,
          isWinningCell && styles.winningCell,
        ]}
        onPress={() => !isDisabled && onCellPress(index)}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        {value && (
          <Text
            style={[
              styles.cellText,
              value === 'X' && styles.xText,
              value === 'O' && styles.oText,
              isWinningCell && styles.winningText,
            ]}
          >
            {value}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        {board.map((cell, index) => renderCell(cell, index))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: Config.COLORS.background,
    borderWidth: 3, // 🔍 DEBUG: Make thicker to see if board renders
    borderColor: '#00FF00', // 🔍 DEBUG: Bright green border
    borderRadius: 8,
    overflow: 'hidden',
  },
  cell: {
    width: '33.3333%', // Flexbox percentage-based width
    aspectRatio: 1, // Maintain square aspect ratio
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Config.COLORS.emptyCell,
    borderWidth: 1, // 🔍 DEBUG: Add visible border to cells
    borderColor: '#FF00FF', // 🔍 DEBUG: Bright magenta
    boxSizing: 'border-box', // Include borders in width calculation
  },
  cellBorderRight: {
    borderRightWidth: 1,
    borderRightColor: Config.COLORS.border,
  },
  cellBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: Config.COLORS.border,
  },
  winningCell: {
    backgroundColor: Config.COLORS.winningCell,
  },
  cellText: {
    fontSize: BOARD_SIZE / 5, // Scale text relative to board size
    fontWeight: 'bold',
  },
  xText: {
    color: Config.COLORS.xColor,
  },
  oText: {
    color: Config.COLORS.oColor,
  },
  winningText: {
    color: '#FFFFFF',
  },
});
