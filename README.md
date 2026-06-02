# MinhaVoz — Canal Interno de Solicitações Sigilosas

Sistema web de ouvidoria interna para registro e acompanhamento de solicitações sigilosas fictícias, desenvolvido como projeto da Avaliação N3 da disciplina de Segurança da Informação — Curso de Engenharia de Software, Centro Universitário Católica de Santa Catarina.

---

## Sobre o projeto

O MinhaVoz é um sistema de ouvidoria interna onde usuários autenticados podem registrar solicitações sigilosas. Cada solicitação passa por um fluxo de status rastreável: aberta, em análise, respondida e encerrada. O conteúdo é acessível apenas pelo próprio solicitante e pelo analista responsável. Gestores têm visão administrativa do canal. Todas as ações relevantes são registradas em log de auditoria.

---

## Tecnologias

- **Front-end:** React com Next.js
- **Back-end:** Node.js com Next.js API Routes
- **Banco de dados:** PostgreSQL
- **Autenticação:** NextAuth.js com sessão JWT
- **Hash de senhas:** bcrypt

---

## Perfis de usuário

| Perfil | Descrição |
|--------|-----------|
| Solicitante | Registra solicitações e visualiza apenas as próprias |
| Analista | Visualiza solicitações atribuídas, atualiza status e registra respostas |
| Gestor | Acesso administrativo completo: usuários, relatórios e logs de auditoria |

---

## Requisitos

- Node.js 18+
- PostgreSQL 15+
- npm ou yarn

---

## Usuários de teste

Os usuários fictícios para demonstração serão documentados aqui após a implementação do seed de dados.

| E-mail | Perfil |
|--------|--------|
| solicitante@teste.com | Solicitante |
| analista@teste.com | Analista |
| gestor@teste.com | Gestor |

---

## Integrantes

| Nome | RA |
|------|----|
| Ana Beatriz Cardozo | |
| Bárbara Scharf de Almeida | |
| Daniela Luisa da Conceição | |
| João Henrique Souza Rocha | |
| Guilherme Pietro Ruiz Costa | |

---

## Disciplina

Segurança da Informação — Avaliação N3  
Professor: Edson Vaz Lopes  
Centro Universitário Católica de Santa Catarina — 2026
