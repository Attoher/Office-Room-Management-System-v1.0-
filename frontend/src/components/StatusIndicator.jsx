import React from 'react';

const StatusIndicator = ({ occupancy, maxCapacity, size = 'md' }) => {
  const percentage = (occupancy / maxCapacity) * 100;
  
  let statusColor = 'bg-green-500';
  let statusText = 'Hijau';
  
  if (percentage >= 90) {
    statusColor = 'bg-red-500';
    statusText = 'Merah';
  } else if (percentage >= 70) {
    statusColor = 'bg-yellow-500';
    statusText = 'Kuning';
  }
  
  const sizeClasses = {
    sm: 'w-2.5 h-2.5 text-xs',
    md: 'w-3 h-3 text-sm',
    lg: 'w-4 h-4 text-base'
  };
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  return (
    <div className="flex items-center space-x-1.5">
      <div 
        className={`${statusColor} ${sizeClasses[size]} rounded-full flex-shrink-0`}
        title={`${statusText} (${percentage.toFixed(1)}%)`}
      ></div>
      <span className={`text-gray-600 ${textSizeClasses[size]} whitespace-nowrap`}>
        {statusText} <span className="text-gray-400">({percentage.toFixed(1)}%)</span>
      </span>
    </div>
  );
};

export default StatusIndicator;