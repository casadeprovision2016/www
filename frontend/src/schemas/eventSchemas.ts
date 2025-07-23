import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string()
    .min(1, 'El título es requerido')
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(100, 'El título no puede exceder 100 caracteres'),
  
  description: z.string()
    .min(1, 'La descripción es requerida')
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  
  date: z.string()
    .min(1, 'La fecha es requerida')
    .refine((date) => {
      const eventDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    }, 'La fecha del evento no puede ser anterior a hoy'),
  
  time: z.string()
    .min(1, 'La hora es requerida')
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
  
  location: z.string()
    .min(1, 'La ubicación es requerida')
    .min(3, 'La ubicación debe tener al menos 3 caracteres')
    .max(100, 'La ubicación no puede exceder 100 caracteres'),
  
  category: z.enum(['culto', 'estudio', 'jovenes', 'oracion', 'especial'], {
    errorMap: () => ({ message: 'Selecciona una categoría válida' })
  }),
  
  capacity: z.number()
    .int('La capacidad debe ser un número entero')
    .min(1, 'La capacidad mínima es 1 persona')
    .max(10000, 'La capacidad máxima es 10,000 personas')
    .optional()
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEventFormData = z.infer<typeof createEventSchema>;
export type UpdateEventFormData = z.infer<typeof updateEventSchema>;