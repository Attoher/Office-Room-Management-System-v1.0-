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
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };
  
  return (
    <div className="flex items-center space-x-2">
      <div className={`${statusColor} ${sizeClasses[size]} rounded-full`}></div>
      <span className="text-sm text-gray-600">{statusText} ({percentage.toFixed(1)}%)</span>
    </div>
  );
};

export default StatusIndicator;