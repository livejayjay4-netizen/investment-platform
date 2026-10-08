import {redirect} from "next/navigation";
import {getUser} from "../../lib/auth";
import {db} from "../../lib/prisma";
import ProductsBrowser from "../../components/ProductsBrowser";
import {VERIFIED_TESLA} from "../../lib/tesla-catalog";

export default async function ProductsPage() {
  if (!(await getUser())) redirect("/login");

  const products = await db.product.findMany({
    where: {
      active: true,
      brand: "Tesla",
      stockQuantity: { gt: 0 },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  return (
    <ProductsBrowser
      title="Tesla Vehicle Inventory"
      subtitle="Browse Tesla vehicles by model, color and configuration, then start a purchase request."
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        description: p.description,
        price: VERIFIED_TESLA[p.slug]?.price ?? (p.price ? Number(p.price) : null),
        currency: p.currency,
        imageUrl: p.imageUrl,
        priceLabel: VERIFIED_TESLA[p.slug]?.price ? `${VERIFIED_TESLA[p.slug].price.toLocaleString()}` : p.priceLabel,
        downPayment: VERIFIED_TESLA[p.slug]?.downPayment ?? (p.downPayment ? Number(p.downPayment) : null),
        modelYear: VERIFIED_TESLA[p.slug]?.modelYear ?? p.modelYear,
        trim: VERIFIED_TESLA[p.slug]?.trim ?? p.trim,
        exteriorColor: VERIFIED_TESLA[p.slug]?.exteriorColor ?? p.exteriorColor,
        interiorColor: VERIFIED_TESLA[p.slug]?.interiorColor ?? p.interiorColor,
        drivetrain: VERIFIED_TESLA[p.slug]?.drivetrain ?? p.drivetrain,
        rangeMiles: VERIFIED_TESLA[p.slug]?.rangeMiles ?? p.rangeMiles,
        availableColors: VERIFIED_TESLA[p.slug]?.availableColors ?? (p.exteriorColor ? [p.exteriorColor] : []),
        stockQuantity: p.stockQuantity,
      }))}
    />
  );
}