import { prisma } from "@/lib/prisma";
import { defaultSettings } from "@/lib/default-data";
import { isDatabaseConfigured } from "@/lib/env";

export async function getSettings() {
  if (!isDatabaseConfigured()) return { id: "default-setting", ...defaultSettings };

  const settings = await prisma.setting.findFirst();
  if (settings) return settings;

  return prisma.setting.create({
    data: { id: "default-setting", ...defaultSettings }
  });
}
