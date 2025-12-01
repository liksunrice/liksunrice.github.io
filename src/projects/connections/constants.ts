import type { ConnectionGroups, Groups } from './types';

export const GROUP_MAP = {
  1: { class: 'level-1', label: 'Group 1' },
  2: { class: 'level-2', label: 'Group 2' },
  3: { class: 'level-3', label: 'Group 3' },
  4: { class: 'level-4', label: 'Group 4' },
};

export const GROUPS: ConnectionGroups[] = [1, 2, 3, 4];

export const DEFAULT_GROUPS: Groups = {
  1: { title: '', itemsInput: '', items: [] },
  2: { title: '', itemsInput: '', items: [] },
  3: { title: '', itemsInput: '', items: [] },
  4: { title: '', itemsInput: '', items: [] },
};

export const GRID_SIZE_LIMITS = {
  min: 4,
  max: 100,
} as const;

