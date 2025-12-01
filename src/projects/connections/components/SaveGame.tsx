import React, { useState } from 'react';
import { saveGame, generateShareUrl } from '../services/firestore';
import type { Groups } from '../types';

interface SaveGameProps {
  groups: Groups;
  title: string;
  onSaveComplete?: (gameId: string) => void;
}

const SaveGame: React.FC<SaveGameProps> = ({ groups, title, onSaveComplete }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setShareUrl(null);

    try {
      const gameId = await saveGame(groups, title);
      const url = generateShareUrl(gameId);
      setShareUrl(url);
      onSaveComplete?.(gameId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save game');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy link. Please copy it manually.');
    }
  };

  return (
    <div className="save-game-section">
      <button
        onClick={handleSave}
        className="save-btn"
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save & Share Game'}
      </button>

      {error && (
        <div className="save-error">
          <p>{error}</p>
        </div>
      )}

      {shareUrl && (
        <>
          <div className="share-link-section">
            <p className="share-label">Share this link:</p>
            <div className="share-link-container">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="share-link-input"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyLink}
                className="copy-btn"
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
          <div className="edit-info-message">
            <p className="edit-info-text">
              💡 <strong>Tip:</strong> Add <code>&amp;edit=true</code> to the URL to revisit and edit this game later.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default SaveGame;

