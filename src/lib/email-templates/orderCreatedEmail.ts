// src/lib/email-templates/orderCreatedEmail.ts

function formatCurrency(amount: number) {
  return `LKR ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPaymentStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

type OrderEmailItem = {
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type ShippingAddress = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  country?: string;
};

type OrderCreatedEmailParams = {
  customerName: string;
  orderNumber: string;
  items: OrderEmailItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
};

export function buildOrderCreatedEmail({
  customerName,
  orderNumber,
  items,
  shippingAddress,
  subtotal,
  deliveryFee,
  discountAmount,
  totalAmount,
  paymentStatus,
  paymentMethod,
}: OrderCreatedEmailParams) {
  const formattedPaymentStatus = formatPaymentStatus(paymentStatus);
  const formattedPaymentMethod = formatPaymentStatus(paymentMethod);

  const subject = `Order confirmation - ${orderNumber}`;

  const itemRowsText = items
    .map(
      (item) =>
        `${item.productName} (${item.sku || "N/A"}) x ${item.quantity} - ${formatCurrency(item.totalPrice)}`,
    )
    .join("\n");

  const itemRowsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <strong style="color: #111827;">${item.productName}</strong>
            <br />
            <span style="font-size: 12px; color: #6b7280;">SKU: ${item.sku || "N/A"}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ${formatCurrency(item.unitPrice)}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
            ${formatCurrency(item.totalPrice)}
          </td>
        </tr>
      `,
    )
    .join("");

  const text = `
Hi ${customerName},

Thank you for your order. Your order has been created successfully.

Order Number: ${orderNumber}
Payment Method: ${formattedPaymentMethod}
Payment Status: ${formattedPaymentStatus}

Items:
${itemRowsText}

Subtotal: ${formatCurrency(subtotal)}
Delivery Fee: ${formatCurrency(deliveryFee)}
Discount: ${formatCurrency(discountAmount)}
Total Amount: ${formatCurrency(totalAmount)}

Shipping Address:
${shippingAddress.fullName}
${shippingAddress.phone}
${shippingAddress.address}
${shippingAddress.city}
${shippingAddress.postalCode || ""}
${shippingAddress.country || ""}

Thank you for shopping with us.
`;

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 24px;">
      <div style="max-width: 720px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #1c334f, #0453a7); padding: 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 24px;">Order Confirmed</h2>
          <p style="margin: 8px 0 0; font-size: 14px;">
            Thank you for your order. We have received your order successfully.
          </p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 16px; color: #111827;">Hi ${customerName},</p>

          <p style="font-size: 15px; color: #374151; line-height: 1.6;">
            Your order has been created successfully. Please find your order details below.
          </p>

          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Order Number</p>
            <p style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0453a7;">
              ${orderNumber}
            </p>

            <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Payment Method</p>
            <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #111827;">
              ${formattedPaymentMethod}
            </p>

            <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Payment Status</p>
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">
              ${formattedPaymentStatus}
            </p>
          </div>

          <h3 style="font-size: 17px; color: #111827; margin: 24px 0 12px;">
            Order Items
          </h3>

          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px; text-align: left; font-size: 13px; color: #374151;">Product</th>
                <th style="padding: 12px; text-align: center; font-size: 13px; color: #374151;">Qty</th>
                <th style="padding: 12px; text-align: right; font-size: 13px; color: #374151;">Unit Price</th>
                <th style="padding: 12px; text-align: right; font-size: 13px; color: #374151;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRowsHtml}
            </tbody>
          </table>

          <div style="margin-top: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280;">Subtotal</span>
              <strong>${formatCurrency(subtotal)}</strong>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280;">Delivery Fee</span>
              <strong>${formatCurrency(deliveryFee)}</strong>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280;">Discount</span>
              <strong>${formatCurrency(discountAmount)}</strong>
            </div>

            <div style="display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
              <span style="font-size: 17px; font-weight: 700; color: #111827;">Total Amount</span>
              <span style="font-size: 18px; font-weight: 700; color: #0453a7;">
                ${formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          <h3 style="font-size: 17px; color: #111827; margin: 24px 0 12px;">
            Shipping Address
          </h3>

          <div style="font-size: 14px; color: #374151; line-height: 1.7;">
            <strong>${shippingAddress.fullName}</strong><br />
            ${shippingAddress.phone}<br />
            ${shippingAddress.address}<br />
            ${shippingAddress.city}<br />
            ${shippingAddress.postalCode || ""}<br />
            ${shippingAddress.country || ""}
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
