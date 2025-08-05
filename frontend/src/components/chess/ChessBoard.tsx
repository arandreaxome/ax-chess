import React, { useCallback, useRef, useState } from 'react';
import { Position, Piece, SquareHighlight, DragState } from '../../types/chess';
import { useGame } from '../../contexts/GameContext';
import ChessSquare from './ChessSquare';
import ChessPiece from './ChessPiece';
import './ChessBoard.css';

interface ChessBoardProps {
  orientation?: 'white' | 'black';
  size?: number;
  interactive?: boolean;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ 
  orientation = 'white', 
  size = 480,
  interactive = true 
}) => {
  const { 
    game, 
    selectedSquare, 
    highlights, 
    selectSquare, 
    makeMove, 
    isMyTurn,
    myColor 
  } = useGame();

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
  });

  const boardRef = useRef<HTMLDivElement>(null);

  // Calculer les coordonnées d'une position sur l'échiquier
  const getSquareCoordinates = useCallback((rank: number, file: number): { x: number; y: number } => {
    const squareSize = size / 8;
    
    if (orientation === 'white') {
      return {
        x: file * squareSize,
        y: (7 - rank) * squareSize,
      };
    } else {
      return {
        x: (7 - file) * squareSize,
        y: rank * squareSize,
      };
    }
  }, [size, orientation]);

  // Calculer la position à partir des coordonnées
  const getPositionFromCoordinates = useCallback((x: number, y: number): Position | null => {
    if (!boardRef.current) return null;
    
    const rect = boardRef.current.getBoundingClientRect();
    const relativeX = x - rect.left;
    const relativeY = y - rect.top;
    
    if (relativeX < 0 || relativeY < 0 || relativeX > size || relativeY > size) {
      return null;
    }
    
    const squareSize = size / 8;
    let file = Math.floor(relativeX / squareSize);
    let rank = Math.floor(relativeY / squareSize);
    
    if (orientation === 'white') {
      rank = 7 - rank;
    } else {
      file = 7 - file;
    }
    
    if (rank < 0 || rank > 7 || file < 0 || file > 7) {
      return null;
    }
    
    return { rank, file };
  }, [size, orientation]);

  // Récupérer une pièce à une position donnée
  const getPieceAt = useCallback((position: Position): Piece | null => {
    if (!game?.gameState.board) return null;
    return game.gameState.board[position.rank][position.file];
  }, [game?.gameState.board]);

  // Gérer le clic sur une case
  const handleSquareClick = useCallback((position: Position) => {
    if (!interactive || !isMyTurn || dragState.isDragging) return;

    const piece = getPieceAt(position);
    
    if (selectedSquare) {
      // Si une case est déjà sélectionnée
      if (selectedSquare.rank === position.rank && selectedSquare.file === position.file) {
        // Clic sur la même case = désélectionner
        selectSquare(null);
      } else {
        // Tentative de mouvement
        const selectedPiece = getPieceAt(selectedSquare);
        if (selectedPiece && selectedPiece.color === myColor) {
          makeMove(selectedSquare, position);
        }
        selectSquare(null);
      }
    } else {
      // Aucune case sélectionnée
      if (piece && piece.color === myColor) {
        selectSquare(position);
      }
    }
  }, [
    interactive, 
    isMyTurn, 
    dragState.isDragging, 
    selectedSquare, 
    selectSquare, 
    makeMove, 
    getPieceAt, 
    myColor
  ]);

  // Gérer le début du drag
  const handleDragStart = useCallback((position: Position, event: React.MouseEvent) => {
    if (!interactive || !isMyTurn) return;

    const piece = getPieceAt(position);
    if (!piece || piece.color !== myColor) return;

    event.preventDefault();
    
    setDragState({
      isDragging: true,
      piece,
      startPosition: position,
      currentPosition: { x: event.clientX, y: event.clientY },
    });

    selectSquare(position);
  }, [interactive, isMyTurn, getPieceAt, myColor, selectSquare]);

  // Gérer le mouvement du drag
  const handleDragMove = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging) return;

    setDragState(prev => ({
      ...prev,
      currentPosition: { x: event.clientX, y: event.clientY },
    }));
  }, [dragState.isDragging]);

  // Gérer la fin du drag
  const handleDragEnd = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging || !dragState.startPosition) return;

    const endPosition = getPositionFromCoordinates(event.clientX, event.clientY);
    
    if (endPosition && 
        (endPosition.rank !== dragState.startPosition.rank || 
         endPosition.file !== dragState.startPosition.file)) {
      makeMove(dragState.startPosition, endPosition);
    }

    setDragState({ isDragging: false });
    selectSquare(null);
  }, [dragState, getPositionFromCoordinates, makeMove, selectSquare]);

  // Événements de drag globaux
  React.useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  // Générer les cases de l'échiquier
  const renderSquares = () => {
    const squares = [];
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const position: Position = { rank, file };
        const piece = getPieceAt(position);
        const coordinates = getSquareCoordinates(rank, file);
        const isLight = (rank + file) % 2 === 0;
        
        // Trouver les highlights pour cette case
        const highlight = highlights.find(h => 
          h.position.rank === rank && h.position.file === file
        );

        squares.push(
          <ChessSquare
            key={`${rank}-${file}`}
            position={position}
            coordinates={coordinates}
            isLight={isLight}
            highlight={highlight}
            onClick={handleSquareClick}
            size={size / 8}
          />
        );

        // Ajouter la pièce si elle existe et n'est pas en cours de drag
        if (piece && 
            !(dragState.isDragging && 
              dragState.startPosition?.rank === rank && 
              dragState.startPosition?.file === file)) {
          squares.push(
            <ChessPiece
              key={`piece-${rank}-${file}`}
              piece={piece}
              position={coordinates}
              size={size / 8}
              onDragStart={(e) => handleDragStart(position, e)}
              isDraggable={interactive && isMyTurn && piece.color === myColor}
            />
          );
        }
      }
    }

    return squares;
  };

  // Rendu de la pièce en cours de drag
  const renderDraggedPiece = () => {
    if (!dragState.isDragging || !dragState.piece || !dragState.currentPosition) {
      return null;
    }

    return (
      <ChessPiece
        piece={dragState.piece}
        position={{
          x: dragState.currentPosition.x - (size / 16), // Centrer la pièce sur le curseur
          y: dragState.currentPosition.y - (size / 16),
        }}
        size={size / 8}
        isDragging={true}
        style={{ pointerEvents: 'none', zIndex: 1000 }}
      />
    );
  };

  return (
    <div className="chess-board-container">
      <div 
        ref={boardRef}
        className={`chess-board chess-board--${orientation}`}
        style={{ 
          width: size, 
          height: size,
          cursor: dragState.isDragging ? 'grabbing' : 'default'
        }}
      >
        {renderSquares()}
        
        {/* Coordonnées */}
        <div className="board-coordinates">
          {/* Lettres des colonnes */}
          {Array.from({ length: 8 }, (_, i) => {
            const file = orientation === 'white' ? i : 7 - i;
            const letter = String.fromCharCode(97 + file); // a-h
            return (
              <div
                key={`file-${i}`}
                className="coordinate coordinate--file"
                style={{
                  left: i * (size / 8) + (size / 16),
                  bottom: -20,
                }}
              >
                {letter}
              </div>
            );
          })}
          
          {/* Numéros des rangées */}
          {Array.from({ length: 8 }, (_, i) => {
            const rank = orientation === 'white' ? 7 - i : i;
            return (
              <div
                key={`rank-${i}`}
                className="coordinate coordinate--rank"
                style={{
                  top: i * (size / 8) + (size / 16),
                  left: -20,
                }}
              >
                {rank + 1}
              </div>
            );
          })}
        </div>
      </div>
      
      {renderDraggedPiece()}
    </div>
  );
};

export default ChessBoard;