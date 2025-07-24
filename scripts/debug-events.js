#!/usr/bin/env node

/**
 * Script de debug para verificar tabela events
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugEvents() {
  console.log('🔍 Debug da tabela events...\n');
  
  try {
    // 1. Verificar se a tabela existe e listar campos
    console.log('📋 Verificando estrutura da tabela events...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'events')
      .eq('table_schema', 'public');
    
    if (columnsError) {
      console.log('❌ Erro ao buscar colunas:', columnsError.message);
    } else {
      console.log('✅ Colunas da tabela events:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }
    
    // 2. Tentar busca simples
    console.log('\n🔍 Tentando busca simples...');
    
    const { data: simpleData, error: simpleError } = await supabase
      .from('events')
      .select('*')
      .limit(3);
    
    if (simpleError) {
      console.log('❌ Erro na busca simples:', simpleError.message);
      console.log('📝 Código:', simpleError.code);
      console.log('📝 Detalhes:', simpleError.details);
    } else {
      console.log('✅ Busca simples funcionou!');
      console.log(`📊 Encontrados ${simpleData.length} eventos:`);
      simpleData.forEach((event, i) => {
        console.log(`   ${i + 1}. ${event.titulo || event.title || 'Sem título'} (ID: ${event.id})`);
      });
    }
    
    // 3. Tentar criar evento simples
    console.log('\n🔄 Tentando criar evento simples...');
    
    const novoEvento = {
      titulo: 'Evento Debug',
      descricao: 'Teste de debug',
      data_inicio: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      local: 'Local Teste',
      categoria: 'culto',
      status: 'scheduled',
      created_by: 'bf996a80-ba08-4397-a3a8-af6fd5f5b1fe'
    };
    
    const { data: createData, error: createError } = await supabase
      .from('events')
      .insert([novoEvento])
      .select();
    
    if (createError) {
      console.log('❌ Erro ao criar evento:', createError.message);
      console.log('📝 Código:', createError.code);
      console.log('📝 Detalhes:', createError.details);
      console.log('📝 Dados enviados:', JSON.stringify(novoEvento, null, 2));
    } else {
      console.log('✅ Evento criado com sucesso!');
      console.log('📊 Dados retornados:', JSON.stringify(createData[0], null, 2));
    }
    
    // 4. Buscar com join (como no controller)
    console.log('\n🔗 Tentando busca com join...');
    
    const { data: joinData, error: joinError } = await supabase
      .from('events')
      .select('*, created_by:users!events_created_by_fkey(nome, email)')
      .limit(2);
    
    if (joinError) {
      console.log('❌ Erro na busca com join:', joinError.message);
      console.log('📝 Isso pode ser o problema no controller!');
    } else {
      console.log('✅ Busca com join funcionou!');
      console.log(`📊 ${joinData.length} eventos com dados do usuário`);
    }
    
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
  }
}

debugEvents().then(() => {
  console.log('\n✅ Debug concluído!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Debug falhou:', error.message);
  process.exit(1);
});