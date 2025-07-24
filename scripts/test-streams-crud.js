

require('dotenv').config({ path: './api/.env' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const testStreamData = {
  titulo: 'Teste de Transmissão ao Vivo',
  descricao: 'Esta é uma transmissão de teste gerada automaticamente.',
  url_stream: 'https://youtube.com/live/test',
  data_inicio: new Date().toISOString(),
  status: 'agendado',
  publico: true,
};

const updatedStreamData = {
  titulo: 'Teste de Transmissão (Atualizado)',
  status: 'ao_vivo',
};

const runTest = async () => {
  let streamId = null;
  let testUserId = null;

  try {
    // 1. Buscar um usuário para usar como 'created_by'
    console.log('Buscando usuário de teste...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'pastor@casadeprovision.es')
      .single();

    if (userError || !userData) {
      console.error('Erro ao buscar usuário de teste:', userError?.message || 'Usuário pastor não encontrado.');
      return;
    }
    testUserId = userData.id;
    console.log(`Usuário de teste encontrado: ${testUserId}`);

    // 2. Criar a transmissão
    console.log('\n--- Iniciando teste de CRIAÇÃO ---');
    const { data: createdStream, error: createError } = await supabase
      .from('live_streams')
      .insert({
        ...testStreamData,
        created_by: testUserId,
      })
      .select()
      .single();

    if (createError || !createdStream) {
      console.error('❌ FALHA NA CRIAÇÃO:');
      console.error(createError);
      return;
    }
    console.log('✅ SUCESSO NA CRIAÇÃO:');
    console.log('  ID:', createdStream.id);
    console.log('  Título:', createdStream.titulo);
    streamId = createdStream.id;

    // 3. Atualizar a transmissão
    console.log(`\n--- Iniciando teste de ATUALIZAÇÃO para o ID: ${streamId} ---`);
    const { data: updatedStream, error: updateError } = await supabase
      .from('live_streams')
      .update(updatedStreamData)
      .eq('id', streamId)
      .select()
      .single();

    if (updateError || !updatedStream) {
      console.error('❌ FALHA NA ATUALIZAÇÃO:');
      console.error(updateError);
      return;
    }
    console.log('✅ SUCESSO NA ATUALIZAÇÃO:');
    console.log('  Título atualizado:', updatedStream.titulo);
    console.log('  Status atualizado:', updatedStream.status);

  } catch (error) {
    console.error('\n🚨 UM ERRO INESPERADO OCORREU:');
    console.error(error);
  } finally {
    // 4. Deletar a transmissão de teste
    if (streamId) {
      console.log(`\n--- Iniciando limpeza (DELEÇÃO) do ID: ${streamId} ---`);
      const { error: deleteError } = await supabase
        .from('live_streams')
        .delete()
        .eq('id', streamId);

      if (deleteError) {
        console.error('❌ FALHA NA DELEÇÃO:');
        console.error(deleteError);
      } else {
        console.log('✅ SUCESSO NA DELEÇÃO.');
      }
    }
    console.log('\n--- Teste finalizado ---');
  }
};

runTest();

