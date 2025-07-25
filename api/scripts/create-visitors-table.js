#!/usr/bin/env node

/**
 * Script para criar a tabela visitors no Supabase
 * Usage: node scripts/create-visitors-table.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createVisitorsTable() {
  try {
    console.log('🔄 Criando tabela visitors...');
    
    // First, create some test data to ensure table structure works
    const testVisitor = {
      name: 'Visitante Teste',
      email: 'teste@visitante.com',
      phone: '+34 600 000 000',
      address: 'Madrid, Espanha',
      visitDate: new Date().toISOString().split('T')[0],
      source: 'walk_in',
      notes: 'Visitante de teste criado pelo script',
      followUpStatus: 'pending',
      interestedInMembership: false
    };

    // Try to insert directly (this will fail if table doesn't exist)
    const { data, error } = await supabase
      .from('visitors')
      .insert([testVisitor])
      .select();

    if (error) {
      if (error.code === '42P01') {
        console.log('❌ Tabela visitors não existe. Ela precisa ser criada manualmente no Supabase.');
        console.log('\n📋 Execute este SQL no Supabase SQL Editor:');
        console.log(`
CREATE TABLE IF NOT EXISTS public.visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  "visitDate" DATE NOT NULL DEFAULT CURRENT_DATE,
  source VARCHAR(50) NOT NULL DEFAULT 'walk_in' CHECK (source IN ('invitation', 'social_media', 'walk_in', 'website', 'other')),
  notes TEXT,
  "followUpStatus" VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK ("followUpStatus" IN ('pending', 'contacted', 'scheduled', 'completed', 'no_interest')),
  "followUpDate" DATE,
  "interestedInMembership" BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_visitors_visit_date ON public.visitors("visitDate");
CREATE INDEX IF NOT EXISTS idx_visitors_follow_up_status ON public.visitors("followUpStatus");
CREATE INDEX IF NOT EXISTS idx_visitors_source ON public.visitors(source);

-- Trigger para auto-atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_visitors_updated_at ON public.visitors;
CREATE TRIGGER update_visitors_updated_at
  BEFORE UPDATE ON public.visitors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - opcional
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações para usuários autenticados
CREATE POLICY "Allow all operations for authenticated users" ON public.visitors
  FOR ALL USING (auth.role() = 'authenticated');
        `);
        
        console.log('\n✅ Após executar o SQL acima, execute este script novamente para testar.');
        return;
      } else {
        throw error;
      }
    }

    console.log('✅ Tabela visitors já existe e funcionando!');
    console.log('✅ Visitante de teste criado:', data[0].id);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar script
createVisitorsTable().then(() => {
  console.log('\n✅ Script finalizado com sucesso');
  process.exit(0);
});