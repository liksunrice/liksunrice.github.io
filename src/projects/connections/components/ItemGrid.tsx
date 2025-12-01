import React from 'react';

interface ItemGridProps {
  items: string[];
}

const ItemGrid: React.FC<ItemGridProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="grid-title">Shuffled Game Grid ({items.length} Items)</h2>
      <p className="grid-subtitle">This is the final list of words for your game.</p>
      <div className="item-grid">
        {items.map((item, index) => (
          <div key={index} className="grid-item">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItemGrid;

