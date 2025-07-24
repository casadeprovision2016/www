#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Verificando schema real da tabela events...\n');
  
  try {
    // Buscar um evento para ver os campos reais
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro:', error.message);
    } else if (events && events.length > 0) {
      console.log('✅ Campos reais da tabela events:');
      const firstEvent = events[0];
      Object.keys(firstEvent).forEach(key => {
        console.log(`   - ${key}: ${typeof firstEvent[key]} = ${firstEvent[key]}`);
      });
      
      console.log('\n📊 Evento completo:');
      console.log(JSON.stringify(firstEvent, null, 2));
    } else {
      console.log('⚠️ Nenhum evento encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkSchema().then(() => {
  process.exit(0);
});