export function ReportFilters({
  from,
  to,
  branchId,
  branches,
  showBranch,
}: {
  from?: string;
  to?: string;
  branchId?: string;
  branches: { id: string; name: string }[];
  showBranch: boolean;
}) {
  return (
    <form className="tech-card mb-3 grid gap-3 p-3 rounded-md md:grid-cols-4" method="get">
      <div>
        <label>از تاریخ</label>
        <input name="from" type="date" defaultValue={from ?? ""} className="font-mono" />
      </div>
      <div>
        <label>تا تاریخ</label>
        <input name="to" type="date" defaultValue={to ?? ""} className="font-mono" />
      </div>
      {showBranch ? (
        <div>
          <label>شعبه</label>
          <select name="branchId" defaultValue={branchId ?? ""}>
            <option value="">همه شعب</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="branchId" value={branchId ?? ""} />
      )}
      <div className="flex items-end">
        <button className="btn w-full" type="submit">
          اعمال فیلتر
        </button>
      </div>
    </form>
  );
}

export function parseReportRange(sp: { from?: string; to?: string }) {
  const from = sp.from?.trim() ? new Date(`${sp.from}T00:00:00`) : undefined;
  const to = sp.to?.trim() ? new Date(`${sp.to}T23:59:59`) : undefined;
  return { from, to };
}
