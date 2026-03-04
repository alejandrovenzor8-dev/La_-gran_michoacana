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
  branchName?: string;
  printerName?: string;
}

function generateTicketHTML(data: TicketData): string {
  console.log('📝 Datos del ticket recibidos:', {
    subtotal: data.subtotal,
    total: data.total,
    tax: data.tax,
    amountReceived: data.amountReceived,
    change: data.change
  });

  const subtotal = Number(data.subtotal || 0);
  const total = Number(data.total || 0);
  const tax = Number(data.tax || 0);
  const amountReceived = Number(data.amountReceived || 0);
  const change = Number(data.change || 0);

  console.log('📝 Valores convertidos a números:', {
    subtotal,
    total,
    tax,
    amountReceived,
    change
  });

  const itemsHTML = data.items
    .map((item) => {
      const price = Number(item.price || 0);
      const lineSubtotal = Number(item.subtotal || 0);
      return `<b>${item.name}</b><br>${item.quantity} x $${price.toFixed(2)} = $${lineSubtotal.toFixed(2)}<br><br>`;
    })
    .join('');

  const paymentInfo = data.paymentMethod === 'EFECTIVO' 
    ? `Recibido: $${amountReceived.toFixed(2)}<br>Cambio: $${change.toFixed(2)}<br>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: monospace;
            font-size: 13px;
            width: 260px;
            margin: 0;
            padding: 6px;
            line-height: 1.4;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed black; margin: 8px 0; }
          .small { font-size: 11px; }
          b { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 15px;">LA GRAN</div>
        <div class="center bold" style="font-size: 15px;">MICHOACANA</div>
        <div class="center small">Ticket de Venta</div>
        <div class="line"></div>
        
        <div class="small">
          Folio: ${data.saleId}<br>
          Fecha: ${data.date}<br>
          Cajero: ${data.cashier}<br>
          ${data.branchName ? `Sucursal: ${data.branchName}<br>` : ''}
          Pago: ${data.paymentMethod}
        </div>
        
        <div class="line"></div>
        
        ${itemsHTML}
        
        <div class="line"></div>
        
        <b>Subtotal: $${subtotal.toFixed(2)}</b><br>
        <b>Impuesto: $${tax.toFixed(2)}</b><br>
        <b style="font-size: 16px;">TOTAL: $${total.toFixed(2)}</b><br>
        ${paymentInfo}
        
        ${data.notes ? `<div class="line"></div>${data.notes}<br>` : ''}
        
        <div class="line"></div>
        
        <div class="center small">
          Gracias por su compra<br>
          Conserve su ticket
        </div>
      </body>
    </html>
  `;
}

async function nativeElectronPrintTicket(
  ticketHTML: string,
  printerName?: string,
  silent: boolean = true
): Promise<void> {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      sandbox: true,
    },
  });

  try {
    const encodedHtml = `data:text/html;charset=UTF-8,${encodeURIComponent(ticketHTML)}`;
    await printWindow.loadURL(encodedHtml);

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout en impresión nativa de Electron'));
      }, 20000);

      printWindow.webContents.print(
        {
          silent,
          printBackground: true,
          deviceName: printerName || undefined,
          margins: { marginType: 'none' },
        },
        (success, failureReason) => {
          clearTimeout(timeout);
          if (success) {
            resolve();
          } else {
            reject(new Error(failureReason || 'Fallo de impresión nativa'));
          }
        }
      );
    });
  } finally {
    if (!printWindow.isDestroyed()) {
      printWindow.close();
    }
  }
}

export async function printTicket(
  mainWindow: BrowserWindow,
  ticketData: TicketData
): Promise<void> {
  console.log('🖨️ printTicket llamado con:', JSON.stringify(ticketData, null, 2));
  let lastError: unknown = null;

  try {
    const ticketHTML = generateTicketHTML(ticketData);

    const printData: any = [{
      type: 'html',
      value: ticketHTML,
    }];

    const configuredPrinter = ticketData.printerName?.trim() || undefined;

    const attempts: any[] = [
      {
        preview: false,
        width: '80mm',
        margin: '0 0 0 0',
        copies: 1,
        printerName: configuredPrinter,
        timeOutPerLine: 1200,
        silent: true,
      },
      {
        preview: false,
        width: '80mm',
        margin: '0 0 0 0',
        copies: 1,
        printerName: undefined,
        timeOutPerLine: 1500,
        silent: true,
      },
    ];

    // Solo usar silent=false cuando sí tenemos nombre de impresora
    if (configuredPrinter) {
      attempts.push({
        preview: false,
        width: '80mm',
        margin: '0 0 0 0',
        copies: 1,
        printerName: configuredPrinter,
        timeOutPerLine: 1800,
        silent: false,
      });
    }

    for (const attemptOptions of attempts) {
      try {
        await PosPrinter.print(printData, attemptOptions);
        return;
      } catch (attemptError) {
        lastError = attemptError;
      }
    }

    // Fallback para impresoras térmicas genéricas (ej. POS-5890C)
    try {
      await nativeElectronPrintTicket(ticketHTML, configuredPrinter, true);
      return;
    } catch (nativeSilentError) {
      lastError = nativeSilentError;
    }

    if (configuredPrinter) {
      try {
        await nativeElectronPrintTicket(ticketHTML, configuredPrinter, false);
        return;
      } catch (nativeDialogError) {
        lastError = nativeDialogError;
      }
    }

    throw lastError || new Error('No se pudo imprimir en ningún intento');
  } catch (error) {
    let detailedError = 'Error desconocido';

    if (error instanceof Error) {
      detailedError = error.message;
      if (error.stack) {
        detailedError = `${error.message} | ${error.stack}`;
      }
    } else if (typeof error === 'string') {
      detailedError = error;
    } else {
      try {
        detailedError = JSON.stringify(error);
      } catch (jsonError) {
        detailedError = String(error);
      }
    }

    throw new Error(`Error al imprimir ticket: ${detailedError}`);
  }
}
