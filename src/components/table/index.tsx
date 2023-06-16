"use client"

import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@tremor/react"
import { useEffect, useState } from "react";

type columnDefinition = {
  title: string;
  key: string;
}

export default function CatchmentTable({
  fetchItems,
  columnDefinitions
}: {
  fetchItems: () => Promise<any[]>;
  columnDefinitions: columnDefinition[];
}) {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  });

  const fetchData = async () => {
    setIsLoading(true);
    const response = await fetchItems();
    setItems(response);
    setIsLoading(false);
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          {columnDefinitions.map((column) => (
            <TableHeaderCell key={column.key}>
              {column.title}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            {columnDefinitions.map((column) => (
            <TableCell key={column.key}>
              {item[column.key]}
            </TableCell>
          ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}