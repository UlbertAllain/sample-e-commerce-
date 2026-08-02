import type { Order } from "@/types/commerce";

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (context.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  lines.forEach((item, index) => context.fillText(item, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function drawBarcode(context: CanvasRenderingContext2D, code: string, x: number, y: number, width: number, height: number) {
  const units = Array.from(code).flatMap((character, index) => {
    const value = character.charCodeAt(0) + index;
    return [1 + (value % 3), 1, 1 + ((value >> 2) % 4), 1];
  });
  const total = units.reduce((sum, unit) => sum + unit, 0);
  let cursor = x;
  context.fillStyle = "#101712";
  units.forEach((unit, index) => {
    const barWidth = (unit / total) * width;
    if (index % 2 === 0) context.fillRect(cursor, y, Math.max(2, barWidth), height);
    cursor += barWidth;
  });
}

export function downloadShippingLabelPng(order: Order) {
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1754;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Browser tidak mendukung pembuatan gambar resi.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#101712";
  context.lineWidth = 5;
  context.strokeRect(45, 45, canvas.width - 90, canvas.height - 90);

  context.fillStyle = "#101712";
  context.font = "700 42px Arial";
  context.fillText("BERKAH OYOT", 90, 125);
  context.font = "500 22px Arial";
  context.fillText("AQUARIUM SUPPLY · SHIPPING LABEL", 90, 163);

  context.textAlign = "right";
  context.font = "800 54px Arial";
  context.fillText(order.shipping.courier, 1150, 132);
  context.font = "700 25px Arial";
  context.fillText(order.shipping.service, 1150, 170);
  context.textAlign = "left";

  context.beginPath();
  context.moveTo(45, 210);
  context.lineTo(1195, 210);
  context.stroke();

  context.font = "800 20px Arial";
  context.fillText("PENGIRIM / FROM", 90, 265);
  context.font = "700 31px Arial";
  context.fillText("BERKAH OYOT", 90, 310);
  context.font = "400 24px Arial";
  context.fillText("Blimbing, Wonorejo, Polokarto, Sukoharjo 57555", 90, 350);
  context.fillText("+62 882-0053-95987", 90, 388);

  context.beginPath();
  context.moveTo(45, 435);
  context.lineTo(1195, 435);
  context.stroke();

  context.font = "800 20px Arial";
  context.fillText("PENERIMA / TO", 90, 490);
  context.font = "800 42px Arial";
  context.fillText(order.customer.fullName.toUpperCase(), 90, 545);
  context.font = "700 27px Arial";
  context.fillText(order.customer.phone, 90, 590);
  context.font = "400 27px Arial";
  const address = `${order.customer.address}, ${order.customer.district}, ${order.customer.city}, ${order.customer.province} ${order.customer.postalCode}`;
  drawWrappedText(context, address, 90, 640, 1050, 40, 5);

  context.beginPath();
  context.moveTo(45, 860);
  context.lineTo(1195, 860);
  context.stroke();

  context.font = "800 20px Arial";
  context.fillText("NOMOR RESI", 90, 920);
  context.font = "800 46px Arial";
  context.fillText(order.trackingNumber, 90, 975);
  drawBarcode(context, order.trackingNumber, 90, 1020, 1060, 180);
  context.textAlign = "center";
  context.font = "700 28px monospace";
  context.fillText(order.trackingNumber, 620, 1245);
  context.textAlign = "left";

  context.beginPath();
  context.moveTo(45, 1300);
  context.lineTo(1195, 1300);
  context.stroke();

  context.font = "800 20px Arial";
  context.fillText("ORDER", 90, 1360);
  context.font = "800 34px Arial";
  context.fillText(order.orderNumber, 90, 1405);

  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
  const totalWeight = order.items.reduce((total, item) => total + item.product.weightGrams * item.quantity, 0);
  context.font = "800 20px Arial";
  context.fillText("ISI PAKET", 720, 1360);
  context.font = "700 29px Arial";
  context.fillText(`${itemCount} BARANG · ${(totalWeight / 1000).toFixed(2)} KG`, 720, 1405);

  context.fillStyle = "#101712";
  context.fillRect(90, 1480, 1060, 130);
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.font = "800 31px Arial";
  context.fillText("JANGAN DIBANTING · PERIKSA KONDISI PAKET", 620, 1558);
  context.textAlign = "left";

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `resi-${order.trackingNumber}.png`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function printShippingLabelPdf(order: Order) {
  const printWindow = window.open("", "_blank", "width=620,height=860");
  if (!printWindow) {
    throw new Error("Popup diblokir. Izinkan popup untuk mencetak resi.");
  }

  const bars = Array.from({ length: 52 }, (_, index) => {
    const width = index % 5 === 0 ? 4 : index % 3 === 0 ? 3 : 2;
    return `<i style="display:block;width:${width}px;height:100%;background:#111"></i>`;
  }).join("");

  const customerAddress = `${order.customer.address}, ${order.customer.district}, ${order.customer.city}, ${order.customer.province} ${order.customer.postalCode}`;

  printWindow.document.write(`<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Resi ${escapeHtml(order.trackingNumber)}</title>
<style>
  @page { size: A6 portrait; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #111; background: #fff; font-family: Arial, sans-serif; }
  .label { width: 105mm; min-height: 148mm; padding: 8mm; border: 1.2mm solid #111; }
  .head { display:flex; align-items:flex-start; justify-content:space-between; gap:5mm; padding-bottom:4mm; border-bottom:.7mm solid #111; }
  .brand { display:grid; gap:1mm; }
  .brand strong { font-size:12pt; letter-spacing:.08em; }
  .brand span, .caption { color:#555; font-size:6.5pt; font-weight:700; letter-spacing:.12em; }
  .courier { font-size:20pt; font-weight:900; }
  .route { padding:4mm 0; border-bottom:.35mm dashed #777; }
  .route strong { display:block; margin:1.5mm 0; font-size:10pt; }
  .route p { margin:0; font-size:8pt; line-height:1.45; }
  .service { display:flex; align-items:center; justify-content:space-between; padding:4mm 0; }
  .service strong { font-size:18pt; }
  .service span { padding:1.5mm 2mm; border:.7mm solid #111; font-size:8pt; font-weight:900; }
  .barcode { height:18mm; display:flex; justify-content:space-between; gap:.5mm; overflow:hidden; }
  .resi { margin-top:2mm; text-align:center; font-family:monospace; font-size:9pt; font-weight:900; letter-spacing:.08em; }
  .order { margin-top:4mm; padding:3mm; display:flex; justify-content:space-between; border:.7mm solid #111; font-size:8pt; }
  .warning { margin-top:3mm; padding:3mm; color:white; background:#111; text-align:center; font-size:6.5pt; font-weight:900; letter-spacing:.05em; }
</style>
</head>
<body>
  <main class="label">
    <header class="head">
      <div class="brand"><strong>BERKAH OYOT</strong><span>SHIPPING LABEL</span></div>
      <div class="courier">${escapeHtml(order.shipping.courier)}</div>
    </header>
    <section class="route"><span class="caption">FROM</span><strong>BERKAH OYOT</strong><p>Blimbing, Wonorejo, Polokarto, Sukoharjo 57555<br />+62 882-0053-95987</p></section>
    <section class="route"><span class="caption">TO</span><strong>${escapeHtml(order.customer.fullName)}</strong><p>${escapeHtml(customerAddress)}<br />${escapeHtml(order.customer.phone)}</p></section>
    <section class="service"><strong>${escapeHtml(order.shipping.courier)}</strong><span>${escapeHtml(order.shipping.service)}</span></section>
    <div class="barcode">${bars}</div>
    <div class="resi">${escapeHtml(order.trackingNumber)}</div>
    <div class="order"><span>ORDER</span><strong>${escapeHtml(order.orderNumber)}</strong></div>
    <div class="warning">JANGAN DIBANTING · PERIKSA KONDISI PAKET</div>
  </main>
<script>window.addEventListener('load', () => setTimeout(() => window.print(), 150));</script>
</body>
</html>`);
  printWindow.document.close();
}
