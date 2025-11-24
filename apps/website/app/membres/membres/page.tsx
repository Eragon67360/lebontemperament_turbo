"use client";
import Papa from "papaparse";
import { useEffect, useState } from "react";
import { IoPersonCircle } from "react-icons/io5"; // Add this import
import { FaSearch } from "react-icons/fa"; // Add this import

interface MemberData {
  [key: string]: string; // This allows for dynamic column names
}

const Membres = () => {
  const [columns, setColumns] = useState<string[]>([]);
  const [data, setData] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://docs.google.com/spreadsheets/d/e/2PACX-1vTdoIYE2BEV1E3qXW65BpTDsxzgDwFeaC4lvbQ3UNWXZOPfpRtqKfhmG05ElyByDp0442WTARufKmHg/pub?gid=0&single=true&output=csv",
        );
        const text = await response.text();
        const result = Papa.parse<MemberData>(text, { header: true });

        if (result.data) {
          setData(result.data);
        }
        if (result.meta && result.meta.fields) {
          setColumns(result.meta.fields);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = data.filter((row) =>
    Object.values(row).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  );

  return (
    <div className="w-full p-2 md:p-4 lg:p-6">
      <div className="bg-content1 rounded-xl shadow-sm">
        {/* Header */}
        <div className="border-divider border-b p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-md p-2">
              <IoPersonCircle className="text-primary h-5 w-5" />
            </div>
            <div>
              <h2 className="text-foreground text-lg font-semibold">Membres</h2>
              <p className="text-default-500 text-sm">
                Liste des membres du Bon Tempérament
              </p>
            </div>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="border-divider border-b p-4 lg:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="focus:ring-primary/20 border-divider bg-content2 text-foreground w-full rounded-lg border py-2 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
              />
              <FaSearch className="text-default-400 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            </div>
            <div className="text-default-500 text-sm">
              {filteredData.length} membre{filteredData.length !== 1 && "s"}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="p-2 lg:p-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-default-100 h-12 rounded" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column}
                        className="border-divider text-default-500 border-b px-4 py-3 text-left text-xs font-medium tracking-wider uppercase"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-divider divide-y">
                  {filteredData.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-default-50 transition-colors"
                    >
                      {columns.map((column) => (
                        <td
                          key={column}
                          className="text-foreground px-4 py-3 text-sm whitespace-nowrap"
                        >
                          {row[column]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredData.length === 0 && (
                <div className="text-default-500 py-12 text-center">
                  Aucun résultat trouvé
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Membres;
