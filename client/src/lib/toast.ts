import React from 'react';
import toast, { type Renderable, type ValueOrFunction } from 'react-hot-toast';

const baseStyle: React.CSSProperties = {
  fontSize: 14,
  padding: '12px 24px',
  borderRadius: 8,
  color: '#ffffff',
  background: '#1f2c33',
  fontFamily: 'inherit',
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
    // Manual dismiss; user should call dismiss with returned id
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
    // Full-width banner look using custom renderer without JSX
    return toast.custom(
      () =>
        React.createElement(
          'div',
          {
            style: {
              width: '100%',
              maxWidth: '100%',
              borderRadius: 0,
              background: isError ? '#dc3545' : '#00a884',
              color: '#ffffff',
              fontSize: 14,
              fontFamily: 'inherit',
              padding: '12px 24px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
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
              fontSize: 14,
              fontFamily: 'inherit',
              padding: '12px 24px',
              borderRadius: 8,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            },
          },
          React.createElement('span', null, message),
          React.createElement(
            'button',
            {
              onClick: () => {
                try {
                  onAction();
                } finally {
                  toast.dismiss(t.id);
                }
              },
              style: {
                marginLeft: 8,
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                background: '#00a884',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: 13,
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
