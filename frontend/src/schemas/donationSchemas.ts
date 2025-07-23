import { z } from 'zod';

export const updateDonationInfoSchema = z.object({
  iban: z.string()
    .min(1, 'El IBAN es requerido')
    .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/, 'Formato de IBAN inválido')
    .length(24, 'El IBAN debe tener exactamente 24 caracteres'),
  
  bic: z.string()
    .min(1, 'El BIC/SWIFT es requerido')
    .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Formato de BIC/SWIFT inválido')
    .min(8, 'El BIC/SWIFT debe tener al menos 8 caracteres')
    .max(11, 'El BIC/SWIFT no puede exceder 11 caracteres'),
  
  titular: z.string()
    .min(1, 'El titular es requerido')
    .min(3, 'El titular debe tener al menos 3 caracteres')
    .max(100, 'El titular no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]+$/, 'El titular solo puede contener letras y espacios'),
  
  bizum: z.string()
    .min(1, 'La información de Bizum es requerida')
    .max(50, 'La información de Bizum no puede exceder 50 caracteres'),
  
  verse: z.string()
    .min(1, 'El versículo bíblico es requerido')
    .min(10, 'El versículo debe tener al menos 10 caracteres')
    .max(500, 'El versículo no puede exceder 500 caracteres'),
  
  additionalMethods: z.string()
    .max(300, 'Los métodos adicionales no pueden exceder 300 caracteres')
    .optional()
    .or(z.literal(''))
});

export type UpdateDonationInfoFormData = z.infer<typeof updateDonationInfoSchema>;