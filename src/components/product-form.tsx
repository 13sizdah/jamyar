import { saveProductAction } from "@/app/actions/inventory";
import { BackLink, PageHeader } from "@/components/ui";

type Item = { id: string; name: string };

export function ProductForm({
  product,
  categories,
  units,
  warehouses,
}: {
  product?: {
    id: string;
    name: string;
    sku: string;
    categoryId: string;
    unitId: string;
    minStock: unknown;
    salePrice: unknown;
    active: boolean;
  };
  categories: Item[];
  units: Item[];
  warehouses?: { id: string; name: string }[];
}) {
  return (
    <div className="p-4 max-w-xl">
      <BackLink href="/inventory/products" label="کالاها" />
      <PageHeader title={product ? "ویرایش کالا" : "کالای جدید"} subtitle="کد کالا" />
      <form action={saveProductAction} className="tech-card space-y-4 p-4 rounded-md">
        {product ? <input type="hidden" name="id" value={product.id} /> : null}
        <div>
          <label>نام</label>
          <input name="name" required defaultValue={product?.name} />
        </div>
        <div>
          <label>کد کالا</label>
          <input name="sku" required defaultValue={product?.sku} className="font-mono" />
        </div>
        <div>
          <label>دسته</label>
          <select name="categoryId" defaultValue={product?.categoryId} required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>واحد</label>
          <select name="unitId" defaultValue={product?.unitId} required>
            {units.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>حداقل موجودی</label>
          <input name="minStock" type="number" step="0.001" defaultValue={Number(product?.minStock ?? 0)} className="font-mono" />
        </div>
        <div>
          <label>قیمت فروش</label>
          <input name="salePrice" type="number" step="1" defaultValue={Number(product?.salePrice ?? 0)} className="font-mono" />
        </div>
        {!product && warehouses?.length ? (
          <>
            <div>
              <label>انبار موجودی اولیه</label>
              <select name="warehouseId" defaultValue={warehouses[0]?.id}>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>موجودی اولیه</label>
              <input name="openingQty" type="number" step="0.001" defaultValue={0} className="font-mono" />
            </div>
            <div>
              <label>بهای تمام‌شده اولیه</label>
              <input name="openingCost" type="number" step="1" defaultValue={0} className="font-mono" />
            </div>
          </>
        ) : null}
        <label className="flex items-center gap-2 text-sm !font-sans normal-case tracking-normal">
          <input className="w-auto" type="checkbox" name="active" defaultChecked={product?.active ?? true} />
          فعال
        </label>
        <button className="btn" type="submit">
          ذخیره
        </button>
      </form>
    </div>
  );
}
