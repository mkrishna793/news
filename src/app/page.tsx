import { listItems, totals } from "@/lib/data";
import { toCard } from "@/lib/cards";
import ReadingDesk from "@/components/ReadingDesk";
export const dynamic = "force-dynamic";
export default async function Home() {
  const [items, counts] = await Promise.all([
    listItems({ limit: 24 }),
    totals(),
  ]);
  return (
    <ReadingDesk
      date={new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })}
      items={items.map(toCard)}
      total={Object.values(counts).reduce((a, b) => a + b, 0)}
    />
  );
}
