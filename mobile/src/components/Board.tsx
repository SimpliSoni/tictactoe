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
const BOARD_SIZE = Math.min(width - 60, 360);
const GAP_SIZE = 10;
const CELL_SIZE = (BOARD_SIZE - GAP_SIZE * 4) / 3; // 4 gaps total (outer + inner)

export const Board: React.FC<BoardProps> = ({ 
  board, 
  onCellPress, 
  disabled,
  mySymbol,
  winningPattern 
}) => {
  const renderRow = (rowIndex: number) => {
    const cells = [];
    for (let col = 0; col < 3; col++) {
      const index = rowIndex * 3 + col;
      const value = board[index];
      const isWinningCell = winningPattern?.includes(index);
      const isDisabled = disabled || value !== null;

      cells.push(
        <TouchableOpacity
          key={index}
          style={[
            styles.cell,
            isWinningCell && styles.winningCell,
          ]}
          onPress={() => {
            console.log(`Cell ${index} pressed, value: ${value}, disabled: ${isDisabled}`);
            if (!isDisabled) {
              onCellPress(index);
            }
          }}
          disabled={isDisabled}
          activeOpacity={0.6}
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
    }
    return cells;
  };

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        <View style={styles.row}>
          {renderRow(0)}
        </View>
        <View style={styles.row}>
          {renderRow(1)}
        </View>
        <View style={styles.row}>
          {renderRow(2)}
        </View>
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
    backgroundColor: Config.COLORS.background,
    padding: GAP_SIZE,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: Config.COLORS.border,
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: CELL_SIZE,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Config.COLORS.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Config.COLORS.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  winningCell: {
    backgroundColor: Config.COLORS.winningCell,
    borderColor: Config.COLORS.secondary,
    borderWidth: 3,
  },
  cellText: {
    fontSize: Math.floor(CELL_SIZE * 0.65),
    fontWeight: '900',
    textAlign: 'center',
  },
  xText: {
    color: Config.COLORS.xColor,
  },
  oText: {
    color: Config.COLORS.oColor,
  },
  winningText: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
