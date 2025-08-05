import React from 'react';
import { Position, SquareHighlight } from '../../types/chess';
import './ChessSquare.css';

interface ChessSquareProps {
  position: Position;
  coordinates: { x: number; y: number };
  isLight: boolean;
  highlight?: SquareHighlight;
  onClick: (position: Position) => void;
  size: number;
}

const ChessSquare: React.FC<ChessSquareProps> = ({
  position,
  coordinates,
  isLight,
  highlight,
  onClick,
  size,
}) => {
  const handleClick = () => {
    onClick(position);
  };

  const getSquareClasses = (): string => {
    const classes = ['chess-square'];
    
    if (isLight) {
      classes.push('chess-square--light');
    } else {
      classes.push('chess-square--dark');
    }
    
    if (highlight) {
      classes.push(`chess-square--${highlight.type}`);
    }
    
    return classes.join(' ');
  };

  const renderHighlightIndicator = () => {
    if (!highlight) return null;

    switch (highlight.type) {
      case 'possible':
        return <div className="square-indicator square-indicator--possible" />;
      case 'selected':
        return <div className="square-indicator square-indicator--selected" />;
      case 'check':
        return <div className="square-indicator square-indicator--check" />;
      case 'lastMove':
        return <div className="square-indicator square-indicator--last-move" />;
      case 'capture':
        return <div className="square-indicator square-indicator--capture" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={getSquareClasses()}
      style={{
        position: 'absolute',
        left: coordinates.x,
        top: coordinates.y,
        width: size,
        height: size,
      }}
      onClick={handleClick}
    >
      {renderHighlightIndicator()}
    </div>
  );
};

export default ChessSquare;