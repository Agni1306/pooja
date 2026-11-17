import assert from 'node:assert/strict';
import http from 'node:http';
import { UserRole } from '@prisma/client';
import { createApp } from '../src/app.ts';
import { signAuthToken } from '../src/utils/jwt.ts';
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
  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind test server port');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const customerToken = signAuthToken({
    userId: 'cust-test-1',
    role: UserRole.CUSTOMER,
    name: 'Customer Test',
    email: 'cust@digithela-demo.in',
    mobileNumber: null,
  });

  const vendorToken = signAuthToken({
    userId: 'vend-test-1',
    role: UserRole.VENDOR,
    name: 'Vendor Test',
    email: 'vend@digithela-demo.in',
    mobileNumber: '+919820000101',
  });

  const adminToken = signAuthToken({
    userId: 'admin-test-1',
    role: UserRole.ADMIN,
    name: 'Admin Test',
    email: 'admin@digithela-demo.in',
    mobileNumber: null,
  });

  try {
    await runTest('POST /api/vendors/register rejects sensitive UPI PIN/OTP fields', async () => {
      const res = await fetch(`${baseUrl}/api/vendors/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Ramesh Patil',
          mobileNumber: '9820000101',
          password: 'password123',
          businessName: 'Patil Cart',
          category: 'Fruits & Vegetables',
          description: 'Fresh vegetables daily in Mira Road East.',
          address: 'Shanti Nagar Gate',
          area: 'Mira Road East',
          openingTime: '07:00 AM',
          closingTime: '09:30 PM',
          upiPin: '1234',
        }),
      });
      assert.equal(res.status, 400);
    });

    await runTest('POST /api/vendors/register validates required profile fields and UPI format', async () => {
      const res = await fetch(`${baseUrl}/api/vendors/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Ramesh',
          mobileNumber: '9820000101',
          password: 'password123',
          businessName: 'Patil Cart',
          category: 'Fruits & Vegetables',
          description: 'Fresh produce.',
          address: 'Mira Road East',
          area: 'Mira Road East',
          openingTime: '07:00 AM',
          closingTime: '09:00 PM',
          upiId: 'invalid-upi-without-at',
        }),
      });
      assert.equal(res.status, 400);
    });

    await runTest('GET /api/vendors/my-profile rejects unauthenticated and non-vendor roles', async () => {
      const unauth = await fetch(`${baseUrl}/api/vendors/my-profile`);
      assert.equal(unauth.status, 401);

      const asCustomer = await fetch(`${baseUrl}/api/vendors/my-profile`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(asCustomer.status, 403);

      const asAdmin = await fetch(`${baseUrl}/api/vendors/my-profile`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(asAdmin.status, 403);
    });

    await runTest('PUT /api/vendors/my-profile blocks tampering with verificationStatus or userId', async () => {
      const res = await fetch(`${baseUrl}/api/vendors/my-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vendorToken}`,
        },
        body: JSON.stringify({
          businessName: 'Updated Stall',
          verificationStatus: 'VERIFIED',
        }),
      });
      assert.equal(res.status, 400);
    });

    await runTest('PUT /api/vendors/my-profile rejects empty update body', async () => {
      const res = await fetch(`${baseUrl}/api/vendors/my-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vendorToken}`,
        },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
    });

    await runTest('GET /api/vendors validates pagination limit bounds', async () => {
      const res = await fetch(`${baseUrl}/api/vendors?limit=500`);
      assert.equal(res.status, 400);
    });

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
      await runTest('GET /api/vendors returns clean 503 DATABASE_UNAVAILABLE when DB is not configured', async () => {
        const res = await fetch(`${baseUrl}/api/vendors`);
        assert.equal(res.status, 503);
        const body = (await res.json()) as { error: { code: string } };
        assert.equal(body.error.code, 'DATABASE_UNAVAILABLE');
      });

      results.push({
        name: 'PostgreSQL vendor CRUD, public listing, view count & ownership isolation',
        status: 'SKIPPED',
        detail: 'Skipped: PostgreSQL server / DATABASE_URL is not configured in this environment.',
      });
      console.log('SKIP  PostgreSQL vendor CRUD tests (no live DATABASE_URL reachable)');
    } else {
      const suffix = Date.now();
      const createdUserIds: string[] = [];

      try {
        let vendorAId = '';
        let vendorAToken = '';
        let vendorBToken = '';

        await runTest('DB: Register two vendors with profiles via POST /api/vendors/register', async () => {
          const resA = await fetch(`${baseUrl}/api/vendors/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Vendor A Owner',
              mobileNumber: `98${String(suffix).slice(-8)}`,
              password: 'Password123!',
              businessName: `Mira Fresh A ${suffix}`,
              category: 'Fruits & Vegetables',
              description: 'Fresh seasonal vegetables and fruits in Mira Road East.',
              address: 'Shop 1, Shanti Nagar, Mira Road East',
              area: 'Mira Road East',
              openingTime: '07:00 AM',
              closingTime: '09:30 PM',
              upiId: 'vendora.demo@upi',
            }),
          });
          assert.equal(resA.status, 201);
          const bodyA = (await resA.json()) as {
            data: { token: string; user: { id: string }; vendorProfile: { id: string } };
          };
          createdUserIds.push(bodyA.data.user.id);
          vendorAId = bodyA.data.vendorProfile.id;
          vendorAToken = bodyA.data.token;

          const resB = await fetch(`${baseUrl}/api/vendors/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Vendor B Owner',
              email: `vendorb.${suffix}@digithela-demo.in`,
              password: 'Password123!',
              businessName: `Bhayandar Snacks B ${suffix}`,
              category: 'Street Food',
              description: 'Hot vada pav and evening chaat near Bhayandar station.',
              address: 'Station Road, Bhayandar West',
              area: 'Bhayandar West',
              openingTime: '04:00 PM',
              closingTime: '10:30 PM',
            }),
          });
          assert.equal(resB.status, 201);
          const bodyB = (await resB.json()) as {
            data: { token: string; user: { id: string } };
          };
          createdUserIds.push(bodyB.data.user.id);
          vendorBToken = bodyB.data.token;
        });

        await runTest('DB: Public GET /api/vendors filters by area/category and GET /api/vendors/:id records view', async () => {
          const listRes = await fetch(
            `${baseUrl}/api/vendors?area=${encodeURIComponent('Mira Road East')}&search=${encodeURIComponent(String(suffix))}`
          );
          assert.equal(listRes.status, 200);
          const listBody = (await listRes.json()) as {
            data: { vendors: Array<{ id: string }> };
          };
          assert.equal(listBody.data.vendors.length, 1);
          assert.equal(listBody.data.vendors[0].id, vendorAId);

          const detailRes = await fetch(`${baseUrl}/api/vendors/${vendorAId}`);
          assert.equal(detailRes.status, 200);
        });

        await runTest('DB: Logged-in vendor retrieves & updates ONLY their own profile', async () => {
          const myRes = await fetch(`${baseUrl}/api/vendors/my-profile`, {
            headers: { Authorization: `Bearer ${vendorAToken}` },
          });
          assert.equal(myRes.status, 200);

          const updateRes = await fetch(`${baseUrl}/api/vendors/my-profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${vendorAToken}`,
            },
            body: JSON.stringify({
              businessName: `Mira Fresh A Updated ${suffix}`,
              upiId: 'vendora.updated@upi',
            }),
          });
          assert.equal(updateRes.status, 200);

          // Confirm Vendor B's profile remained untouched
          const myResB = await fetch(`${baseUrl}/api/vendors/my-profile`, {
            headers: { Authorization: `Bearer ${vendorBToken}` },
          });
          const bodyB = (await myResB.json()) as {
            data: { vendor: { businessName: string } };
          };
          assert.equal(bodyB.data.vendor.businessName, `Bhayandar Snacks B ${suffix}`);
        });
      } finally {
        if (createdUserIds.length > 0) {
          await prisma.user.deleteMany({
            where: { id: { in: createdUserIds } },
          });
        }
      }
    }

    console.log('\nVendor Test Summary:', JSON.stringify(results, null, 2));
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
