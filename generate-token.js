const jwt = require('jsonwebtoken');

// Simular um payload de usuário
const payload = {
  sub: '550e8400-e29b-41d4-a716-446655444441',
  email: 'admin@test.com',
  role: 'admin',
  aud: 'authenticated',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
};

const secret = 'sua_chave_super_secreta_256_bits_cccp_sistema_2024_desenvolvimento';

try {
  const token = jwt.sign(payload, secret);
  console.log('Token JWT gerado:');
  console.log(token);
  
  // Verificar se o token é válido
  const decoded = jwt.verify(token, secret);
  console.log('\nToken decodificado:');
  console.log(decoded);
} catch (error) {
  console.error('Erro:', error.message);
}