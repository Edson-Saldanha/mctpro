-- ============================================================
-- MCTPro — Schema multi-tenant para Supabase (Postgres)
-- Rode isso inteiro no SQL Editor do seu projeto Supabase.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------
-- BUSINESSES (cada conta/negócio = um tenant)
-- ----------------------------------------------------------------
create table businesses (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  owner_name text not null,
  phone text,
  whatsapp text,
  city text,
  state text,
  address text,
  logo_url text,
  currency text default 'BRL',
  default_credit_limit numeric default 0,
  fee_rate numeric default 0,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- EMPLOYEES (perfis de acesso dentro do negócio)
-- ----------------------------------------------------------------
create table employees (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'funcionario' check (role in ('admin','funcionario')),
  created_at timestamptz default now(),
  unique (business_id, user_id)
);

-- ----------------------------------------------------------------
-- CLIENTS
-- ----------------------------------------------------------------
create table clients (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  full_name text not null,
  cpf text,
  rg text,
  phone text,
  whatsapp text,
  email text,
  address text,
  number text,
  neighborhood text,
  city text,
  state text,
  zip_code text,
  reference text,
  photo_url text,
  latitude numeric,
  longitude numeric,
  credit_limit numeric default 0,
  credit_used numeric default 0,
  internal_score int default 0,
  status text not null default 'ativo' check (status in ('ativo','bloqueado','inadimplente')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on clients (business_id);

-- ----------------------------------------------------------------
-- PRODUCTS
-- ----------------------------------------------------------------
create table products (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  category text,
  sku text,
  internal_code text,
  description text,
  cost numeric default 0,
  sale_price numeric not null default 0,
  stock_current numeric default 0,
  stock_min numeric default 0,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on products (business_id);

-- ----------------------------------------------------------------
-- SALES
-- ----------------------------------------------------------------
create table sales (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  client_id uuid not null references clients(id),
  seller_id uuid references employees(id),
  sale_date timestamptz default now(),
  total_amount numeric not null default 0,
  discount numeric default 0,
  down_payment numeric default 0,
  installment_type text check (installment_type in ('vista','semanal','quinzenal','mensal')),
  installment_count int default 1,
  status text not null default 'aberta' check (status in ('aberta','parcialmente_paga','quitada','cancelada')),
  signature_data text,
  signature_at timestamptz,
  created_at timestamptz default now()
);
create index on sales (business_id);
create index on sales (client_id);

-- ----------------------------------------------------------------
-- SALE_ITEMS
-- ----------------------------------------------------------------
create table sale_items (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  total_price numeric not null default 0
);
create index on sale_items (sale_id);

-- ----------------------------------------------------------------
-- INSTALLMENTS (parcelas)
-- ----------------------------------------------------------------
create table installments (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  sale_id uuid not null references sales(id) on delete cascade,
  client_id uuid not null references clients(id),
  installment_number int not null,
  due_date date not null,
  amount numeric not null,
  status text not null default 'pendente' check (status in ('pendente','pago','vencido','renegociado')),
  paid_amount numeric default 0,
  paid_at timestamptz,
  created_at timestamptz default now()
);
create index on installments (business_id);
create index on installments (sale_id);
create index on installments (client_id);
create index on installments (due_date);

-- ----------------------------------------------------------------
-- PAYMENTS (recebimentos)
-- ----------------------------------------------------------------
create table payments (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  installment_id uuid references installments(id),
  sale_id uuid references sales(id),
  client_id uuid references clients(id),
  amount numeric not null,
  payment_date timestamptz default now(),
  method text check (method in ('dinheiro','pix','cartao','transferencia')),
  notes text,
  created_at timestamptz default now()
);
create index on payments (business_id);

-- ----------------------------------------------------------------
-- EXPENSES (financeiro - saídas)
-- ----------------------------------------------------------------
create table expenses (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  category text not null,
  description text,
  amount numeric not null,
  expense_date date default current_date,
  created_at timestamptz default now()
);
create index on expenses (business_id);

-- ----------------------------------------------------------------
-- ROUTES (rotas de cobrança)
-- ----------------------------------------------------------------
create table routes (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  client_ids uuid[] default '{}',
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  client_id uuid references clients(id),
  installment_id uuid references installments(id),
  message text not null,
  channel text default 'whatsapp',
  status text default 'pendente',
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- SETTINGS (1:1 com businesses, chave/valor flexível)
-- ----------------------------------------------------------------
create table settings (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade unique,
  data jsonb default '{}',
  updated_at timestamptz default now()
);

-- ============================================================
-- RLS — cada usuário só vê dados do(s) negócio(s) a que pertence
-- ============================================================
alter table businesses enable row level security;
alter table employees enable row level security;
alter table clients enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table installments enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;
alter table routes enable row level security;
alter table notifications enable row level security;
alter table settings enable row level security;

-- Função helper: ids dos negócios que o usuário logado pode acessar
create or replace function auth_business_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select id from businesses where owner_id = auth.uid()
  union
  select business_id from employees where user_id = auth.uid()
$$;

create policy "businesses_select" on businesses for select using (owner_id = auth.uid() or id in (select auth_business_ids()));
create policy "businesses_modify" on businesses for all using (owner_id = auth.uid());

create policy "employees_select" on employees for select using (business_id in (select auth_business_ids()));
create policy "employees_modify" on employees for all using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "clients_all" on clients for all using (business_id in (select auth_business_ids()));
create policy "products_all" on products for all using (business_id in (select auth_business_ids()));
create policy "sales_all" on sales for all using (business_id in (select auth_business_ids()));
create policy "sale_items_all" on sale_items for all using (sale_id in (select id from sales where business_id in (select auth_business_ids())));
create policy "installments_all" on installments for all using (business_id in (select auth_business_ids()));
create policy "payments_all" on payments for all using (business_id in (select auth_business_ids()));
create policy "expenses_all" on expenses for all using (business_id in (select auth_business_ids()));
create policy "routes_all" on routes for all using (business_id in (select auth_business_ids()));
create policy "notifications_all" on notifications for all using (business_id in (select auth_business_ids()));
create policy "settings_all" on settings for all using (business_id in (select auth_business_ids()));

-- ============================================================
-- TRIGGER: marcar parcelas vencidas automaticamente (rodar via cron/Edge Function
-- ou checar no app; aqui fica a função pronta para um pg_cron diário)
-- ============================================================
create or replace function mark_overdue_installments()
returns void language sql as $$
  update installments
  set status = 'vencido'
  where status = 'pendente' and due_date < current_date;
$$;
