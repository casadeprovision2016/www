import { z } from 'zod';

export const createMemberSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  
  email: z.string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido')
    .max(150, 'El email no puede exceder 150 caracteres'),
  
  phone: z.string()
    .min(1, 'El teléfono es requerido')
    .min(8, 'El teléfono debe tener al menos 8 dígitos')
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Formato de teléfono inválido'),
  
  address: z.string()
    .min(1, 'La dirección es requerida')
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(200, 'La dirección no puede exceder 200 caracteres'),
  
  birthDate: z.string()
    .min(1, 'La fecha de nacimiento es requerida')
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age >= 1;
      }
      return age >= 0 && age <= 120;
    }, 'Fecha de nacimiento inválida'),
  
  ministry: z.string()
    .min(1, 'El ministerio es requerido')
    .refine((ministry) => {
      const validMinistries = ['Adoración', 'Jóvenes', 'Niños', 'Intercesión', 'Evangelismo', 'Técnico'];
      return validMinistries.includes(ministry);
    }, 'Selecciona un ministerio válido'),
  
  status: z.enum(['active', 'inactive'], {
    errorMap: () => ({ message: 'El estado debe ser activo o inactivo' })
  })
});

export const updateMemberSchema = createMemberSchema.partial();

export const attendanceSchema = z.object({
  memberId: z.string().min(1, 'ID del miembro es requerido'),
  date: z.string().min(1, 'La fecha es requerida'),
  serviceType: z.enum(['domingo', 'miercoles', 'especial'], {
    errorMap: () => ({ message: 'Tipo de servicio inválido' })
  }),
  present: z.boolean(),
  notes: z.string().max(200, 'Las notas no pueden exceder 200 caracteres').optional()
});

export type CreateMemberFormData = z.infer<typeof createMemberSchema>;
export type UpdateMemberFormData = z.infer<typeof updateMemberSchema>;
export type AttendanceFormData = z.infer<typeof attendanceSchema>;