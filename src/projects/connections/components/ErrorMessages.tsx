import React from 'react';

interface ErrorMessagesProps {
  errors: string[];
}

const ErrorMessages: React.FC<ErrorMessagesProps> = ({ errors }) => {
  if (errors.length === 0) return null;

  return (
    <div className="error-messages">
      <p className="error-title">Cannot Generate Game:</p>
      <ul className="error-list">
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </div>
  );
};

export default ErrorMessages;

