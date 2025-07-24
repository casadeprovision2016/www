#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAPI() {
  console.log('🧪 Testando API diretamente...\n');
  
  try {
    // 1. Login
    console.log('🔐 Testando login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'pastor@casadeprovision.es',
      password: '2GZPkxTmfSiTY64E'
    });
    
    if (authError) {
      console.log('❌ Erro no login:', authError.message);
      return;
    }
    
    console.log('✅ Login OK, token:', authData.session.access_token.substring(0, 50) + '...');
    
    // 2. Verificar usuário na tabela users
    console.log('\n👤 Verificando usuário na tabela...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (userError) {
      console.log('❌ Erro ao buscar usuário:', userError.message);
    } else {
      console.log('✅ Usuário encontrado:', userData.email, '| Role:', userData.role);
    }
    
    // 3. Testar busca de eventos diretamente
    console.log('\n📅 Testando busca de eventos...');
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(3);
    
    if (eventsError) {
      console.log('❌ Erro ao buscar eventos:', eventsError.message);
    } else {
      console.log(`✅ Eventos encontrados: ${eventsData.length}`);
      eventsData.forEach((event, i) => {
        console.log(`   ${i + 1}. ${event.titulo} - ${event.data_inicio}`);
      });
    }
    
    // 4. Testar criação de evento
    console.log('\n➕ Testando criação de evento...');
    const novoEvento = {
      titulo: 'Teste API Direct',
      descricao: 'Evento criado diretamente via API',
      data_inicio: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      local: 'Local Teste',
      max_participantes: 100,
      created_by: authData.user.id
    };
    
    const { data: newEvent, error: createError } = await supabase
      .from('events')
      .insert([novoEvento])
      .select();
    
    if (createError) {
      console.log('❌ Erro ao criar evento:', createError.message);
    } else {
      console.log('✅ Evento criado:', newEvent[0].titulo);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testAPI().then(() => {
  console.log('\n✅ Teste concluído!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Teste falhou:', error.message);
  process.exit(1);
});