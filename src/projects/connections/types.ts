export type ConnectionGroups = 1 | 2 | 3 | 4;

export interface Group {
  title: string;
  itemsInput: string;
  items: string[];
}

export type Groups = Record<ConnectionGroups, Group>;

export interface GroupInputProps {
  groupNumber: ConnectionGroups;
  group: Group;
  onUpdate: (groupNumber: ConnectionGroups, field: 'title' | 'itemsInput', value: string) => void;
}

export interface GroupConfig {
  class: string;
  label: string;
}

export type GroupMap = {
  [key in ConnectionGroups]: GroupConfig;
};

export type ItemState = 'default' | 'selected' | 'found' | 'wrong';

export interface GameState {
  selectedItems: string[];
  foundGroups: Set<ConnectionGroups>;
  mistakes: number;
  isGameActive: boolean;
  isGameWon: boolean;
  wrongItems: string[];
}

export interface PlayableItemGridProps {
  items: string[];
  itemToGroupMap: Map<string, ConnectionGroups>;
  groups: Groups;
  gameState: GameState;
  onItemClick: (item: string) => void;
  onSubmit: () => void;
  onDeselect: () => void;
}

