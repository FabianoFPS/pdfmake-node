import { Router, Request, Response } from 'express';
import PDFPrinter from 'pdfmake';
import { TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import fs from 'fs';

import { prismaClient } from './databases/primaClient';

export const routes = Router();

routes.get('/products', async (request: Request, response: Response) => {
  const products = await prismaClient.products.findMany();
  return response.json(products);
});

routes.get('/products/report', async (request: Request, response: Response) => {
  const products = await prismaClient.products.findMany();
  const font = {
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    }
  }
  const printer = new PDFPrinter(font);
  const body = [];
  const columnsTitle: TableCell[] = [
    { text: 'ID', style: 'columnsTtitle' },
    { text: 'Descrição', style: 'columnsTtitle' },
    { text: 'Preço', style: 'columnsTtitle' },
    { text: 'Quantidade', style: 'columnsTtitle' },
  ]
  for (let produc of products) {
    const rows = new Array();
    rows.push(produc.id);
    rows.push(produc.description);
    rows.push(`R$ ${produc.price}`);
    rows.push(produc.quantity);
    body.push(rows);
  }
  const docDefinitions: TDocumentDefinitions = {
    defaultStyle: { font: 'Helvetica' },
    content: [
      {
        columns: [
          {
            text: 'Relatório de produtos',
            style: 'header'
          },
          {
            text: '20/07/2021',
            style: 'header'
          },

        ]
      },
      { text: '\n\n' },
      {
        table: {
          heights: (row) => 25,
          widths: [100, 'auto', 100, 'auto'],
          body: [
            columnsTitle,
            ...body
          ],
        },
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'center'
      },
      columnsTtitle: {
        fontSize: 15,
        bold: true,
        fillColor: '#7159c1',
        color: '#FFF',
        alignment: 'center',
        margin: 4,
      }
    }
  };
  const pdfDoc = printer.createPdfKitDocument(docDefinitions);
  // pdfDoc.pipe(fs.createWriteStream('relatorio.pdf'));

  const chunks: Uint8Array[] = [];

  pdfDoc.on('data', (chunk) => {
    chunks.push(chunk);
  })
  pdfDoc.end();
  pdfDoc.on('end', () => response.end(
    Buffer.concat(chunks)
  ));
});
