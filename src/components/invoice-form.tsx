"use client";

import { useState } from "react";
import { createInvoiceAction } from "@/app/actions/accounting";

type Opt = { id: string; name: string; extra?: string };

export function InvoiceForm({
  branches,
  warehouses,
  parties,
  products,
}: {
  branches: Opt[];
  warehouses: { id: string; name: string; branchId: string }[];
  parties: { id: string; name: string; type: string }[];
  products: { id: string; name: string; salePrice: number; avgCost: number }[];
}) {
  const [type, setType] = useState<"SALE" | "PURCHASE">("SALE");
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [rows, setRows] = useState([{ productId: products[0]?.id ?? "", quantity: 1, unitPrice: products[0]?.salePrice ?? 0 }]);
  const filteredWh = warehouses.filter((w) => w.branchId === branchId);
  const filteredParties = parties.filter((p) => (type === "SALE" ? p.type === "CUSTOMER" : p.type === "SUPPLIER"));

  return (
    <form action={createInvoiceAction} className="tech-card space-y-4 p-4 rounded-md">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label>TYPE</label>
          <select name="type" value={type} onChange={(e) => setType(e.target.value as "SALE" | "PURCHASE")}>
            <option value="SALE">فروش</option>
            <option value="PURCHASE">خرید</option>
          </select>
        </div>
        <div>
          <label>BRANCH</label>
          <select name="branchId" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>WAREHOUSE</label>
          <select name="warehouseId" required>
            {filteredWh.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>PARTY</label>
          <select name="partyId" required>
            {filteredParties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm !font-sans normal-case tracking-normal">
        <input className="w-auto" type="checkbox" name="paid" />
        نقدی (صندوق)
      </label>
      <div>
        <label>NOTE</label>
        <input name="note" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="mono-label text-text-secondary">LINES</span>
          <button
            type="button"
            className="btn-ghost px-2 py-1 text-xs rounded-md"
            onClick={() =>
              setRows((r) => [...r, { productId: products[0]?.id ?? "", quantity: 1, unitPrice: type === "SALE" ? products[0]?.salePrice ?? 0 : products[0]?.avgCost ?? 0 }])
            }
          >
            + ردیف
          </button>
        </div>
        {rows.map((row, i) => (
          <div key={i} className="grid gap-2 md:grid-cols-3">
            <select
              name="productId"
              value={row.productId}
              onChange={(e) => {
                const p = products.find((x) => x.id === e.target.value);
                setRows((rs) =>
                  rs.map((x, idx) =>
                    idx === i
                      ? { ...x, productId: e.target.value, unitPrice: type === "SALE" ? p?.salePrice ?? 0 : p?.avgCost ?? 0 }
                      : x,
                  ),
                );
              }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              name="quantity"
              type="number"
              step="0.001"
              className="font-mono"
              value={row.quantity}
              onChange={(e) => setRows((rs) => rs.map((x, idx) => (idx === i ? { ...x, quantity: Number(e.target.value) } : x)))}
            />
            <input
              name="unitPrice"
              type="number"
              step="1"
              className="font-mono"
              value={row.unitPrice}
              onChange={(e) => setRows((rs) => rs.map((x, idx) => (idx === i ? { ...x, unitPrice: Number(e.target.value) } : x)))}
            />
          </div>
        ))}
      </div>
      <button className="btn" type="submit">
        ثبت و صدور سند
      </button>
    </form>
  );
}
