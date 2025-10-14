import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Loading Spinner Component
export const LoadingSpinner = ({ size = 'md', text = 'Cargando...' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className={`${sizeClasses[size]} border-4 border-gray-700 rounded-full`}></div>
        <div className={`${sizeClasses[size]} border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0`}></div>
      </div>
      {text && (
        <p className="mt-4 text-text-secondary font-medium">{text}</p>
      )}
    </div>
  );
};

// Full Page Loading
export const LoadingPage = ({ text = 'Cargando...' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-primary via-dark-secondary to-dark-primary flex items-center justify-center">
      <div className="text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <span className="text-white font-bold text-4xl">P</span>
          </div>
        </div>
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  );
};

// Error Message Component
export const ErrorMessage = ({
  title = 'Algo salió mal',
  message,
  onRetry,
  retryText = 'Reintentar'
}) => {
  return (
    <div className="bg-danger/10 border-2 border-danger rounded-xl p-6 max-w-md mx-auto my-8">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-danger/20 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-danger" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-danger mb-2">{title}</h3>
          {message && (
            <p className="text-text-secondary text-sm mb-4">{message}</p>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-danger text-white font-semibold rounded-lg hover:bg-opacity-80 transition-all"
            >
              {retryText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Empty State Component
export const EmptyState = ({
  icon = '📭',
  title = 'No hay datos',
  message,
  action,
  actionText
}) => {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-text-primary mb-2">{title}</h3>
      {message && (
        <p className="text-text-secondary mb-6 max-w-md mx-auto">{message}</p>
      )}
      {action && (
        <button
          onClick={action}
          className="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

// Success Message Component
export const SuccessMessage = ({ message, onClose }) => {
  return (
    <div className="bg-secondary/10 border-2 border-secondary rounded-xl p-4 flex items-center justify-between animate-slideIn">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-text-primary font-medium">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Skeleton Loader for Cards
export const SkeletonCard = () => {
  return (
    <div className="bg-dark-secondary rounded-xl p-6 animate-pulse">
      <div className="h-40 bg-dark-primary rounded-lg mb-4"></div>
      <div className="h-4 bg-dark-primary rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-dark-primary rounded w-1/2"></div>
    </div>
  );
};

// Skeleton Loader for List Items
export const SkeletonList = ({ items = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="bg-dark-secondary rounded-lg p-4 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-dark-primary rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-dark-primary rounded w-3/4"></div>
              <div className="h-3 bg-dark-primary rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default {
  LoadingSpinner,
  LoadingPage,
  ErrorMessage,
  EmptyState,
  SuccessMessage,
  SkeletonCard,
  SkeletonList,
};