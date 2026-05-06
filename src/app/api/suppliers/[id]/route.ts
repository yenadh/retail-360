import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/authorize";
import { USER_ROLES } from "@/lib/roles";
import Supplier from "@/models/Supplier";

const updateSupplierSchema = z.object({
  name: z.string().min(2, "Supplier name is required").optional(),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  isActive: z.boolean().optional(),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole([
    USER_ROLES.ADMIN,
    USER_ROLES.INVENTORY_MANAGER,
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
          message: "Invalid supplier id",
        },
        { status: 400 },
      );
    }

    const supplier = await Supplier.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Supplier loaded successfully",
        data: supplier,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get supplier by id error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load supplier",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole([
    USER_ROLES.ADMIN,
    USER_ROLES.INVENTORY_MANAGER,
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
          message: "Invalid supplier id",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = updateSupplierSchema.parse(body);

    const supplier = await Supplier.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier not found",
        },
        { status: 404 },
      );
    }

    if (validatedData.name) {
      const existingSupplier = await Supplier.findOne({
        _id: { $ne: id },
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

      supplier.name = validatedData.name.trim();
    }

    if (validatedData.contactPerson !== undefined) {
      supplier.contactPerson = validatedData.contactPerson.trim();
    }

    if (validatedData.email !== undefined) {
      supplier.email = validatedData.email.toLowerCase().trim();
    }

    if (validatedData.phone !== undefined) {
      supplier.phone = validatedData.phone.trim();
    }

    if (validatedData.address !== undefined) {
      supplier.address = validatedData.address.trim();
    }

    if (validatedData.city !== undefined) {
      supplier.city = validatedData.city.trim();
    }

    if (validatedData.country !== undefined) {
      supplier.country = validatedData.country.trim();
    }

    if (validatedData.isActive !== undefined) {
      supplier.isActive = validatedData.isActive;
    }

    supplier.updatedBy = auth.user?.userId;

    await supplier.save();

    return NextResponse.json(
      {
        success: true,
        message: "Supplier updated successfully",
        data: supplier,
      },
      { status: 200 },
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

    console.error("Update supplier error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update supplier",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole([
    USER_ROLES.ADMIN,
    USER_ROLES.INVENTORY_MANAGER,
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
          message: "Invalid supplier id",
        },
        { status: 400 },
      );
    }

    const supplier = await Supplier.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier not found",
        },
        { status: 404 },
      );
    }

    supplier.isDeleted = true;
    supplier.isActive = false;
    supplier.updatedBy = auth.user?.userId;

    await supplier.save();

    return NextResponse.json(
      {
        success: true,
        message: "Supplier deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete supplier error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete supplier",
      },
      { status: 500 },
    );
  }
}
