"use client";
import { Card, Skeleton } from "@heroui/react";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  slug: string;
}

const CDsViewer = () => {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await fetch("/api/cds");
      const data = await response.json();
      setProducts(data);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  return (
    <>
      {loading ? (
        <div className="flex gap-4">
          {[0, 1].map((i) => (
            <Card key={i} className="w-[200px] space-y-5 rounded-lg p-4">
              <Skeleton className="h-24 rounded-lg" />
              <div className="space-y-3">
                <Skeleton className="h-3 w-3/5 rounded-lg" />
                <Skeleton className="h-3 w-4/5 rounded-lg" />
                <Skeleton className="h-3 w-2/5 rounded-lg" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 md:flex-row">
          {products.map((item, index) => (
            <Card
              className="w-fit shadow-sm transition-all duration-200 hover:scale-105 hover:opacity-90"
              key={index}
            >
              <button
                type="button"
                className="w-full cursor-pointer text-left"
                onClick={() =>
                  router.push(`/concerts/autres/preview/${item.slug}`)
                }
                aria-label={`Voir ${item.name}`}
              >
                <Card.Content className="p-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    height={270}
                    width={270}
                    alt={item.name}
                    className="h-full w-full rounded-lg object-contain shadow-sm"
                    src={item.image}
                  />
                </Card.Content>
                <Card.Footer className="justify-between text-sm">
                  <b>{item.name}</b>
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
      )}
    </>
  );
};

export default CDsViewer;
