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
    <div className="p-2 md:p-4 lg:p-6 w-full">
      <div className="bg-white rounded-xl shadow-sm">
        {/* Header */}
        <div className="p-4 lg:p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <IoPersonCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Membres</h2>
              <p className="text-sm text-gray-500">
                Liste des membres du Bon Tempérament
              </p>
            </div>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="p-4 lg:p-6 border-b">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            <div className="text-sm text-gray-500">
              {filteredData.length} membre{filteredData.length !== 1 && "s"}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="p-2 lg:p-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded" />
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
                        className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredData.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {columns.map((column) => (
                        <td
                          key={column}
                          className="whitespace-nowrap py-3 px-4 text-sm text-gray-900"
                        >
                          {row[column]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredData.length === 0 && (
                <div className="text-center py-12 text-gray-500">
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
