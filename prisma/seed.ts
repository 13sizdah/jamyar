import bcrypt from "bcryptjs";
import { PrismaClient, AccountType, PartyType, Role, StockMovementType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.journalLine.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.payrollEntry.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.stockLevel.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.party.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.organization.deleteMany();

  const org = await prisma.organization.create({
    data: { name: "مجموعه فروشگاهی جامیار" },
  });

  const central = await prisma.branch.create({
    data: { organizationId: org.id, name: "شعبه مرکزی", city: "تهران" },
  });
  const west = await prisma.branch.create({
    data: { organizationId: org.id, name: "شعبه غرب", city: "تهران" },
  });

  const whCentral = await prisma.warehouse.create({
    data: { branchId: central.id, name: "انبار مرکزی" },
  });
  const whWest = await prisma.warehouse.create({
    data: { branchId: west.id, name: "انبار غرب" },
  });

  const passwordHash = await bcrypt.hash("admin1234", 10);

  await prisma.user.createMany({
    data: [
      {
        organizationId: org.id,
        email: "owner@jamyar.local",
        passwordHash,
        name: "مالک مجموعه",
        role: Role.OWNER,
        phone: "09120000000",
      },
      {
        organizationId: org.id,
        branchId: central.id,
        email: "manager@jamyar.local",
        passwordHash,
        name: "مدیر شعبه مرکزی",
        role: Role.BRANCH_MANAGER,
        phone: "09121111111",
      },
      {
        organizationId: org.id,
        branchId: central.id,
        email: "warehouse@jamyar.local",
        passwordHash,
        name: "انباردار مرکزی",
        role: Role.WAREHOUSE,
        phone: "09122222222",
      },
      {
        organizationId: org.id,
        branchId: central.id,
        email: "accountant@jamyar.local",
        passwordHash,
        name: "حسابدار",
        role: Role.ACCOUNTANT,
        phone: "09123333333",
      },
      {
        organizationId: org.id,
        branchId: west.id,
        email: "staff@jamyar.local",
        passwordHash,
        name: "کارمند شعبه غرب",
        role: Role.STAFF,
        phone: "09124444444",
      },
    ],
  });

  const [food, clean] = await Promise.all([
    prisma.category.create({ data: { organizationId: org.id, name: "خوراکی" } }),
    prisma.category.create({ data: { organizationId: org.id, name: "شوینده" } }),
  ]);
  const [pcs, kg] = await Promise.all([
    prisma.unit.create({ data: { organizationId: org.id, name: "عدد" } }),
    prisma.unit.create({ data: { organizationId: org.id, name: "کیلوگرم" } }),
  ]);

  const rice = await prisma.product.create({
    data: {
      organizationId: org.id,
      categoryId: food.id,
      unitId: kg.id,
      sku: "RICE-10",
      name: "برنج طارم ۱۰ کیلویی",
      minStock: 20,
      avgCost: 380000,
      salePrice: 450000,
    },
  });
  const oil = await prisma.product.create({
    data: {
      organizationId: org.id,
      categoryId: food.id,
      unitId: pcs.id,
      sku: "OIL-1.8",
      name: "روغن مایع ۱٫۸ لیتر",
      minStock: 30,
      avgCost: 95000,
      salePrice: 118000,
    },
  });
  const soap = await prisma.product.create({
    data: {
      organizationId: org.id,
      categoryId: clean.id,
      unitId: pcs.id,
      sku: "SOAP-01",
      name: "مایع ظرفشویی",
      minStock: 15,
      avgCost: 42000,
      salePrice: 59000,
    },
  });

  await prisma.stockLevel.createMany({
    data: [
      { productId: rice.id, warehouseId: whCentral.id, quantity: 48 },
      { productId: oil.id, warehouseId: whCentral.id, quantity: 80 },
      { productId: soap.id, warehouseId: whCentral.id, quantity: 12 },
      { productId: rice.id, warehouseId: whWest.id, quantity: 18 },
      { productId: oil.id, warehouseId: whWest.id, quantity: 25 },
      { productId: soap.id, warehouseId: whWest.id, quantity: 40 },
    ],
  });

  await prisma.stockMovement.createMany({
    data: [
      {
        productId: rice.id,
        warehouseId: whCentral.id,
        type: StockMovementType.IN,
        quantity: 48,
        unitCost: 380000,
        note: "موجودی اولیه",
      },
      {
        productId: soap.id,
        warehouseId: whCentral.id,
        type: StockMovementType.IN,
        quantity: 12,
        unitCost: 42000,
        note: "موجودی اولیه",
      },
    ],
  });

  await prisma.party.createMany({
    data: [
      { organizationId: org.id, type: PartyType.SUPPLIER, name: "پخش البرز", phone: "02144000000" },
      { organizationId: org.id, type: PartyType.CUSTOMER, name: "مشتری نقدی", phone: "" },
    ],
  });

  const accounts = [
    { code: "1101", name: "صندوق", type: AccountType.ASSET, systemKey: "CASH" },
    { code: "1130", name: "حساب‌های دریافتنی", type: AccountType.ASSET, systemKey: "AR" },
    { code: "1140", name: "موجودی کالا", type: AccountType.ASSET, systemKey: "INVENTORY" },
    { code: "2101", name: "حساب‌های پرداختنی", type: AccountType.LIABILITY, systemKey: "AP" },
    { code: "2110", name: "حقوق پرداختنی", type: AccountType.LIABILITY, systemKey: "PAYROLL_PAYABLE" },
    { code: "3101", name: "سرمایه", type: AccountType.EQUITY, systemKey: "EQUITY" },
    { code: "4101", name: "درآمد فروش", type: AccountType.REVENUE, systemKey: "SALES" },
    { code: "5101", name: "بهای تمام‌شده کالای فروش‌رفته", type: AccountType.EXPENSE, systemKey: "COGS" },
    { code: "5201", name: "هزینه حقوق", type: AccountType.EXPENSE, systemKey: "PAYROLL_EXPENSE" },
  ];

  await prisma.account.createMany({
    data: accounts.map((a) => ({ ...a, organizationId: org.id })),
  });

  console.log("Seed complete. Login: owner@jamyar.local / admin1234");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
