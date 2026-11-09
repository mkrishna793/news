import { listItems } from "@/lib/data";
import { toCard } from "@/lib/cards";
import ItemCard from "@/components/ItemCard";
import { PageHero, Empty } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Library · Curiosity Atlas" };

export default async function Page() {
  const rows = (
    await listItems({
      saved: true,
      limit: 120,
      sort: "latest",
      essentials: "any",
    })
  ).map(toCard);
  return (
    <>
      <PageHero
        title="Your library"
        subtitle="Everything you bookmarked. Saved items are never auto-deleted."
        emoji="📚"
        variant="helix"
        color="#fbbf24"
        color2="#f472b6"
        stats={[{ label: "saved", value: rows.length }]}
      />
      {rows.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => (
            <ItemCard key={c.id} c={c} />
          ))}
        </div>
      ) : (
        <Empty
          title="Nothing saved yet"
          hint="Tap the bookmark on any card to keep it here."
        />
      )}
    </>
  );
}
