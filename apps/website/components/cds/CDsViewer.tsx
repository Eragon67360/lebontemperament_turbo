"use client";
import { Card, CardBody, CardFooter, Image, Skeleton } from "@heroui/react";
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
          <Card className="w-[200px] space-y-5 p-4" radius="lg">
            <Skeleton className="rounded-lg">
              <div className="bg-default-300 h-24 rounded-lg"></div>
            </Skeleton>
            <div className="space-y-3">
              <Skeleton className="w-3/5 rounded-lg">
                <div className="bg-default-200 h-3 w-3/5 rounded-lg"></div>
              </Skeleton>
              <Skeleton className="w-4/5 rounded-lg">
                <div className="bg-default-200 h-3 w-4/5 rounded-lg"></div>
              </Skeleton>
              <Skeleton className="w-2/5 rounded-lg">
                <div className="bg-default-300 h-3 w-2/5 rounded-lg"></div>
              </Skeleton>
            </div>
          </Card>
          <Card className="w-[200px] space-y-5 p-4" radius="lg">
            <Skeleton className="rounded-lg">
              <div className="bg-default-300 h-24 rounded-lg"></div>
            </Skeleton>
            <div className="space-y-3">
              <Skeleton className="w-3/5 rounded-lg">
                <div className="bg-default-200 h-3 w-3/5 rounded-lg"></div>
              </Skeleton>
              <Skeleton className="w-4/5 rounded-lg">
                <div className="bg-default-200 h-3 w-4/5 rounded-lg"></div>
              </Skeleton>
              <Skeleton className="w-2/5 rounded-lg">
                <div className="bg-default-300 h-3 w-2/5 rounded-lg"></div>
              </Skeleton>
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 md:flex-row">
          {products.map((item, index) => (
            <Card
              shadow="sm"
              className="w-fit transition-all duration-200 hover:scale-105 hover:opacity-90"
              key={index}
              isPressable
              onPress={() =>
                router.push(`/concerts/autres/preview/${item.slug}`)
              }
            >
              <CardBody className="p-0">
                <Image
                  shadow="sm"
                  radius="lg"
                  height={270}
                  width={270}
                  alt={item.name}
                  className="h-full w-full object-contain"
                  src={item.image}
                />
              </CardBody>
              <CardFooter className="text-small justify-between">
                <b>{item.name}</b>
                <p className="text-default-500 font-bold">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: item.currency,
                  }).format(item.price / 100)}
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default CDsViewer;
