import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings, type Meta } from "@/db/schema";
import { ready } from "@/db/ensure";

export async function getSetting<T extends Meta = Meta>(
  key: string,
  fallback: T,
): Promise<T> {
  await ready();
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  return rows[0] ? ({ ...fallback, ...(rows[0].value as T) } as T) : fallback;
}

export async function setSetting(key: string, value: Meta): Promise<void> {
  await ready();
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function patchSetting(key: string, patch: Meta): Promise<Meta> {
  const cur = await getSetting(key, {});
  const next = { ...cur, ...patch };
  await setSetting(key, next);
  return next;
}
