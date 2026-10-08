import {redirect} from "next/navigation";
import {getUser} from "../../lib/auth";
import {db} from "../../lib/prisma";
import ProductsBrowser from "../../components/ProductsBrowser";

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
        price: p.price ? Number(p.price) : null,
        currency: p.currency,
        imageUrl: p.imageUrl,
        priceLabel: p.priceLabel,
        downPayment: p.downPayment ? Number(p.downPayment) : null,
        modelYear: p.modelYear,
        trim: p.trim,
        exteriorColor: p.exteriorColor,
        interiorColor: p.interiorColor,
        drivetrain: p.drivetrain,
        rangeMiles: p.rangeMiles,
        availableColors: p.exteriorColor ? [p.exteriorColor] : [],
        stockQuantity: p.stockQuantity,
      }))}
    />
  );
}