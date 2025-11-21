import React from 'react';
import toast, { type Renderable, type ValueOrFunction } from 'react-hot-toast';

const baseStyle: React.CSSProperties = {
  fontSize: 'clamp(13px, 4vw, 16px)', // Scales for mobile
  padding: '12px 6vw', // Responsive horizontal padding
  borderRadius: 8,
  color: '#ffffff',
  background: '#1f2c33',
  fontFamily: 'inherit',
  maxWidth: '96vw',
  width: 'fit-content',
  minWidth: '200px',
  boxSizing: 'border-box',
};

const positions = { position: 'top-center' as const };

const icons = {
  check: '✓',
  x: '✕',
  info: 'ℹ️',
};

export const showToast = {
  success(message: string) {
    return toast.success(message, {
      ...positions,
      duration: 3000,
      style: { ...baseStyle, background: '#00a884' },
      icon: icons.check,
    });
  },

  error(message: string) {
    return toast.error(message, {
      ...positions,
      duration: 4000,
      style: { ...baseStyle, background: '#dc3545' },
      icon: icons.x,
    });
  },

  loading(message: string) {
    return toast.loading(message, {
      ...positions,
      duration: Infinity,
      style: { ...baseStyle, background: '#1f2c33' },
    });
  },

  info(message: string) {
    return toast(message, {
      ...positions,
      duration: 3000,
      style: { ...baseStyle, background: '#1f2c33' },
      icon: icons.info,
    });
  },

  networkStatus(message: string, isError: boolean) {
    // Full-width mobile-friendly banner
    return toast.custom(
      () =>
        React.createElement(
          'div',
          {
            style: {
              width: '100vw',
              maxWidth: '100vw',
              borderRadius: 0,
              background: isError ? '#dc3545' : '#00a884',
              color: '#ffffff',
              fontSize: 'clamp(13px, 4vw, 16px)',
              fontFamily: 'inherit',
              padding: '12px 6vw',
              boxShadow: '0 4px 10px rgba(0,0,0,0.13)',
              boxSizing: 'border-box',
            },
          },
          message,
        ),
      {
        ...positions,
        duration: isError ? Infinity : 2000,
      },
    );
  },

  withAction(message: string, actionLabel: string, onAction: () => void) {
    return toast.custom(
      (t) =>
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: '#1f2c33',
              color: '#ffffff',
              fontSize: 'clamp(13px, 4vw, 16px)',
              fontFamily: 'inherit',
              padding: '12px 6vw',
              borderRadius: 8,
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.10)',
              maxWidth: '96vw',
              minWidth: '200px',
              boxSizing: 'border-box',
              flexWrap: 'wrap',
            },
          },
          React.createElement('span', null, message),
          React.createElement(
            'button',
            {
              onClick: () => {
                try { onAction(); } finally { toast.dismiss(t.id); }
              },
              style: {
                marginLeft: 6,
                padding: '8px 14px',
                borderRadius: 6,
                border: 'none',
                background: '#00a884',
                color: '#fff',
                cursor: 'pointer',
                minWidth: 'auto',
                fontSize: '15px',
                flexShrink: 0,
                marginTop: 6,
              },
            },
            actionLabel,
          ),
        ),
      {
        ...positions,
        duration: 5000,
      },
    );
  },

  promise<T>(promise: Promise<T>, messages: { loading: string; success: ValueOrFunction<Renderable, T>; error: ValueOrFunction<Renderable, any>; }) {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    }, {
      ...positions,
      style: baseStyle,
    });
  },

  dismiss(toastId?: string) {
    if (toastId) return toast.dismiss(toastId);
    toast.dismiss();
  },
};

export default showToast;
