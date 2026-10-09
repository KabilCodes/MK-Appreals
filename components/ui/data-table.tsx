"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { EmptyState } from "./empty-state";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyTitle?: string;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyTitle = "No records found",
  emptyMessage = "There are no entries to display at this time.",
  className,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyMessage} />;
  }

  return (
    <div className={cn("w-full overflow-hidden rounded-2xl border border-charcoal-200/80 bg-white shadow-card", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-charcoal-50/80 border-b border-charcoal-200/80 text-charcoal-600 uppercase text-[11px] font-semibold tracking-wider">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} scope="col" className={cn("px-4 py-3.5", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-100 text-charcoal-800">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="hover:bg-gold-50/30 transition-colors"
              >
                {columns.map((col, idx) => (
                  <td key={idx} className={cn("px-4 py-3.5 align-middle", col.className)}>
                    {col.cell
                      ? col.cell(item)
                      : col.accessorKey
                      ? String(item[col.accessorKey] ?? "")
                      : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
