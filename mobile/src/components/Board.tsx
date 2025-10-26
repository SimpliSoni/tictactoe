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
const CELL_SIZE = BOARD_SIZE / 3;

export const Board: React.FC<BoardProps> = ({ 
  board, 
  onCellPress, 
  disabled,
  mySymbol,
  winningPattern 
}) => {
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
    borderWidth: 2,
    borderColor: Config.COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cell: {
    width: '33.3333%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Config.COLORS.emptyCell,
  },
  cellBorderRight: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Config.COLORS.border,
  },
  cellBorderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Config.COLORS.border,
  },
  winningCell: {
    backgroundColor: Config.COLORS.winningCell,
  },
  cellText: {
    fontSize: CELL_SIZE * 0.6,
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
