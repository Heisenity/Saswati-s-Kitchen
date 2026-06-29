import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  global.prismaGlobal ??
  new PrismaClient({
    log: []
  });

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}

export function isPrismaConnectionError(error: unknown) {
  if (!(error instanceof Error)) return false;

  return (
    error.name === "PrismaClientInitializationError" ||
    error.message.includes("Authentication failed against database server") ||
    error.message.includes("Can't reach database server")
  );
}
