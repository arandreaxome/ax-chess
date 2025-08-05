import React from 'react';
import { Piece } from '../../types/chess';
import './ChessPiece.css';

interface ChessPieceProps {
  piece: Piece;
  position: { x: number; y: number };
  size: number;
  onDragStart?: (event: React.MouseEvent) => void;
  isDraggable?: boolean;
  isDragging?: boolean;
  style?: React.CSSProperties;
}

const ChessPiece: React.FC<ChessPieceProps> = ({
  piece,
  position,
  size,
  onDragStart,
  isDraggable = false,
  isDragging = false,
  style = {},
}) => {
  // Mapping des pièces vers leurs symboles Unicode
  const getPieceSymbol = (piece: Piece): string => {
    const symbols = {
      white: {
        K: '♔', // Roi blanc
        Q: '♕', // Dame blanche
        R: '♖', // Tour blanche
        B: '♗', // Fou blanc
        N: '♘', // Cavalier blanc
        P: '♙', // Pion blanc
      },
      black: {
        K: '♚', // Roi noir
        Q: '♛', // Dame noire
        R: '♜', // Tour noire
        B: '♝', // Fou noir
        N: '♞', // Cavalier noir
        P: '♟', // Pion noir
      },
    };

    return symbols[piece.color][piece.type] || '';
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (isDraggable && onDragStart) {
      onDragStart(event);
    }
  };

  const getPieceClasses = (): string => {
    const classes = ['chess-piece'];
    
    classes.push(`chess-piece--${piece.color}`);
    classes.push(`chess-piece--${piece.type.toLowerCase()}`);
    
    if (isDraggable) {
      classes.push('chess-piece--draggable');
    }
    
    if (isDragging) {
      classes.push('chess-piece--dragging');
    }
    
    return classes.join(' ');
  };

  const pieceStyle: React.CSSProperties = {
    position: isDragging ? 'fixed' : 'absolute',
    left: position.x,
    top: position.y,
    width: size,
    height: size,
    fontSize: size * 0.8, // Ajuster la taille du symbole
    cursor: isDraggable ? 'grab' : 'default',
    userSelect: 'none',
    ...style,
  };

  return (
    <div
      className={getPieceClasses()}
      style={pieceStyle}
      onMouseDown={handleMouseDown}
      draggable={false} // Désactiver le drag HTML5 natif
    >
      <span className="piece-symbol">
        {getPieceSymbol(piece)}
      </span>
    </div>
  );
};

export default ChessPiece;