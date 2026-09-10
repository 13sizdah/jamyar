"use client";

import { useState } from "react";
import { createJournalAction } from "@/app/actions/accounting";
import { toInputDate } from "@/lib/format";

export function JournalForm({
  branches,
  accounts,
}: {
  branches: { id: string; name: string }[];
  accounts: { id: string; code: string; name: string }[];
}) {
  const [rows, setRows] = useState([
    { accountId: accounts[0]?.id ?? "", debit: 0, credit: 0, memo: "" },
    { accountId: accounts[1]?.id ?? accounts[0]?.id ?? "", debit: 0, credit: 0, memo: "" },
  ]);

  return (
    <form action={createJournalAction} className="tech-card space-y-4 p-4 rounded-md">
      <div>
        <label>شعبه</label>
        <select name="branchId" required>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>تاریخ</label>
        <input name="date" type="date" required defaultValue={toInputDate(new Date())} className="font-mono" />
      </div>
      <div>
        <label>شرح</label>
        <input name="description" required />
      </div>
      <div className="flex justify-between">
        <span className="text-xs text-text-secondary">ردیف‌ها</span>
        <button
          type="button"
          className="btn-ghost px-2 py-1 text-xs rounded-md"
          onClick={() => setRows((r) => [...r, { accountId: accounts[0]?.id ?? "", debit: 0, credit: 0, memo: "" }])}
        >
          + ردیف
        </button>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="grid gap-2 md:grid-cols-4">
          <select
            name="accountId"
            value={row.accountId}
            onChange={(e) => setRows((rs) => rs.map((x, idx) => (idx === i ? { ...x, accountId: e.target.value } : x)))}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} {a.name}
              </option>
            ))}
          </select>
          <input
            name="debit"
            type="number"
            placeholder="بدهکار"
            className="font-mono"
            value={row.debit || ""}
            onChange={(e) => setRows((rs) => rs.map((x, idx) => (idx === i ? { ...x, debit: Number(e.target.value) } : x)))}
          />
          <input
            name="credit"
            type="number"
            placeholder="بستانکار"
            className="font-mono"
            value={row.credit || ""}
            onChange={(e) => setRows((rs) => rs.map((x, idx) => (idx === i ? { ...x, credit: Number(e.target.value) } : x)))}
          />
          <input
            name="memo"
            placeholder="شرح"
            value={row.memo}
            onChange={(e) => setRows((rs) => rs.map((x, idx) => (idx === i ? { ...x, memo: e.target.value } : x)))}
          />
        </div>
      ))}
      <button className="btn" type="submit">
        ثبت سند
      </button>
    </form>
  );
}
