export interface User {
  id: string;
  email: string;
  name: string;
  telefone?: string;
  role: 'admin' | 'leader' | 'member' | 'visitor';
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  descricao?: string;
  logo?: string;
  configuracoes?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim?: string;
  local?: string;
  max_participantes?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: 'confirmada' | 'pendente' | 'cancelada';
  registered_at: string;
  observacoes?: string;
}

export interface Member {
  id: string;
  user_id: string;
  membership_type: 'efetivo' | 'em_experiencia' | 'congregado';
  status: 'ativo' | 'inativo';
  join_date: string;
  end_date?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  user_id: string;
  valor: number;
  tipo: 'dizimo' | 'oferta' | 'missoes' | 'outros';
  descricao?: string;
  data_doacao: string;
  comprovante?: string;
  created_at: string;
  updated_at: string;
}

export interface LiveStream {
  id: string;
  titulo: string;
  descricao?: string;
  url_stream: string;
  data_inicio: string;
  data_fim?: string;
  ativa: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PastoralVisit {
  id: string;
  visitado_id: string;
  pastor_id: string;
  data_visita: string;
  motivo?: string;
  observacoes?: string;
  status: 'agendada' | 'concluida' | 'cancelada';
  created_at: string;
  updated_at: string;
}

export interface Ministry {
  id: string;
  name: string;
  descricao?: string;
  lider_id: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface MinistryMember {
  id: string;
  ministry_id: string;
  user_id: string;
  cargo?: string;
  ativo: boolean;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  titulo: string;
  mensagem: string;
  tipo: 'aviso' | 'lembrete' | 'urgente';
  lida: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contribution {
  id: string;
  user_id: string;
  valor: number;
  tipo: 'mensalidade' | 'taxa' | 'outros';
  descricao?: string;
  data_contribuicao: string;
  created_at: string;
  updated_at: string;
}