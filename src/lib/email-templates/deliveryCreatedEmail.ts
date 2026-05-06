// src/lib/email-templates/deliveryCreatedEmail.ts

function formatDate(date?: Date | string | null) {
  if (!date) return "Not assigned yet";

  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type DeliveryAddress = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  country?: string;
};

type DeliveryCreatedEmailParams = {
  customerName: string;
  orderNumber?: string;
  trackingNumber: string;
  estimatedDeliveryDate?: Date | string | null;
  deliveryAddress: DeliveryAddress;
};

export function buildDeliveryCreatedEmail({
  customerName,
  orderNumber,
  trackingNumber,
  estimatedDeliveryDate,
  deliveryAddress,
}: DeliveryCreatedEmailParams) {
  const subject = `Your delivery has been created - ${trackingNumber}`;

  const text = `
Hi ${customerName},

Your delivery has been created successfully.

Order Number: ${orderNumber || "N/A"}
Tracking Number: ${trackingNumber}
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
          <h2 style="margin: 0; font-size: 24px;">Delivery Created</h2>
          <p style="margin: 8px 0 0; font-size: 14px;">
            Your order is now being prepared for delivery.
          </p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 16px; color: #111827;">Hi ${customerName},</p>

          <p style="font-size: 15px; color: #374151; line-height: 1.6;">
            Your delivery has been created successfully. You can use the tracking number below to identify your delivery.
          </p>

          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">Order Number</p>
            <p style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #111827;">
              ${orderNumber || "N/A"}
            </p>

            <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">Tracking Number</p>
            <p style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0453a7;">
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
