import React from 'react';

const StatCard = ({ icon, title, value, color }) => {
  const IconComponent = icon;

  return (
    <div className="bg-dark-secondary p-6 rounded-lg shadow-lg flex items-center">
      <div className={`p-3 rounded-full bg-opacity-20 ${color}`}>
        <IconComponent className={`h-8 w-8 ${color}`} />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;