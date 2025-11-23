"use client";
import projects from "@/public/json/projects.json";
import { Button } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { IoIosArrowRoundForward } from "react-icons/io";

const ProjectViewer = () => {
  // Sort projects by date (newest first) and take the latest 4
  const latestProjects = projects
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <div className="w-full">
      <div className="my-8 flex flex-col">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="border-divider bg-background block overflow-hidden rounded-lg border p-4 shadow-none transition-all duration-300 hover:shadow-md">
              <Link
                href={`/concerts/${latestProjects[0]?.slug || ""}`}
                className="block"
              >
                <div className="relative !h-32 overflow-hidden">
                  <Image
                    src={latestProjects[0]?.image || ""}
                    alt={latestProjects[0]?.name || ""}
                    fill
                    className="rounded-lg object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between">
                    <h4 className="text-foreground overflow-hidden text-lg font-semibold">
                      <span className="block truncate">
                        {latestProjects[0]?.name || ""}{" "}
                        {latestProjects[0]?.subName || ""}
                      </span>
                    </h4>
                    <span className="bg-primary/10 text-primary ml-2 inline-block rounded-full px-3 py-1 text-xs font-medium">
                      {latestProjects[0]?.date
                        ? new Date(latestProjects[0].date).getFullYear()
                        : ""}
                    </span>
                  </div>
                  <p className="text-default-600 line-clamp-4 overflow-hidden text-sm">
                    {latestProjects[0]?.explanation || ""}
                  </p>
                </div>
              </Link>
              <div className="px-4 pb-4">
                <Button
                  as={Link}
                  href={`/concerts/${latestProjects[0]?.slug || ""}`}
                  color="primary"
                  variant="light"
                  radius="sm"
                  size="sm"
                  className="flex w-fit items-center gap-2"
                >
                  <span className="text-sm">Voir plus</span>
                  <IoIosArrowRoundForward className="scale-110" />
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="border-divider bg-background flex h-full grow flex-col items-center gap-8 overflow-hidden rounded-lg border p-4 shadow-none transition-all duration-300 hover:shadow-md md:flex-row">
              <Link
                href={`/concerts/${latestProjects[1]?.slug || ""}`}
                className="relative h-32 w-full md:h-full md:w-1/2"
              >
                <Image
                  src={latestProjects[1]?.image || ""}
                  alt={latestProjects[1]?.name || ""}
                  fill
                  className="self-start rounded-lg object-cover object-left"
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
              </Link>
              <div className="w-full space-y-3 p-4 lg:w-1/2">
                <div className="flex items-start justify-between">
                  <h4 className="text-foreground overflow-hidden text-lg font-semibold">
                    <span className="block truncate">
                      {latestProjects[1]?.name || ""}{" "}
                      {latestProjects[1]?.subName || ""}
                    </span>
                  </h4>
                  <span className="bg-primary/10 text-primary ml-2 inline-block rounded-full px-3 py-1 text-xs font-medium">
                    {latestProjects[1]?.date
                      ? new Date(latestProjects[1].date).getFullYear()
                      : ""}
                  </span>
                </div>
                <p
                  className="text-default-600 line-clamp-6 overflow-hidden text-sm"
                  dangerouslySetInnerHTML={{
                    __html: latestProjects[1]?.explanation || "",
                  }}
                ></p>
                <Button
                  as={Link}
                  href={`/concerts/${latestProjects[1]?.slug || ""}`}
                  color="primary"
                  variant="light"
                  radius="sm"
                  size="sm"
                  className="flex w-fit items-center gap-2"
                >
                  <span className="text-sm">Voir plus</span>
                  <IoIosArrowRoundForward className="scale-110" />
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="border-divider bg-background flex h-full grow flex-col items-center gap-8 overflow-hidden rounded-lg border p-4 shadow-none transition-all duration-300 hover:shadow-md md:flex-row">
              <Link
                href={`/concerts/${latestProjects[2]?.slug || ""}`}
                className="relative h-32 w-full md:h-full md:w-1/2"
              >
                <Image
                  src={latestProjects[2]?.image || ""}
                  alt={latestProjects[2]?.name || ""}
                  fill
                  className="self-start rounded-lg object-cover object-left"
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
              </Link>
              <div className="w-full space-y-3 p-4 lg:w-1/2">
                <div className="flex items-start justify-between">
                  <h4 className="text-foreground overflow-hidden text-lg font-semibold">
                    <span className="block truncate">
                      {latestProjects[2]?.name || ""}{" "}
                      {latestProjects[2]?.subName || ""}
                    </span>
                  </h4>
                  <span className="bg-primary/10 text-primary ml-2 inline-block rounded-full px-3 py-1 text-xs font-medium">
                    {latestProjects[2]?.date
                      ? new Date(latestProjects[2].date).getFullYear()
                      : ""}
                  </span>
                </div>
                <p
                  className="text-default-600 line-clamp-6 overflow-hidden text-sm"
                  dangerouslySetInnerHTML={{
                    __html: latestProjects[2]?.explanation || "",
                  }}
                ></p>
                <Button
                  as={Link}
                  href={`/concerts/${latestProjects[2]?.slug || ""}`}
                  color="primary"
                  variant="light"
                  radius="sm"
                  size="sm"
                  className="flex w-fit items-center gap-2"
                >
                  <span className="text-sm">Voir plus</span>
                  <IoIosArrowRoundForward className="scale-110" />
                </Button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="border-divider bg-background block overflow-hidden rounded-lg border p-4 shadow-none transition-all duration-300 hover:shadow-md">
              <Link
                href={`/concerts/${latestProjects[3]?.slug || ""}`}
                className="block"
              >
                <div className="relative h-32">
                  <Image
                    src={latestProjects[3]?.image || ""}
                    alt={latestProjects[3]?.name || ""}
                    fill
                    className="rounded-lg object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between">
                    <h4 className="text-foreground overflow-hidden text-lg font-semibold">
                      <span className="block truncate">
                        {latestProjects[3]?.name || ""}{" "}
                        {latestProjects[3]?.subName || ""}
                      </span>
                    </h4>
                    <span className="bg-primary/10 text-primary ml-2 inline-block rounded-full px-3 py-1 text-xs font-medium">
                      {latestProjects[3]?.date
                        ? new Date(latestProjects[3].date).getFullYear()
                        : ""}
                    </span>
                  </div>
                  <p className="text-default-600 line-clamp-4 overflow-hidden text-sm">
                    {latestProjects[3]?.explanation || ""}
                  </p>
                </div>
              </Link>
              <div className="px-4 pb-4">
                <Button
                  as={Link}
                  href={`/concerts/${latestProjects[3]?.slug || ""}`}
                  color="primary"
                  variant="light"
                  radius="sm"
                  size="sm"
                  className="flex w-fit items-center gap-2"
                >
                  <span className="text-sm">Voir plus</span>
                  <IoIosArrowRoundForward className="scale-110" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectViewer;
