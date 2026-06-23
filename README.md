# MCTPro — SaaS para mascates, sacoleiras e vendedores de crediário

Sistema completo de gestão de clientes, vendas parceladas, parcelas, recebimentos e financeiro,
construído com Next.js 14 (App Router) + Supabase (Postgres + Auth + RLS multi-tenant).

## ✅ O que já está pronto (Fase 1 — entregue)

- **Autenticação**: login, cadastro, recuperação de senha, onboarding (dados do negócio)
- **Multi-tenant real via RLS**: cada usuário só vê os dados do próprio negócio (políticas no `supabase/schema.sql`)
- **Dashboard**: cards (vendido no mês, recebido, a receber, vencidas, inadimplentes, lucro, clientes, vendas), gráficos de vendas/recebimentos por mês, alertas de parcelas vencendo/vencidas
- **Clientes**: CRUD completo + página de histórico (compras, parcelas, totais)
- **Produtos**: CRUD completo com controle de estoque e alerta de estoque baixo
- **Vendas**: fluxo completo — selecionar cliente, adicionar produtos, desconto, entrada, escolher parcelamento (à vista/semanal/quinzenal/mensal, parcelas livres) — gera automaticamente o cronograma de vencimentos e baixa o estoque
- **Parcelas**: tela com filtros (hoje, semana, mês, vencidas, recebidas) e registrar pagamento (atualiza parcela, venda e gera o registro em `payments`)
- **Financeiro**: lançamento de despesas por categoria + receita/despesa/lucro líquido
- **Configurações**: dados do negócio, limite padrão de crédito, taxa padrão

## 🚧 Fase 2 — ainda não construído (próxima leva)

Esses módulos já têm as tabelas prontas no banco (`supabase/schema.sql`), mas as telas ainda não foram feitas:

- **Cobranças**: central de cobrança em lote + geração de mensagens (texto já modelado) — falta a tela e a integração real com WhatsApp/Evolution API
- **Rotas**: agrupar clientes por bairro/cidade e montar rota de visita (sem mapa visual ainda)
- **Relatórios**: telas de relatório por cliente/venda/financeiro/parcelas com exportação PDF/Excel
- **Assinatura digital**: captura de assinatura na finalização da venda (campo já existe em `sales.signature_data`)
- **Assistente de IA**: chat interno que responde perguntas como "quem me deve mais?" usando os dados do Supabase + API da Anthropic
- **Permissões de funcionário**: tabela `employees` já existe com RLS, mas falta a tela de convite/gestão de funcionários

Me avisa qual desses você quer primeiro e eu sigo construindo.

## Como rodar

1. Crie um projeto em https://supabase.com
2. Vá em **SQL Editor** e rode todo o conteúdo de `supabase/schema.sql`
3. Copie `.env.example` para `.env.local` e preencha com a URL e a anon key do seu projeto Supabase (em Project Settings → API)
4. Instale as dependências e rode local:
   ```
   npm install
   npm run dev
   ```
5. Acesse http://localhost:3000 — vai te mandar pro login. Crie uma conta, complete o onboarding e está dentro.

## Deploy no Railway

1. Suba esse projeto pro seu GitHub (`Edson-Saldanha`)
2. No Railway, crie um novo projeto a partir do repositório
3. Configure as variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
4. Build command: `npm run build` / Start command: `npm run start`
5. Conecte seu domínio próprio depois que estiver no ar

## Stack

- Next.js 14 (App Router, Server Components)
- Supabase (Postgres + Auth + RLS) — substitui o Prisma neste projeto, conforme pedido no briefing
- Tailwind CSS (tema dark + laranja, igual seus outros projetos)
- Recharts para os gráficos
