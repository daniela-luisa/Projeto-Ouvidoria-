-- Extensao para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum de perfis
CREATE TYPE perfil_enum AS ENUM ('admin', 'gestor', 'analista', 'solicitante');

-- Enum de status
CREATE TYPE status_enum AS ENUM ('aberta', 'em_analise', 'respondida', 'encerrada');

-- Tabela de usuarios
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil perfil_enum NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de categorias
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(80) UNIQUE NOT NULL,
  descricao TEXT
);

-- Tabela de vinculo analista x categoria
CREATE TABLE analista_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  categoria_id UUID NOT NULL REFERENCES categorias(id),
  UNIQUE(usuario_id, categoria_id)
);

-- Tabela de solicitacoes
CREATE TABLE solicitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitante_id UUID NOT NULL REFERENCES usuarios(id),
  categoria_id UUID NOT NULL REFERENCES categorias(id),
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT NOT NULL,
  status status_enum DEFAULT 'aberta',
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de comentarios
CREATE TABLE comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES solicitacoes(id),
  autor_id UUID NOT NULL REFERENCES usuarios(id),
  conteudo TEXT NOT NULL,
  visivel_solicitante BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de logs
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id),
  acao VARCHAR(80) NOT NULL,
  entidade VARCHAR(80),
  entidade_id UUID,
  detalhes TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Inserir admin inicial
-- Senha: password
-- Hash gerado com: node -e "const b = require('bcryptjs'); b.hash('password', 12).then(h => console.log(h))"
INSERT INTO usuarios (nome, email, senha_hash, perfil)
VALUES (
  'Administrador',
  'admin@nossavoz.com',
  '$2a$12$TsvVpQQ/wKDcffLjG1O3Gu9WKXnQDPuCoiFzL7rc61JkRJo1KRWii',
  'admin'
);

-- Inserir categorias iniciais
INSERT INTO categorias (nome, descricao) VALUES
  ('Denuncia', 'Relatos de condutas inadequadas ou irregulares'),
  ('Reclamacao', 'Insatisfacoes com processos, servicos ou pessoas'),
  ('Sugestao', 'Ideias e propostas de melhoria'),
  ('Elogio', 'Reconhecimento de boas praticas ou atendimentos');

-- Inserir gestor de exemplo
-- Senha: gestor123
INSERT INTO usuarios (nome, email, senha_hash, perfil)
VALUES (
  'Gestor Exemplo',
  'gestor@nossavoz.com',
  '$2a$12$HCdQQEqW8OXoPAQ80m54buumnRX1usaJlbI2IY7K7LqUEOAVfWImK',
  'gestor'
);

-- Inserir analista de exemplo
-- Senha: analista123
INSERT INTO usuarios (nome, email, senha_hash, perfil)
VALUES (
  'Analista Exemplo',
  'analista@nossavoz.com',
  '$2a$12$1xyccDm64Wvl26PodaxImuAHPZnCFzFBDgyFOqvlDfevLsbZ/Jjtu',
  'analista'
);

-- Vincular analista à categoria Denuncia e Reclamacao
INSERT INTO analista_categorias (usuario_id, categoria_id)
SELECT u.id, c.id
FROM usuarios u, categorias c
WHERE u.email = 'analista@nossavoz.com'
AND c.nome IN ('Denuncia', 'Reclamacao');

-- Inserir solicitante de exemplo
-- Senha: solicitante123
INSERT INTO usuarios (nome, email, senha_hash, perfil)
VALUES (
  'Solicitante Exemplo',
  'solicitante@nossavoz.com',
  '$2a$12$GlPCxuV68AfH2stxMOvR2u55YW.MI.bJz.AujHk5er9a0Wz7TwQla',
  'solicitante'
);
