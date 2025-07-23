import multer from 'multer';
export declare const upload: multer.Multer;
declare class UploadService {
    uploadImage(file: Express.Multer.File, folder?: string): Promise<string>;
    uploadDocument(file: Express.Multer.File, folder?: string): Promise<string>;
    deleteFile(filePath: string): Promise<void>;
    getFileInfo(filePath: string): Promise<any>;
    uploadSingle(fieldName: string): import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    uploadMultiple(fieldName: string, maxCount?: number): import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    uploadFields(fields: {
        name: string;
        maxCount: number;
    }[]): import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    validateImageDimensions(buffer: Buffer, minWidth?: number, minHeight?: number): Promise<boolean>;
    resizeImage(buffer: Buffer, width: number, height: number): Promise<Buffer>;
    generateThumbnail(buffer: Buffer, size?: number): Promise<Buffer>;
}
export declare const uploadService: UploadService;
export {};
//# sourceMappingURL=uploadService.d.ts.map