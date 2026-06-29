import { PrismaClient } from "@prisma/client";
import { defaultMenuItems, defaultSettings } from "../lib/default-data";

const prisma = new PrismaClient();

async function main() {
  await prisma.setting.upsert({
    where: { id: "default-setting" },
    update: defaultSettings,
    create: { id: "default-setting", ...defaultSettings }
  });

  for (const item of defaultMenuItems) {
    await prisma.menuItem.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        badge: item.badge,
        mealType: item.mealType,
        stockLimit: item.stockLimit,
        isActive: true
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        badge: item.badge,
        mealType: item.mealType,
        stockLimit: item.stockLimit,
        isActive: true,
        components: {
          create: item.components.map((component) => ({
            itemName: component
          }))
        }
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
