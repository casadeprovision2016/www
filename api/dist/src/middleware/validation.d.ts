import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
export declare const validateAndSanitize: (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const schemas: {
    createEvent: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        date: z.ZodString;
        time: z.ZodString;
        location: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        capacity: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        title?: string;
        description?: string;
        date?: string;
        time?: string;
        location?: string;
        category?: string;
        capacity?: number;
    }, {
        title?: string;
        description?: string;
        date?: string;
        time?: string;
        location?: string;
        category?: string;
        capacity?: number;
    }>;
    updateEvent: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        date: z.ZodOptional<z.ZodString>;
        time: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        capacity: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        title?: string;
        description?: string;
        date?: string;
        time?: string;
        location?: string;
        category?: string;
        capacity?: number;
    }, {
        title?: string;
        description?: string;
        date?: string;
        time?: string;
        location?: string;
        category?: string;
        capacity?: number;
    }>;
    createMember: z.ZodObject<{
        user_id: z.ZodString;
        membership_type: z.ZodEnum<["efetivo", "em_experiencia", "congregado"]>;
        join_date: z.ZodString;
        observacoes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        user_id?: string;
        membership_type?: "efetivo" | "em_experiencia" | "congregado";
        join_date?: string;
        observacoes?: string;
    }, {
        user_id?: string;
        membership_type?: "efetivo" | "em_experiencia" | "congregado";
        join_date?: string;
        observacoes?: string;
    }>;
    updateMember: z.ZodObject<{
        membership_type: z.ZodOptional<z.ZodEnum<["efetivo", "em_experiencia", "congregado"]>>;
        status: z.ZodOptional<z.ZodEnum<["ativo", "inativo"]>>;
        end_date: z.ZodOptional<z.ZodString>;
        observacoes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status?: "ativo" | "inativo";
        membership_type?: "efetivo" | "em_experiencia" | "congregado";
        observacoes?: string;
        end_date?: string;
    }, {
        status?: "ativo" | "inativo";
        membership_type?: "efetivo" | "em_experiencia" | "congregado";
        observacoes?: string;
        end_date?: string;
    }>;
    createDonation: z.ZodObject<{
        user_id: z.ZodString;
        valor: z.ZodNumber;
        tipo: z.ZodEnum<["dizimo", "oferta", "missoes", "outros"]>;
        descricao: z.ZodOptional<z.ZodString>;
        data_doacao: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        user_id?: string;
        valor?: number;
        tipo?: "dizimo" | "oferta" | "missoes" | "outros";
        descricao?: string;
        data_doacao?: string;
    }, {
        user_id?: string;
        valor?: number;
        tipo?: "dizimo" | "oferta" | "missoes" | "outros";
        descricao?: string;
        data_doacao?: string;
    }>;
    createStream: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        streamUrl: z.ZodString;
        startDate: z.ZodString;
        endDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodOptional<z.ZodEnum<["agendado", "ao_vivo", "finalizado", "cancelado"]>>;
        public: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        status?: "agendado" | "ao_vivo" | "finalizado" | "cancelado";
        title?: string;
        description?: string;
        streamUrl?: string;
        startDate?: string;
        endDate?: string;
        public?: boolean;
    }, {
        status?: "agendado" | "ao_vivo" | "finalizado" | "cancelado";
        title?: string;
        description?: string;
        streamUrl?: string;
        startDate?: string;
        endDate?: string;
        public?: boolean;
    }>;
    updateStream: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        streamUrl: z.ZodOptional<z.ZodString>;
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["agendado", "ao_vivo", "finalizado", "cancelado"]>>;
        public: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        status?: "agendado" | "ao_vivo" | "finalizado" | "cancelado";
        title?: string;
        description?: string;
        streamUrl?: string;
        startDate?: string;
        endDate?: string;
        public?: boolean;
    }, {
        status?: "agendado" | "ao_vivo" | "finalizado" | "cancelado";
        title?: string;
        description?: string;
        streamUrl?: string;
        startDate?: string;
        endDate?: string;
        public?: boolean;
    }>;
    createMinistry: z.ZodObject<{
        name: z.ZodString;
        descricao: z.ZodOptional<z.ZodString>;
        lider_id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        descricao?: string;
        name?: string;
        lider_id?: string;
    }, {
        descricao?: string;
        name?: string;
        lider_id?: string;
    }>;
    createVisitor: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        visitDate: z.ZodString;
        source: z.ZodEnum<["invitation", "social_media", "walk_in", "website", "other"]>;
        notes: z.ZodOptional<z.ZodString>;
        followUpStatus: z.ZodOptional<z.ZodEnum<["pending", "contacted", "scheduled", "completed", "no_interest"]>>;
        followUpDate: z.ZodOptional<z.ZodString>;
        interestedInMembership: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        email?: string;
        name?: string;
        phone?: string;
        address?: string;
        visitDate?: string;
        source?: "invitation" | "social_media" | "walk_in" | "website" | "other";
        notes?: string;
        followUpStatus?: "pending" | "contacted" | "scheduled" | "completed" | "no_interest";
        followUpDate?: string;
        interestedInMembership?: boolean;
    }, {
        email?: string;
        name?: string;
        phone?: string;
        address?: string;
        visitDate?: string;
        source?: "invitation" | "social_media" | "walk_in" | "website" | "other";
        notes?: string;
        followUpStatus?: "pending" | "contacted" | "scheduled" | "completed" | "no_interest";
        followUpDate?: string;
        interestedInMembership?: boolean;
    }>;
    updateVisitor: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        visitDate: z.ZodOptional<z.ZodString>;
        source: z.ZodOptional<z.ZodEnum<["invitation", "social_media", "walk_in", "website", "other"]>>;
        notes: z.ZodOptional<z.ZodString>;
        followUpStatus: z.ZodOptional<z.ZodEnum<["pending", "contacted", "scheduled", "completed", "no_interest"]>>;
        followUpDate: z.ZodOptional<z.ZodString>;
        interestedInMembership: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        email?: string;
        name?: string;
        phone?: string;
        address?: string;
        visitDate?: string;
        source?: "invitation" | "social_media" | "walk_in" | "website" | "other";
        notes?: string;
        followUpStatus?: "pending" | "contacted" | "scheduled" | "completed" | "no_interest";
        followUpDate?: string;
        interestedInMembership?: boolean;
    }, {
        email?: string;
        name?: string;
        phone?: string;
        address?: string;
        visitDate?: string;
        source?: "invitation" | "social_media" | "walk_in" | "website" | "other";
        notes?: string;
        followUpStatus?: "pending" | "contacted" | "scheduled" | "completed" | "no_interest";
        followUpDate?: string;
        interestedInMembership?: boolean;
    }>;
    createPastoralVisit: z.ZodObject<{
        visitado_id: z.ZodString;
        pastor_id: z.ZodString;
        data_visita: z.ZodString;
        motivo: z.ZodOptional<z.ZodString>;
        observacoes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        observacoes?: string;
        visitado_id?: string;
        pastor_id?: string;
        data_visita?: string;
        motivo?: string;
    }, {
        observacoes?: string;
        visitado_id?: string;
        pastor_id?: string;
        data_visita?: string;
        motivo?: string;
    }>;
    login: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email?: string;
        password?: string;
    }, {
        email?: string;
        password?: string;
    }>;
    pagination: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
        sort: z.ZodOptional<z.ZodString>;
        order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    }, "strip", z.ZodTypeAny, {
        limit?: number;
        sort?: string;
        page?: number;
        order?: "asc" | "desc";
    }, {
        limit?: number;
        sort?: string;
        page?: number;
        order?: "asc" | "desc";
    }>;
    eventQuery: z.ZodObject<{
        upcoming: z.ZodOptional<z.ZodBoolean>;
        past: z.ZodOptional<z.ZodBoolean>;
        month: z.ZodOptional<z.ZodString>;
        year: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        upcoming?: boolean;
        past?: boolean;
        month?: string;
        year?: string;
    }, {
        upcoming?: boolean;
        past?: boolean;
        month?: string;
        year?: string;
    }>;
    donationQuery: z.ZodObject<{
        tipo: z.ZodOptional<z.ZodEnum<["dizimo", "oferta", "missoes", "outros"]>>;
        user_id: z.ZodOptional<z.ZodString>;
        start_date: z.ZodOptional<z.ZodString>;
        end_date: z.ZodOptional<z.ZodString>;
        min_amount: z.ZodOptional<z.ZodNumber>;
        max_amount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        user_id?: string;
        end_date?: string;
        tipo?: "dizimo" | "oferta" | "missoes" | "outros";
        start_date?: string;
        min_amount?: number;
        max_amount?: number;
    }, {
        user_id?: string;
        end_date?: string;
        tipo?: "dizimo" | "oferta" | "missoes" | "outros";
        start_date?: string;
        min_amount?: number;
        max_amount?: number;
    }>;
};
//# sourceMappingURL=validation.d.ts.map