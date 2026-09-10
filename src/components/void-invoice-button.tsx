"use client";

import { voidInvoiceAction } from "@/app/actions/accounting";

export function VoidInvoiceButton({ invoiceId }: { invoiceId: string }) {
  return (
    <form
      action={voidInvoiceAction}
      className="mt-4"
      onSubmit={(e) => {
        if (!window.confirm("فاکتور باطل شود؟ موجودی برمی‌گردد و سند تهاتر ثبت می‌شود.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={invoiceId} />
      <button className="btn-danger rounded-md px-4 py-2 text-sm" type="submit">
        ابطال فاکتور
      </button>
    </form>
  );
}
