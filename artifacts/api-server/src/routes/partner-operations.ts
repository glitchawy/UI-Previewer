import { Router, type Request, type Response } from "express";
import { and, asc, count, desc, eq, gte, inArray, sql, sum } from "drizzle-orm";
import {
  branchInventoryTable,
  branchesTable,
  db,
  inventoryAdjustmentsTable,
  orderItemsTable,
  orderReviewsTable,
  ordersTable,
  productsTable,
  restaurantsTable,
  restaurantSettlementsTable,
  reviewResponsesTable,
  usersTable,
} from "@workspace/db";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use("/partner/operations", requireAuth, requireRole("partner"));

const positiveId = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};
const pagination = (query: Record<string, unknown>) => {
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? 20);
  return Number.isInteger(page) && page > 0 && Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 50
    ? { page, pageSize, offset: (page - 1) * pageSize }
    : null;
};
const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const money = (value: string | null | undefined) => Number(value ?? 0);

async function ownedRestaurant(req: Request) {
  const [restaurant] = await db.select().from(restaurantsTable)
    .where(eq(restaurantsTable.ownerUserId, req.authUser!.id)).limit(1);
  return restaurant ?? null;
}

router.get("/partner/operations/analytics", async (req, res: Response): Promise<void> => {
  const restaurant = await ownedRestaurant(req);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }
  const days = Number(req.query.days ?? 7);
  if (![7, 30, 90].includes(days)) { res.status(400).json({ error: "الفترة غير صحيحة" }); return; }
  const from = new Date(Date.now() - (days - 1) * 86_400_000);
  from.setUTCHours(0, 0, 0, 0);
  const where = and(eq(ordersTable.restaurantId, restaurant.id), gte(ordersTable.createdAt, from));
  const delivered = and(where, eq(ordersTable.status, "delivered"));
  const [[summary], series, best, worst, branchPerformance, [customers]] = await Promise.all([
    db.select({
      orders: count(),
      delivered: sql<number>`count(*) filter (where ${ordersTable.status} = 'delivered')`,
      revenue: sql<string>`coalesce(sum(case when ${ordersTable.status} = 'delivered' then ${ordersTable.subtotal} else 0 end), 0)`,
      cancelled: sql<number>`count(*) filter (where ${ordersTable.status} = 'cancelled')`,
    }).from(ordersTable).where(where),
    db.select({
      date: sql<string>`to_char(date_trunc('day', ${ordersTable.createdAt} at time zone 'Africa/Cairo'), 'YYYY-MM-DD')`,
      orders: count(),
      revenue: sum(ordersTable.subtotal),
    }).from(ordersTable).where(delivered).groupBy(sql`date_trunc('day', ${ordersTable.createdAt} at time zone 'Africa/Cairo')`).orderBy(asc(sql`date_trunc('day', ${ordersTable.createdAt} at time zone 'Africa/Cairo')`)),
    db.select({ name: orderItemsTable.productName, orders: sum(orderItemsTable.quantity), revenue: sum(orderItemsTable.lineTotal) })
      .from(orderItemsTable).innerJoin(ordersTable, eq(ordersTable.id, orderItemsTable.orderId)).where(delivered)
      .groupBy(orderItemsTable.productName).orderBy(desc(sum(orderItemsTable.quantity))).limit(5),
    db.select({ name: orderItemsTable.productName, orders: sum(orderItemsTable.quantity), revenue: sum(orderItemsTable.lineTotal) })
      .from(orderItemsTable).innerJoin(ordersTable, eq(ordersTable.id, orderItemsTable.orderId)).where(delivered)
      .groupBy(orderItemsTable.productName).orderBy(asc(sum(orderItemsTable.quantity))).limit(5),
    db.select({ branchId: branchesTable.id, name: branchesTable.name, orders: count(ordersTable.id), revenue: sum(ordersTable.subtotal) })
      .from(branchesTable).leftJoin(ordersTable, and(eq(ordersTable.branchId, branchesTable.id), gte(ordersTable.createdAt, from), eq(ordersTable.status, "delivered")))
      .where(eq(branchesTable.restaurantId, restaurant.id)).groupBy(branchesTable.id, branchesTable.name).orderBy(branchesTable.name).limit(100),
    db.select({
      unique: sql<number>`count(*)`,
      repeat: sql<number>`count(*) filter (where customer_orders > 1)`,
    }).from(sql`(select ${ordersTable.customerId}, count(*) as customer_orders from ${ordersTable} where ${ordersTable.restaurantId} = ${restaurant.id} and ${ordersTable.createdAt} >= ${from} group by ${ordersTable.customerId}) customer_counts`),
  ]);
  const revenue = money(summary?.revenue);
  const orderCount = summary?.orders ?? 0;
  const deliveredCount = Number(summary?.delivered ?? 0);
  res.json({
    days,
    summary: { orders: orderCount, delivered: deliveredCount, revenue, cancelled: Number(summary?.cancelled ?? 0), averageOrderValue: deliveredCount ? revenue / deliveredCount : 0 },
    customers: { unique: Number(customers?.unique ?? 0), repeat: Number(customers?.repeat ?? 0) },
    series: series.map(row => ({ ...row, revenue: money(row.revenue) })),
    bestProducts: best.map(row => ({ ...row, orders: Number(row.orders ?? 0), revenue: money(row.revenue) })),
    worstProducts: worst.map(row => ({ ...row, orders: Number(row.orders ?? 0), revenue: money(row.revenue) })),
    branches: branchPerformance.map(row => ({ ...row, orders: row.orders, revenue: money(row.revenue) })),
  });
});

