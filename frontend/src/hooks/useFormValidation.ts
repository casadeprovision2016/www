import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const useFormValidation = <T extends z.ZodType<any>>(
  schema: T,
  defaultValues?: Partial<z.infer<T>>
) => {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange', // Validar mientras el usuario escribe
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty, isSubmitting },
    reset,
    setValue,
    getValues,
    watch,
    clearErrors,
    setError,
  } = form;

  // Función para obtener el mensaje de error de un campo
  const getFieldError = (fieldName: keyof z.infer<T>) => {
    const error = errors[fieldName];
    return error?.message as string | undefined;
  };

  // Función para verificar si un campo tiene error
  const hasFieldError = (fieldName: keyof z.infer<T>) => {
    return !!errors[fieldName];
  };

  // Función para limpiar errores de un campo específico
  const clearFieldError = (fieldName: keyof z.infer<T>) => {
    clearErrors(fieldName as any);
  };

  // Función para establecer un error personalizado
  const setFieldError = (fieldName: keyof z.infer<T>, message: string) => {
    setError(fieldName as any, { type: 'manual', message });
  };

  return {
    register,
    handleSubmit,
    errors,
    isValid,
    isDirty,
    isSubmitting,
    reset,
    setValue,
    getValues,
    watch,
    getFieldError,
    hasFieldError,
    clearFieldError,
    setFieldError,
    form, // Para acceso completo al form si es necesario
  };
};

// Hook específico para manejar validación en tiempo real
export const useFieldValidation = <T extends z.ZodType<any>>(
  schema: T,
  fieldName: keyof z.infer<T>,
  value: any
) => {
  try {
    const fieldSchema = schema.shape[fieldName];
    if (fieldSchema) {
      fieldSchema.parse(value);
      return { isValid: true, error: null };
    }
    return { isValid: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message || 'Error de validación',
      };
    }
    return { isValid: false, error: 'Error de validación' };
  }
};