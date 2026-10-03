"use client";
import cds from "@/public/json/cds.json";
import { Card } from "@heroui/react";
import { useRouter } from "next/navigation";

// Original assets, pixel-identical to the covers Stripe used to serve.
const CLOUDINARY_BASE = "https://res.cloudinary.com/dlt2j3dld/image/upload/v1/";

// Catalogue only: the CDs come from public/json/cds.json (no shop backend).
// `cardName` / `cardOrder` keep the cards as they were when Stripe listed them.
const cards = [...cds].sort((a, b) => a.cardOrder - b.cardOrder);

const CDsViewer = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center gap-2 md:flex-row">
      {cards.map((item) => (
        <Card
          className="w-fit shadow-sm transition-all duration-200 hover:scale-105 hover:opacity-90"
          key={item.slug}
        >
          <button
            type="button"
            className="w-full cursor-pointer text-left"
            onClick={() => router.push(`/concerts/autres/preview/${item.slug}`)}
            aria-label={`Voir ${item.cardName}`}
          >
            <Card.Content className="p-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height={270}
                width={270}
                alt={item.cardName}
                className="h-full w-full rounded-lg object-contain shadow-sm"
                src={`${CLOUDINARY_BASE}${item.image}`}
              />
            </Card.Content>
            <Card.Footer className="justify-between text-sm">
              <b>{item.cardName}</b>
              <p className="text-muted font-bold">
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: item.currency,
                }).format(item.price / 100)}
              </p>
            </Card.Footer>
          </button>
        </Card>
      ))}
    </div>
  );
};

export default CDsViewer;
