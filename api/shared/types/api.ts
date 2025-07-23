import { Request } from 'express';
import { User, Event, Member, Donation, LiveStream, PastoralVisit, Ministry } from './database';

// Request types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateEventRequest {
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim?: string;
  local?: string;
  max_participantes?: number;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  id: string;
}

export interface CreateMemberRequest {
  user_id: string;
  membership_type: 'efetivo' | 'em_experiencia' | 'congregado';
  join_date: string;
  observacoes?: string;
}

export interface CreateDonationRequest {
  user_id: string;
  valor: number;
  tipo: 'dizimo' | 'oferta' | 'missoes' | 'outros';
  descricao?: string;
  data_doacao: string;
}

export interface CreateStreamRequest {
  titulo: string;
  descricao?: string;
  url_stream: string;
  data_inicio: string;
  data_fim?: string;
}

export interface CreatePastoralVisitRequest {
  visitado_id: string;
  pastor_id: string;
  data_visita: string;
  motivo?: string;
  observacoes?: string;
}

export interface CreateMinistryRequest {
  name: string;
  descricao?: string;
  lider_id: string;
}

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expires_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface StatsResponse {
  total: number;
  active?: number;
  inactive?: number;
  monthly?: Record<string, number>;
  weekly?: Record<string, number>;
}

export interface DashboardStats {
  events: StatsResponse;
  members: StatsResponse;
  donations: StatsResponse & { total_amount: number };
  visitors: StatsResponse;
  streams: StatsResponse;
}

// Query parameters
export interface BaseQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface EventQueryParams extends BaseQueryParams {
  upcoming?: boolean;
  past?: boolean;
  month?: string;
  year?: string;
}

export interface MemberQueryParams extends BaseQueryParams {
  status?: 'ativo' | 'inativo';
  membership_type?: 'efetivo' | 'em_experiencia' | 'congregado';
  ministry_id?: string;
}

export interface DonationQueryParams extends BaseQueryParams {
  tipo?: 'dizimo' | 'oferta' | 'missoes' | 'outros';
  user_id?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
}

export interface StreamQueryParams extends BaseQueryParams {
  status?: 'ativa' | 'finalizada' | 'agendada';
  month?: string;
  year?: string;
}

// Authentication & Authorization
export interface AuthenticatedRequest extends Request {
  user: User;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}