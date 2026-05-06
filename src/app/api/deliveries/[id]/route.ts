import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/authorize";
import { USER_ROLES } from "@/lib/roles";
import { buildDeliveryStatusUpdatedEmail } from "@/lib/email-templates/deliveryStatusUpdatedEmail";
import Delivery from "@/models/Delivery";
import Order from "@/models/Order";
import "@/models/User";
import { sendEmail } from "@/lib/sendMail";

const updateDeliverySchema = z.object({
  deliveryStaffId: z.string().optional().nullable(),

  deliveryStatus: z
    .enum([
      "PENDING",
      "READY_FOR_DISPATCH",
      "DISPATCHED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "FAILED",
      "RETURNED",
    ])
    .optional(),

  estimatedDeliveryDate: z.string().optional(),
  deliveryNotes: z.string().optional(),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

function getDeliveryStatusTimestampField(status: string) {
  const map: Record<string, string> = {
    DISPATCHED: "dispatchedAt",
    OUT_FOR_DELIVERY: "outForDeliveryAt",
    DELIVERED: "deliveredAt",
    FAILED: "failedAt",
    RETURNED: "returnedAt",
  };

  return map[status];
}

function getOrderStatusFromDeliveryStatus(status: string) {
  const map: Record<string, string> = {
    PENDING: "PACKED",
    READY_FOR_DISPATCH: "PACKED",
    DISPATCHED: "DISPATCHED",
    OUT_FOR_DELIVERY: "DISPATCHED",
    DELIVERED: "DELIVERED",
    FAILED: "DISPATCHED",
    RETURNED: "RETURNED",
  };

  return map[status];
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole([
    USER_ROLES.ADMIN,
    USER_ROLES.SALES_STAFF,
    USER_ROLES.DELIVERY_STAFF,
  ]);

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
          message: "Invalid delivery id",
        },
        { status: 400 },
      );
    }

    const filter: Record<string, unknown> = {
      _id: id,
      isDeleted: false,
    };

    if (auth.user?.role === USER_ROLES.DELIVERY_STAFF) {
      filter.deliveryStaffId = auth.user.userId;
    }

    const delivery = await Delivery.findOne(filter)
      .populate("orderId", "orderNumber totalAmount orderStatus paymentStatus")
      .populate("customerId", "fullName email")
      .populate("deliveryStaffId", "fullName email");

    if (!delivery) {
      return NextResponse.json(
        {
          success: false,
          message: "Delivery not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Delivery loaded successfully",
        data: delivery,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get delivery by id error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load delivery",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole([
    USER_ROLES.ADMIN,
    USER_ROLES.SALES_STAFF,
    USER_ROLES.DELIVERY_STAFF,
  ]);

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
          message: "Invalid delivery id",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = updateDeliverySchema.parse(body);

    const filter: Record<string, unknown> = {
      _id: id,
      isDeleted: false,
    };

    if (auth.user?.role === USER_ROLES.DELIVERY_STAFF) {
      filter.deliveryStaffId = auth.user.userId;
    }

    const delivery = await Delivery.findOne(filter);

    if (!delivery) {
      return NextResponse.json(
        {
          success: false,
          message: "Delivery not found",
        },
        { status: 404 },
      );
    }

    const previousDeliveryStatus = delivery.deliveryStatus;
    let shouldSendStatusEmail = false;

    if (
      validatedData.deliveryStaffId !== undefined &&
      auth.user?.role !== USER_ROLES.DELIVERY_STAFF
    ) {
      delivery.deliveryStaffId = validatedData.deliveryStaffId || null;
    }

    if (validatedData.estimatedDeliveryDate !== undefined) {
      delivery.estimatedDeliveryDate = validatedData.estimatedDeliveryDate
        ? new Date(validatedData.estimatedDeliveryDate)
        : null;
    }

    if (validatedData.deliveryNotes !== undefined) {
      delivery.deliveryNotes = validatedData.deliveryNotes.trim();
    }

    if (validatedData.deliveryStatus !== undefined) {
      delivery.deliveryStatus = validatedData.deliveryStatus;

      if (previousDeliveryStatus !== validatedData.deliveryStatus) {
        shouldSendStatusEmail = true;
      }

      const deliveryField = getDeliveryStatusTimestampField(
        validatedData.deliveryStatus,
      );

      if (deliveryField && !delivery.get(deliveryField)) {
        delivery.set(deliveryField, new Date());
      }

      const mappedOrderStatus = getOrderStatusFromDeliveryStatus(
        validatedData.deliveryStatus,
      );

      if (mappedOrderStatus) {
        const order = await Order.findById(delivery.orderId);

        if (order) {
          order.orderStatus = mappedOrderStatus;
          order.updatedBy = auth.user?.userId;

          if (mappedOrderStatus === "DISPATCHED" && !order.dispatchedAt) {
            order.dispatchedAt = new Date();
          }

          if (mappedOrderStatus === "DELIVERED" && !order.deliveredAt) {
            order.deliveredAt = new Date();
          }

          await order.save();
        }
      }
    }

    delivery.updatedBy = auth.user?.userId;

    await delivery.save();

    const populatedDelivery = await Delivery.findById(delivery._id)
      .populate("orderId", "orderNumber totalAmount orderStatus paymentStatus")
      .populate("customerId", "fullName email")
      .populate("deliveryStaffId", "fullName email");

    if (shouldSendStatusEmail && populatedDelivery) {
      try {
        const customer = populatedDelivery.customerId as {
          fullName?: string;
          email?: string;
        };

        const populatedOrder = populatedDelivery.orderId as {
          orderNumber?: string;
        };

        if (customer?.email) {
          const emailContent = buildDeliveryStatusUpdatedEmail({
            customerName: customer.fullName || "Customer",
            orderNumber: populatedOrder?.orderNumber,
            trackingNumber: populatedDelivery.trackingNumber,
            deliveryStatus: populatedDelivery.deliveryStatus,
            estimatedDeliveryDate: populatedDelivery.estimatedDeliveryDate,
            deliveryAddress: populatedDelivery.deliveryAddress,
          });

          await sendEmail({
            to: customer.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          });
        } else {
          console.warn(
            "Delivery status email skipped: customer email not found",
            populatedDelivery._id,
          );
        }
      } catch (emailError) {
        console.error(
          "Delivery updated but status email notification failed:",
          emailError,
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Delivery updated successfully",
        data: populatedDelivery,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message || "Invalid delivery data",
          errors: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Update delivery error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update delivery",
      },
      { status: 500 },
    );
  }
}
