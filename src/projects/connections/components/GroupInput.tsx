import React from 'react';
import type { GroupInputProps } from '../types';
import { GROUP_MAP } from '../constants';
import { parseItems } from '../utils';

const GroupInput: React.FC<GroupInputProps> = ({ groupNumber, group, onUpdate }) => {
  const { class: groupClass } = GROUP_MAP[groupNumber];

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(groupNumber, 'title', e.target.value);
  };

  const handleItemsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(groupNumber, 'itemsInput', e.target.value);
  };

  const items = parseItems(group.itemsInput);

  return (
    <div className={`connection-card ${groupClass}`}>
      <div className="card-header">
        <input
          type="text"
          name="title"
          placeholder={`Group ${groupNumber} Title (e.g., 'Types of Dogs')`}
          value={group.title}
          onChange={handleTitleChange}
          className="title-input"
        />
      </div>

      <div className="input-group">
        <label className="input-label">Items (Comma separated):</label>
        <textarea
          rows={3}
          name="itemsInput"
          placeholder="ITEM A, ITEM B, ITEM C, ITEM D, ..."
          value={group.itemsInput}
          onChange={handleItemsChange}
          className="items-textarea"
        />
        <p className="item-count-label">
          Current Count: <span className="item-count">{items.length}</span>
        </p>
      </div>
    </div>
  );
};

export default GroupInput;

