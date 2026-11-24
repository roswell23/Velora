/**
 * VÉLORA Demo Seed Script
 * Run: npx prisma db seed
 *
 * Seeds:
 *  - 1 user per staff role (ADMIN, SALES, INVENTORY, FINANCE)
 *  - 1 demo customer account (CUSTOMER role + Customer record)
 *  - 5 walk-in customer records
 *  - 3 fragrance categories
 *  - 12 perfume products (some intentionally low on stock)
 *  - 2 sample orders (1 ONLINE PENDING, 1 INTERNAL FULFILLED with payment)
 */

import { PrismaClient, Role, OrderSource, OrderStatus, PaymentStatus } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const DEMO_PASSWORD = "DemoPass123!";

async function hashPassword(password) {
  return argon2.hash(password, ARGON2_OPTIONS);
}

async function main() {
  console.log("🌱 Starting VÉLORA seed...");

  // ----------------------------------------------------------------
  // 1. Staff Users
  // ----------------------------------------------------------------
  const adminHash = await hashPassword(DEMO_PASSWORD);
  const salesHash = await hashPassword(DEMO_PASSWORD);
  const inventoryHash = await hashPassword(DEMO_PASSWORD);
  const financeHash = await hashPassword(DEMO_PASSWORD);

  const _admin = await prisma.user.upsert({
    where: { email: "admin@velora.local" },
    update: {},
    create: {
      name: "Arthur Admin",
      email: "admin@velora.local",
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: "sales@velora.local" },
    update: {},
    create: {
      name: "Sarah Sales",
      email: "sales@velora.local",
      passwordHash: salesHash,
      role: Role.SALES,
    },
  });

  const inventoryUser = await prisma.user.upsert({
    where: { email: "inventory@velora.local" },
    update: {},
    create: {
      name: "Ian Inventory",
      email: "inventory@velora.local",
      passwordHash: inventoryHash,
      role: Role.INVENTORY,
    },
  });

  const financeUser = await prisma.user.upsert({
    where: { email: "finance@velora.local" },
    update: {},
    create: {
      name: "Fiona Finance",
      email: "finance@velora.local",
      passwordHash: financeHash,
      role: Role.FINANCE,
    },
  });

  console.log("✅ Staff users seeded.");

  // ----------------------------------------------------------------
  // 2. Demo Customer Account (ONLINE)
  // ----------------------------------------------------------------
  const customerHash = await hashPassword(DEMO_PASSWORD);

  const customerUser = await prisma.user.upsert({
    where: { email: "customer@velora.local" },
    update: {},
    create: {
      name: "Clara Customer",
      email: "customer@velora.local",
      passwordHash: customerHash,
      role: Role.CUSTOMER,
    },
  });

  const demoCustomer = await prisma.customer.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: {
      userId: customerUser.id,
      name: "Clara Customer",
      phone: "+639171000001",
      email: "customer@velora.local",
      address: "Penthouse A, The Residences, BGC, Taguig City",
    },
  });

  console.log("✅ Demo customer account seeded.");

  // ----------------------------------------------------------------
  // 3. Walk-in Customer Records (no userId)
  // ----------------------------------------------------------------
  const _walkInCustomers = await Promise.all([
    prisma.customer
      .upsert({
        where: { id: 100 },
        update: {},
        create: {
          name: "Miguel Santos",
          phone: "+639181234567",
          email: "miguel.santos@email.com",
          address: "32 Acacia St, Quezon City",
        },
      })
      .catch(() =>
        prisma.customer.create({
          data: {
            name: "Miguel Santos",
            phone: "+639181234567",
            email: "miguel.santos@email.com",
            address: "32 Acacia St, Quezon City",
          },
        })
      ),
    prisma.customer
      .create({
        data: {
          name: "Isabella Reyes",
          phone: "+639192345678",
          email: null,
          address: "Unit 5B, Lakeview Tower, Pasig City",
        },
      })
      .catch(() => null),
    prisma.customer
      .create({
        data: {
          name: "Carlos Mendoza",
          phone: "+639203456789",
          email: "c.mendoza@business.ph",
          address: "88 Emerald Ave, Ortigas Center, Pasig",
        },
      })
      .catch(() => null),
    prisma.customer
      .create({
        data: {
          name: "Sofia Lim",
          phone: "+639214567890",
          email: null,
          address: null,
        },
      })
      .catch(() => null),
    prisma.customer
      .create({
        data: {
          name: "Rafael Dela Cruz",
          phone: "+639225678901",
          email: "rafael.dc@company.com",
          address: "120 Ayala Ave, Makati City",
        },
      })
      .catch(() => null),
  ]);

  console.log("✅ Walk-in customers seeded.");

  // ----------------------------------------------------------------
  // 4. Categories
  // ----------------------------------------------------------------
  const woodyCategory = await prisma.category.upsert({
    where: { name: "Woody" },
    update: {},
    create: {
      name: "Woody",
      description:
        "Warm and grounding fragrances built on sandalwood, cedar, vetiver, and precious oud.",
    },
  });

  const floralCategory = await prisma.category.upsert({
    where: { name: "Floral" },
    update: {},
    create: {
      name: "Floral",
      description: "Romantic and luminous blends of rose, jasmine, peony, and orange blossom.",
    },
  });

  const orientalCategory = await prisma.category.upsert({
    where: { name: "Oriental" },
    update: {},
    create: {
      name: "Oriental",
      description: "Rich and seductive compositions of amber, vanilla, musk, and exotic spices.",
    },
  });

  console.log("✅ Categories seeded.");

  // ----------------------------------------------------------------
  // 5. Products (12 perfumes, some low on stock)
  // ----------------------------------------------------------------
  const productsData = [
    // Woody
    {
      categoryId: woodyCategory.id,
      sku: "VEL-WOOD-001",
      name: "Santal Royale",
      brand: "VÉLORA Atelier",
      description:
        "Creamy Australian sandalwood entwined with dark cardamom, smoky leather, and a whisper of orris. A warm, meditative signature.",
      imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800",
      size: "100ml",
      unitPrice: "185.00",
      stock: 10,
      reorderLevel: 5,
    },
    {
      categoryId: woodyCategory.id,
      sku: "VEL-WOOD-002",
      name: "Oud Mystère",
      brand: "VÉLORA Atelier",
      description:
        "Smoky Cambodian oud resinous heart with Bulgarian damask rose and black saffron. The essence of Eastern luxury.",
      imageUrl: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=800",
      size: "50ml",
      unitPrice: "240.00",
      stock: 7,
      reorderLevel: 4,
    },
    {
      categoryId: woodyCategory.id,
      sku: "VEL-WOOD-003",
      name: "Vétiver Noir",
      brand: "VÉLORA Atelier",
      description:
        "Haitian vetiver root smoked over birch tar, grounded by Haitian ylang-ylang and a touch of marine salt.",
      imageUrl: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=800",
      size: "100ml",
      unitPrice: "165.00",
      stock: 3, // Low stock (reorderLevel = 5)
      reorderLevel: 5,
    },
    {
      categoryId: woodyCategory.id,
      sku: "VEL-WOOD-004",
      name: "Cèdre Élite",
      brand: "VÉLORA Atelier",
      description:
        "Atlas cedar from Morocco paired with bergamot, cool ginger, and warm amber base. Effortlessly refined.",
      imageUrl: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=800",
      size: "75ml",
      unitPrice: "155.00",
      stock: 15,
      reorderLevel: 5,
    },
    // Floral
    {
      categoryId: floralCategory.id,
      sku: "VEL-FLOR-001",
      name: "Rose Impériale",
      brand: "VÉLORA Atelier",
      description:
        "Five hundred hand-picked Bulgarian roses distilled into a timeless floral with lychee, peony, and white musk.",
      imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683702?w=800",
      size: "100ml",
      unitPrice: "195.00",
      stock: 12,
      reorderLevel: 5,
    },
    {
      categoryId: floralCategory.id,
      sku: "VEL-FLOR-002",
      name: "Fleur de Soie",
      brand: "VÉLORA Atelier",
      description:
        "Gossamer silk jasmine from Grasse layered over tuberose, lilac, and powdery sandalwood.",
      imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683702?w=800",
      size: "50ml",
      unitPrice: "160.00",
      stock: 2, // Low stock (reorderLevel = 5) — Workflow 2 demo product
      reorderLevel: 5,
    },
    {
      categoryId: floralCategory.id,
      sku: "VEL-FLOR-003",
      name: "Magnolia Blanche",
      brand: "VÉLORA Atelier",
      description:
        "Creamy white magnolia at full bloom, softened by sheer musks and vanilla orchid.",
      imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683702?w=800",
      size: "75ml",
      unitPrice: "145.00",
      stock: 20,
      reorderLevel: 5,
    },
    {
      categoryId: floralCategory.id,
      sku: "VEL-FLOR-004",
      name: "Orange Blossom Elixir",
      brand: "VÉLORA Atelier",
      description:
        "Neroli and orange blossom absolute from Tunisia, brightened by petit grain and dried on honeyed amber.",
      imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683702?w=800",
      size: "100ml",
      unitPrice: "175.00",
      stock: 0, // Out of stock — demo for E-Commerce badge
      reorderLevel: 5,
    },
    // Oriental
    {
      categoryId: orientalCategory.id,
      sku: "VEL-ORIE-001",
      name: "Ambre Céleste",
      brand: "VÉLORA Atelier",
      description:
        "Warm labdanum amber enveloped in tonka bean, Tahitian vanilla, and frankincense smoke.",
      imageUrl: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=800",
      size: "100ml",
      unitPrice: "210.00",
      stock: 8,
      reorderLevel: 4,
    },
    {
      categoryId: orientalCategory.id,
      sku: "VEL-ORIE-002",
      name: "Musc de Nuit",
      brand: "VÉLORA Atelier",
      description:
        "Skin-intimate white musk layered with cashmeran, sandalwood shavings, and aldehydic warmth.",
      imageUrl: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=800",
      size: "50ml",
      unitPrice: "135.00",
      stock: 4, // Low stock (reorderLevel = 4)
      reorderLevel: 4,
    },
    {
      categoryId: orientalCategory.id,
      sku: "VEL-ORIE-003",
      name: "Safran Précieux",
      brand: "VÉLORA Atelier",
      description:
        "Spanish saffron, intoxicatingly woven with rose absolute, smoky birch, and warm leather accord.",
      imageUrl: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=800",
      size: "100ml",
      unitPrice: "225.00",
      stock: 6,
      reorderLevel: 4,
    },
    {
      categoryId: orientalCategory.id,
      sku: "VEL-ORIE-004",
      name: "Vanille Noire",
      brand: "VÉLORA Atelier",
      description:
        "Madagascar black vanilla pod absolute, deepened with benzoin resin, dark cocoa, and patchouli.",
      imageUrl: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=800",
      size: "75ml",
      unitPrice: "150.00",
      stock: 18,
      reorderLevel: 5,
    },
  ];

  const products = {};
  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
    products[p.sku] = product;
  }

  console.log("✅ 12 products seeded.");

  // ----------------------------------------------------------------
  // 6. Sample Orders
  // ----------------------------------------------------------------

  // Order 1: Online PENDING order (Workflow 1 starting state)
  const existingOrder1 = await prisma.order.findUnique({
    where: { orderNumber: "VEL-2026-0001" },
  });

  let _order1;
  if (!existingOrder1) {
    const santalRoyale = products["VEL-WOOD-001"];
    _order1 = await prisma.order.create({
      data: {
        orderNumber: "VEL-2026-0001",
        customerId: demoCustomer.id,
        source: OrderSource.ONLINE,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        deliveryAddress: "Penthouse A, The Residences, BGC, Taguig City",
        total: santalRoyale.unitPrice,
        items: {
          create: [
            {
              productId: santalRoyale.id,
              productName: santalRoyale.name,
              unitPrice: santalRoyale.unitPrice,
              quantity: 1,
              lineTotal: santalRoyale.unitPrice,
            },
          ],
        },
      },
    });
  }

  // Find first walk-in customer who was successfully created
  const firstWalkIn = await prisma.customer.findFirst({
    where: { userId: null },
    orderBy: { id: "asc" },
  });

  // Order 2: Internal FULFILLED + PAID order (historical data for Finance dashboard)
  const existingOrder2 = await prisma.order.findUnique({
    where: { orderNumber: "VEL-2026-0002" },
  });

  if (!existingOrder2 && firstWalkIn) {
    const roseImperiale = products["VEL-FLOR-001"];
    const vanilleNoire = products["VEL-ORIE-004"];

    const orderTotal =
      parseFloat(roseImperiale.unitPrice.toString()) * 1 +
      parseFloat(vanilleNoire.unitPrice.toString()) * 2;

    const order2 = await prisma.order.create({
      data: {
        orderNumber: "VEL-2026-0002",
        customerId: firstWalkIn.id,
        source: OrderSource.INTERNAL,
        createdById: salesUser.id,
        status: OrderStatus.FULFILLED,
        paymentStatus: PaymentStatus.UNPAID,
        deliveryAddress: "32 Acacia St, Quezon City",
        total: orderTotal.toFixed(2),
        fulfilledAt: new Date(),
        fulfilledById: inventoryUser.id,
        items: {
          create: [
            {
              productId: roseImperiale.id,
              productName: roseImperiale.name,
              unitPrice: roseImperiale.unitPrice,
              quantity: 1,
              lineTotal: roseImperiale.unitPrice,
            },
            {
              productId: vanilleNoire.id,
              productName: vanilleNoire.name,
              unitPrice: vanilleNoire.unitPrice,
              quantity: 2,
              lineTotal: (parseFloat(vanilleNoire.unitPrice.toString()) * 2).toFixed(2),
            },
          ],
        },
      },
    });

    // Write SALE stock movements for order 2
    await prisma.stockMovement.createMany({
      data: [
        {
          productId: roseImperiale.id,
          type: "SALE",
          quantity: -1,
          reason: "Order fulfillment: VEL-2026-0002",
          referenceOrderId: order2.id,
          performedById: inventoryUser.id,
        },
        {
          productId: vanilleNoire.id,
          type: "SALE",
          quantity: -2,
          reason: "Order fulfillment: VEL-2026-0002",
          referenceOrderId: order2.id,
          performedById: inventoryUser.id,
        },
      ],
    });

    // Record payment for order 2 (fully paid demo)
    await prisma.payment.create({
      data: {
        orderId: order2.id,
        amount: orderTotal.toFixed(2),
        method: "CASH",
        referenceNo: "REC-SEED-0001",
        recordedById: financeUser.id,
      },
    });

    // Update order 2 paymentStatus to PAID
    await prisma.order.update({
      where: { id: order2.id },
      data: { paymentStatus: PaymentStatus.PAID },
    });
  }

  console.log("✅ Sample orders seeded.");

  // ----------------------------------------------------------------
  // 7. Sample Stock Movements for historical cost data
  // ----------------------------------------------------------------
  const existingMovements = await prisma.stockMovement.count({
    where: { type: "STOCK_IN" },
  });

  if (existingMovements === 0) {
    await prisma.stockMovement.createMany({
      data: [
        {
          productId: products["VEL-WOOD-001"].id,
          type: "STOCK_IN",
          quantity: 10,
          unitCost: "95.00",
          reason: "Initial stock — Supplier: Grasse Atelier Distillers",
          performedById: inventoryUser.id,
        },
        {
          productId: products["VEL-FLOR-001"].id,
          type: "STOCK_IN",
          quantity: 12,
          unitCost: "98.00",
          reason: "Initial stock — Supplier: Provence Natural Extracts",
          performedById: inventoryUser.id,
        },
        {
          productId: products["VEL-ORIE-001"].id,
          type: "STOCK_IN",
          quantity: 8,
          unitCost: "105.00",
          reason: "Initial stock — Supplier: Dubai Luxury Essences",
          performedById: inventoryUser.id,
        },
      ],
    });
  }

  console.log("✅ Stock movements seeded.");

  // ----------------------------------------------------------------
  // Summary
  // ----------------------------------------------------------------
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.customer.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.payment.count(),
    prisma.stockMovement.count(),
  ]);

  console.log("\n📊 VÉLORA Seed Summary:");
  console.log(`  Users:          ${counts[0]}`);
  console.log(`  Customers:      ${counts[1]}`);
  console.log(`  Categories:     ${counts[2]}`);
  console.log(`  Products:       ${counts[3]}`);
  console.log(`  Orders:         ${counts[4]}`);
  console.log(`  Payments:       ${counts[5]}`);
  console.log(`  Stock Moves:    ${counts[6]}`);
  console.log("\n🎯 Demo Credentials (password for all: DemoPass123!):");
  console.log("  ADMIN     → admin@velora.local       (ERP Portal :5174)");
  console.log("  SALES     → sales@velora.local       (ERP Portal :5174)");
  console.log("  INVENTORY → inventory@velora.local   (ERP Portal :5174)");
  console.log("  FINANCE   → finance@velora.local     (ERP Portal :5174)");
  console.log("  CUSTOMER  → customer@velora.local    (Storefront :5173)");
  console.log("\n✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
