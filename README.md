# Ecommerce Admin

Next.js 13 e-commerce administration dashboard backed by PostgreSQL and Prisma.

## Requirements

- Node.js 18.17 or newer (Node.js 20 LTS is recommended)
- npm 9 or newer
- PostgreSQL 14 or newer (PostgreSQL 16 is recommended)
- A Clerk application
- A Stripe account
- A Cloudinary account with an unsigned upload preset

## Configuration

Create a `.env.local` file in the repository root. Do not commit this file.

```env
DATABASE_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
STRIPE_API_KEY
STRIPE_WEBHOOK_SECRET
FRONTEND_STORE_URL="http://localhost:3001"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
```

`FRONTEND_STORE_URL` is the customer-facing storefront URL used for Stripe
success and cancellation redirects. The admin dashboard itself runs on port
3000 by default.

The image uploader currently uses the `rdkhv4ol` Cloudinary upload preset in
`components/ui/image-upload.tsx`. Create that unsigned preset in Cloudinary,
or replace the preset name in the component with the preset used by your
Cloudinary account.

## Getting service credentials

### PostgreSQL with pgAdmin 4

1. In pgAdmin, register your local PostgreSQL server (`localhost`, port
   `5432`, user `postgres`) and enter the password chosen during PostgreSQL
   installation.
2. Create a database named `ecommerce_admin`.
3. Set `DATABASE_URL` in `.env.local`:

   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ecommerce_admin?schema=public"
   ```

   URL-encode special characters in the password (for example, `@` becomes
   `%40`). If PostgreSQL uses another port or username, replace those values.


### Clerk

1. Create an application at <https://dashboard.clerk.com>.
2. Open the application's **API Keys** page.
3. Copy the publishable key to `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and the
   secret key to `CLERK_SECRET_KEY`.
4. Add `http://localhost:3000` to development origins/redirect URLs. Add the
   deployed admin URL to the production instance later.

### Stripe

1. Create or sign in to an account at <https://dashboard.stripe.com>.
2. Enable **Test mode**, then open **Developers > API keys**.
3. Copy the secret key to `STRIPE_API_KEY`. Never expose this key in browser
   code or commit it.
4. Set `FRONTEND_STORE_URL` to the URL of the customer-facing storefront.
5. For local webhooks, install the Stripe CLI and run:

   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhook
   ```

   Copy the `whsec_...` value printed by the CLI to
   `STRIPE_WEBHOOK_SECRET`. In production, create a webhook endpoint at
   `https://YOUR_ADMIN_DOMAIN/api/webhook` and use its signing secret instead.

### Cloudinary

1. Create an account at <https://cloudinary.com/users/register/free>.
2. Open the Cloudinary console and copy the **Cloud name** to
   `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
3. Open **Settings > Upload > Upload presets**, create an unsigned preset, and
   either name it `rdkhv4ol` or update the preset name in
   `components/ui/image-upload.tsx`.

## Local development

1. Install PostgreSQL and pgAdmin 4. In pgAdmin, create a database named
   `ecommerce_admin`. The default local PostgreSQL connection is usually:
   host `localhost`, port `5432`, user `postgres`.

2. Install the exact dependency versions from the lockfile:

   ```bash
   npm ci
   ```

   The install script generates the Prisma client.

3. Set `DATABASE_URL` and the other service credentials in `.env.local`.

4. Apply the Prisma schema to the development database:

   ```bash
   npx prisma db push
   ```

   For a migration-based workflow, use `npx prisma migrate dev` instead.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open <http://localhost:3000>. Sign in or create an account through Clerk.

## Student marketplace

The dashboard includes a marketplace for buying from other students:

1. Open **Marketplace**, add products from one supplier to the cart, and select
   **Buy now**.
2. Submit your name, room number, roll number, and phone number.
3. The supplier reviews the request under **Orders** and approves or denies it.
4. Approved requests appear under **My Orders** with the amount owed. The
   supplier can mark the request as **Payment settled**, and the buyer's
   status refreshes automatically.

This flow records requests and payment status only; it does not process online
payments.

## Stripe webhooks

The webhook endpoint is:

```text
http://localhost:3000/api/webhook
```

For local testing, forward Stripe events to the running app with the Stripe
CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

Copy the signing secret printed by the CLI into `STRIPE_WEBHOOK_SECRET`.
Configure the deployed equivalent endpoint in the Stripe dashboard and use
its production webhook signing secret.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run lint` | Run Next.js ESLint checks |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npx prisma db push` | Apply the Prisma schema without migrations |
| `npx prisma migrate dev` | Create and apply a development migration |
