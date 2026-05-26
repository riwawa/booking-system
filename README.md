# BookingSystem

Sistema genérico de agendamento + pagamento + confirmação automática via WhatsApp.
Multi-tenant: um deploy, múltiplos clientes, cada um com sua URL e configuração.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Node.js 22 + TypeScript + Fastify |
| ORM | Prisma + PostgreSQL 16 |
| Filas | BullMQ + Redis 7 |
| Pagamentos | Mercado Pago (PIX, cartão, boleto) |
| WhatsApp | Evolution API |
| E-mail | Resend |
| Frontend | Next.js 15 + Tailwind CSS |
| Infra | Docker Compose → Railway |
| CI/CD | GitHub Actions |

## Rodando localmente

### Pré-requisitos
- Node.js 22+ / pnpm 11+
- Docker + Docker Compose

### Setup

```bash
git clone <repo> && cd booking-system

# instala dependências
pnpm install

# sobe postgres + redis
docker compose up -d

# configura .env
cp apps/api/.env.example apps/api/.env
# edite com suas chaves

# roda migrations + seed
pnpm db:migrate
pnpm db:seed

# inicia tudo
pnpm dev
```

### URLs
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Redis UI: http://localhost:8081
- Página de agendamento: http://localhost:3000/demo

### Credenciais do seed
- Owner: `owner@demo.com` / `demo1234`
- Provider: `provider@demo.com` / `demo1234`

## API endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

POST   /api/tenants
GET    /api/tenants/:slug
POST   /api/tenants/:slug/providers    🔒
GET    /api/tenants/:slug/providers
POST   /api/tenants/:slug/services     🔒
GET    /api/tenants/:slug/services
PUT    /api/tenants/:slug/providers/:id/availability  🔒

GET    /api/bookings/slots?providerId=&serviceId=&date=
GET    /api/bookings              🔒
GET    /api/bookings/:id          🔒
POST   /api/bookings              🔒
DELETE /api/bookings/:id          🔒

POST   /api/payments              🔒
GET    /api/payments/booking/:id  🔒
POST   /api/payments/webhook

GET    /health
```

🔒 = requer Authorization: Bearer {token}

## Adaptando para um nicho

O sistema é genérico por design. Para adaptar a um cliente:

1. Edite os labels no frontend (`provider` → `médico`, `service` → `consulta`)
2. Configure `TenantSettings` no seed ou dashboard
3. Personalize os templates em `notification.service.ts`
4. Ajuste `brandColor` no tenant para a cor do cliente

## Deploy no Railway

1. Crie um projeto no Railway
2. Adicione PostgreSQL e Redis como services
3. Conecte o repositório GitHub
4. Configure as variáveis de ambiente
5. O `deploy.yml` cuida do resto automaticamente
