// ============================================================
// ERNET STORE — Seed de démonstration
// ============================================================
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ERNET STORE...');

  // Admin
  const adminPassword = await bcrypt.hash('Admin@123456', 10);
  await prisma.user.upsert({
    where: { email: 'admin@ernetstore.com' },
    update: {},
    create: {
      email: 'admin@ernetstore.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'ERNET',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // Catégories
  const categories = [
    'Processeurs',
    'Cartes mères',
    'Mémoire RAM',
    'Stockage',
    'Cartes graphiques',
    'Alimentations',
    'Boîtiers',
    'Ordinateurs',
    'Serveurs',
    'Réseaux',
    'Périphériques',
    'Accessoires',
  ];
  for (const name of categories) {
    await prisma.category.upsert({
      where: {
        slug: name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '-'),
      },
      update: {},
      create: {
        name,
        slug: name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '-'),
      },
    });
  }

  // Marques
  const brands = [
    'Intel',
    'AMD',
    'NVIDIA',
    'ASUS',
    'Dell',
    'HP',
    'Lenovo',
    'Kingston',
    'Seagate',
    'Corsair',
  ];
  for (const name of brands) {
    await prisma.brand.upsert({
      where: { slug: name.toLowerCase() },
      update: {},
      create: { name, slug: name.toLowerCase() },
    });
  }

  // Produits de démo
  const intel = await prisma.brand.findUnique({ where: { slug: 'intel' } });
  const nvidia = await prisma.brand.findUnique({ where: { slug: 'nvidia' } });
  const kingston = await prisma.brand.findUnique({ where: { slug: 'kingston' } });
  const dell = await prisma.brand.findUnique({ where: { slug: 'dell' } });
  const cpuCat = await prisma.category.findUnique({ where: { slug: 'processeurs' } });
  const gpuCat = await prisma.category.findUnique({ where: { slug: 'cartes-graphiques' } });
  const ramCat = await prisma.category.findUnique({ where: { slug: 'memoire-ram' } });
  const ordCat = await prisma.category.findUnique({ where: { slug: 'ordinateurs' } });

  const products = [
    {
      sku: 'INT-14700K',
      name: 'Intel Core i7-14700K (20 cœurs, 5.6 GHz)',
      slug: 'intel-core-i7-14700k',
      price: 4990,
      compareAt: 5990,
      costPrice: 4590,
      stock: 25,
      isFeatured: true,
      isNew: true,
      brandId: intel.id,
      categoryId: cpuCat.id,
      specs: { cores: 20, threads: 28, socket: 'LGA 1700', tdp: '125W' },
    },
    {
      sku: 'NVD-4070S',
      name: 'NVIDIA GeForce RTX 4070 Super 12 Go',
      slug: 'nvidia-rtx-4070-super',
      price: 7490,
      compareAt: 8490,
      costPrice: 6990,
      stock: 8,
      isFeatured: true,
      stockAlert: 5,
      brandId: nvidia.id,
      categoryId: gpuCat.id,
      specs: { memory: '12GB GDDR6X', bus: '192-bit', dlss: '3' },
    },
    {
      sku: 'KNG-DDR5-32',
      name: 'Kingston Fury Beast DDR5 32 Go (2x16) 5600 MHz',
      slug: 'kingston-fury-ddr5-32gb',
      price: 1290,
      costPrice: 1190,
      stock: 50,
      isFeatured: true,
      brandId: kingston.id,
      categoryId: ramCat.id,
      specs: { memory: '32GB', type: 'DDR5', speed: '5600MHz' },
    },
    {
      sku: 'DELL-LAT-5540',
      name: 'Dell Latitude 5540 Intel Core i5 13e Gen',
      slug: 'dell-latitude-5540',
      price: 8990,
      compareAt: 11200,
      costPrice: 8490,
      stock: 12,
      isFeatured: true,
      brandId: dell.id,
      categoryId: ordCat.id,
      specs: { screen: '15.6" FHD', ram: '16GB', storage: '512GB SSD' },
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: p,
      create: p,
    });
  }

  console.log('✅ Seed terminé');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
