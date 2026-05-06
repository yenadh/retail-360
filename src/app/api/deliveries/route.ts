import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/authorize";
import { USER_ROLES } from "@/lib/roles";

import { buildDeliveryCreatedEmail } from "@/lib/email-templates/deliveryCreatedEmail";
import Delivery from "@/models/Delivery";
import Order from "@/models/Order";
import "@/models/User";
import "@/models/Product";
import { sendMail } from "@/lib/sendMail";

const createDeliverySchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  deliveryStaffId: z.string().optional().nullable(),
  estimatedDeliveryDate: z.string().optional(),
  deliveryNotes: z.string().optional(),
});

function generateTrackingNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = Math.floor(100000 + Math.random() * 900000);

  return `TRK-${datePart}-${randomPart}`;
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const filter: Record<string, unknown> = {
      isDeleted: false,
    };

    if (status) {
      filter.deliveryStatus = status;
    }

    if (auth.user?.role === USER_ROLES.DELIVERY_STAFF) {
      filter.deliveryStaffId = auth.user.userId;
    }

    if (search) {
      filter.$or = [
        { trackingNumber: { $regex: search, $options: "i" } },
        { "deliveryAddress.fullName": { $regex: search, $options: "i" } },
        { "deliveryAddress.phone": { $regex: search, $options: "i" } },
        { "deliveryAddress.city": { $regex: search, $options: "i" } },
      ];
    }

    const deliveries = await Delivery.find(filter)
      .populate("orderId", "orderNumber totalAmount orderStatus paymentStatus")
      .populate("customerId", "fullName email")
      .populate("deliveryStaffId", "fullName email")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        message: "Deliveries loaded successfully",
        data: deliveries,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get deliveries error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load deliveries",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole([USER_ROLES.ADMIN, USER_ROLES.SALES_STAFF]);

  if (auth.error) {
    return auth.error;
  }

  try {
    await connectDB();

    const body = await request.json();
    const validatedData = createDeliverySchema.parse(body);

    const order = await Order.findOne({
      _id: validatedData.orderId,
      isDeleted: false,
    }).populate("customerId", "fullName email");

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 },
      );
    }

    const existingDelivery = await Delivery.findOne({
      orderId: order._id,
      isDeleted: false,
    });

    if (existingDelivery) {
      return NextResponse.json(
        {
          success: false,
          message: "A delivery record already exists for this order",
        },
        { status: 409 },
      );
    }

    const trackingNumber = generateTrackingNumber();

    const delivery = await Delivery.create({
      orderId: order._id,
      customerId: order.customerId,
      deliveryStaffId: validatedData.deliveryStaffId || null,
      trackingNumber,
      deliveryStatus: "PENDING",
      deliveryAddress: {
        fullName: order.shippingAddress.fullName,
        phone: order.shippingAddress.phone,
        address: order.shippingAddress.address,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode || "",
        country: order.shippingAddress.country || "",
      },
      estimatedDeliveryDate: validatedData.estimatedDeliveryDate
        ? new Date(validatedData.estimatedDeliveryDate)
        : null,
      deliveryNotes: validatedData.deliveryNotes?.trim() || "",
      createdBy: auth.user?.userId,
    });

    order.orderStatus = "PACKED";
    order.updatedBy = auth.user?.userId;

    if (!order.packedAt) {
      order.packedAt = new Date();
    }

    await order.save();

    const populatedDelivery = await Delivery.findById(delivery._id)
      .populate("orderId", "orderNumber totalAmount orderStatus paymentStatus")
      .populate("customerId", "fullName email")
      .populate("deliveryStaffId", "fullName email");

    try {
      const customer = populatedDelivery?.customerId as {
        fullName?: string;
        email?: string;
      };

      const populatedOrder = populatedDelivery?.orderId as {
        orderNumber?: string;
      };

      if (customer?.email) {
        const emailContent = buildDeliveryCreatedEmail({
          customerName: customer.fullName || "Customer",
          orderNumber: populatedOrder?.orderNumber,
          trackingNumber: delivery.trackingNumber,
          estimatedDeliveryDate: delivery.estimatedDeliveryDate,
          deliveryAddress: delivery.deliveryAddress,
        });

        await sendMail({
          to: customer.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
      } else {
        console.warn(
          "Delivery email skipped: customer email not found",
          delivery._id,
        );
      }
    } catch (emailError) {
      console.error(
        "Delivery created but email notification failed:",
        emailError,
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Delivery created successfully",
        data: populatedDelivery,
      },
      { status: 201 },
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

    console.error("Create delivery error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create delivery",
      },
      { status: 500 },
    );
  }
}
