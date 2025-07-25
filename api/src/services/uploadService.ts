import multer from 'multer';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middleware/errorHandler';
import { uploadLogger } from '../utils/logger';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configurações de upload
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Configuração do multer
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: MAX_SIZE,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use apenas JPEG, PNG ou WebP.'));
    }
  }
});

class UploadService {
  async uploadImage(file: Express.Multer.File, folder: string = 'images'): Promise<string> {
    try {
      if (!file) {
        throw new AppError('Arquivo não fornecido', 400);
      }

      // Processar imagem com Sharp
      const processedBuffer = await sharp(file.buffer)
        .jpeg({ quality: 80 })
        .resize(1200, 1200, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .toBuffer();

      // Gerar nome único para o arquivo
      const fileExtension = 'jpg';
      const fileName = `${Date.now()}-${uuidv4()}.${fileExtension}`;
      const filePath = `${folder}/${fileName}`;

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(filePath, processedBuffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new AppError(`Erro no upload do arquivo: ${error.message}`, 500);
      }

      // Log do upload bem-sucedido
      uploadLogger.success(fileName, processedBuffer.length, 'system');

      // Retornar URL pública do arquivo
      const { data: publicUrlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;

    } catch (error: any) {
      uploadLogger.failed(file.originalname, error.message, 'system');
      throw error;
    }
  }

  async uploadDocument(file: Express.Multer.File, folder: string = 'documents'): Promise<string> {
    try {
      if (!file) {
        throw new AppError('Arquivo não fornecido', 400);
      }

      // Verificar tipos permitidos para documentos
      const allowedDocTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];

      if (!allowedDocTypes.includes(file.mimetype)) {
        throw new AppError('Tipo de documento não permitido', 400);
      }

      // Gerar nome único
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${uuidv4()}.${fileExtension}`;
      const filePath = `${folder}/${fileName}`;

      // Upload direto sem processamento
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new AppError(`Erro no upload do documento: ${error.message}`, 500);
      }

      uploadLogger.success(fileName, file.size, 'system');

      const { data: publicUrlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;

    } catch (error: any) {
      uploadLogger.failed(file.originalname, error.message, 'system');
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      // Extrair caminho relativo da URL
      const relativePath = filePath.replace(/.*\/uploads\//, '');

      const { error } = await supabase.storage
        .from('uploads')
        .remove([relativePath]);

      if (error) {
        throw new AppError(`Erro ao deletar arquivo: ${error.message}`, 500);
      }

    } catch (error: any) {
      throw error;
    }
  }

  async getFileInfo(filePath: string): Promise<any> {
    try {
      const relativePath = filePath.replace(/.*\/uploads\//, '');

      const { data, error } = await supabase.storage
        .from('uploads')
        .list('', {
          search: relativePath
        });

      if (error) {
        throw new AppError(`Erro ao buscar informações do arquivo: ${error.message}`, 500);
      }

      return data?.[0] || null;

    } catch (error: any) {
      throw error;
    }
  }

  // Middleware para validação de arquivo único
  uploadSingle(fieldName: string) {
    return upload.single(fieldName);
  }

  // Middleware para múltiplos arquivos
  uploadMultiple(fieldName: string, maxCount: number = 5) {
    return upload.array(fieldName, maxCount);
  }

  // Middleware para campos mistos
  uploadFields(fields: { name: string; maxCount: number }[]) {
    return upload.fields(fields);
  }

  // Validação de imagem
  validateImageDimensions(buffer: Buffer, minWidth: number = 100, minHeight: number = 100): Promise<boolean> {
    return new Promise((resolve, reject) => {
      sharp(buffer)
        .metadata()
        .then(metadata => {
          if (!metadata.width || !metadata.height) {
            reject(new AppError('Não foi possível determinar as dimensões da imagem', 400));
            return;
          }

          if (metadata.width < minWidth || metadata.height < minHeight) {
            reject(new AppError(`Imagem muito pequena. Mínimo: ${minWidth}x${minHeight}px`, 400));
            return;
          }

          resolve(true);
        })
        .catch(error => {
          reject(new AppError('Arquivo de imagem inválido', 400));
        });
    });
  }

  // Redimensionar imagem para tamanhos específicos
  async resizeImage(buffer: Buffer, width: number, height: number): Promise<Buffer> {
    return await sharp(buffer)
      .resize(width, height, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer();
  }

  // Gerar thumbnail
  async generateThumbnail(buffer: Buffer, size: number = 150): Promise<Buffer> {
    return await sharp(buffer)
      .resize(size, size, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toBuffer();
  }
}

export const uploadService = new UploadService();