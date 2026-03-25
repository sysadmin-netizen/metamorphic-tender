'use client';

import { useSyncExternalStore } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

// ---------------------------------------------------------------------------
// Global store (no external dependencies)
// ---------------------------------------------------------------------------

type Listener = () => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();
let nextId = 0;

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Toast[] {
  return toasts;
}

function addToast(type: ToastType, message: string, duration = 5000): string {
  const id = String(++nextId);
  toasts = [...toasts, { id, type, message }];
  emit();

  if (duration > 0) {
    setTimeout(() => removeToast(id), duration);
  }
  return id;
}

function removeToast(id: string): void {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const toast = {
  success: (msg: string) => addToast('success', msg),
  error: (msg: string) => addToast('error', msg),
  warning: (msg: string) => addToast('warning', msg),
  info: (msg: string) => addToast('info', msg),
  dismiss: removeToast,
};

export function useToast() {
  return toast;
}

// ---------------------------------------------------------------------------
// Styling
// ---------------------------------------------------------------------------

const typeStyles: Record<ToastType, { container: string; icon: string }> = {
  success: {
    container: 'border-green-200 bg-green-50',
    icon: 'text-green-700',
  },
  error: {
    container: 'border-red-200 bg-red-50',
    icon: 'text-red-700',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50',
    icon: 'text-amber-700',
  },
  info: {
    container: 'border-blue-200 bg-blue-50',
    icon: 'text-blue-700',
  },
};

const typeIcons: Record<ToastType, string> = {
  success: '\u2713',
  error: '\u2717',
  warning: '\u26A0',
  info: '\u2139',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ToastItem({ item }: { item: Toast }) {
  const style = typeStyles[item.type];
  const icon = typeIcons[item.type];

  return (
    <div
      role="alert"
      className={[
        'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg',
        'min-w-[280px] max-w-sm',
        'animate-[slideIn_200ms_ease-out]',
        style.container,
      ].join(' ')}
    >
      <span className={`flex-shrink-0 text-lg leading-none ${style.icon}`} aria-hidden="true">
        {icon}
      </span>
      <p className="flex-1 text-sm text-stone-900">{item.message}</p>
      <button
        type="button"
        onClick={() => removeToast(item.id)}
        className="flex-shrink-0 text-stone-400 hover:text-stone-600 min-h-[24px] min-w-[24px] flex items-center justify-center"
        aria-label="Dismiss notification"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2"
    >
      {items.map((item) => (
        <ToastItem key={item.id} item={item} />
      ))}
    </div>
  );
}
