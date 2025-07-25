const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pzchczilvfhzudybmgms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6Y2hjemlsdmZoenVkeWJtZ21zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI1Mjg2NCwiZXhwIjoyMDY4ODI4ODY0fQ.1YCovZzkID1Yd23hdAM6hq1FV8wITbR6bjyUPHn3MIM',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createTestUser() {
  console.log('Creating test user...');
  
  // Criar usuário de auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: 'test@example.com',
    password: 'test123456',
    email_confirm: true
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    return;
  }

  console.log('Auth user created:', authUser.user.id);

  // Criar registro na tabela users
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert({
      id: authUser.user.id,
      nome: 'Test User',
      email: 'test@example.com',
      role: 'admin'
    })
    .select()
    .single();

  if (userError) {
    console.error('Error creating user record:', userError);
    return;
  }

  console.log('User record created:', userData);
  console.log('✅ Test user ready! Use: test@example.com / test123456');
}

createTestUser().catch(console.error);