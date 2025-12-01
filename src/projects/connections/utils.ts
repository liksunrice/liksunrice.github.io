export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const parseItems = (itemsInput: string): string[] => {
  return itemsInput
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
};

