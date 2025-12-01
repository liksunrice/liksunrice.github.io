import React from 'react';

interface GameConfigProps {
  currentItemCount: number;
  gameTitle: string;
  onTitleChange: (title: string) => void;
}

const TOTAL_ITEMS = 16;

const GameConfig: React.FC<GameConfigProps> = ({ currentItemCount, gameTitle, onTitleChange }) => {
  const isMatch = currentItemCount === TOTAL_ITEMS;
  const tallyClass = isMatch ? 'tally-match' : 'tally-mismatch';

  return (
    <div className="config-card">
      <h2 className="config-title">Game Configuration</h2>

      <div className="input-group">
        <label className="input-label">Game Title (optional):</label>
        <input
          type="text"
          value={gameTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter a title for this game..."
          className="game-title-input"
        />
      </div>

      <div className="tally-display">
        <p className="input-label">Current Item Tally:</p>
        <p className={`tally-value ${tallyClass}`}>
          {currentItemCount} / {TOTAL_ITEMS}
        </p>
        {!isMatch && (
          <p className="tally-error">Item count must match grid size!</p>
        )}
      </div>
    </div>
  );
};

export default GameConfig;

