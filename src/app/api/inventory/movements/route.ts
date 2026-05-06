import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/authorize";
import { USER_ROLES } from "@/lib/roles";
import Product from "@/models/Product";
import StockMovement from "@/models/StockMovement";
import "@/models/Category";
import "@/models/Supplier";

const createMovementSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  movementType: z.enum([
    "STOCK_IN",
    "STOCK_OUT",
    "RETURN",
    "ADJUSTMENT",
    "DAMAGED",
  ]),
  quantity: z.coerce.number().min(1, "Quantity must be greater than 0"),
  reason: z.string().optional(),
  referenceType: z
    .enum(["ORDER", "SUPPLIER", "MANUAL", "RETURN", "DAMAGE"])
    .optional(),
  batchNumber: z.string().optional(),
});

function calculateNewStock({
  previousStock,
  movementType,
  quantity,
}: {
  previousStock: number;
  movementType: string;
  quantity: number;
}) {
  switch (movementType) {
    case "STOCK_IN":
    case "RETURN":
      return previousStock + quantity;

    case "STOCK_OUT":
    case "DAMAGED":
      return previousStock - quantity;

    case "ADJUSTMENT":
      return quantity;

    default:
      return previousStock;
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireRole([
    USER_ROLES.ADMIN,
    USER_ROLES.INVENTORY_MANAGER,
  ]);

  if (auth.error) {
    return auth.error;
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") || "";

    const filter: Record<string, unknown> = {};

    if (productId) {
      filter.productId = productId;
    }

    const movements = await StockMovement.find(filter)
      .populate("productId", "name sku")
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json(
      {
        success: true,
        message: "Stock movements loaded successfully",
        data: movements,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get stock movements error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load stock movements",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole([
    USER_ROLES.ADMIN,
    USER_ROLES.INVENTORY_MANAGER,
  ]);

  if (auth.error) {
    return auth.error;
  }

  const session = await mongoose.startSession();

  try {
    await connectDB();

    const body = await request.json();
    const validatedData = createMovementSchema.parse(body);

    session.startTransaction();

    const product = await Product.findOne({
      _id: validatedData.productId,
      isDeleted: false,
    }).session(session);

    if (!product) {
      await session.abortTransaction();

      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 },
      );
    }

    const previousStock = product.stockQuantity;
    const newStock = calculateNewStock({
      previousStock,
      movementType: validatedData.movementType,
      quantity: validatedData.quantity,
    });

    if (newStock < 0) {
      await session.abortTransaction();

      return NextResponse.json(
        {
          success: false,
          message: "Stock cannot be less than zero",
        },
        { status: 400 },
      );
    }

    product.stockQuantity = newStock;

    if (validatedData.batchNumber !== undefined) {
      product.batchNumber = validatedData.batchNumber.trim();
    }

    product.updatedBy = auth.user?.userId;

    await product.save({ session });

    const movement = await StockMovement.create(
      [
        {
          productId: product._id,
          movementType: validatedData.movementType,
          quantity: validatedData.quantity,
          previousStock,
          newStock,
          reason: validatedData.reason?.trim() || "",
          referenceType:
            validatedData.referenceType ||
            (validatedData.movementType === "DAMAGED" ? "DAMAGE" : "MANUAL"),
          batchNumber: validatedData.batchNumber?.trim() || product.batchNumber,
          createdBy: auth.user?.userId,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    const populatedMovement = await StockMovement.findById(movement[0]._id)
      .populate("productId", "name sku")
      .populate("createdBy", "fullName email");

    return NextResponse.json(
      {
        success: true,
        message: "Stock movement recorded successfully",
        data: populatedMovement,
      },
      { status: 201 },
    );
  } catch (error) {
    await session.abortTransaction();

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message || "Invalid stock movement data",
          errors: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Create stock movement error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to record stock movement",
      },
      { status: 500 },
    );
  } finally {
    session.endSession();
  }
}
