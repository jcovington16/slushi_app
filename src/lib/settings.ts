import { prisma } from "./prisma";
import { parseAllowedStreets } from "./neighborhood";

export const SETTINGS = {
  allowedStreets: "ALLOWED_STREETS",
  enableAdultBoosters: "ENABLE_ADULT_BOOSTERS"
} as const;

export async function getAllowedStreets() {
  const setting = await prisma.adminSetting.findUnique({
    where: { key: SETTINGS.allowedStreets }
  });

  return parseAllowedStreets(setting?.value);
}

export async function setAllowedStreets(streets: string[]) {
  return prisma.adminSetting.upsert({
    where: { key: SETTINGS.allowedStreets },
    create: { key: SETTINGS.allowedStreets, value: streets },
    update: { value: streets }
  });
}
