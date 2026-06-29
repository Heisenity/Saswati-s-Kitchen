import { isPrismaConnectionError, prisma } from "@/lib/prisma";
import { defaultKitchenCoordinates, defaultSettings } from "@/lib/default-data";
import { isDatabaseConfigured } from "@/lib/env";

const oldKitchenCoordinates = {
  latitude: 22.7604,
  longitude: 88.37
};

export async function getSettings() {
  if (!isDatabaseConfigured()) return { id: "default-setting", ...defaultSettings };

  try {
    const settings = await prisma.setting.findFirst();
    if (settings) {
      if (
        Math.abs(settings.kitchenLatitude - oldKitchenCoordinates.latitude) < 0.000001 &&
        Math.abs(settings.kitchenLongitude - oldKitchenCoordinates.longitude) < 0.000001
      ) {
        return await prisma.setting.update({
          where: { id: settings.id },
          data: {
            kitchenLatitude: defaultKitchenCoordinates.latitude,
            kitchenLongitude: defaultKitchenCoordinates.longitude
          }
        });
      }

      return settings;
    }

    return await prisma.setting.create({
      data: { id: "default-setting", ...defaultSettings }
    });
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return { id: "default-setting", ...defaultSettings };
    }
    throw error;
  }
}
