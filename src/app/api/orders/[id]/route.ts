import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromCookies } from "@/lib/auth";
import { requireRole } from "@/lib/authorize";
import { USER_ROLES } from "@/lib/roles";
import { buildOrderStatusUpdatedEmail } from "@/lib/email-templates/orderStatusUpdatedEmail";
import Order from "@/models/Order";
import "@/models/User";
import "@/models/Product";
import { sendMail } from "@/lib/sendMail";

const updateOrderSchema = z.object({
  orderStatus: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "PACKED",
      "DISPATCHED",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
    ])
    .optional(),

  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),

  notes: z.string().optional(),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

function getStatusTimestampField(status: string) {
  const map: Record<string, string> = {
    CONFIRMED: "confirmedAt",
    PROCESSING: "processedAt",
    PACKED: "packedAt",
    DISPATCHED: "dispatchedAt",
    DELIVERED: "deliveredAt",
    CANCELLED: "cancelledAt",
  };

  return map[status];
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authUser = await getAuthUserFromCookies();

  if (!authUser) {
    return NextResponse.json(
      {
        success: false,
        message: "Authentication required",
      },
      { status: 401 },
    );
  }

  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order id",
        },
        { status: 400 },
      );
    }

    const filter: Record<string, unknown> = {
      _id: id,
      isDeleted: false,
    };

    if (authUser.role === USER_ROLES.CUSTOMER) {
      filter.customerId = authUser.userId;
    }

    const order = await Order.findOne(filter)
      .populate("customerId", "fullName email")
      .populate("items.productId", "name sku images");

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order loaded successfully",
        data: order,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get order by id error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load order",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole([USER_ROLES.ADMIN, USER_ROLES.SALES_STAFF]);

  if (auth.error) {
    return auth.error;
  }

  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order id",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = updateOrderSchema.parse(body);

    const order = await Order.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 },
      );
    }

    const previousOrderStatus = order.orderStatus;
    const previousPaymentStatus = order.paymentStatus;

    let shouldSendOrderUpdateEmail = false;

    if (validatedData.orderStatus !== undefined) {
      order.orderStatus = validatedData.orderStatus;

      if (previousOrderStatus !== validatedData.orderStatus) {
        shouldSendOrderUpdateEmail = true;
      }

      const field = getStatusTimestampField(validatedData.orderStatus);

      if (field && !order.get(field)) {
        order.set(field, new Date());
      }
    }

    if (validatedData.paymentStatus !== undefined) {
      order.paymentStatus = validatedData.paymentStatus;

      if (previousPaymentStatus !== validatedData.paymentStatus) {
        shouldSendOrderUpdateEmail = true;
      }
    }

    if (validatedData.notes !== undefined) {
      order.notes = validatedData.notes.trim();
    }

    order.updatedBy = auth.user?.userId;

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("customerId", "fullName email")
      .populate("items.productId", "name sku images");

    /**
     * Send customer order update email.
     * Email errors are logged but do not fail order update.
     */
    if (shouldSendOrderUpdateEmail && populatedOrder) {
      try {
        const customer = populatedOrder.customerId as {
          fullName?: string;
          email?: string;
        };

        if (customer?.email) {
          const emailContent = buildOrderStatusUpdatedEmail({
            customerName: customer.fullName || "Customer",
            orderNumber: populatedOrder.orderNumber,
            orderStatus: populatedOrder.orderStatus,
            paymentStatus: populatedOrder.paymentStatus,
            totalAmount: populatedOrder.totalAmount,
          });

          await sendMail({
            to: customer.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          });
        } else {
          console.warn(
            "Order update email skipped: customer email not found",
            populatedOrder._id,
          );
        }
      } catch (emailError) {
        console.error(
          "Order updated but email notification failed:",
          emailError,
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order updated successfully",
        data: populatedOrder,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message || "Invalid order data",
          errors: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Update order error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update order",
      },
      { status: 500 },
    );
  }
}
