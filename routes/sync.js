const { writeFileSync, createWriteStream, readFileSync } = require("fs");
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, UnderlineType, HeadingLevel } = require("docx");
const docxConverter = require('docx-pdf');
const moment = require("moment");
const { stringify } = require("csv-stringify");
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const { SET_REDIS_DATA, GET_REDIS_DATA } = require('../redis-client');
const { CONVERT_TO_ARRAY, UPLOAD_TO_AZURE_STORAGE } = require("../helpers");
const { GET_RATING_SHEET_DATA } = require("../repositories/RatingSheetData");

async function sync_routes(fastify) {
  fastify.post('/get_users', async (request, reply) => {
    var response = {};
    response['success'] = true;
    response['users'] = [];
    reply.send(response);
  });

  fastify.post('/get_user_by_email', async (request, reply) => {
    var response = {};
    response['success'] = true;
    response['user'] = {};
    reply.send(response);
  });

  fastify.post('/set_user', async (request, reply) => {
    var response = {};
    response['success'] = true;
    response['uuid'] = uuidv4();
    reply.send(response);
  });

  fastify.post('/get_companies', async (request, reply) => {
    var response = {};
    response['success'] = true;
    response['companies'] = [];
    reply.send(response);
  });

  fastify.post('/get_company', async (request, reply) => {
    var response = {};
    response['success'] = true;
    response['company'] = {};
    reply.send(response);
  });

  fastify.post('/set_company', async (request, reply) => {
    var response = {};
    response['success'] = true;
    response['uuid'] = uuidv4();
    reply.send(response);
  });

  fastify.post('/set_company_mandates', async (request, reply) => {
    var response = {};
    response['success'] = true;
    response['uuid'] = uuidv4();
    reply.send(response);
  });

  fastify.post('/redis_test', async (request, reply) => {   
    const cached_data = await GET_REDIS_DATA('db_company_uuid');
    if (cached_data) { return reply.send(cached_data); }
    
    var response = {};
    response['uuid'] = uuidv4();
    response['success'] = true;
    await SET_REDIS_DATA('db_company_uuid', response);
    reply.send(response);
  });

  fastify.post('/docx_test', async (request, reply) => {
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                          new TextRun("CogniTensor Document"),
                          new TextRun({
                            text: "Sample Document Generated",
                            bold: true,
                          }),
                        ],
                    }),
                    new Paragraph({
                        children: [
                          new TextRun({
                            text: "\n DOCx + PDF!",
                            bold: true,
                          }),
                        ],
                    }),
                ],
            },
        ],
    });
    
    Packer.toBuffer(doc).then((buffer) => {
      let doc_fs = "generated/Sample_Document.docx";
      let pdf_fs = "generated/Sample_Document.pdf";
      writeFileSync(doc_fs, buffer);

      docxConverter(doc_fs, pdf_fs, function(err,result){
        if(err){
          console.log(err);
        }
        console.log('result'+result);
      });
    });

    var response = {};
    response['uuid'] = uuidv4();
    reply.send(response);
  });

  fastify.post('/pdf_test', async (request, reply) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const html = await fastify.view("templates/pdf/sample.pug", { text: "Sample Dynamic Data from Pug!" });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.emulateMediaType('screen');
    await page.pdf({
      path: 'generated/result_pug.pdf',
      margin: { top: '100px', right: '50px', bottom: '100px', left: '50px' },
      printBackground: true,
      format: 'A4',
    });
    await browser.close();

    var response = {};
    response['uuid'] = uuidv4();
    reply.send(response);
  });

  fastify.post('/csv_test', async (request, reply) => {
    const csv_fs = "generated/Sample_Document.csv";
    const writableStream = createWriteStream(csv_fs);

    const columns = [
      "year_month",
      "month_of_release",
      "passenger_type",
      "direction",
      "sex",
      "age",
      "estimate",
    ];
    const stringifier = stringify({ header: true, columns: columns });

    stringifier.write(['x', 'w', 'z']);
    stringifier.write(['x2', 'w1', 'zz']);

    stringifier.pipe(writableStream);

    var response = {};
    response['uuid'] = uuidv4();
    response['success'] = true;
    reply.send(response);
  });

  fastify.post('/multipart_test', async (request, reply) => {
    const mandate_id = CONVERT_TO_ARRAY(request.body['mandate_id[]']).map((row) => row['value']);
    const document_buffer = await request.body['document'].toBuffer();
    const document_path = await UPLOAD_TO_AZURE_STORAGE(document_buffer, {
      'path': 'sample-folder/sample-file-name.pdf'
    });

    reply.send({
      'success': true,
      'ctx': "multipart_test",
      'mandate_id': mandate_id,
      'document_path': document_path,
    });
  });
}

module.exports = {
  sync_routes
};