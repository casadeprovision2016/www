#!/usr/bin/env node

/**
 * Script para criar usuário de teste no Supabase
 * Usage: node scripts/create-test-user.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  try {
    console.log('🔄 Criando usuário de teste...');
    
    // Criar usuário na autenticação do Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@test.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        name: 'Administrador Teste',
        role: 'admin'
      }
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log('✅ Usuário já existe na autenticação');
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Usuário criado na autenticação:', authData.user.id);
    }

    // Verificar se usuário existe na tabela users
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@test.com')
      .single();

    let userId = authData?.user?.id;
    
    if (!existingUser) {
      // Se não temos o ID do auth, buscar por email
      if (!userId) {
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        
        const authUser = users.find(u => u.email === 'admin@test.com');
        if (authUser) {
          userId = authUser.id;
        }
      }

      if (userId) {
        // Inserir na tabela users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([
            {
              id: userId,
              email: 'admin@test.com',
              name: 'Administrador Teste',
              role: 'admin',
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (userError) {
          if (userError.code === '23505') { // Duplicate key error
            console.log('✅ Usuário já existe na tabela users');
          } else {
            throw userError;
          }
        } else {
          console.log('✅ Usuário criado na tabela users:', userData.id);
        }
      }
    } else {
      console.log('✅ Usuário já existe na tabela users:', existingUser.id);
    }

    // Criar alguns eventos de exemplo
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .limit(1);

    if (!eventsError && eventsData.length === 0) {
      console.log('🔄 Criando eventos de exemplo...');
      
      const sampleEvents = [
        {
          title: 'Culto Dominical',
          description: 'Culto de adoração e palavra',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // próximo domingo
          time: '09:00',
          location: 'Santuário Principal',
          category: 'culto',
          status: 'scheduled',
          capacity: 200,
          created_by: userId
        },
        {
          title: 'Estudo Bíblico',
          description: 'Estudo das Escrituras',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // em 3 dias
          time: '19:30',
          location: 'Sala de Estudos',
          category: 'estudio',
          status: 'scheduled',
          capacity: 50,
          created_by: userId
        }
      ];

      const { error: insertEventsError } = await supabase
        .from('events')
        .insert(sampleEvents);

      if (insertEventsError) {
        console.log('⚠️ Erro ao criar eventos:', insertEventsError.message);
      } else {
        console.log('✅ Eventos de exemplo criados');
      }
    }

    console.log('\n🎉 Setup completo!');
    console.log('📧 Email: admin@test.com');
    console.log('🔑 Senha: admin123');
    console.log('👑 Role: admin');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar script
createTestUser().then(() => {
  console.log('\n✅ Script finalizado com sucesso');
  process.exit(0);
});