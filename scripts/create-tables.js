#!/usr/bin/env node

/**
 * Script simplificado para criar tabelas principais via API Supabase
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTables() {
  console.log('🚀 Criando estrutura do banco de dados...\n');
  
  try {
    // 1. Garantir que o usuário existe na tabela users
    console.log('👤 Verificando usuário pastor...');
    
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'pastor@casadeprovision.es')
      .single();
    
    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.log('⚠️ Erro ao verificar usuário:', userCheckError.message);
    }
    
    if (!existingUser) {
      const { data: newUser, error: insertUserError } = await supabase
        .from('users')
        .insert([
          {
            id: 'bf996a80-ba08-4397-a3a8-af6fd5f5b1fe',
            email: 'pastor@casadeprovision.es',
            nome: 'Pastor Principal',
            telefone: '+34 600 000 000',
            role: 'admin',
            status: 'active'
          }
        ])
        .select()
        .single();
      
      if (insertUserError) {
        console.log('❌ Erro ao criar usuário:', insertUserError.message);
      } else {
        console.log('✅ Usuário pastor criado com sucesso');
      }
    } else {
      console.log('✅ Usuário pastor já existe');
    }
    
    // 2. Criar eventos de exemplo
    console.log('\n📅 Criando eventos...');
    
    const { data: existingEvents } = await supabase
      .from('events')
      .select('id')
      .limit(1);
    
    if (!existingEvents || existingEvents.length === 0) {
      const eventos = [
        {
          titulo: 'Culto Dominical',
          descricao: 'Culto de adoração e palavra todos os domingos',
          data_inicio: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          local: 'Santuário Principal',
          categoria: 'culto',
          status: 'scheduled',
          max_participantes: 200,
          created_by: 'bf996a80-ba08-4397-a3a8-af6fd5f5b1fe'
        },
        {
          titulo: 'Estudo Bíblico',
          descricao: 'Estudo profundo das Escrituras',
          data_inicio: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
          local: 'Sala de Estudos',
          categoria: 'estudio',
          status: 'scheduled',
          max_participantes: 50,
          created_by: 'bf996a80-ba08-4397-a3a8-af6fd5f5b1fe'
        },
        {
          titulo: 'Reunião de Jovens',
          descricao: 'Encontro semanal dos jovens',
          data_inicio: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
          local: 'Salão dos Jovens',
          categoria: 'jovenes',
          status: 'scheduled',
          max_participantes: 80,
          created_by: 'bf996a80-ba08-4397-a3a8-af6fd5f5b1fe'
        }
      ];
      
      const { data: newEvents, error: eventsError } = await supabase
        .from('events')
        .insert(eventos)
        .select();
      
      if (eventsError) {
        console.log('❌ Erro ao criar eventos:', eventsError.message);
        console.log('📝 Detalhes:', eventsError);
      } else {
        console.log(`✅ ${newEvents.length} eventos criados com sucesso`);
      }
    } else {
      console.log('✅ Eventos já existem na base de dados');
    }
    
    // 3. Criar ministérios
    console.log('\n⛪ Criando ministérios...');
    
    const { data: existingMinistries } = await supabase
      .from('ministries')
      .select('id')
      .limit(1);
    
    if (!existingMinistries || existingMinistries.length === 0) {
      const ministerios = [
        {
          name: 'Ministério de Adoração',
          descricao: 'Responsável pela adoração nos cultos e eventos',
          lider_id: 'bf996a80-ba08-4397-a3a8-af6fd5f5b1fe',
          ativo: true
        },
        {
          name: 'Ministério de Jovens',
          descricao: 'Trabalho voltado para os jovens da igreja',
          lider_id: 'bf996a80-ba08-4397-a3a8-af6fd5f5b1fe',
          ativo: true
        },
        {
          name: 'Ministério de Evangelismo',
          descricao: 'Evangelização e missões da igreja',
          lider_id: 'bf996a80-ba08-4397-a3a8-af6fd5f5b1fe',
          ativo: true
        }
      ];
      
      const { data: newMinistries, error: ministriesError } = await supabase
        .from('ministries')
        .insert(ministerios)
        .select();
      
      if (ministriesError) {
        console.log('❌ Erro ao criar ministérios:', ministriesError.message);
      } else {
        console.log(`✅ ${newMinistries.length} ministérios criados com sucesso`);
      }
    } else {
      console.log('✅ Ministérios já existem na base de dados');
    }
    
    // 4. Verificar organização
    console.log('\n🏢 Verificando organização...');
    
    const { data: existingOrg } = await supabase
      .from('organization')
      .select('*')
      .limit(1);
    
    if (!existingOrg || existingOrg.length === 0) {
      const { data: newOrg, error: orgError } = await supabase
        .from('organization')
        .insert([
          {
            name: 'Centro Cristiano Casa de Provisión',
            descricao: 'Igreja evangélica dedicada ao crescimento espiritual e social da comunidade.',
            configuracoes: {
              timezone: 'Europe/Madrid',
              currency: 'EUR',
              language: 'es'
            }
          }
        ])
        .select();
      
      if (orgError) {
        console.log('❌ Erro ao criar organização:', orgError.message);
      } else {
        console.log('✅ Organização criada com sucesso');
      }
    } else {
      console.log('✅ Organização já existe');
    }
    
    console.log('\n🎉 Estrutura do banco criada com sucesso!');
    console.log('\n📊 Resumo:');
    console.log('   👤 Usuário pastor: pastor@casadeprovision.es');
    console.log('   📅 Eventos de exemplo criados');
    console.log('   ⛪ Ministérios básicos configurados');
    console.log('   🏢 Organização configurada');
    
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    console.error('📝 Stack:', error.stack);
    process.exit(1);
  }
}

// Executar
createTables().then(() => {
  console.log('\n✅ Script concluído com sucesso!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Script falhou:', error.message);
  process.exit(1);
});