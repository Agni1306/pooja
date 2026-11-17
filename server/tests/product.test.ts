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
    userId: 'cust-prod-1',
    role: UserRole.CUSTOMER,
    name: 'Customer Test',
    email: 'cust@digithela-demo.in',
    mobileNumber: null,
  });

  const vendorToken = signAuthToken({
    userId: 'vend-prod-1',
    role: UserRole.VENDOR,
    name: 'Vendor Test',
    email: 'vend@digithela-demo.in',
    mobileNumber: '+919820000101',
  });

  try {
    await runTest('POST /api/products requires VENDOR JWT (401 unauth, 403 customer)', async () => {
      const unauth = await fetch(`${baseUrl}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(unauth.status, 401);

      const asCustomer = await fetch(`${baseUrl}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({}),
      });
      assert.equal(asCustomer.status, 403);
    });

    await runTest('POST /api/products validates positive price and required fields', async () => {
      const res = await fetch(`${baseUrl}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vendorToken}`,
        },
        body: JSON.stringify({
          productName: 'Alphonso Mangoes',
          description: 'Fresh seasonal mangoes.',
          category: 'Seasonal Fruits',
          price: -50,
        }),
      });
      assert.equal(res.status, 400);
    });

    await runTest('POST /api/products rejects non-image file uploads via Multer filter', async () => {
      const formData = new FormData();
      formData.append('productName', 'Test Item');
      formData.append('description', 'Test item description');
      formData.append('category', 'Grocery');
      formData.append('price', '100');
      formData.append(
        'image',
        new Blob(['plain text content'], { type: 'text/plain' }),
        'malicious.txt'
      );

      const res = await fetch(`${baseUrl}/api/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vendorToken}`,
        },
        body: formData,
      });
      assert.equal(res.status, 400);
      const body = (await res.json()) as { error: { code: string } };
      assert.equal(body.error.code, 'INVALID_FILE_TYPE');
    });

    await runTest('PUT /api/products/:id blocks vendorId tampering and empty bodies', async () => {
      const tamperRes = await fetch(`${baseUrl}/api/products/prod-123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vendorToken}`,
        },
        body: JSON.stringify({ vendorId: 'other-vendor' }),
      });
      assert.equal(tamperRes.status, 400);

      const emptyRes = await fetch(`${baseUrl}/api/products/prod-123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vendorToken}`,
        },
        body: JSON.stringify({}),
      });
      assert.equal(emptyRes.status, 400);
    });

    await runTest('PATCH /api/products/:id/availability rejects invalid boolean values', async () => {
      const res = await fetch(`${baseUrl}/api/products/prod-123/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vendorToken}`,
        },
        body: JSON.stringify({ availability: 'maybe' }),
      });
      assert.equal(res.status, 400);
    });

    await runTest('GET /api/products validates sort and pagination parameters', async () => {
      const res = await fetch(`${baseUrl}/api/products?sort=invalid-sort`);
      assert.equal(res.status, 400);
    });

    await runTest('POST /api/uploads/image rejects missing file and invalid file types', async () => {
      const emptyForm = new FormData();
      const missingRes = await fetch(`${baseUrl}/api/uploads/image`, {
        method: 'POST',
        body: emptyForm,
      });
      assert.equal(missingRes.status, 400);
      const missingBody = (await missingRes.json()) as { error: { code: string } };
      assert.equal(missingBody.error.code, 'VALIDATION_ERROR');

      const badForm = new FormData();
      badForm.append('image', new Blob(['not an image'], { type: 'text/plain' }), 'bad.txt');
      const badRes = await fetch(`${baseUrl}/api/uploads/image`, {
        method: 'POST',
        body: badForm,
      });
      assert.equal(badRes.status, 400);
      const badBody = (await badRes.json()) as { error: { code: string } };
      assert.equal(badBody.error.code, 'INVALID_FILE_TYPE');
    });

    await runTest('POST /api/uploads/image accepts PNG image and serves it via /uploads', async () => {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const pngBytes = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
      ]);
      const form = new FormData();
      form.append('image', new Blob([pngBytes], { type: 'image/png' }), 'test-pixel.png');

      const res = await fetch(`${baseUrl}/api/uploads/image`, {
        method: 'POST',
        body: form,
      });
      assert.equal(res.status, 201);
      const body = (await res.json()) as {
        success: boolean;
        data: { imageUrl: string; filename: string };
      };
      assert.equal(body.success, true);
      assert.ok(body.data.imageUrl.startsWith('/uploads/'));

      const staticRes = await fetch(`${baseUrl}${body.data.imageUrl}`);
      assert.equal(staticRes.status, 200);

      // Clean up test upload artifact
      await fs.unlink(path.resolve(process.cwd(), 'uploads', body.data.filename)).catch(() => {});
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
      await runTest('GET /api/products returns clean 503 DATABASE_UNAVAILABLE when DB is not configured', async () => {
        const res = await fetch(`${baseUrl}/api/products`);
        assert.equal(res.status, 503);
        const body = (await res.json()) as { error: { code: string } };
        assert.equal(body.error.code, 'DATABASE_UNAVAILABLE');
      });

      results.push({
        name: 'PostgreSQL product CRUD, search/filter, vendor-wise listing & owner isolation',
        status: 'SKIPPED',
        detail: 'Skipped: PostgreSQL server / DATABASE_URL is not configured in this environment.',
      });
      console.log('SKIP  PostgreSQL product CRUD tests (no live DATABASE_URL reachable)');
    } else {
      const suffix = Date.now();
      const createdUserIds: string[] = [];

      try {
        let vendorAToken = '';
        let vendorAId = '';
        let vendorBToken = '';
        let productId = '';

        await runTest('DB: Setup two vendors and create a product for Vendor A', async () => {
          const regA = await fetch(`${baseUrl}/api/vendors/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Vendor A',
              mobileNumber: `98${String(suffix).slice(-8)}`,
              password: 'Password123!',
              businessName: `Fruit Stall A ${suffix}`,
              category: 'Fruits & Vegetables',
              description: 'Fresh seasonal produce in Mira Road.',
              address: 'Shanti Nagar Gate',
              area: 'Mira Road East',
              openingTime: '07:00 AM',
              closingTime: '09:00 PM',
            }),
          });
          assert.equal(regA.status, 201);
          const bodyA = (await regA.json()) as {
            data: { token: string; user: { id: string }; vendorProfile: { id: string } };
          };
          createdUserIds.push(bodyA.data.user.id);
          vendorAToken = bodyA.data.token;
          vendorAId = bodyA.data.vendorProfile.id;

          const regB = await fetch(`${baseUrl}/api/vendors/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Vendor B',
              email: `vendorb.prod.${suffix}@digithela-demo.in`,
              password: 'Password123!',
              businessName: `Chaat Stall B ${suffix}`,
              category: 'Street Food',
              description: 'Hot evening chaat in Bhayandar.',
              address: 'Station Road',
              area: 'Bhayandar West',
              openingTime: '04:00 PM',
              closingTime: '10:00 PM',
            }),
          });
          assert.equal(regB.status, 201);
          const bodyB = (await regB.json()) as {
            data: { token: string; user: { id: string } };
          };
          createdUserIds.push(bodyB.data.user.id);
          vendorBToken = bodyB.data.token;

          const createRes = await fetch(`${baseUrl}/api/products`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${vendorAToken}`,
            },
            body: JSON.stringify({
              productName: `Devgad Mangoes ${suffix}`,
              description: 'Naturally ripened golden mangoes.',
              category: 'Seasonal Fruits',
              price: 480,
              unit: 'per dozen',
            }),
          });
          assert.equal(createRes.status, 201);
          const createdBody = (await createRes.json()) as {
            data: { product: { id: string; price: number } };
          };
          productId = createdBody.data.product.id;
          assert.equal(createdBody.data.product.price, 480);
        });

        await runTest('DB: Search, category filter, single product retrieval & vendor-wise listing', async () => {
          const searchRes = await fetch(
            `${baseUrl}/api/products?search=${encodeURIComponent(String(suffix))}&category=${encodeURIComponent('Seasonal Fruits')}`
          );
          assert.equal(searchRes.status, 200);
          const searchBody = (await searchRes.json()) as {
            data: { products: Array<{ id: string }> };
          };
          assert.equal(searchBody.data.products.length, 1);

          const singleRes = await fetch(`${baseUrl}/api/products/${productId}`);
          assert.equal(singleRes.status, 200);

          const vendorProdRes = await fetch(
            `${baseUrl}/api/vendors/${vendorAId}/products`
          );
          assert.equal(vendorProdRes.status, 200);
        });

        await runTest('DB: Non-owner Vendor B cannot edit, toggle, or delete Vendor A product (403)', async () => {
          const editRes = await fetch(`${baseUrl}/api/products/${productId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${vendorBToken}`,
            },
            body: JSON.stringify({ price: 999 }),
          });
          assert.equal(editRes.status, 403);

          const toggleRes = await fetch(
            `${baseUrl}/api/products/${productId}/availability`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${vendorBToken}`,
              },
              body: JSON.stringify({ availability: false }),
            }
          );
          assert.equal(toggleRes.status, 403);

          const delRes = await fetch(`${baseUrl}/api/products/${productId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${vendorBToken}` },
          });
          assert.equal(delRes.status, 403);
        });

        await runTest('DB: Owner Vendor A can edit, toggle availability, and delete product', async () => {
          const editRes = await fetch(`${baseUrl}/api/products/${productId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${vendorAToken}`,
            },
            body: JSON.stringify({ price: 520 }),
          });
          assert.equal(editRes.status, 200);

          const toggleRes = await fetch(
            `${baseUrl}/api/products/${productId}/availability`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${vendorAToken}`,
              },
              body: JSON.stringify({ availability: false }),
            }
          );
          assert.equal(toggleRes.status, 200);

          const delRes = await fetch(`${baseUrl}/api/products/${productId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${vendorAToken}` },
          });
          assert.equal(delRes.status, 200);
        });
      } finally {
        if (createdUserIds.length > 0) {
          await prisma.user.deleteMany({
            where: { id: { in: createdUserIds } },
          });
        }
      }
    }

    console.log('\nProduct Test Summary:', JSON.stringify(results, null, 2));
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
