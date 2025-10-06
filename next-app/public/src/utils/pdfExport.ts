import jsPDF from "jspdf";
import { formatDateTime } from "./date";

export function exportEntriesToPDF({ sales, expenses, inventory, download = true, chartImages }: { sales: any[]; expenses: any[]; inventory: any[]; download?: boolean; chartImages?: string[] }) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Business Entries Report", 10, 15);
  doc.setFontSize(12);
  let y = 25;

  // If chart images provided (base64), add them at the top
  if (Array.isArray(chartImages) && chartImages.length) {
    let imgY = y;
    chartImages.forEach((b64, idx) => {
      try {
        doc.addImage(b64, 'PNG', 10, imgY, 180, 60);
        imgY += 65;
        if (imgY > 240) {
          doc.addPage();
          imgY = 15;
        }
      } catch (e) {
        // ignore image errors
      }
    });
    y = imgY + 4;
  }

  // Group entries by month
  const groupByMonth = (entries: any[], dateKey: string) => {
    return entries.reduce((acc, entry) => {
      const date = new Date(entry[dateKey]);
      const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
      if (!acc[month]) acc[month] = [];
      acc[month].push(entry);
      return acc;
    }, {} as Record<string, any[]>);
  };

  const salesByMonth = groupByMonth(sales, "createdAt");
  const expensesByMonth = groupByMonth(expenses, "createdAt");
  const inventoryByMonth = groupByMonth(inventory, "createdAt");
  const allMonths = Array.from(new Set([
    ...Object.keys(salesByMonth),
    ...Object.keys(expensesByMonth),
    ...Object.keys(inventoryByMonth)
  ])).sort();

  allMonths.forEach((month) => {
    doc.setFontSize(14);
    doc.text(month, 10, y);
    y += 6;
    // Stock Movements
    if (inventoryByMonth[month]?.length) {
      doc.setFontSize(12);
      doc.text("Stock Movements:", 12, y);
      y += 6;
  inventoryByMonth[month].forEach((item: any) => {
        doc.text(
          `Time: ${formatDateTime(item.createdAt)} | Type: ${item.type === 'addition' ? 'Stock In' : 'Stock Out'} | Qty: ${item.quantity} | Balance: ${item.balance} | Note: ${item.note || '-'}`,
          14,
          y
        );
        y += 6;
      });
    }
    // Sales
    if (salesByMonth[month]?.length) {
      doc.setFontSize(12);
      doc.text("Sales:", 12, y);
      y += 6;
  salesByMonth[month].forEach((sale: any) => {
        doc.text(
          `Time: ${formatDateTime(sale.createdAt)} | Customer: ${sale.customerName || "-"} | Qty: ${sale.quantity} | Price: ZMW ${sale.pricePerUnit} | Total: ZMW ${sale.totalPrice}`,
          14,
          y
        );
        y += 6;
      });
    }
    // Expenses
    if (expensesByMonth[month]?.length) {
      doc.setFontSize(12);
      doc.text("Expenses:", 12, y);
      y += 6;
  expensesByMonth[month].forEach((expense: any) => {
        doc.text(
          `Time: ${formatDateTime(expense.createdAt)} | Category: ${expense.categoryName || "-"} | Amount: ZMW ${expense.amount} | Desc: ${expense.description}`,
          14,
          y
        );
        y += 6;
      });
    }
    y += 4;
    if (y > 270) {
      doc.addPage();
      y = 15;
    }
  });

  if (download) {
    doc.save("business-entries-report.pdf");
  }
  return doc;
}
