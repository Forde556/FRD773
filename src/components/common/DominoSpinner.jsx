import React from 'react';

export default function DominoSpinner() {
  return (
    <div className="domino-spinner-wrapper" aria-label="Loading dominoes...">
      <div className="domino-spinner">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
