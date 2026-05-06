// src/lib/email-templates/orderStatusUpdatedEmail.ts

function formatCurrency(amount: number) {
  return `LKR ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

type OrderStatusUpdatedEmailParams = {
  customerName: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
};

export function buildOrderStatusUpdatedEmail({
  customerName,
  orderNumber,
  orderStatus,
  paymentStatus,
  totalAmount,
}: OrderStatusUpdatedEmailParams) {
  const formattedOrderStatus = formatStatus(orderStatus);
  const formattedPaymentStatus = formatStatus(paymentStatus);

  const subject = `Order update - ${orderNumber}`;

  const text = `
Hi ${customerName},

Your order has been updated.

Order Number: ${orderNumber}
Order Status: ${formattedOrderStatus}
Payment Status: ${formattedPaymentStatus}
Total Amount: ${formatCurrency(totalAmount)}

Thank you for shopping with us.
`;

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #1c334f, #0453a7); padding: 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 24px;">Order Updated</h2>
          <p style="margin: 8px 0 0; font-size: 14px;">
            Your order has a new update.
          </p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 16px; color: #111827;">Hi ${customerName},</p>

          <p style="font-size: 15px; color: #374151; line-height: 1.6;">
            Your order information has been updated. Please find the latest order details below.
          </p>

          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">Order Number</p>
            <p style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0453a7;">
              ${orderNumber}
            </p>

            <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">Order Status</p>
            <p style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #111827;">
              ${formattedOrderStatus}
            </p>

            <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">Payment Status</p>
            <p style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #111827;">
              ${formattedPaymentStatus}
            </p>

            <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">Total Amount</p>
            <p style="margin: 0; font-size: 18px; font-weight: 700; color: #0453a7;">
              ${formatCurrency(totalAmount)}
            </p>
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
