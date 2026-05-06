// src/lib/email-templates/deliveryStatusUpdatedEmail.ts

function formatDate(date?: Date | string | null) {
  if (!date) return "Not assigned yet";

  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

type DeliveryAddress = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  country?: string;
};

type DeliveryStatusUpdatedEmailParams = {
  customerName: string;
  orderNumber?: string;
  trackingNumber: string;
  deliveryStatus: string;
  estimatedDeliveryDate?: Date | string | null;
  deliveryAddress: DeliveryAddress;
};

export function buildDeliveryStatusUpdatedEmail({
  customerName,
  orderNumber,
  trackingNumber,
  deliveryStatus,
  estimatedDeliveryDate,
  deliveryAddress,
}: DeliveryStatusUpdatedEmailParams) {
  const formattedStatus = formatStatus(deliveryStatus);

  const subject = `Delivery status updated - ${formattedStatus}`;

  const text = `
Hi ${customerName},

Your delivery status has been updated.

Order Number: ${orderNumber || "N/A"}
Tracking Number: ${trackingNumber}
Current Status: ${formattedStatus}
Estimated Delivery Date: ${formatDate(estimatedDeliveryDate)}

Delivery Address:
${deliveryAddress.fullName}
${deliveryAddress.phone}
${deliveryAddress.address}
${deliveryAddress.city}
${deliveryAddress.postalCode || ""}
${deliveryAddress.country || ""}

Thank you for shopping with us.
`;

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #1c334f, #0453a7); padding: 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 24px;">Delivery Status Updated</h2>
          <p style="margin: 8px 0 0; font-size: 14px;">
            Your delivery has a new status update.
          </p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 16px; color: #111827;">Hi ${customerName},</p>

          <p style="font-size: 15px; color: #374151; line-height: 1.6;">
            Your delivery status has been updated. Please find the latest delivery information below.
          </p>

          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">Current Status</p>
            <p style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #0453a7;">
              ${formattedStatus}
            </p>

            <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">Order Number</p>
            <p style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #111827;">
              ${orderNumber || "N/A"}
            </p>

            <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">Tracking Number</p>
            <p style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #111827;">
              ${trackingNumber}
            </p>

            <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">Estimated Delivery Date</p>
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">
              ${formatDate(estimatedDeliveryDate)}
            </p>
          </div>

          <h3 style="font-size: 16px; color: #111827; margin-bottom: 10px;">
            Delivery Address
          </h3>

          <div style="font-size: 14px; color: #374151; line-height: 1.7;">
            <strong>${deliveryAddress.fullName}</strong><br />
            ${deliveryAddress.phone}<br />
            ${deliveryAddress.address}<br />
            ${deliveryAddress.city}<br />
            ${deliveryAddress.postalCode || ""}<br />
            ${deliveryAddress.country || ""}
          </div>

          <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin-top: 24px;">
            Thank you for shopping with us.
          </p>
        </div>
      </div>
    </div>
  `;

  return {
    subject,
    html,
    text,
  };
}
