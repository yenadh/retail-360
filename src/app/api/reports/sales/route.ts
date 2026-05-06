// src/app/api/reports/sales/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/authorize";
import { USER_ROLES } from "@/lib/roles";
import Order from "@/models/Order";
import "@/models/User";
import "@/models/Product";

function getDateRange(range: string) {
  const end = new Date();
  const start = new Date();

  if (range === "7d") {
    start.setDate(end.getDate() - 7);
  } else if (range === "30d") {
    start.setDate(end.getDate() - 30);
  } else if (range === "90d") {
    start.setDate(end.getDate() - 90);
  } else {
    start.setDate(end.getDate() - 30);
  }

  return { start, end };
}

export async function GET(request: NextRequest) {
  const auth = await requireRole([USER_ROLES.ADMIN, USER_ROLES.SALES_STAFF]);

  if (auth.error) {
    return auth.error;
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";

    const { start, end } = getDateRange(range);

    const orders = await Order.find({
      isDeleted: false,
      createdAt: {
        $gte: start,
        $lte: end,
      },
    }).sort({ createdAt: 1 });

    const paidOrders = orders.filter((order) => order.paymentStatus === "PAID");

    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );

    const totalOrders = orders.length;

    const averageOrderValue =
      paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    const salesByDayMap = new Map<
      string,
      {
        date: string;
        revenue: number;
        orders: number;
      }
    >();

    for (const order of orders) {
      const date = new Date(order.createdAt).toISOString().slice(0, 10);

      const current = salesByDayMap.get(date) || {
        date,
        revenue: 0,
        orders: 0,
      };

      current.orders += 1;

      if (order.paymentStatus === "PAID") {
        current.revenue += order.totalAmount;
      }

      salesByDayMap.set(date, current);
    }

    const salesByDay = Array.from(salesByDayMap.values());

    const orderStatusBreakdown = {
      pending: orders.filter((order) => order.orderStatus === "PENDING").length,
      confirmed: orders.filter((order) => order.orderStatus === "CONFIRMED")
        .length,
      processing: orders.filter((order) => order.orderStatus === "PROCESSING")
        .length,
      packed: orders.filter((order) => order.orderStatus === "PACKED").length,
      dispatched: orders.filter((order) => order.orderStatus === "DISPATCHED")
        .length,
      delivered: orders.filter((order) => order.orderStatus === "DELIVERED")
        .length,
      cancelled: orders.filter((order) => order.orderStatus === "CANCELLED")
        .length,
      returned: orders.filter((order) => order.orderStatus === "RETURNED")
        .length,
    };

    const paymentStatusBreakdown = {
      pending: orders.filter((order) => order.paymentStatus === "PENDING")
        .length,
      paid: orders.filter((order) => order.paymentStatus === "PAID").length,
      failed: orders.filter((order) => order.paymentStatus === "FAILED").length,
      refunded: orders.filter((order) => order.paymentStatus === "REFUNDED")
        .length,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Sales report loaded successfully",
        data: {
          range,
          totalRevenue,
          totalOrders,
          paidOrders: paidOrders.length,
          averageOrderValue,
          salesByDay,
          orderStatusBreakdown,
          paymentStatusBreakdown,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get sales report error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load sales report",
      },
      { status: 500 },
    );
  }
}
