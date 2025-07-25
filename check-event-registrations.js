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

async function checkTable() {
  console.log('Checking event_registrations table structure...');
  
  // Verificar estrutura da tabela
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Sample record:', data);
  
  if (data && data.length > 0) {
    console.log('Available columns:', Object.keys(data[0]));
  }
}

checkTable().catch(console.error);