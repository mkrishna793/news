import { db } from "@/db";
import { projects } from "@/db/schema";
import { ready } from "@/db/ensure";
import ProjectsClient from "@/components/ProjectsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects · Curiosity Atlas" };

export default async function Page() {
  await ready();
  const rows = await db
    .select()
    .from(projects)
    .orderBy(projects.position, projects.id);
  return (
    <ProjectsClient
      initial={rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
