import { requireAdmin, AuthError } from "@repo/auth";
import { prisma } from "@repo/db/client";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    await requireAdmin();

    const [purchases, paidOrders] = await Promise.all([
      prisma.userPurchases.findMany({
        include: {
          user: { select: { name: true, email: true } },
          course: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.paymentOrder.findMany({
        where: { status: "PAID" },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    // Most recent PAID order per (userId, courseId) — free-course enrollments
    // simply won't have a matching order, which is fine.
    const orderByPurchase = new Map<string, (typeof paidOrders)[number]>();
    for (const order of paidOrders) {
      const key = `${order.userId}:${order.courseId}`;
      if (!orderByPurchase.has(key)) orderByPurchase.set(key, order);
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Students");

    sheet.columns = [
      { header: "Student Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Course", key: "course", width: 30 },
      { header: "Amount Paid (₹)", key: "amount", width: 16 },
      { header: "Razorpay Order ID", key: "orderId", width: 24 },
      { header: "Razorpay Payment ID", key: "paymentId", width: 24 },
      { header: "Purchased At", key: "purchasedAt", width: 20 },
    ];
    sheet.getRow(1).font = { bold: true };

    for (const purchase of purchases) {
      const order = orderByPurchase.get(`${purchase.userId}:${purchase.courseId}`);
      sheet.addRow({
        name: purchase.user.name ?? "—",
        email: purchase.user.email ?? "—",
        course: purchase.course.title,
        amount: order?.amount ?? 0,
        orderId: order?.razorpayOrderId ?? "(free enrollment)",
        paymentId: order?.razorpayPaymentId ?? "—",
        purchasedAt: purchase.createdAt.toISOString().slice(0, 10),
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="students-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[export-students]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
