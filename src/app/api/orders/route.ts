import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromCookies } from "@/lib/auth";
import { USER_ROLES } from "@/lib/roles";
import { buildOrderCreatedEmail } from "@/lib/email-templates/orderCreatedEmail";
import Order from "@/models/Order";
import Product from "@/models/Product";
import StockMovement from "@/models/StockMovement";
import "@/models/User";
import "@/models/Category";
import { sendMail } from "@/lib/sendMail";

const orderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().min(1, "Quantity must be greater than 0"),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "At least one item is required"),

  shippingAddress: z.object({
    fullName: z.string().min(2, "Full name is required"),
    phone: z.string().min(5, "Phone number is required"),
    address: z.string().min(3, "Address is required"),
    city: z.string().min(2, "City is required"),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }),

  deliveryFee: z.coerce.number().min(0).optional(),
  discountAmount: z.coerce.number().min(0).optional(),

  paymentMethod: z
    .enum(["CARD", "BANK_TRANSFER", "CASH_ON_DELIVERY", "MOCK_PAYMENT"])
    .optional(),

  notes: z.string().optional(),
});

function generateOrderNumber() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = Math.floor(100000 + Math.random() * 900000);

  return `ORD-${datePart}-${randomPart}`;
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";

    const filter: Record<string, unknown> = {
      isDeleted: false,
    };

    if (authUser.role === USER_ROLES.CUSTOMER) {
      filter.customerId = authUser.userId;
    }

    if (status) {
      filter.orderStatus = status;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "shippingAddress.fullName": { $regex: search, $options: "i" } },
        { "shippingAddress.phone": { $regex: search, $options: "i" } },
      ];
    }

    const orders = await Order.find(filter)
      .populate("customerId", "fullName email")
      .populate("items.productId", "name sku images")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        message: "Orders loaded successfully",
        data: orders,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get orders error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load orders",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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

  await connectDB();

  const session = await mongoose.startSession();

  try {
    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    session.startTransaction();

    const orderItems = [];
    let subtotal = 0;

    for (const item of validatedData.items) {
      const product = await Product.findOne({
        _id: item.productId,
        isDeleted: false,
        isActive: true,
      }).session(session);

      if (!product) {
        await session.abortTransaction();

        return NextResponse.json(
          {
            success: false,
            message: "One or more products were not found",
          },
          { status: 404 },
        );
      }

      if (product.stockQuantity < item.quantity) {
        await session.abortTransaction();

        return NextResponse.json(
          {
            success: false,
            message: `${product.name} does not have enough stock`,
          },
          { status: 400 },
        );
      }

      const unitPrice =
        product.discountPrice > 0 ? product.discountPrice : product.price;

      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      const previousStock = product.stockQuantity;
      const newStock = previousStock - item.quantity;

      product.stockQuantity = newStock;
      product.updatedBy = authUser.userId;

      await product.save({ session });

      orderItems.push({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });

      await StockMovement.create(
        [
          {
            productId: product._id,
            movementType: "SALE",
            quantity: item.quantity,
            previousStock,
            newStock,
            reason: "Stock reduced after customer order",
            referenceType: "ORDER",
            batchNumber: product.batchNumber || "",
            createdBy: authUser.userId,
          },
        ],
        { session },
      );
    }

    const deliveryFee = validatedData.deliveryFee || 0;
    const discountAmount = validatedData.discountAmount || 0;
    const totalAmount = subtotal + deliveryFee - discountAmount;

    const paymentMethod = validatedData.paymentMethod || "MOCK_PAYMENT";

    const orderNumber = generateOrderNumber();

    const order = await Order.create(
      [
        {
          orderNumber,
          customerId: authUser.userId,
          items: orderItems,
          shippingAddress: {
            fullName: validatedData.shippingAddress.fullName.trim(),
            phone: validatedData.shippingAddress.phone.trim(),
            address: validatedData.shippingAddress.address.trim(),
            city: validatedData.shippingAddress.city.trim(),
            postalCode: validatedData.shippingAddress.postalCode?.trim() || "",
            country: validatedData.shippingAddress.country?.trim() || "",
          },
          subtotal,
          deliveryFee,
          discountAmount,
          totalAmount,
          orderStatus: "PENDING",
          paymentStatus:
            paymentMethod === "CASH_ON_DELIVERY" ? "PENDING" : "PAID",
          paymentMethod,
          notes: validatedData.notes?.trim() || "",
          createdBy: authUser.userId,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    const populatedOrder = await Order.findById(order[0]._id)
      .populate("customerId", "fullName email")
      .populate("items.productId", "name sku images");

    /**
     * Send customer order confirmation email.
     * Email errors are logged but do not fail order creation.
     */
    try {
      const customer = populatedOrder?.customerId as {
        fullName?: string;
        email?: string;
      };

      if (customer?.email && populatedOrder) {
        const emailContent = buildOrderCreatedEmail({
          customerName: customer.fullName || "Customer",
          orderNumber: populatedOrder.orderNumber,
          items: populatedOrder.items.map(
            (item: {
              productName: string;
              sku?: string;
              quantity: number;
              unitPrice: number;
              totalPrice: number;
            }) => ({
              productName: item.productName,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            }),
          ),
          shippingAddress: populatedOrder.shippingAddress,
          subtotal: populatedOrder.subtotal,
          deliveryFee: populatedOrder.deliveryFee,
          discountAmount: populatedOrder.discountAmount,
          totalAmount: populatedOrder.totalAmount,
          paymentStatus: populatedOrder.paymentStatus,
          paymentMethod: populatedOrder.paymentMethod,
        });

        await sendMail({
          to: customer.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
      } else {
        console.warn(
          "Order confirmation email skipped: customer email not found",
          order[0]._id,
        );
      }
    } catch (emailError) {
      console.error(
        "Order created but confirmation email notification failed:",
        emailError,
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",
        data: populatedOrder,
      },
      { status: 201 },
    );
  } catch (error) {
    await session.abortTransaction();

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

    console.error("Create order error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create order",
      },
      { status: 500 },
    );
  } finally {
    session.endSession();
  }
}
