/**
 * Confirmation dialog component
 */
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onClose
}: ConfirmDialogProps) {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 dark:bg-opacity-70"
        onClick={onClose}
      />

      {/* Dialog */}
      <Card className="relative z-10 max-w-md p-6 m-4">
        <h3 className="text-lg font-semibold dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
