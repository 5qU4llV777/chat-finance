# 🌱 Verdinho

**Verdinho** é um assistente de organização financeira pessoal com interface de chat, que ajuda você a acompanhar gastos, receitas e hábitos financeiros de forma simples e conversacional.

## ✨ Funcionalidades

- 💬 Chat com IA para registrar e consultar suas finanças em linguagem natural
- 📊 Visualização de dados e gráficos de gastos/receitas
- 🔐 Autenticação e persistência de dados via Supabase
- 🎨 Interface moderna construída com componentes Radix UI e Tailwind CSS
- ⚡ Aplicação rápida e reativa com TanStack Start (SSR) e React 19

## 🛠️ Tecnologias

- **[TanStack Start](https://tanstack.com/start)** — framework full-stack React com SSR
- **[TanStack Router](https://tanstack.com/router)** e **[TanStack Query](https://tanstack.com/query)** — roteamento e gerenciamento de estado assíncrono
- **React 19** + **TypeScript**
- **Tailwind CSS 4** + **Radix UI** — estilização e componentes acessíveis
- **[Supabase](https://supabase.com)** — banco de dados, autenticação e backend
- **[AI SDK](https://sdk.vercel.ai)** — integração com modelos de IA para o chat
- **Vite** — build e dev server
- **ESLint + Prettier** — padronização e qualidade de código

## 🚀 Como rodar localmente

### Pré-requisitos

- [Node.js](https://nodejs.org) (recomendado via [nvm](https://github.com/nvm-sh/nvm))
- Uma conta no [Supabase](https://supabase.com) para as variáveis de ambiente do backend

### Instalação

```bash
# Clone o repositório
git clone https://github.com/5qU4llV777/chat-finance.git
cd chat-finance

# Instale as dependências
npm install
```

### Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as credenciais do Supabase e demais chaves necessárias (ex: chave da API de IA). Consulte `supabase/` para mais detalhes de configuração do backend.

> ⚠️ Nunca commite o arquivo `.env` — ele já deve estar listado no `.gitignore`.

### Rodando em modo desenvolvimento

```bash
npm run dev
```

O projeto ficará disponível em `http://localhost:5173` (ou na porta configurada pelo Vite).

### Outros comandos úteis

```bash
npm run build       # build de produção
npm run build:dev   # build em modo desenvolvimento
npm run preview      # preview do build de produção
npm run lint         # checagem de lint
npm run format       # formatação com Prettier
```

## 📁 Estrutura do projeto

```
├── public/           # arquivos estáticos
├── src/              # código-fonte da aplicação (rotas, componentes, lógica)
├── supabase/         # configuração e migrações do Supabase
├── package.json
└── vite.config.ts
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir uma *issue* ou enviar um *pull request*.

## 📄 Licença

Este projeto ainda não possui uma licença definida.


## Fotos do projeto 