router.get("/partner/operations/settlements", async (req, res: Response): Promise<void> => {
  const restaurant = await ownedRestaurant(req);
  const page = pagination(req.query);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }
  if (!page) { res.status(400).json({ error: "بيانات الصفحات غير صحيحة" }); return; }
  const [items, [total]] = await Promise.all([
    db.select().from(restaurantSettlementsTable).where(eq(restaurantSettlementsTable.restaurantId, restaurant.id))
      .orderBy(desc(restaurantSettlementsTable.periodEnd), desc(restaurantSettlementsTable.id)).limit(page.pageSize).offset(page.offset),
    db.select({ value: count() }).from(restaurantSettlementsTable).where(eq(restaurantSettlementsTable.restaurantId, restaurant.id)),
  ]);
  res.json({ items, page: page.page, pageSize: page.pageSize, total: total?.value ?? 0 });
});

router.get("/partner/operations/reviews", async (req, res: Response): Promise<void> => {
  const restaurant = await ownedRestaurant(req);
  const page = pagination(req.query);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }
  if (!page) { res.status(400).json({ error: "بيانات الصفحات غير صحيحة" }); return; }
  const ownVisible = and(eq(orderReviewsTable.restaurantId, restaurant.id), eq(orderReviewsTable.moderationStatus, "visible"));
  const [items, [total]] = await Promise.all([
    db.select({
      review: orderReviewsTable,
      customerName: usersTable.name,
      response: reviewResponsesTable.response,
      responseUpdatedAt: reviewResponsesTable.updatedAt,
    }).from(orderReviewsTable)
      .leftJoin(usersTable, eq(usersTable.id, orderReviewsTable.customerId))
      .leftJoin(reviewResponsesTable, eq(reviewResponsesTable.reviewId, orderReviewsTable.id))
      .where(ownVisible).orderBy(desc(orderReviewsTable.createdAt)).limit(page.pageSize).offset(page.offset),
    db.select({ value: count() }).from(orderReviewsTable).where(ownVisible),
  ]);
  res.json({ items, page: page.page, pageSize: page.pageSize, total: total?.value ?? 0 });
});

router.put("/partner/operations/reviews/:id/response", async (req, res: Response): Promise<void> => {
  const restaurant = await ownedRestaurant(req);
  const reviewId = positiveId(req.params.id);
  const response = text(req.body?.response, 1000);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }
  if (!reviewId || response.length < 2) { res.status(400).json({ error: "الرد يجب أن يتكون من حرفين على الأقل" }); return; }
  const [review] = await db.select({ id: orderReviewsTable.id }).from(orderReviewsTable)
    .where(and(eq(orderReviewsTable.id, reviewId), eq(orderReviewsTable.restaurantId, restaurant.id), eq(orderReviewsTable.moderationStatus, "visible"))).limit(1);
  if (!review) { res.status(404).json({ error: "التقييم غير موجود أو غير متاح" }); return; }
  const [row] = await db.insert(reviewResponsesTable).values({
    reviewId, restaurantId: restaurant.id, response, responderUserId: req.authUser!.id,
  }).onConflictDoUpdate({
    target: reviewResponsesTable.reviewId,
    set: { response, responderUserId: req.authUser!.id, updatedAt: new Date() },
  }).returning();
  req.log.info({ restaurantId: restaurant.id, reviewId }, "Restaurant review response saved");
  res.json(row);
});

