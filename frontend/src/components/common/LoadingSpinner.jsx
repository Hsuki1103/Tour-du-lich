import React from 'react';

const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex justify-center items-center min-h-[200px]">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-primary-500 border-t-transparent`} />
    </div>
  );
};

export default LoadingSpinner;