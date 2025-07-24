#!/usr/bin/env node

/**
 * Script para executar migração completa do banco Supabase
 * Usage: node scripts/migrate-database.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigrations() {
  try {
    console.log('🚀 Iniciando migração do banco de dados...\n');
    
    // Ler o arquivo SQL
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Arquivo SQL carregado com sucesso');
    console.log(`📏 Tamanho: ${schemaSql.length} caracteres\n`);
    
    // Dividir em comandos individuais (separados por ;)
    const commands = schemaSql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`🔧 Executando ${commands.length} comandos SQL...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      // Pular comentários e comandos vazios
      if (command.startsWith('--') || command.trim().length < 10) {
        continue;
      }
      
      try {
        // Executar comando via RPC para SQL direto
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: command + ';'
        });
        
        if (error) {
          // Tentar método alternativo para comandos específicos
          console.log(`⚠️  Comando ${i + 1} falhou via RPC, tentando método alternativo...`);
          
          // Para comandos CREATE TABLE, usar abordagem diferente
          if (command.includes('CREATE TABLE')) {
            console.log(`📋 Pulando CREATE TABLE (pode já existir): ${command.substring(0, 50)}...`);
            continue;
          }
          
          throw error;
        }
        
        successCount++;
        console.log(`✅ Comando ${i + 1}/${commands.length} executado com sucesso`);
        
      } catch (error) {
        errorCount++;
        console.log(`❌ Erro no comando ${i + 1}: ${error.message}`);
        console.log(`   SQL: ${command.substring(0, 100)}...`);
        
        // Continuar com próximo comando mesmo em caso de erro
        // (algumas tabelas podem já existir)
      }
    }
    
    console.log(`\n📊 Resumo da migração:`);
    console.log(`   ✅ Sucessos: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📝 Total: ${commands.length}`);
    
    // Verificar se as tabelas principais foram criadas
    await verifyTables();
    
    // Inserir usuário de exemplo
    await insertSampleData();
    
    console.log('\n🎉 Migração finalizada!');
    
  } catch (error) {
    console.error('❌ Erro fatal na migração:', error.message);
    process.exit(1);
  }
}

async function verifyTables() {
  console.log('\n🔍 Verificando tabelas criadas...');
  
  const expectedTables = [
    'users', 'events', 'members', 'donations', 'ministries',
    'live_streams', 'pastoral_visits', 'notifications', 'organization'
  ];
  
  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log(`   ✅ Tabela '${tableName}' criada e acessível`);
      } else {
        console.log(`   ❌ Problema com tabela '${tableName}': ${error.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro ao verificar '${tableName}': ${error.message}`);
    }
  }
}

async function insertSampleData() {
  console.log('\n📝 Inserindo dados de exemplo...');
  
  try {
    // Verificar se já existe usuário pastor
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'pastor@casadeprovision.es')
      .single();
    
    if (!existingUser) {
      // Inserir usuário na tabela users (conectado ao auth)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: 'bf996a80-ba08-4397-a3a8-af6fd5f5b1fe', // ID já existente no auth
            email: 'pastor@casadeprovision.es',
            nome: 'Pastor Principal',
            telefone: '+34 600 000 000',
            role: 'admin',
            status: 'active'
          }
        ])
        .select()
        .single();
      
      if (userError) {
        console.log(`   ⚠️ Erro ao inserir usuário: ${userError.message}`);
      } else {
        console.log(`   ✅ Usuário pastor criado na tabela users`);
      }
    } else {
      console.log(`   ✅ Usuário pastor já existe na tabela users`);
    }
    
    // Inserir eventos de exemplo
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .limit(1);
    
    if (!eventsError && eventsData.length === 0) {
      const sampleEvents = [
        {
          titulo: 'Culto Dominical',
          descricao: 'Culto de adoração e palavra todos os domingos',
          data_inicio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          local: 'Santuário Principal',
          categoria: 'culto',
          status: 'scheduled',
          max_participantes: 200,
          created_by: 'bf996a80-ba08-4397-a3a8-af6fd5f5b1fe'
        },
        {
          titulo: 'Estudo Bíblico - Quarta-feira',
          descricao: 'Estudo profundo das Escrituras',
          data_inicio: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          local: 'Sala de Estudos',
          categoria: 'estudio',
          status: 'scheduled',
          max_participantes: 50,
          created_by: 'bf996a80-ba08-4397-a3a8-af6fd5f5b1fe'
        },
        {
          titulo: 'Reunião de Jovens',
          descricao: 'Encontro semanal dos jovens da igreja',
          data_inicio: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          local: 'Salão dos Jovens',
          categoria: 'jovenes',
          status: 'scheduled',
          max_participantes: 80,
          created_by: 'bf996a80-ba08-4397-a3a8-af6fd5f5b1fe'
        }
      ];
      
      const { error: insertEventsError } = await supabase
        .from('events')
        .insert(sampleEvents);
      
      if (insertEventsError) {
        console.log(`   ⚠️ Erro ao inserir eventos: ${insertEventsError.message}`);
      } else {
        console.log(`   ✅ ${sampleEvents.length} eventos de exemplo criados`);
      }
    }
    
    // Inserir ministérios de exemplo
    const { data: ministriesData, error: ministriesError } = await supabase
      .from('ministries')
      .select('id')
      .limit(1);
    
    if (!ministriesError && ministriesData.length === 0) {
      const sampleMinistries = [
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
      
      const { error: insertMinistriesError } = await supabase
        .from('ministries')
        .insert(sampleMinistries);
      
      if (insertMinistriesError) {
        console.log(`   ⚠️ Erro ao inserir ministérios: ${insertMinistriesError.message}`);
      } else {
        console.log(`   ✅ ${sampleMinistries.length} ministérios de exemplo criados`);
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Erro ao inserir dados de exemplo: ${error.message}`);
  }
}

// Executar migração
runMigrations().then(() => {
  console.log('\n✅ Script finalizado com sucesso');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Script falhou:', error.message);
  process.exit(1);
});