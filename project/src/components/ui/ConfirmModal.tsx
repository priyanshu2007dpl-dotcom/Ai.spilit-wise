import { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${danger ? 'bg-danger-50 text-danger-500' : 'bg-cream-200 text-brown-500'}`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
        <p className="text-sm text-brown-600 mb-6">{message}</p>
        <div className="flex gap-3 w-full">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            className="flex-1"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
