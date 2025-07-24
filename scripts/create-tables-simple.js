#!/usr/bin/env node

/**
 * Script simplificado para criar dados no Supabase (sem dotenv)
 */

const { createClient } = require('@supabase/supabase-js');

// Usar variáveis de ambiente diretamente
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas:');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createData() {
  console.log('🚀 Criando dados no banco de dados...\n');
  console.log('🔗 URL:', SUPABASE_URL);
  console.log('🔑 Key:', SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'Não configurada');
  
  try {
    // 1. Verificar/criar usuário
    console.log('\n👤 Verificando usuário pastor...');
    
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'pastor@casadeprovision.es')
      .single();
    
    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.log('⚠️ Erro ao verificar usuário:', userCheckError.message);
      console.log('📝 Código do erro:', userCheckError.code);
    }
    
    if (!existingUser) {
      console.log('🔄 Criando usuário pastor...');
      
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
        console.log('📝 Detalhes:', insertUserError);
      } else {
        console.log('✅ Usuário pastor criado com sucesso');
      }
    } else {
      console.log('✅ Usuário pastor já existe');
      console.log('📊 Dados:', existingUser);
    }
    
    // 2. Criar eventos
    console.log('\n📅 Criando eventos...');
    
    const { data: existingEvents, error: eventsCheckError } = await supabase
      .from('events')
      .select('id')
      .limit(1);
    
    if (eventsCheckError) {
      console.log('⚠️ Erro ao verificar eventos:', eventsCheckError.message);
    }
    
    if (!existingEvents || existingEvents.length === 0) {
      console.log('🔄 Inserindo eventos de exemplo...');
      
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
        }
      ];
      
      const { data: newEvents, error: eventsError } = await supabase
        .from('events')
        .insert(eventos)
        .select();
      
      if (eventsError) {
        console.log('❌ Erro ao criar eventos:', eventsError.message);
        console.log('📝 Detalhes completos:', JSON.stringify(eventsError, null, 2));
        
        // Tentar inserir um por vez para debug
        console.log('\n🔄 Tentando inserir eventos um por vez...');
        for (let i = 0; i < eventos.length; i++) {
          const evento = eventos[i];
          console.log(`📝 Inserindo evento ${i + 1}: ${evento.titulo}`);
          
          const { data: singleEvent, error: singleError } = await supabase
            .from('events')
            .insert([evento])
            .select();
          
          if (singleError) {
            console.log(`   ❌ Erro: ${singleError.message}`);
            console.log(`   📝 Dados: ${JSON.stringify(evento, null, 2)}`);
          } else {
            console.log(`   ✅ Sucesso: ${singleEvent[0].titulo}`);
          }
        }
      } else {
        console.log(`✅ ${newEvents.length} eventos criados com sucesso`);
      }
    } else {
      console.log('✅ Eventos já existem na base de dados');
    }
    
    console.log('\n🎉 Processo finalizado!');
    
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    console.error('📝 Stack:', error.stack);
    process.exit(1);
  }
}

// Executar
createData().then(() => {
  console.log('\n✅ Script concluído!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Script falhou:', error.message);
  process.exit(1);
});