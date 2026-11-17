import assert from 'node:assert/strict';
import http from 'node:http';
import { UserRole } from '@prisma/client';
import { createApp } from '../src/app.ts';
import { signAuthToken } from '../src/utils/jwt.ts';
import { prisma } from '../src/config/prisma.ts';
import { env } from '../src/config/env.ts';
import {
  SEED_LEARNING_MATERIALS,
  seedLearningMaterials,
} from '../../prisma/seed.ts';

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
    userId: 'cust-feat-1',
    role: UserRole.CUSTOMER,
    name: 'Customer Test',
    email: 'cust.feat@digithela-demo.in',
    mobileNumber: null,
  });

  const vendorToken = signAuthToken({
    userId: 'vend-feat-1',
    role: UserRole.VENDOR,
    name: 'Vendor Test',
    email: 'vend.feat@digithela-demo.in',
    mobileNumber: '+919820000201',
  });

  const adminToken = signAuthToken({
    userId: 'admin-feat-1',
    role: UserRole.ADMIN,
    name: 'Admin Test',
    email: 'admin.feat@digithela-demo.in',
    mobileNumber: null,
  });

  try {
    await runTest('Seed data contains 12 valid DigiThela learning tutorials across 4 categories', async () => {
      assert.equal(SEED_LEARNING_MATERIALS.length, 12);
      const slugs = new Set(SEED_LEARNING_MATERIALS.map((t) => t.slug));
      assert.equal(slugs.size, 12);

      const categories = new Set(SEED_LEARNING_MATERIALS.map((t) => t.category));
      assert.deepEqual(
        Array.from(categories).sort(),
        ['Digital Marketing', 'Digital Payments', 'Digital Safety', 'Online Business']
      );

      for (const item of SEED_LEARNING_MATERIALS) {
        const parsed = JSON.parse(item.content) as {
          steps: Array<{ heading: string; explanation: string }>;
          keyTip: string;
          avoidTip: string;
        };
        assert.ok(Array.isArray(parsed.steps) && parsed.steps.length >= 3);
        assert.ok(parsed.keyTip.length > 5);
        assert.ok(parsed.avoidTip.length > 5);
      }
    });

    await runTest('Learning progress & admin creation routes enforce authentication and RBAC', async () => {
      const unauthProgress = await fetch(`${baseUrl}/api/learning/progress`);
      assert.equal(unauthProgress.status, 401);

      const unauthComplete = await fetch(
        `${baseUrl}/api/learning/tut-what-is-upi/complete`,
        { method: 'POST' }
      );
      assert.equal(unauthComplete.status, 401);

      const badProgressPayload = await fetch(
        `${baseUrl}/api/learning/tut-what-is-upi/progress`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${vendorToken}`,
          },
          body: JSON.stringify({ isCompleted: 'yes' }),
        }
      );
      assert.equal(badProgressPayload.status, 400);

      const customerCreate = await fetch(`${baseUrl}/api/learning`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({}),
      });
      assert.equal(customerCreate.status, 403);

      const adminInvalidBody = await fetch(`${baseUrl}/api/learning`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ title: 'Too short' }),
      });
      assert.equal(adminInvalidBody.status, 400);
    });

    await runTest('Vendor favorites endpoints require authentication and validate vendorId', async () => {
      const unauthList = await fetch(`${baseUrl}/api/favorites`);
      assert.equal(unauthList.status, 401);

      const unauthToggle = await fetch(`${baseUrl}/api/favorites/vend-123/toggle`, {
        method: 'POST',
      });
      assert.equal(unauthToggle.status, 401);

      const badBody = await fetch(`${baseUrl}/api/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ vendorId: '' }),
      });
      assert.equal(badBody.status, 400);
    });

    await runTest('Vendor dashboard endpoints require VENDOR JWT and validate days query', async () => {
      const unauth1 = await fetch(`${baseUrl}/api/dashboard/vendor`);
      assert.equal(unauth1.status, 401);

      const unauth2 = await fetch(`${baseUrl}/api/vendors/dashboard`);
      assert.equal(unauth2.status, 401);

      const customerAttempt = await fetch(`${baseUrl}/api/dashboard/vendor`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(customerAttempt.status, 403);

      const adminAttempt = await fetch(`${baseUrl}/api/vendors/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(adminAttempt.status, 403);

      const invalidDays = await fetch(`${baseUrl}/api/dashboard/vendor?days=999`, {
        headers: { Authorization: `Bearer ${vendorToken}` },
      });
      assert.equal(invalidDays.status, 400);
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
      await runTest('GET /api/learning returns clean 503 DATABASE_UNAVAILABLE when DB is not configured', async () => {
        const res = await fetch(`${baseUrl}/api/learning`);
        assert.equal(res.status, 503);
        const body = (await res.json()) as { error: { code: string } };
        assert.equal(body.error.code, 'DATABASE_UNAVAILABLE');
      });

      results.push({
        name: 'PostgreSQL seed, learning progress, vendor favorites & vendor dashboard stats',
        status: 'SKIPPED',
        detail: 'Skipped: PostgreSQL server / DATABASE_URL is not configured in this environment.',
      });
      console.log(
        'SKIP  PostgreSQL integration tests for learning, favorites, and dashboard (no live DATABASE_URL reachable)'
      );
    } else {
      const suffix = Date.now();
      const createdUserIds: string[] = [];

      try {
        let vendorTokenLive = '';
        let vendorProfileId = '';
        let customerTokenLive = '';

        await runTest('DB: Seed 12 learning tutorials and list/filter/read them', async () => {
          const seedResult = await seedLearningMaterials(prisma);
          assert.equal(seedResult.upsertedCount, 12);

          const listRes = await fetch(
            `${baseUrl}/api/learning?category=${encodeURIComponent('Digital Payments')}`
          );
          assert.equal(listRes.status, 200);
          const listBody = (await listRes.json()) as {
            data: { tutorials: Array<{ slug: string }> };
          };
          assert.equal(listBody.data.tutorials.length, 3);

          const detailRes = await fetch(`${baseUrl}/api/learning/tut-what-is-upi`);
          assert.equal(detailRes.status, 200);
          const detailBody = (await detailRes.json()) as {
            data: {
              tutorial: {
                slug: string;
                structuredContent: { steps: unknown[]; keyTip: string };
              };
            };
          };
          assert.equal(detailBody.data.tutorial.slug, 'tut-what-is-upi');
          assert.ok(detailBody.data.tutorial.structuredContent.steps.length >= 3);
        });

        await runTest('DB: Register vendor & customer, add product, and track views/favorites/learning', async () => {
          const regVendor = await fetch(`${baseUrl}/api/vendors/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Dashboard Vendor',
              email: `dash.vendor.${suffix}@digithela-demo.in`,
              password: 'Password123!',
              businessName: `Dash Fruit Cart ${suffix}`,
              category: 'Fruits & Vegetables',
              description: 'Fresh seasonal fruits near Mira Road station.',
              address: 'Station Gate 2',
              area: 'Mira Road East',
              openingTime: '07:00 AM',
              closingTime: '09:30 PM',
              upiId: `dash${suffix}@okaxis`,
            }),
          });
          assert.equal(regVendor.status, 201);
          const vendBody = (await regVendor.json()) as {
            data: { token: string; user: { id: string }; vendorProfile: { id: string } };
          };
          createdUserIds.push(vendBody.data.user.id);
          vendorTokenLive = vendBody.data.token;
          vendorProfileId = vendBody.data.vendorProfile.id;

          const regCust = await fetch(`${baseUrl}/api/auth/register/customer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Favorite Customer',
              email: `fav.cust.${suffix}@digithela-demo.in`,
              password: 'Password123!',
            }),
          });
          assert.equal(regCust.status, 201);
          const custBody = (await regCust.json()) as {
            data: { token: string; user: { id: string } };
          };
          createdUserIds.push(custBody.data.user.id);
          customerTokenLive = custBody.data.token;

          const prodRes = await fetch(`${baseUrl}/api/products`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${vendorTokenLive}`,
            },
            body: JSON.stringify({
              productName: 'Alphonso Mangoes',
              description: 'Sweet Devgad Alphonso mangoes.',
              category: 'Seasonal Fruits',
              price: 480,
              unit: 'per dozen',
            }),
          });
          assert.equal(prodRes.status, 201);

          // Record a public vendor view
          const viewRes = await fetch(`${baseUrl}/api/vendors/${vendorProfileId}`);
          assert.equal(viewRes.status, 200);

          // Vendor completes 1 tutorial
          const compRes = await fetch(
            `${baseUrl}/api/learning/tut-what-is-upi/complete`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${vendorTokenLive}` },
            }
          );
          assert.equal(compRes.status, 200);

          const progRes = await fetch(`${baseUrl}/api/learning/progress`, {
            headers: { Authorization: `Bearer ${vendorTokenLive}` },
          });
          assert.equal(progRes.status, 200);
          const progBody = (await progRes.json()) as {
            data: { completedCount: number; completedSlugs: string[] };
          };
          assert.equal(progBody.data.completedCount, 1);
          assert.ok(progBody.data.completedSlugs.includes('tut-what-is-upi'));

          // Customer favorites the vendor
          const favRes = await fetch(`${baseUrl}/api/favorites/${vendorProfileId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${customerTokenLive}` },
          });
          assert.equal(favRes.status, 201);

          const favListRes = await fetch(`${baseUrl}/api/favorites`, {
            headers: { Authorization: `Bearer ${customerTokenLive}` },
          });
          assert.equal(favListRes.status, 200);
          const favListBody = (await favListRes.json()) as {
            data: { vendorIds: string[] };
          };
          assert.ok(favListBody.data.vendorIds.includes(vendorProfileId));

          // Fetch Vendor Dashboard stats
          const dashRes = await fetch(`${baseUrl}/api/dashboard/vendor?days=7`, {
            headers: { Authorization: `Bearer ${vendorTokenLive}` },
          });
          assert.equal(dashRes.status, 200);
          const dashBody = (await dashRes.json()) as {
            data: {
              profileCompletion: { percentage: number };
              stats: {
                totalProducts: number;
                availableProducts: number;
                totalViews: number;
                totalFavorites: number;
                upiReady: boolean;
                learning: { completedTutorials: number };
              };
            };
          };
          assert.equal(dashBody.data.profileCompletion.percentage, 100);
          assert.equal(dashBody.data.stats.totalProducts, 1);
          assert.equal(dashBody.data.stats.availableProducts, 1);
          assert.ok(dashBody.data.stats.totalViews >= 1);
          assert.equal(dashBody.data.stats.totalFavorites, 1);
          assert.equal(dashBody.data.stats.upiReady, true);
          assert.equal(dashBody.data.stats.learning.completedTutorials, 1);

          // Customer removes favorite & vendor uncompletes tutorial
          const delFavRes = await fetch(
            `${baseUrl}/api/favorites/${vendorProfileId}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${customerTokenLive}` },
            }
          );
          assert.equal(delFavRes.status, 200);

          const uncompRes = await fetch(
            `${baseUrl}/api/learning/tut-what-is-upi/complete`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${vendorTokenLive}` },
            }
          );
          assert.equal(uncompRes.status, 200);
        });
      } finally {
        if (createdUserIds.length > 0) {
          await prisma.user.deleteMany({
            where: { id: { in: createdUserIds } },
          });
        }
      }
    }

    console.log(
      '\nLearning, Favorites & Dashboard Test Summary:',
      JSON.stringify(results, null, 2)
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
