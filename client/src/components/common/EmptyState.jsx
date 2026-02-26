// src/components/common/EmptyState.jsx
import React from 'react';

function EmptyState({
    icon: Icon,
    title,
    subtitle,
    layout = 'full', // 'full' | 'embedded'
    className = ''
}) {
    const isFull = layout === 'full';

    return (
        <div className={`
      flex flex-col items-center justify-center text-center
      ${isFull ? 'h-full w-full bg-ancient-bg-dark border-ancient-border-stone shadow-inner p-4 sm:p-8' : 'w-full h-full p-8'}
      ${!isFull && className ? className : ''}
    `}>
            {Icon && (
                <div className={`
          flex items-center justify-center 
          ${isFull ? 'text-ancient-icon-glow animate-pulse-slow' : 'w-16 h-16 rounded-full bg-ancient-bg-dark mb-4 text-ancient-text-muted'}
        `}>
                    <Icon className={`
            select-none
            ${isFull ? 'text-[80px] sm:text-[120px]' : 'text-2xl'}
          `} />
                </div>
            )}

            {title && (
                <h3 className={`
          select-none tracking-wider max-w-md
          ${isFull ? 'text-ancient-text-light mt-4 sm:mt-6 text-xl sm:text-2xl font-semibold' : 'text-ancient-text-light text-lg font-medium mb-1'}
        `}>
                    {title}
                </h3>
            )}

            {subtitle && (
                <p className={`
          select-none max-w-sm
          ${isFull ? 'text-ancient-text-muted mt-1 sm:mt-2 text-sm sm:text-base' : 'text-ancient-text-muted text-sm'}
        `}>
                    {subtitle}
                </p>
            )}
        </div>
    );
}

export default EmptyState;
