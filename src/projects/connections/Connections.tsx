import React, { useState, useMemo, useEffect } from 'react';
import '../../App.css';
import './Connections.css';
import type { ConnectionGroups, Groups, GameState } from './types';
import { GROUPS } from './constants';
import { shuffleArray, parseItems } from './utils';
import { loadGame } from './services/firestore';
import GroupInput from './components/GroupInput';
import GameConfig from './components/GameConfig';
import ErrorMessages from './components/ErrorMessages';
import ItemGrid from './components/ItemGrid';
import PlayableItemGrid from './components/PlayableItemGrid';
import SaveGame from './components/SaveGame';

const Connections: React.FC = () => {
  const [groups, setGroups] = useState<Groups>({
    1: { title: 'Fruits', itemsInput: 'Apple, Banana, Cherry, Grape', items: [] },
    2: { title: 'Planets', itemsInput: 'Mercury, Venus, Earth, Mars', items: [] },
    3: { title: '', itemsInput: '', items: [] },
    4: { title: '', itemsInput: '', items: [] },
  });
  const TOTAL_ITEMS = 16;
  const MAX_MISTAKES = 4;
  const [shuffledItems, setShuffledItems] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    selectedItems: [],
    foundGroups: new Set<ConnectionGroups>(),
    mistakes: 0,
    isGameActive: false,
    isGameWon: false,
    wrongItems: [],
  });
  const [isLoadingGame, setIsLoadingGame] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);
  const [gameTitle, setGameTitle] = useState<string>('');

  /* ============================================
     Update Page Title
     ============================================ */
  useEffect(() => {
    // Set page title when component mounts or when game title/view mode changes
    if (isViewOnlyMode && gameTitle) {
      document.title = `${gameTitle} - Connections Game`;
    } else {
      document.title = 'Connections Game';
    }

    // Cleanup: restore default title when component unmounts
    return () => {
      document.title = 'LikSunRice';
    };
  }, [isViewOnlyMode, gameTitle]);

  /* ============================================
     Load Game from URL
     ============================================ */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    const editMode = urlParams.get('edit') === 'true' || urlParams.get('edit') === '1';

    if (gameId) {
      setIsLoadingGame(true);
      setLoadError(null);
      // Only set view-only mode if edit parameter is not present
      setIsViewOnlyMode(!editMode);

      loadGame(gameId)
        .then(loadedGame => {
          if (loadedGame) {
            setGroups(loadedGame.groups);
            setGameTitle(loadedGame.title);
            // Don't clear URL parameter - keep it for sharing
          } else {
            setLoadError('Game not found. Please check the link and try again.');
            setIsViewOnlyMode(false);
          }
        })
        .catch(err => {
          setLoadError(err instanceof Error ? err.message : 'Failed to load game');
          setIsViewOnlyMode(false);
        })
        .finally(() => {
          setIsLoadingGame(false);
        });
    }
  }, []);

  // Parse items for all groups
  const parsedGroups = useMemo(() => {
    const parsed: Groups = { ...groups };
    GROUPS.forEach(groupNum => {
      parsed[groupNum] = {
        ...parsed[groupNum],
        items: parseItems(parsed[groupNum].itemsInput),
      };
    });
    return parsed;
  }, [groups]);

  const currentItemCount = useMemo(() => {
    return GROUPS.reduce((sum, groupNum) => sum + parsedGroups[groupNum].items.length, 0);
  }, [parsedGroups]);

  // Auto-generate game when loaded in view-only mode (not edit mode)
  useEffect(() => {
    if (isViewOnlyMode && !isLoadingGame && currentItemCount === TOTAL_ITEMS && shuffledItems.length === 0) {
      // Validate and generate game automatically
      const allItems = GROUPS.flatMap(groupNum => parsedGroups[groupNum].items);
      const allItemsLower = allItems.map(item => item.toLowerCase());
      const uniqueItems = new Set(allItemsLower);
      
      // Only auto-generate if valid
      if (allItems.length === uniqueItems.size && allItems.length === TOTAL_ITEMS) {
        const finalShuffled = shuffleArray(allItems);
        setShuffledItems(finalShuffled);
        
        // Start the game
        setGameState({
          selectedItems: [],
          foundGroups: new Set<ConnectionGroups>(),
          mistakes: 0,
          isGameActive: true,
          isGameWon: false,
          wrongItems: [],
        });
      }
    }
  }, [isViewOnlyMode, isLoadingGame, currentItemCount, parsedGroups, shuffledItems.length]);

  // Create mapping from items to their groups
  const itemToGroupMap = useMemo(() => {
    const map = new Map<string, ConnectionGroups>();
    GROUPS.forEach((groupNum: ConnectionGroups) => {
      parsedGroups[groupNum].items.forEach(item => {
        map.set(item, groupNum);
      });
    });
    return map;
  }, [parsedGroups]);

  /* ============================================
     Group Management
     ============================================ */
  const updateGroup = (
    groupNumber: ConnectionGroups,
    field: 'title' | 'itemsInput',
    value: string
  ): void => {
    setGroups(prev => ({
      ...prev,
      [groupNumber]: {
        ...prev[groupNumber],
        [field]: value,
      },
    }));
    setShuffledItems([]);
  };

  /* ============================================
     Validation
     ============================================ */
  const validateGame = (): boolean => {
    const errors: string[] = [];

    if (currentItemCount !== TOTAL_ITEMS) {
      errors.push(
        `Grid size mismatch: ${currentItemCount} items added, but target is ${TOTAL_ITEMS}.`
      );
    }

    const allItems = GROUPS.flatMap((groupNum: ConnectionGroups) =>
      parsedGroups[groupNum].items.map((item: string) => item.toLowerCase())
    );
    const uniqueItems = new Set(allItems);
    if (allItems.length !== uniqueItems.size) {
      errors.push('Duplicate items found across groups. All items must be unique.');
    }

    GROUPS.forEach((groupNum: ConnectionGroups) => {
      const group = parsedGroups[groupNum];
      if (!group.title.trim()) {
        errors.push(`Group ${groupNum} has an empty title.`);
      }
      if (group.items.length === 0) {
        errors.push(`Group ${groupNum} "${group.title || 'Untitled'}" has no items.`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  /* ============================================
     Game Generation
     ============================================ */
  const handleGenerate = (): void => {
    if (!validateGame()) {
      setShuffledItems([]);
      return;
    }

    const allItems = GROUPS.flatMap(groupNum => parsedGroups[groupNum].items);
    const finalShuffled = shuffleArray(allItems);
    setShuffledItems(finalShuffled);
    
    // Reset game state and start new game
    setGameState({
      selectedItems: [],
      foundGroups: new Set<ConnectionGroups>(),
      mistakes: 0,
      isGameActive: true,
      isGameWon: false,
      wrongItems: [],
    });
  };

  /* ============================================
     Game Play Logic
     ============================================ */
  const handleItemClick = (item: string): void => {
    if (!gameState.isGameActive || gameState.foundGroups.has(itemToGroupMap.get(item)!)) {
      return;
    }

    setGameState(prev => {
      const selected = [...prev.selectedItems];
      const itemIndex = selected.indexOf(item);
      
      if (itemIndex > -1) {
        // Deselect item
        selected.splice(itemIndex, 1);
      } else if (selected.length < 4) {
        // Select item
        selected.push(item);
      }
      
      return { ...prev, selectedItems: selected };
    });
  };

  const handleDeselect = (): void => {
    setGameState(prev => ({ ...prev, selectedItems: [] }));
  };

  const handleSubmit = (): void => {
    if (gameState.selectedItems.length !== 4 || !gameState.isGameActive) {
      return;
    }

    // Check if all selected items belong to the same group
    const selectedGroups = gameState.selectedItems.map(item => itemToGroupMap.get(item)!);
    const uniqueGroups = new Set(selectedGroups);
    
    if (uniqueGroups.size === 1) {
      // Correct! Found a group
      const foundGroup = selectedGroups[0];
      setGameState(prev => {
        const newFoundGroups = new Set(prev.foundGroups);
        newFoundGroups.add(foundGroup);
        const isWon = newFoundGroups.size === 4;
        
        return {
          ...prev,
          selectedItems: [],
          foundGroups: newFoundGroups,
          isGameWon: isWon,
          isGameActive: !isWon,
        };
      });
    } else {
      // Wrong guess - increment mistakes and show wrong items temporarily
      setGameState(prev => {
        const newMistakes = prev.mistakes + 1;
        const isGameOver = newMistakes >= MAX_MISTAKES;
        
        return {
          ...prev,
          selectedItems: [],
          mistakes: newMistakes,
          isGameActive: !isGameOver,
          wrongItems: [...prev.selectedItems],
        };
      });
      
      // Clear wrong items after animation
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          wrongItems: [],
        }));
      }, 1000);
    }
  };

  /* ============================================
     Main Render
     ============================================ */
  return (
    <div className="app-container connections-page">
      <div className="main-content">
        <h1 className="main-title">
          {isViewOnlyMode 
            ? (gameTitle || 'Connections Game')
            : 'Custom Connections Builder'}
        </h1>

        {isLoadingGame && (
          <div className="loading-message">
            <p>Loading game...</p>
          </div>
        )}

        {loadError && (
          <div className="error-messages">
            <p className="error-title">Error Loading Game:</p>
            <p>{loadError}</p>
          </div>
        )}


        {!isViewOnlyMode && (
          <>
            <GameConfig 
              currentItemCount={currentItemCount}
              gameTitle={gameTitle}
              onTitleChange={setGameTitle}
            />

            <div className="connections-list">
              {GROUPS.map(groupNum => (
                <GroupInput
                  key={groupNum}
                  groupNumber={groupNum}
                  group={groups[groupNum]}
                  onUpdate={updateGroup}
                />
              ))}
            </div>
          </>
        )}

        <div className="output-card">
          {!isViewOnlyMode && <SaveGame groups={groups} title={gameTitle} />}

          {!isViewOnlyMode && (
            <button onClick={handleGenerate} className="generate-btn">
              Generate & Shuffle Game Grid
            </button>
          )}

          {!isViewOnlyMode && <ErrorMessages errors={validationErrors} />}
          
          {gameState.isGameActive || gameState.foundGroups.size > 0 ? (
            <PlayableItemGrid
              items={shuffledItems}
              itemToGroupMap={itemToGroupMap}
              groups={parsedGroups}
              gameState={gameState}
              onItemClick={handleItemClick}
              onSubmit={handleSubmit}
              onDeselect={handleDeselect}
            />
          ) : (
            !isViewOnlyMode && <ItemGrid items={shuffledItems} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Connections;

