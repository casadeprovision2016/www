import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2, UserX, XCircle } from 'lucide-react';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  icon?: React.ReactNode;
  onConfirm: () => void;
  loading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  icon,
  onConfirm,
  loading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const defaultIcon = variant === 'destructive' ? (
    <AlertTriangle className="h-6 w-6 text-red-600" />
  ) : (
    <AlertTriangle className="h-6 w-6 text-yellow-600" />
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {icon || defaultIcon}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={
              variant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-church-gold hover:bg-church-gold-dark text-white'
            }
          >
            {loading ? 'Procesando...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Hooks para confirmações específicas
export const useDeleteConfirmation = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [onConfirm, setOnConfirm] = React.useState<() => void>(() => {});

  const confirm = (callback: () => void) => {
    setOnConfirm(() => callback);
    setIsOpen(true);
  };

  const Dialog = ({ itemName, loading = false }: { itemName: string; loading?: boolean }) => (
    <ConfirmationDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Confirmar eliminación"
      description={`¿Estás seguro de que quieres eliminar "${itemName}"? Esta acción no se puede deshacer.`}
      confirmText="Eliminar"
      variant="destructive"
      icon={<Trash2 className="h-6 w-6 text-red-600" />}
      onConfirm={onConfirm}
      loading={loading}
    />
  );

  return { confirm, Dialog, isOpen, setIsOpen };
};

export const useRemoveConfirmation = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [onConfirm, setOnConfirm] = React.useState<() => void>(() => {});

  const confirm = (callback: () => void) => {
    setOnConfirm(() => callback);
    setIsOpen(true);
  };

  const Dialog = ({ itemName, loading = false }: { itemName: string; loading?: boolean }) => (
    <ConfirmationDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Confirmar remoción"
      description={`¿Estás seguro de que quieres remover a "${itemName}" de este grupo?`}
      confirmText="Remover"
      variant="destructive"
      icon={<UserX className="h-6 w-6 text-red-600" />}
      onConfirm={onConfirm}
      loading={loading}
    />
  );

  return { confirm, Dialog, isOpen, setIsOpen };
};

export const useCancelConfirmation = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [onConfirm, setOnConfirm] = React.useState<() => void>(() => {});

  const confirm = (callback: () => void) => {
    setOnConfirm(() => callback);
    setIsOpen(true);
  };

  const Dialog = ({ itemName, loading = false }: { itemName: string; loading?: boolean }) => (
    <ConfirmationDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Confirmar cancelación"
      description={`¿Estás seguro de que quieres cancelar "${itemName}"? Los cambios no guardados se perderán.`}
      confirmText="Cancelar"
      variant="default"
      icon={<XCircle className="h-6 w-6 text-yellow-600" />}
      onConfirm={onConfirm}
      loading={loading}
    />
  );

  return { confirm, Dialog, isOpen, setIsOpen };
};