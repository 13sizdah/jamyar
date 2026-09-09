"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6">
      <div className="tech-card p-4 rounded-md max-w-lg">
        <p className="mono-label text-orange-400">ERROR</p>
        <p className="mt-2 text-sm">{error.message === "FORBIDDEN" ? "دسترسی ندارید." : error.message}</p>
        <button className="btn mt-4" type="button" onClick={() => reset()}>
          تلاش دوباره
        </button>
      </div>
    </div>
  );
}
