// src/components/common/Button.jsx
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

function Button({
    children,
    onClick,
    type = 'button',
    variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost'
    size = 'md', // 'sm' | 'md' | 'lg'
    isLoading = false,
    loadingText,
    disabled = false,
    className = '',
    ...props
}) {
    const baseClasses = "relative inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ancient-bg-dark disabled:opacity-50 disabled:cursor-not-allowed";

    const sizeClasses = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg"
    };

    const variantClasses = {
        primary: "bg-ancient-icon-glow text-ancient-bg-dark hover:bg-ancient-icon-glow/90 focus:ring-ancient-icon-glow",
        secondary: "bg-ancient-bg-medium text-ancient-text-light hover:bg-ancient-bg-light focus:ring-ancient-text-muted",
        danger: "bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/30 focus:ring-red-500",
        ghost: "bg-transparent text-ancient-icon-glow shadow-none hover:bg-ancient-bg-medium focus:ring-ancient-icon-glow"
    };

    const spinnerSize = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`}
            {...props}
        >
            <div className={`flex items-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                {children}
            </div>

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner
                        size={spinnerSize}
                        label={loadingText || ''}
                        className="bg-transparent shadow-none p-0 !text-inherit"
                    />
                </div>
            )}
        </button>
    );
}

export default Button;
