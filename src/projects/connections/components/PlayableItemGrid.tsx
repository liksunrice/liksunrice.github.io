import React from 'react';
import type { PlayableItemGridProps, ItemState, ConnectionGroups } from '../types';
import { GROUP_MAP } from '../constants';

const PlayableItemGrid: React.FC<PlayableItemGridProps> = ({
  items,
  itemToGroupMap,
  groups,
  gameState,
  onItemClick,
  onSubmit,
  onDeselect,
}) => {
  const getItemState = (item: string): ItemState => {
    if (gameState.foundGroups.has(itemToGroupMap.get(item)!)) {
      return 'found';
    }
    if (gameState.wrongItems.includes(item)) {
      return 'wrong';
    }
    if (gameState.selectedItems.includes(item)) {
      return 'selected';
    }
    return 'default';
  };

  const getGroupClass = (item: string): string => {
    const groupNum = itemToGroupMap.get(item);
    if (groupNum && gameState.foundGroups.has(groupNum)) {
      return GROUP_MAP[groupNum].class;
    }
    return '';
  };

  const canSubmit = gameState.selectedItems.length === 4;
  const isGameOver = gameState.isGameWon || !gameState.isGameActive;

  return (
    <div>
      <div className="game-info">
        <div className="game-stats">
          <p className="stat-item">
            Groups Found: <span className="stat-value">{gameState.foundGroups.size} / 4</span>
          </p>
          <p className="stat-item">
            Mistakes: <span className="stat-value">{gameState.mistakes} / 4</span>
          </p>
        </div>
        {gameState.isGameWon && (
          <div className="game-won-message">
            🎉 Congratulations! You found all groups!
          </div>
        )}
        {!gameState.isGameActive && !gameState.isGameWon && (
          <div className="game-lost-message">
            Game Over! You ran out of mistakes.
          </div>
        )}
      </div>

      <div className="item-grid">
        {items.map((item, index) => {
          const state = getItemState(item);
          const groupClass = getGroupClass(item);
          const isClickable = state !== 'found' && gameState.isGameActive;

          return (
            <div
              key={index}
              className={`grid-item grid-item-${state} ${groupClass}`}
              onClick={() => isClickable && onItemClick(item)}
            >
              {item}
            </div>
          );
        })}
      </div>

      {gameState.selectedItems.length > 0 && (
        <div className="selection-controls">
          <div className="selected-items">
            <p className="input-label">Selected ({gameState.selectedItems.length} / 4):</p>
            <div className="selected-items-list">
              {gameState.selectedItems.map((item, idx) => (
                <span key={idx} className="selected-item-tag">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="selection-buttons">
            <button
              onClick={onDeselect}
              className="deselect-btn"
              disabled={!gameState.isGameActive}
            >
              Deselect All
            </button>
            <button
              onClick={onSubmit}
              className="submit-btn"
              disabled={!canSubmit || !gameState.isGameActive}
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {gameState.foundGroups.size > 0 && (
        <div className="found-groups">
          <h3 className="grid-title">Found Groups:</h3>
          {Array.from(gameState.foundGroups).map(groupNum => {
            const group = groups[groupNum];
            return (
              <div key={groupNum} className={`found-group ${GROUP_MAP[groupNum].class}`}>
                <div className="found-group-header">
                  <span className="found-group-title">{group.title}</span>
                </div>
                <div className="found-group-items">
                  {group.items.map((item, idx) => (
                    <span key={idx} className={`found-item ${GROUP_MAP[groupNum].class}`}>{item}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlayableItemGrid;

