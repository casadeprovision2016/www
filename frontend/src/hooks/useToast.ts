import { toast } from "sonner";

export const useToast = () => {
  const showSuccess = (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
    });
  };

  const showError = (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 5000,
    });
  };

  const showWarning = (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 4000,
    });
  };

  const showInfo = (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 3000,
    });
  };

  const showLoading = (message: string) => {
    return toast.loading(message);
  };

  const dismiss = (toastId: string | number) => {
    toast.dismiss(toastId);
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    dismiss,
  };
};

// Funções de conveniência para operações CRUD
export const useOperationToasts = () => {
  const { showSuccess, showError, showLoading, dismiss } = useToast();

  const showCreateSuccess = (resource: string) => {
    showSuccess(`${resource} creado exitosamente`);
  };

  const showUpdateSuccess = (resource: string) => {
    showSuccess(`${resource} actualizado exitosamente`);
  };

  const showDeleteSuccess = (resource: string) => {
    showSuccess(`${resource} eliminado exitosamente`);
  };

  const showCreateError = (resource: string, error?: string) => {
    showError(`Error al crear ${resource}`, error);
  };

  const showUpdateError = (resource: string, error?: string) => {
    showError(`Error al actualizar ${resource}`, error);
  };

  const showDeleteError = (resource: string, error?: string) => {
    showError(`Error al eliminar ${resource}`, error);
  };

  const showLoadError = (resource: string, error?: string) => {
    showError(`Error al cargar ${resource}`, error);
  };

  return {
    showCreateSuccess,
    showUpdateSuccess,
    showDeleteSuccess,
    showCreateError,
    showUpdateError,
    showDeleteError,
    showLoadError,
    showLoading,
    dismiss,
  };
};