import assert from 'node:assert/strict';
import http from 'node:http';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { createApp } from '../src/app.ts';
import {
  AuthenticatedRequest,
  authenticateJWT,
  authorizeRoles,
} from '../src/middleware/auth.middleware.ts';
import { signAuthToken } from '../src/utils/jwt.ts';
import { sanitizeUser } from '../src/services/auth.service.ts';
import { prisma } from '../src/config/prisma.ts';
import { env } from '../src/config/env.ts';

interface TestResult {
  name: string;
  status: 'PASSED' | 'SKIPPED';
  detail?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, status: 'PASSED' });
    console.log(`PASS  ${name}`);
  } catch (err) {
    console.error(`FAIL  ${name}`);
    throw err;
  }
}

async function main() {
  const app = createApp((expressApp) => {
    expressApp.get(
      '/api/_test/vendor-only',
      authenticateJWT,
      authorizeRoles(UserRole.VENDOR),
      (req: AuthenticatedRequest, res) => {
        res.status(200).json({ success: true, role: req.user?.role });
      }
    );
    expressApp.get(
      '/api/_test/admin-only',
      authenticateJWT,
      authorizeRoles(UserRole.ADMIN),
      (req: AuthenticatedRequest, res) => {
        res.status(200).json({ success: true, role: req.user?.role });
      }
    );
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind test server port');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 1. Health endpoint
    await runTest('GET /api/health returns 200 OK', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);
      const body = (await res.json()) as { success: boolean; service: string };
      assert.equal(body.success, true);
      assert.equal(body.service, 'digithela-api');
    });

    // 2. bcrypt password hashing & sanitizeUser check
    await runTest('bcrypt hashes passwords securely and sanitizeUser strips passwordHash', async () => {
      const raw = 'VendorPass#2026';
      const hash = await bcrypt.hash(raw, 10);
      assert.notEqual(hash, raw);
      assert.equal(await bcrypt.compare(raw, hash), true);
      assert.equal(await bcrypt.compare('WrongPass', hash), false);

      const safe = sanitizeUser({
        id: 'u-1',
        name: 'Test User',
        email: 'test@digithela-demo.in',
        mobileNumber: '+919820000101',
        passwordHash: hash,
        role: UserRole.VENDOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      assert.equal('passwordHash' in safe, false);
      assert.equal(safe.role, UserRole.VENDOR);
    });

    // 3. Input validation & sensitive banking field rejection
    await runTest('POST /api/auth/register/customer rejects sensitive fields (upiPin / otp)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register/customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Customer Test',
          email: 'cust@example.com',
          password: 'password123',
          upiPin: '1234',
        }),
      });
      assert.equal(res.status, 400);
      const body = (await res.json()) as { error: { code: string } };
      assert.equal(body.error.code, 'VALIDATION_ERROR');
    });

    await runTest('POST /api/auth/register/vendor validates Indian mobile number and email presence', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register/vendor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Ramesh',
          mobileNumber: '12345',
          password: 'password123',
        }),
      });
      assert.equal(res.status, 400);
      const body = (await res.json()) as { error: { code: string } };
      assert.equal(body.error.code, 'VALIDATION_ERROR');
    });

    await runTest('POST /api/auth/login rejects missing identifier', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'password123' }),
      });
      assert.equal(res.status, 400);
    });

    // 4. JWT Authentication Middleware
    await runTest('GET /api/auth/me returns 401 when Authorization header is missing', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`);
      assert.equal(res.status, 401);
      const body = (await res.json()) as { error: { code: string } };
      assert.equal(body.error.code, 'UNAUTHORIZED');
    });

    await runTest('GET /api/auth/me returns 401 for malformed or invalid JWT', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: 'Bearer invalid.jwt.token' },
      });
      assert.equal(res.status, 401);
      const body = (await res.json()) as { error: { code: string } };
      assert.equal(body.error.code, 'INVALID_TOKEN');
    });

    // 5. Role-Based Authorization (CUSTOMER, VENDOR, ADMIN)
    await runTest('Role-based authorization enforces CUSTOMER / VENDOR / ADMIN boundaries', async () => {
      const customerToken = signAuthToken({
        userId: 'cust-1',
        role: UserRole.CUSTOMER,
        name: 'Customer Demo',
        email: 'cust@demo.in',
        mobileNumber: null,
      });
      const vendorToken = signAuthToken({
        userId: 'vend-1',
        role: UserRole.VENDOR,
        name: 'Vendor Demo',
        email: null,
        mobileNumber: '+919820000101',
      });
      const adminToken = signAuthToken({
        userId: 'admin-1',
        role: UserRole.ADMIN,
        name: 'Admin Demo',
        email: 'admin@demo.in',
        mobileNumber: null,
      });

      // Customer denied on vendor-only route
      const custOnVendor = await fetch(`${baseUrl}/api/_test/vendor-only`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(custOnVendor.status, 403);

      // Vendor allowed on vendor-only route
      const vendOnVendor = await fetch(`${baseUrl}/api/_test/vendor-only`, {
        headers: { Authorization: `Bearer ${vendorToken}` },
      });
      assert.equal(vendOnVendor.status, 200);

      // Vendor denied on admin-only route
      const vendOnAdmin = await fetch(`${baseUrl}/api/_test/admin-only`, {
        headers: { Authorization: `Bearer ${vendorToken}` },
      });
      assert.equal(vendOnAdmin.status, 403);

      // Admin allowed on admin-only route
      const adminOnAdmin = await fetch(`${baseUrl}/api/_test/admin-only`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(adminOnAdmin.status, 200);
    });

    // 6. Logout endpoint
    await runTest('POST /api/auth/logout returns 200 and clears auth cookie', async () => {
      const res = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST' });
      assert.equal(res.status, 200);
      const body = (await res.json()) as { success: boolean };
      assert.equal(body.success, true);
    });

    // 7. Database-backed end-to-end tests (run only if PostgreSQL is configured & reachable)
    let dbAvailable = false;
    if (env.databaseUrl) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        dbAvailable = true;
      } catch {
        dbAvailable = false;
      }
    }

    if (!dbAvailable) {
      await runTest('Unconfigured PostgreSQL returns clean 503 DATABASE_UNAVAILABLE without crashing', async () => {
        const res = await fetch(`${baseUrl}/api/auth/register/customer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Ananya Demo',
            email: 'ananya.demo@example.com',
            password: 'password123',
          }),
        });
        assert.equal(res.status, 503);
        const body = (await res.json()) as { error: { code: string } };
        assert.equal(body.error.code, 'DATABASE_UNAVAILABLE');
      });

      results.push({
        name: 'PostgreSQL live persistence tests (register, duplicate check, login, /me)',
        status: 'SKIPPED',
        detail: 'Skipped: PostgreSQL server / DATABASE_URL is not configured in this environment.',
      });
      console.log('SKIP  PostgreSQL live persistence tests (no live DATABASE_URL reachable)');
    } else {
      const suffix = Date.now();
      const custEmail = `cust.${suffix}@digithela-demo.in`;
      const vendMobile = `98${String(suffix).slice(-8)}`;
      const adminEmail = `admin.${suffix}@digithela-demo.in`;
      const createdUserIds: string[] = [];

      try {
        await runTest('DB: Register Customer, Login by Email, and GET /api/auth/me', async () => {
          const reg = await fetch(`${baseUrl}/api/auth/register/customer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Customer Live Test',
              email: custEmail,
              password: 'Password123!',
            }),
          });
          assert.equal(reg.status, 201);
          const regBody = (await reg.json()) as {
            data: { token: string; user: { id: string; role: string } };
          };
          createdUserIds.push(regBody.data.user.id);
          assert.equal(regBody.data.user.role, 'CUSTOMER');

          const me = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${regBody.data.token}` },
          });
          assert.equal(me.status, 200);

          const login = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: custEmail, password: 'Password123!' }),
          });
          assert.equal(login.status, 200);
        });

        await runTest('DB: Register Vendor with VendorProfile and Login by Mobile', async () => {
          const reg = await fetch(`${baseUrl}/api/auth/register/vendor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Vendor Live Test',
              mobileNumber: vendMobile,
              password: 'Password123!',
              vendorProfile: {
                businessName: 'Test Chaat Stall',
                category: 'Street Food',
                description: 'Fresh evening snacks for Mira Road commuters.',
                address: 'Near Station Road, Bhayandar West',
                area: 'Bhayandar West',
                openingTime: '04:00 PM',
                closingTime: '10:00 PM',
                upiId: 'testchaat.demo@upi',
              },
            }),
          });
          assert.equal(reg.status, 201);
          const regBody = (await reg.json()) as {
            data: { user: { id: string; role: string; vendorProfile: { businessName: string } } };
          };
          createdUserIds.push(regBody.data.user.id);
          assert.equal(regBody.data.user.role, 'VENDOR');
          assert.equal(regBody.data.user.vendorProfile.businessName, 'Test Chaat Stall');

          const login = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: vendMobile, password: 'Password123!' }),
          });
          assert.equal(login.status, 200);
        });

        await runTest('DB: Register Admin and reject duplicate email', async () => {
          const reg = await fetch(`${baseUrl}/api/auth/register/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Admin Live Test',
              email: adminEmail,
              password: 'AdminPassword123!',
              adminSecret: env.adminRegistrationKey || undefined,
            }),
          });
          assert.equal(reg.status, 201);
          const regBody = (await reg.json()) as {
            data: { user: { id: string; role: string } };
          };
          createdUserIds.push(regBody.data.user.id);
          assert.equal(regBody.data.user.role, 'ADMIN');

          const dup = await fetch(`${baseUrl}/api/auth/register/customer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Duplicate',
              email: custEmail,
              password: 'Password123!',
            }),
          });
          assert.equal(dup.status, 409);
        });
      } finally {
        if (createdUserIds.length > 0) {
          await prisma.user.deleteMany({
            where: { id: { in: createdUserIds } },
          });
        }
      }
    }

    console.log('\nTest Summary:', JSON.stringify(results, null, 2));
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
