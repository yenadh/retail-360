import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/authorize";
import { USER_ROLES } from "@/lib/roles";
import Supplier from "@/models/Supplier";

const supplierSchema = z.object({
  name: z.string().min(2, "Supplier name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  isActive: z.boolean().optional(),
});

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

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const filter: Record<string, unknown> = {
      isDeleted: false,
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
      ];
    }

    if (status === "active") {
      filter.isActive = true;
    }

    if (status === "inactive") {
      filter.isActive = false;
    }

    const suppliers = await Supplier.find(filter).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        message: "Suppliers loaded successfully",
        data: suppliers,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get suppliers error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load suppliers",
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

  try {
    await connectDB();

    const body = await request.json();
    const validatedData = supplierSchema.parse(body);

    const existingSupplier = await Supplier.findOne({
      name: {
        $regex: `^${validatedData.name.trim()}$`,
        $options: "i",
      },
      isDeleted: false,
    });

    if (existingSupplier) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier name already exists",
        },
        { status: 409 },
      );
    }

    const supplier = await Supplier.create({
      name: validatedData.name.trim(),
      contactPerson: validatedData.contactPerson?.trim() || "",
      email: validatedData.email?.toLowerCase().trim() || "",
      phone: validatedData.phone?.trim() || "",
      address: validatedData.address?.trim() || "",
      city: validatedData.city?.trim() || "",
      country: validatedData.country?.trim() || "",
      isActive: validatedData.isActive ?? true,
      createdBy: auth.user?.userId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Supplier created successfully",
        data: supplier,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message || "Invalid supplier data",
          errors: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Create supplier error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create supplier",
      },
      { status: 500 },
    );
  }
}
