import { Router, Request, Response } from 'express';
import PDFPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
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
  for(let produc of products){
    const rows = new Array();
    rows.push(produc.id);
    rows.push(produc.description);
    rows.push(produc.price);
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
          }
        ]
      },      
      {
        table: {
          body: [
            ['ID', 'Descrição', 'Preço', 'Quantidade'],
            ...body
          ],
        },
      }
    ],
    styles: {
      header:{
        fontSize: 18,
        bold: true
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

//https://youtu.be/WG1EYRhny3M?t=1954