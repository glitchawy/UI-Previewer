import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, Field, Button, Icon, Badge, Table, Td } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { EGP, productOf, categories, branches } from "@/lib/tb/data";

export const Route = createFileRoute("/partner/menu/$id")({
  head: () => ({
    meta: [
      { title: "تعديل منتج — طلبات بيتك" },
      { name: "description", content: "تعديل بيانات المنتج، الأسعار، الإضافات والمخزون." },
      { property: "og:title", content: "تعديل منتج — طلبات بيتك" },
      { property: "og:description", content: "تعديل بيانات المنتج، الأسعار، الإضافات والمخزون." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnerMenuDetail,
});

function PartnerMenuDetail() {
  const { id } = Route.useParams();
  const product = productOf(id);
  if (!product) return null;
  return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم — برجر هاوس" nav={partnerNav} title={product.name}>
      <div className="tb-stagger flex flex-col gap-lg">
        <Link to="/partner/menu" className="flex w-fit items-center gap-1 font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface">
          <Icon name="arrow_forward" className="text-[18px]" />
          رجوع للمنتجات
        </Link>

        <div className="grid grid-cols-1 gap-md lg:grid-cols-3">
          <div className="flex flex-col gap-md lg:col-span-2">
            <Card className="p-md">
              <SectionTitle title="بيانات المنتج" icon="edit" />
              <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
                <Field label="اسم المنتج" value={product.name} />
                <Field label="السعر" type="number" value={String(product.price)} icon="payments" />
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="font-label-lg text-label-lg text-on-surface-variant">الوصف</span>
                  <textarea defaultValue={product.description} className="min-h-20 rounded-button border border-outline-variant bg-surface-container-lowest p-2.5 font-body-md text-body-md text-on-surface outline-none" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-label-lg text-label-lg text-on-surface-variant">التصنيف</span>
                  <select defaultValue={product.category} className="rounded-button border border-outline-variant bg-surface-container-lowest p-2.5 font-body-md text-body-md text-on-surface">
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-label-lg text-label-lg text-on-surface-variant">متاح؟</span>
                  <button className={`relative h-6 w-11 rounded-full transition ${product.available ? "bg-primary-container" : "bg-surface-container-high"}`}>
                    <span className={`absolute top-0.5 size-5 rounded-full bg-surface-container-lowest transition ${product.available ? "right-0.5" : "right-5"}`} />
                  </button>
                </div>
              </div>
              <div className="mt-md flex items-center justify-center rounded-card border-2 border-dashed border-outline-variant p-lg text-center">
                <div>
                  <Icon name="upload" className="mx-auto mb-1 text-[28px] text-outline" />
                  <p className="font-label-md text-label-md text-on-surface-variant">اسحب صورة المنتج هنا أو اضغط للرفع</p>
                </div>
              </div>
            </Card>

            <Card className="p-md">
              <SectionTitle title="الأحجام / التنويعات" icon="tune" action={<Button variant="outline" icon="add" className="!px-3 !py-1.5">إضافة</Button>} />
              <Table head={["الاسم", "فرق السعر", ""]}>
                {product.variations.map((v) => (
                  <tr key={v.id}>
                    <Td>{v.name}</Td>
                    <Td>{EGP(v.price)}</Td>
                    <Td><Icon name="delete" className="text-[18px] text-error" /></Td>
                  </tr>
                ))}
              </Table>
            </Card>

            <Card className="p-md">
              <SectionTitle title="الإضافات" icon="add_circle" action={<Button variant="outline" icon="add" className="!px-3 !py-1.5">إضافة</Button>} />
              <Table head={["الاسم", "السعر", ""]}>
                {product.addons.map((a) => (
                  <tr key={a.id}>
                    <Td>{a.name}</Td>
                    <Td>{EGP(a.price)}</Td>
                    <Td><Icon name="delete" className="text-[18px] text-error" /></Td>
                  </tr>
                ))}
              </Table>
            </Card>
          </div>

          <div className="flex flex-col gap-md">
            <Card className="p-md">
              <SectionTitle title="المخزون لكل فرع" icon="inventory_2" />
              <div className="flex flex-col gap-2">
                {branches.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-button border border-outline-variant p-2">
                    <span className="font-label-lg text-label-lg text-on-surface">{b.name}</span>
                    <Badge tone="success">متوفر</Badge>
                  </div>
                ))}
              </div>
              <p className="mt-sm font-label-md text-label-md text-outline">السعر موحد، والمخزون يُدار من صفحة "مخزون الفروع".</p>
            </Card>
            <div className="flex gap-2">
              <Button className="flex-1">حفظ التعديلات</Button>
              <Button variant="ghost" className="flex-1">إلغاء</Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
