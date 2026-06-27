# NossaVoz — Canal Interno de Ouvidoria

Sistema web de ouvidoria interna para registro e acompanhamento de solicitações sigilosas, desenvolvido como projeto da Avaliação N3 da disciplina de Segurança da Informação — Curso de Engenharia de Software, Centro Universitário Católica de Santa Catarina.

---

## Sobre o projeto

O NossaVoz é um sistema de ouvidoria interna onde usuários autenticados podem registrar solicitações sigilosas de forma estruturada. Cada solicitação passa por um fluxo de status rastreável: **Aberta → Em análise → Respondida → Encerrada**. O acesso ao conteúdo é restrito por perfil — o solicitante vê apenas as próprias solicitações, o analista vê apenas as da sua categoria e o gestor tem visão administrativa completa. Todas as ações relevantes são registradas em log de auditoria.

---

## Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19 + Vite + React Router |
| Backend | Node.js + Express |
| Banco de dados | PostgreSQL |
| Autenticação | JWT (jsonwebtoken) |
| Hash de senhas | bcryptjs (custo 12) |
| Comunicação | Fetch API (cliente HTTP próprio) |

---

## Perfis de usuário

| Perfil | Permissões |
|--------|-----------|
| **Admin** | Cria e gerencia gestores |
| **Gestor** | Gerencia usuários, categorias, vê todas as solicitações, comenta, encerra e acessa logs de auditoria |
| **Analista** | Vê e trata solicitações da sua categoria, altera status, comenta |
| **Solicitante** | Registra solicitações e acompanha status e respostas visíveis |

---

## Pré-requisitos

Certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) v18 ou superior
- [PostgreSQL](https://www.postgresql.org/) v14 ou superior
- [Git](https://git-scm.com/)

---

## Instalação e execução

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/Projeto-Ouvidoria.git
cd Projeto-Ouvidoria
```

### 2. Criar o banco de dados

Abra o pgAdmin ou o terminal do PostgreSQL e execute:

```sql
CREATE DATABASE nossavoz;
```

Em seguida, com o banco `nossavoz` selecionado, rode o script completo do arquivo `banco.sql` que está na raiz do repositório. Ele criará todas as tabelas, os tipos enumerados e já inserirá os usuários iniciais com senhas em hash.

### 3. Configurar o backend

Acesse a pasta do backend:

```bash
cd backend
```

Copie o arquivo de variáveis de ambiente:

```bash
cp .env.example .env
```

Abra o arquivo `.env` e preencha com os dados do seu PostgreSQL:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nossavoz
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
JWT_SECRET=uma_string_secreta_longa_qualquer
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:5173
```

Instale as dependências:

```bash
npm install
```

Inicie o servidor:

```bash
npm run dev
```

Se a conexão estiver correta, você verá no terminal:

```
✅ Banco conectado com sucesso!
🚀 NossaVoz API rodando na porta 3000
```

### 4. Configurar o frontend

Em outro terminal, acesse a pasta do frontend:

```bash
cd frontend
```

Copie o arquivo de variáveis de ambiente:

```bash
cp .env.example .env
```

O arquivo `.env` do frontend já vem configurado para apontar para o backend local:

```env
VITE_API_URL=http://localhost:3000
```

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

### 5. Acessar o sistema

Abra o navegador e acesse:

```
http://localhost:5173
```

---

## Usuários disponíveis para teste

Todos os usuários abaixo são inseridos automaticamente ao rodar o `banco.sql`:

| Nome | E-mail | Senha | Perfil |
|------|--------|-------|--------|
| Administrador | admin@nossavoz.com | password | Admin |
| Gestor Exemplo | gestor@nossavoz.com | gestor123 | Gestor |
| Analista Exemplo | analista@nossavoz.com | analista123 | Analista |
| Solicitante Exemplo | solicitante@nossavoz.com | solicitante123 | Solicitante |

> O Analista Exemplo já vem vinculado às categorias **Denúncia** e **Reclamação**.

---

## Estrutura do projeto

```
Projeto-Ouvidoria/
├── banco.sql                        ← Script de criação do banco e seed inicial
├── backend/
│   ├── .env.example
│   ├── src/
│   │   ├── index.js                 ← Entry point do servidor Express
│   │   ├── db/index.js              ← Conexão com o PostgreSQL (pool)
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── usuariosController.js
│   │   │   ├── categoriasController.js
│   │   │   ├── solicitacoesController.js
│   │   │   ├── comentariosController.js
│   │   │   └── logsController.js
│   │   ├── middlewares/
│   │   │   ├── autenticacao.js      ← Verifica JWT
│   │   │   └── autorizacao.js       ← Verifica perfil e categoria
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── usuarios.js
│   │       ├── categorias.js
│   │       ├── solicitacoes.js
│   │       ├── comentarios.js
│   │       └── logs.js
└── frontend/
    ├── .env.example
    └── src/
        ├── App.jsx                  ← Rotas e proteção por perfil
        ├── contexts/AuthContext.jsx ← Contexto de autenticação
        ├── services/api.js          ← Cliente HTTP com token automático
        └── pages/
            ├── Login/
            ├── Admin/
            ├── Gestor/
            ├── Analista/
            ├── Solicitante/
            └── NaoAutorizado/
```

---

## Segurança implementada

- Senhas armazenadas com hash **bcryptjs** (custo 12) — nunca em texto puro
- Autenticação via **JWT** com expiração configurável
- Middleware de **autorização por perfil** em todas as rotas protegidas
- Analista restrito às solicitações da **própria categoria**
- Solicitante restrito às **próprias solicitações**
- Proteção contra **timing attacks** no login (comparação de hash mesmo quando e-mail não existe)
- **Log de auditoria** completo: login, login falho, cadastros, alterações de status, comentários, acessos negados
- Variáveis sensíveis em `.env` — nunca versionadas

---

## Integrantes

| Nome | RA |
|------|----|
| Ana Beatriz Pedrozo | |
| Bárbara Scharf de Almeida | |
| Daniela Luisa da Conceição | |
| João Henrique Souza Rocha | |
| Guilherme Pietro Ruiz Costa | |

---

## Disciplina

Segurança da Informação — Avaliação N3  
Professor: Edson Vaz Lopes  
Centro Universitário Católica de Santa Catarina — 2026