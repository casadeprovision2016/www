"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadService = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const supabase_js_1 = require("@supabase/supabase-js");
const uuid_1 = require("uuid");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
// Configurações de upload
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
// Configuração do multer
exports.upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: MAX_SIZE,
        files: 1
    },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Tipo de arquivo não permitido. Use apenas JPEG, PNG ou WebP.'));
        }
    }
});
class UploadService {
    async uploadImage(file, folder = 'images') {
        try {
            if (!file) {
                throw new errorHandler_1.AppError('Arquivo não fornecido', 400);
            }
            // Processar imagem com Sharp
            const processedBuffer = await (0, sharp_1.default)(file.buffer)
                .jpeg({ quality: 80 })
                .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true
            })
                .toBuffer();
            // Gerar nome único para o arquivo
            const fileExtension = 'jpg';
            const fileName = `${Date.now()}-${(0, uuid_1.v4)()}.${fileExtension}`;
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
                throw new errorHandler_1.AppError(`Erro no upload do arquivo: ${error.message}`, 500);
            }
            // Log do upload bem-sucedido
            logger_1.uploadLogger.success(fileName, processedBuffer.length, 'system');
            // Retornar URL pública do arquivo
            const { data: publicUrlData } = supabase.storage
                .from('uploads')
                .getPublicUrl(filePath);
            return publicUrlData.publicUrl;
        }
        catch (error) {
            logger_1.uploadLogger.failed(file.originalname, error.message, 'system');
            throw error;
        }
    }
    async uploadDocument(file, folder = 'documents') {
        try {
            if (!file) {
                throw new errorHandler_1.AppError('Arquivo não fornecido', 400);
            }
            // Verificar tipos permitidos para documentos
            const allowedDocTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ];
            if (!allowedDocTypes.includes(file.mimetype)) {
                throw new errorHandler_1.AppError('Tipo de documento não permitido', 400);
            }
            // Gerar nome único
            const fileExtension = file.originalname.split('.').pop();
            const fileName = `${Date.now()}-${(0, uuid_1.v4)()}.${fileExtension}`;
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
                throw new errorHandler_1.AppError(`Erro no upload do documento: ${error.message}`, 500);
            }
            logger_1.uploadLogger.success(fileName, file.size, 'system');
            const { data: publicUrlData } = supabase.storage
                .from('uploads')
                .getPublicUrl(filePath);
            return publicUrlData.publicUrl;
        }
        catch (error) {
            logger_1.uploadLogger.failed(file.originalname, error.message, 'system');
            throw error;
        }
    }
    async deleteFile(filePath) {
        try {
            // Extrair caminho relativo da URL
            const relativePath = filePath.replace(/.*\/uploads\//, '');
            const { error } = await supabase.storage
                .from('uploads')
                .remove([relativePath]);
            if (error) {
                throw new errorHandler_1.AppError(`Erro ao deletar arquivo: ${error.message}`, 500);
            }
        }
        catch (error) {
            throw error;
        }
    }
    async getFileInfo(filePath) {
        try {
            const relativePath = filePath.replace(/.*\/uploads\//, '');
            const { data, error } = await supabase.storage
                .from('uploads')
                .list('', {
                search: relativePath
            });
            if (error) {
                throw new errorHandler_1.AppError(`Erro ao buscar informações do arquivo: ${error.message}`, 500);
            }
            return data?.[0] || null;
        }
        catch (error) {
            throw error;
        }
    }
    // Middleware para validação de arquivo único
    uploadSingle(fieldName) {
        return exports.upload.single(fieldName);
    }
    // Middleware para múltiplos arquivos
    uploadMultiple(fieldName, maxCount = 5) {
        return exports.upload.array(fieldName, maxCount);
    }
    // Middleware para campos mistos
    uploadFields(fields) {
        return exports.upload.fields(fields);
    }
    // Validação de imagem
    validateImageDimensions(buffer, minWidth = 100, minHeight = 100) {
        return new Promise((resolve, reject) => {
            (0, sharp_1.default)(buffer)
                .metadata()
                .then(metadata => {
                if (!metadata.width || !metadata.height) {
                    reject(new errorHandler_1.AppError('Não foi possível determinar as dimensões da imagem', 400));
                    return;
                }
                if (metadata.width < minWidth || metadata.height < minHeight) {
                    reject(new errorHandler_1.AppError(`Imagem muito pequena. Mínimo: ${minWidth}x${minHeight}px`, 400));
                    return;
                }
                resolve(true);
            })
                .catch(error => {
                reject(new errorHandler_1.AppError('Arquivo de imagem inválido', 400));
            });
        });
    }
    // Redimensionar imagem para tamanhos específicos
    async resizeImage(buffer, width, height) {
        return await (0, sharp_1.default)(buffer)
            .resize(width, height, { fit: 'cover' })
            .jpeg({ quality: 85 })
            .toBuffer();
    }
    // Gerar thumbnail
    async generateThumbnail(buffer, size = 150) {
        return await (0, sharp_1.default)(buffer)
            .resize(size, size, { fit: 'cover' })
            .jpeg({ quality: 70 })
            .toBuffer();
    }
}
exports.uploadService = new UploadService();
//# sourceMappingURL=uploadService.js.map