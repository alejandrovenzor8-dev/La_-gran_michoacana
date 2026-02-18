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

  // Convertir precios a números si son strings
  const itemsHTML = data.items
    .map(
      (item) => {
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
        const subtotal = typeof item.subtotal === 'string' ? parseFloat(item.subtotal) : item.subtotal;
        
        return `<div style="${leftAlignStyles}">
          ${item.name.padEnd(15)} ${item.quantity.toString().padStart(3)}x $${price.toFixed(2).padStart(7)} $${subtotal.toFixed(2).padStart(7)}
        </div>`;
      }
    )
    .join('');

  const taxLine = data.tax
    ? `<div style="${centerStyles}">IVA: $${(typeof data.tax === 'string' ? parseFloat(data.tax) : data.tax).toFixed(2)}</div>`
    : '';

  const paymentDetails =
    data.paymentMethod === 'EFECTIVO'
      ? `<div style="${leftAlignStyles}">Recibido: $${(typeof data.amountReceived === 'string' ? parseFloat(data.amountReceived) : data.amountReceived).toFixed(2)}</div>
         <div style="${leftAlignStyles}">Cambio: $${(typeof data.change === 'string' ? parseFloat(data.change) : data.change).toFixed(2)}</div>`
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
          🍦 La Michoacana
        </div>
        <div style="${centerStyles}">
          La Gran Michoacana
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
          Subtotal: $${(typeof data.subtotal === 'string' ? parseFloat(data.subtotal) : data.subtotal).toFixed(2)}
        </div>
        ${taxLine}
        <div style="${centerStyles}; font-weight: bold; font-size: 14px;">
          TOTAL: $${(typeof data.total === 'string' ? parseFloat(data.total) : data.total).toFixed(2)}
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

    const printData: any = [{
      type: 'raw',
      format: 'html',
      value: ticketHTML,
    }];

    const printOptions: any = {
      preview: true, // true para testing/preview, false para producción
      width: '80mm',
      margin: '0 0 0 0',
      copies: 1,
      printerName: undefined, // Usa la impresora predeterminada
      timeOutPerLine: 400,
      silent: true, // Sin diálogo de impresión
    };

    await PosPrinter.print(printData, printOptions);
  } catch (error) {
    throw new Error(`Error al imprimir ticket: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}
