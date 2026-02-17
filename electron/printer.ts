import { PosPrinter } from 'electron-pos-printer';
import { BrowserWindow } from 'electron';

export interface TicketData {
  saleId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  tax?: number;
  total: number;
  paymentMethod: 'EFECTIVO' | 'TARJETA' | 'MIXTO';
  amountReceived: number;
  change: number;
  cashier: string;
  date: string;
  notes?: string;
}

function generateTicketHTML(data: TicketData): string {
  const baseStyles = `
    font-family: 'Courier New', monospace;
    font-size: 12px;
    max-width: 300px;
    margin: 0 auto;
    line-height: 1.4;
  `;

  const headerStyles = `${baseStyles} text-align: center; font-weight: bold;`;
  const leftAlignStyles = `${baseStyles} text-align: left;`;
  const centerStyles = `${baseStyles} text-align: center;`;
  const separatorLine = '----------------------------';

  const itemsHTML = data.items
    .map(
      (item) =>
        `<div style="${leftAlignStyles}">
          ${item.name.padEnd(15)} ${item.quantity.toString().padStart(3)}x $${item.price.toFixed(2).padStart(7)} $${item.subtotal.toFixed(2).padStart(7)}
        </div>`
    )
    .join('');

  const taxLine = data.tax
    ? `<div style="${centerStyles}">IVA: $${data.tax.toFixed(2)}</div>`
    : '';

  const paymentDetails =
    data.paymentMethod === 'EFECTIVO'
      ? `<div style="${leftAlignStyles}">Recibido: $${data.amountReceived.toFixed(2)}</div>
         <div style="${leftAlignStyles}">Cambio: $${data.change.toFixed(2)}</div>`
      : '';

  const notesLine = data.notes
    ? `<div style="${centerStyles}">Notas: ${data.notes}</div>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Ticket de Venta</title>
      </head>
      <body style="margin: 0; padding: 10px;">
        <div style="${headerStyles}">
          🍦 Super Coldy
        </div>
        <div style="${centerStyles}">
          Michoacana
        </div>
        
        <div style="${centerStyles}">
          Av. Principal #123
          <br>
          Tel: (123) 456-7890
        </div>

        <div style="${centerStyles}">
          ${separatorLine}
        </div>

        <div style="${leftAlignStyles}">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 5px;">
            <span>Producto</span>
            <span>Cant</span>
            <span>Precio</span>
            <span>Subtotal</span>
          </div>
        </div>

        <div style="${centerStyles}">
          ${separatorLine}
        </div>

        ${itemsHTML}

        <div style="${centerStyles}">
          ${separatorLine}
        </div>

        <div style="${centerStyles}; font-weight: bold;">
          Subtotal: $${data.subtotal.toFixed(2)}
        </div>
        ${taxLine}
        <div style="${centerStyles}; font-weight: bold; font-size: 14px;">
          TOTAL: $${data.total.toFixed(2)}
        </div>

        <div style="${centerStyles}">
          Método de Pago: ${data.paymentMethod}
        </div>
        ${paymentDetails}

        <div style="${centerStyles}">
          ${separatorLine}
        </div>

        <div style="${centerStyles}; font-style: italic;">
          ¡Gracias por su compra!
        </div>

        <div style="${centerStyles}">
          ${data.date}
        </div>

        <div style="${centerStyles}">
          Cajero: ${data.cashier}
        </div>

        <div style="${centerStyles}">
          Folio: ${data.saleId}
        </div>

        ${notesLine}
      </body>
    </html>
  `;

  return html;
}

export async function printTicket(
  mainWindow: BrowserWindow,
  ticketData: TicketData
): Promise<void> {
  try {
    const ticketHTML = generateTicketHTML(ticketData);

    const printOptions = {
      preview: false, // Cambiar a true para previsualizaciones en desarrollo
      width: '80mm',
      margin: '0 0 0 0',
      copies: 1,
      printerName: undefined, // Usa la impresora predeterminada
      timeOutPerLine: 400,
      silent: true, // Sin diálogo de impresión
      data: [{
        type: 'raw',
        format: 'html',
        value: ticketHTML,
      }],
    };

    await PosPrinter.print(printOptions);
  } catch (error) {
    throw new Error(`Error al imprimir ticket: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}
