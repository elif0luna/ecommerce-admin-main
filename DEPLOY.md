### AWS RDS for PostgreSQL

For production, use an RDS PostgreSQL instance instead of a local PostgreSQL
server:

1. In AWS, open **RDS > Databases > Create database** and choose
   **Standard create** with the PostgreSQL engine.
2. Use a strong master username and password, enable automated backups, and
   place the instance in the appropriate VPC and security group.
3. Allow inbound TCP `5432` only from the required application/network
   sources. Do not allow `0.0.0.0/0` for a production database.
4. Copy the endpoint from **Connectivity & security** after the instance is
   available. Do not prefix the endpoint with `https://`.
5. Create the `ecommerce_admin` database if it was not created during
   provisioning.
6. Configure the production connection string:

   ```env
   DATABASE_URL="postgresql://RDS_USER:RDS_PASSWORD@RDS_ENDPOINT:5432/ecommerce_admin?schema=public&sslmode=require"
   ```

7. From a trusted machine, run `npx prisma db push` to apply the current
   schema. For production migrations, prefer reviewed Prisma migrations over
   repeatedly using `db push`.
8. Keep the endpoint, username, and password out of Git. Use AWS Secrets
   Manager or another secret manager for credential rotation.


## Docker

The repository includes a multi-stage `Dockerfile` that installs dependencies,
generates Prisma Client, builds Next.js, and runs the production server.

Because `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is embedded during the Next.js
build, provide it as a build argument:

```powershell
docker build --no-cache `
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..." `
  -t ecommerce-admin .
```

Create a local `.env.docker` file with runtime values. For PostgreSQL running
on the Windows host, use `host.docker.internal`, not `localhost`:

```env
DATABASE_URL="postgresql://postgres:PASSWORD@host.docker.internal:5432/ecommerce_admin?schema=public"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
STRIPE_API_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
FRONTEND_STORE_URL="http://localhost:3001"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
```

Run the container:

```powershell
docker run --rm `
  --name ecommerce-admin `
  --env-file .env.docker `
  -p 3000:3000 `
  ecommerce-admin
```

Do not commit `.env.docker`. Inspect runtime failures with:

```powershell
docker logs -f ecommerce-admin
```

For hosted containers, use the RDS `DATABASE_URL`; do not use
`host.docker.internal`.

## Verification and production run

Run the available checks before deploying:

```bash
npx prisma validate
npm run lint
npm run build
```

After setting production environment variables and applying the database
schema, start the production server with:

```bash
npm run start
```

## Vercel deployment

Vercel builds and hosts the Next.js application separately from GitHub
Actions. Before deploying, create the AWS RDS database and verify its
production `DATABASE_URL`.

1. Push the repository to GitHub and import it through **Vercel > Add New >
   Project**.
2. Keep the root directory as the repository root. Use:

   ```text
   Framework preset: Next.js
   Install command: npm ci
   Build command: npm run build
   ```

3. In **Project Settings > Environment Variables**, add these values for
   **Production**:

   ```env
   DATABASE_URL=postgresql://RDS_USER:RDS_PASSWORD@RDS_ENDPOINT:5432/ecommerce_admin?schema=public&sslmode=require
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   STRIPE_API_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   FRONTEND_STORE_URL=https://YOUR_STOREFRONT_DOMAIN
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   ```

4. Confirm the RDS security group and network design allow Vercel to connect.
   Do not use a local `localhost` database URL in Vercel.
5. Deploy and copy the generated Vercel domain.
6. In Clerk, add the Vercel domain to production allowed origins and redirect
   URLs.
7. In Stripe **Developers > Webhooks**, add:

   ```text
   https://YOUR_VERCEL_DOMAIN/api/webhook
   ```

   Select the required events, copy the endpoint signing secret, and set it
   as `STRIPE_WEBHOOK_SECRET` in Vercel.
8. Redeploy after changing environment variables. Verify authentication,
   database reads/writes, image uploads, marketplace requests, supplier
   approval, payment settlement, and webhook handling.

## GitHub Actions CI/CD

The workflow in `.github/workflows/ci.yml` runs on pushes to `main`, `master`,
or `develop`, and on pull requests. It starts a temporary PostgreSQL 16
service, installs dependencies, validates and applies the Prisma schema,
runs ESLint, and creates a production build.

Add these repository secrets under **GitHub > Settings > Secrets and
variables > Actions**:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
STRIPE_API_KEY
STRIPE_WEBHOOK_SECRET
FRONTEND_STORE_URL
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
```

CI uses test-only PostgreSQL credentials defined in the workflow and must not
connect to the production RDS instance.

The project currently has no test files. Do not run `npm test` until Jest and
tests are installed. If Jest is added, add a `test` script to `package.json`
and a dedicated test step to the workflow.

Vercel can deploy automatically after a successful Git push. To block
production merges when CI fails, configure a GitHub branch protection rule
that requires the `build-and-test` status check.

## Production checklist

- RDS PostgreSQL is available and its security group is restricted.
- Prisma schema is applied to RDS.
- Vercel production environment variables are configured.
- Clerk production origins and redirect URLs include the deployed domain.
- Stripe production webhook points to `/api/webhook`.
- Cloudinary cloud name and upload preset are configured.
- `.env`, `.env.local`, `.env.docker`, and other secret files are ignored.
- `npx prisma validate`, `npm run lint`, `npm run build`, and CI pass.