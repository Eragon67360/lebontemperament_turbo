"use client";
import Papa from "papaparse";
import { useEffect, useState } from "react";

const Membres = () => {
  const [columns, setColumns] = useState<string[]>([]);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vTdoIYE2BEV1E3qXW65BpTDsxzgDwFeaC4lvbQ3UNWXZOPfpRtqKfhmG05ElyByDp0442WTARufKmHg/pub?gid=0&single=true&output=csv",
      );
      const text = await response.text();
      const result = Papa.parse(text, { header: true });

      if (result.data) {
        setData(result.data);
      }
      if (result.meta && result.meta.fields) {
        setColumns(result.meta.fields);
      }
    };

    fetchData();
  }, []);
  return (
    <div className="px-8 max-w-[1440px] w-full flex flex-col">
      <div className="py-8">
        <h1 className="text-title text-primary/50 font-light leading-none">
          Liste
        </h1>
        <h2 className="text-title text-[#333] font-bold leading-none">
          des membres
        </h2>
        <hr className="my-8" />

        <div className="overflow-x-auto mt-5 rounded-lg">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-primary text-white">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="text-left py-2 px-4">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={index}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-[#cccccc]"} hover:bg-[#eaeaea]`}
                >
                  {columns.map((column) => (
                    <td key={column} className="text-left py-2 px-4">
                      {row[column]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Membres;
