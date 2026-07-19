import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({ open, onClose, title, description, children, size = 'md', className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          style={{ animation: 'fade-in 0.2s ease both' }}
        />
        {/* Panel */}
        <Dialog.Content
          className={clsx(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full p-6 rounded-2xl outline-none',
            'glass-elevated',
            sizeClasses[size],
            className
          )}
          style={{ animation: 'fade-up 0.25s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          {/* Header */}
          {(title || description) && (
            <div className="mb-5">
              {title && (
                <Dialog.Title className="text-base font-semibold text-slate-100 mb-1">
                  {title}
                </Dialog.Title>
              )}
              {description && (
                <Dialog.Description className="text-sm text-slate-400">
                  {description}
                </Dialog.Description>
              )}
            </div>
          )}

          {/* Content */}
          {children}

          {/* Close button */}
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 btn-icon"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/06', className)}>
      {children}
    </div>
  );
}
