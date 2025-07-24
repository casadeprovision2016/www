#!/usr/bin/env node

/**
 * Script para verificar estrutura atual do banco Supabase
 * Usage: node scripts/check-database.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabase() {
  try {
    console.log('🔍 Verificando estrutura atual do banco...\n');
    
    // Verificar tabelas existentes
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'schema_migrations');

    if (tablesError) {
      console.log('❌ Erro ao buscar tabelas:', tablesError.message);
    } else {
      console.log('📋 Tabelas existentes:');
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
      console.log(`\nTotal: ${tables.length} tabelas\n`);
    }

    // Verificar usuários na auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Erro ao buscar usuários auth:', authError.message);
    } else {
      console.log('👥 Usuários na autenticação:');
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.id})`);
      });
      console.log(`\nTotal: ${users.length} usuários\n`);
    }

    // Verificar dados na tabela users se existir
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5);

      if (!usersError && usersData) {
        console.log('📊 Dados na tabela users:');
        usersData.forEach(user => {
          console.log(`  - ${user.email || user.nome} (role: ${user.role})`);
        });
        console.log(`\nTotal: ${usersData.length} registros na tabela users\n`);
      }
    } catch (error) {
      console.log('⚠️ Tabela users não existe ou não acessível\n');
    }

    // Verificar dados na tabela events se existir
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .limit(5);

      if (!eventsError && eventsData) {
        console.log('📅 Dados na tabela events:');
        eventsData.forEach(event => {
          console.log(`  - ${event.titulo || event.title} (${event.id})`);
        });
        console.log(`\nTotal: ${eventsData.length} eventos\n`);
      }
    } catch (error) {
      console.log('⚠️ Tabela events não existe ou não acessível\n');
    }

    console.log('✅ Verificação completa!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar verificação
checkDatabase().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error.message);
  process.exit(1);
});