router.get("/partner/operations/inventory", async (req, res: Response): Promise<void> => {
  const restaurant = await ownedRestaurant(req);
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }
  const [branches, products, inventory] = await Promise.all([
    db.select().from(branchesTable).where(eq(branchesTable.restaurantId, restaurant.id)).orderBy(branchesTable.name).limit(100),
    db.select().from(productsTable).where(eq(productsTable.restaurantId, restaurant.id)).orderBy(productsTable.name).limit(500),
    db.select().from(branchInventoryTable)
      .innerJoin(branchesTable, eq(branchesTable.id, branchInventoryTable.branchId))
      .where(eq(branchesTable.restaurantId, restaurant.id)),
  ]);
  const values = new Map(inventory.map(row => [`${row.branch_inventory.branchId}:${row.branch_inventory.productId}`, row.branch_inventory]));
  res.json({
    branches: branches.map(branch => ({ id: branch.id, name: branch.name })),
    products: products.map(product => ({
      id: product.id, name: product.name, globallyAvailable: product.isAvailable,
      branches: branches.map(branch => {
        const value = values.get(`${branch.id}:${product.id}`);
        return { branchId: branch.id, quantity: value?.quantity ?? 0, isAvailable: value?.isAvailable ?? false };
      }),
    })),
  });
});

router.put("/partner/operations/inventory/:branchId/:productId", async (req, res: Response): Promise<void> => {
  const restaurant = await ownedRestaurant(req);
  const branchId = positiveId(req.params.branchId), productId = positiveId(req.params.productId);
  const quantity = Number(req.body?.quantity), isAvailable = req.body?.isAvailable;
  if (!restaurant) { res.status(404).json({ error: "لم يتم العثور على مطعمك" }); return; }
  if (!branchId || !productId || !Number.isInteger(quantity) || quantity < 0 || quantity > 1_000_000 || typeof isAvailable !== "boolean") {
    res.status(400).json({ error: "بيانات المخزون غير صحيحة" }); return;
  }
  const [[branch], [product]] = await Promise.all([
    db.select({ id: branchesTable.id }).from(branchesTable).where(and(eq(branchesTable.id, branchId), eq(branchesTable.restaurantId, restaurant.id))).limit(1),
    db.select({ id: productsTable.id }).from(productsTable).where(and(eq(productsTable.id, productId), eq(productsTable.restaurantId, restaurant.id))).limit(1),
  ]);
  if (!branch || !product) { res.status(404).json({ error: "الفرع أو المنتج لا يخص مطعمك" }); return; }
  const row = await db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(78242, ${branchId * 1_000_000 + productId})`);
    const [before] = await tx.select().from(branchInventoryTable).where(and(eq(branchInventoryTable.branchId, branchId), eq(branchInventoryTable.productId, productId))).limit(1);
    const [after] = await tx.insert(branchInventoryTable).values({ branchId, productId, quantity, isAvailable, updatedByUserId: req.authUser!.id })
      .onConflictDoUpdate({ target: [branchInventoryTable.branchId, branchInventoryTable.productId], set: { quantity, isAvailable, updatedByUserId: req.authUser!.id, updatedAt: new Date() } }).returning();
    await tx.insert(inventoryAdjustmentsTable).values({
      branchId, productId, actorUserId: req.authUser!.id,
      previousQuantity: before?.quantity ?? 0, newQuantity: quantity,
      previousAvailable: before?.isAvailable ?? false, newAvailable: isAvailable,
    });
    return after;
  });
  req.log.info({ restaurantId: restaurant.id, branchId, productId }, "Branch inventory updated");
  res.json(row);
});

export default router;