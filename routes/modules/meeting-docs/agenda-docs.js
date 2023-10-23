const { writeFileSync, readFileSync } = require("fs");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  UnderlineType,
  HeadingLevel,
  VerticalAlign,
  BorderStyle,
} = require("docx");
const docxConverter = require("docx-pdf");
const moment = require("moment");
const puppeteer = require("puppeteer");
const { v4: uuidv4 } = require("uuid");
const { UPLOAD_TO_AZURE_STORAGE } = require("../../../helpers");
const { CHECK_PERMISSIONS } = require("../../../helpers");
const {
  RatingCommitteeMeetingDocument,
} = require("../../../models/modules/rating-committee");
const {
  GET_AGENDA_SHEET_DATA,
} = require("../../../repositories/AgendaSheetData");
const HTMLtoDOCX = require("html-to-docx");
const { DocumentType } = require("../../../models/modules/onboarding");

async function agenda_docs_routes(fastify) {
  fastify.post("/agenda/generate/docx", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Rating.Letter");

      const GENERATE_UUID = uuidv4();

      const path = `generated/agenda_doc_${GENERATE_UUID}.docx`;

      var document_url = "";

      const { params } = request.body;

      const document_type_details = await DocumentType.findOne({
        where: {
          name: "agenda",
          is_active: true
        }
      })

      const data = await GET_AGENDA_SHEET_DATA({
        uuid: params["rating_committee_meeting_uuid"],
        is_active: true,
      });

      console.log("data in agenda word======>", data);

      const suffixes = (num) => {
        const strNum = num.toString();
        const newNum = strNum[strNum.split("").length - 1];
        if (newNum == "1") {
          return "st";
        } else if (newNum == "2") {
          return "nd";
        } else if (newNum == "3") {
          return "rd";
        } else {
          return "th";
        }
      };

      const heading = new Paragraph({
        text: "INFOMERICS VALUATION AND RATING PRIVATE LIMITED",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        allCaps: true,
        bold: true,
      });

      const contact_info_1 = new Paragraph({
        text: "Head Office-Flat No. 104/106/108, Golf Apartments, Sujan Singh Park, New Delhi-110003",
        alignment: AlignmentType.CENTER,
      });

      const contact_info = new Paragraph({
        text: "Corporate Office: 1102, 1103 & 1104 -B Wing, Kanakia Wallstreet, Off. Andheri Kurla Road, Andheri (East), Mumbai-400093.",
        alignment: AlignmentType.CENTER,
      });

      const contact_info_2 = new Paragraph({
        text: "Email: vma@infomerics.com, Website: https://www.infomerics.com",
        alignment: AlignmentType.CENTER,
      });

      const contact_info_3 = new Paragraph({
        text: "Phone: +91-11 24601142, 24611910, Fax: +91 11 24627549",
        alignment: AlignmentType.CENTER,
      });

      const cin = new Paragraph({
        text: `(CIN: U32202DL1986PTC024575)`,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      });

      const agenda_line = new Paragraph({
        text: "AGENDA",
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
      });

      const meeting_detail_head = new Paragraph({
        text: `Agenda for ${
          data.docs_data[0].instruments[0].rating_committee_meeting_id
        }${suffixes(
          data.docs_data[0].instruments[0].rating_committee_meeting_id
        )} Rating Committee Meeting (${data.docs_data[0].instruments[0].committee_type}) for the Financial Year ${moment(
          data.docs_data[0].instruments[0].meeting_at
        ).format("YYYY")} - ${moment(
          data.docs_data[0].instruments[0].meeting_at
        )
          .add(1, "year")
          .format(
            "YYYY"
          )} of Infomerics Valuation and Rating Private Limited to be held on ${moment(
          data.docs_data[0].instruments[0].meeting_at
        ).format("dddd, MMMM Do YYYY, h:mm A")} through ${
          data.docs_data[0].instruments[0].meeting_type == "Virtual"
            ? "video"
            : data.docs_data[0].instruments[0].meeting_type
        } conference.`,
        heading: HeadingLevel.HEADING_3,
        alignment: AlignmentType.LEFT,
      });

      const table_header = new Table({
        alignment: AlignmentType.CENTER,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 7,
                verticalAlign: VerticalAlign.CENTER,
                width: { size: 20, type: WidthType.DXA },
                children: [
                  new Paragraph({
                    text: "Agenda",
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                width: {
                  size: 10,
                  type: WidthType.DXA,
                },
                columnSpan: [1],
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph("A")],
              }),
              new TableCell({
                columnSpan: 6,
                width: {
                  size: 12,
                  type: WidthType.DXA,
                },
                children: [
                  new Paragraph(
                    `To confirm the minutes of the ${
                      data.penultimate_meeting_details.length > 0
                        ? data.penultimate_meeting_details[0]
                            .rating_committee_meeting_id
                        : "NA"
                    }${
                      data.penultimate_meeting_details.length > 0
                        ? suffixes(
                            data.penultimate_meeting_details[0]
                              .rating_committee_meeting_id
                          )
                        : "NA"
                    } Committee Meeting held on ${moment(
                      data.penultimate_meeting_details.length > 0
                        ? data.penultimate_meeting_details[0].meeting_at
                        : "NA"
                    ).format("dddd, MMMM Do YYYY")}.`
                  ),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                width: {
                  size: 5,
                  type: WidthType.PERCENTAGE,
                },
                columnSpan: [1],
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph("B")],
              }),
              new TableCell({
                columnSpan: 6,
                children: [
                  new Paragraph("To consider following proposal for rating:-"),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                columnSpan: [2],
                children: [new Paragraph("   ")],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: "Sr. No",
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: "Name of the Entity",
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: "Instrument/Facility",
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: "Size (Rs Crore)",
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: "Nature of Assignment",
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const date = new Paragraph({
        text: ` Date: ${moment(
          data.docs_data[0].instruments[0].meeting_at
        ).format("Do MMMM YYYY")}`,
        heading: HeadingLevel.HEADING_4,
      });

      let table_rows = [];
      let serial_number = 1;
      data.docs_data.forEach((company) => {
        company.instruments.forEach((instrument) => {
          table_rows.push(
            new TableRow({
              children: [
                new TableCell({
                  columnSpan: [2],
                  children: [new Paragraph({ text: " " })],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: String(serial_number),
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: String(company["entity_name"]),
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  width: { size: 40, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: instrument["instrument"],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  width: { size: 40, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: String(
                        instrument["size_in_crore"] == null
                          ? "NA"
                          : instrument["size_in_crore"].toFixed(2)
                      ),
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  width: { size: 40, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: instrument["nature_of_assignment"],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  width: { size: 40, type: WidthType.PERCENTAGE },
                }),
              ],
            })
          );
        });
        serial_number++;
      });

      console.log(
        "tableRows================================================>",
        table_rows
      );

      const table_rows_container = new Table({
        alignment: AlignmentType.CENTER,
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: table_rows,
      });

      const doc = new Document({
        styles: {
          paragraphStyles: [
            {
              id: "Heading1",
              name: "Heading 1",
              basedOn: "Normal",
              next: "Normal",
              quickFormat: true,
              run: {
                size: 24,
                bold: true,
                font: "Times New Roman",
              },
              paragraph: {
                spacing: {
                  after: 120,
                },
              },
            },
            {
              id: "Heading2",
              name: "Heading 2",
              basedOn: "Normal",
              next: "Normal",
              quickFormat: true,
              run: {
                size: 20,
                bold: true,
                underline: {
                  type: UnderlineType.SINGLE,
                  color: "000000",
                },
              },
              paragraph: {
                spacing: {
                  before: 100,
                  after: 100,
                },
              },
            },
            {
              id: "Heading3",
              name: "Heading 3",
              basedOn: "Normal",
              next: "Normal",
              quickFormat: true,
              run: {
                size: 20,
                bold: true,
              },
              paragraph: {
                spacing: {
                  before: 100,
                  after: 100,
                },
              },
            },
            {
              id: "Heading4",
              name: "Heading 4",
              basedOn: "Normal",
              next: "Normal",
              quickFormat: true,
              run: {
                size: 20,
                bold: true,
              },
              paragraph: {
                spacing: {
                  before: 100,
                  after: 100,
                },
              },
            },
            {
              id: "aside",
              name: "Aside",
              basedOn: "Normal",
              next: "Normal",
              run: {
                color: "999999",
                italics: true,
              },
              paragraph: {
                indent: {
                  left: 720,
                },
                spacing: {
                  line: 276,
                },
              },
            },
          ],
        },
        sections: [
          {
            properties: {},
            children: [
              heading,
              contact_info_1,
              contact_info,
              contact_info_2,
              contact_info_3,
              cin,
              agenda_line,
              meeting_detail_head,
              table_header,
              table_rows_container,
              date,
            ],
          },
        ],
      });

      const doc_url_promise = new Promise((resolve, reject) => {
        Packer.toBuffer(doc).then(async (buffer) => {
          let doc_fs = path;
          let pdf_fs = "generated/Sample_Document.pdf";
          writeFileSync(doc_fs, buffer);

          docxConverter(doc_fs, pdf_fs, function (err, result) {
            if (err) {
              console.log(err);
            }
          });

          const docx = readFileSync(path);

          document_url = await UPLOAD_TO_AZURE_STORAGE(docx, {
            path: doc_fs,
          });

          await RatingCommitteeMeetingDocument.create({
            uuid: uuidv4(),
            path: document_url,
            is_active: true,
            rating_committee_meeting_id:
            data.docs_data[0].instruments[0].rating_committee_meeting_id,
            doc_type: "docx",
            document_type_id: document_type_details.id,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: request.user.id,
          });
    

          resolve(document_url);
        });
      });

      const document_link = await doc_url_promise;

      var response = {};
      response["uuid"] = uuidv4();
      response["data"] = data;
      response["document_url"] = document_link;
      reply.send(response);

      //       var header = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><title>AGENDA-DOC</title>

      //       </head>
      //       <body>
      //       `;

      //       var html = header;

      //       var headerHTMLString = `<div style="text-align: center; width: 100%;">
      //       <p style="text-align: center">
      //         <strong style="font-size: 12pt; font-family: 'Cambria', serif;">I</strong>
      //         <strong style="font-size: 12pt; font-family: 'Cambria', serif;">NFOMERICS</strong>
      //         <strong style="font-size: 12pt; font-family: 'Cambria', serif;"> V</strong>
      //         <strong style="font-size: 10pt; font-family: 'Cambria', serif; margin-right: 4.5rem">ALUATION AND</strong>
      //         <strong style="font-size: 12pt; font-family: 'Cambria', serif;"> R</strong>
      //         <strong style="font-size: 10pt; font-family: 'Cambria', serif; margin-right: 4.5rem">ATING</strong>
      //         <strong style="font-size: 12pt; font-family: 'Cambria', serif;"> P</strong>
      //         <strong style="font-size: 10pt; font-family: 'Cambria', serif; margin-right: 4.5rem">RIVATE</strong>
      //         <strong style="font-size: 12pt; font-family: 'Cambria', serif;"> L</strong>
      //         <strong style="font-size: 10pt; font-family: 'Cambria', serif;">IMITED</strong>
      //       </p>
      //       <p style="text-align: center">
      //           <span style="font-size: 8pt; font-family: 'Cambria', serif;"><strong>Head Office-</strong>Flat No. 104/106/108, Golf Apartments, Sujan Singh Park,</span>
      //       </p>
      //       <div style="text-align: center; width: 100%; display: flex; justify-content: center;">
      //   <p style="text-align: center; width: 80%; margin: 0 auto; padding: 0">
      //       <span style="font-size: 8pt; font-family: Cambria, serif; text-align: center;"><strong>Corporate Office:</strong>1102, 1103 & 1104 -B Wing, Kanakia Wallstreet, Off. Andheri Kurla Road, Andheri (East), Mumbai-400093.</span>
      //   </p>
      // </div>
      //       <p style="text-align: center">
      //           <span style="font-size: 8pt; font-family: 'Cambria', serif;">Email: </span>
      //           <a href="mailto:vma@infomerics.com" target="_blank" style="font-size: 8pt; font-family: 'Cambria', serif; color: rgb(5, 99, 193);">vma@infomerics.com</a>
      //           <span style="font-size: 8pt; font-family: 'Cambria', serif;">, Website: </span>
      //           <span style="font-size: 8pt; font-family: 'Cambria', serif; color: rgb(5, 99, 193);">www.infomerics.com</span>
      //       </p>
      //       <p style="text-align: center">
      //           <span style="font-size: 8pt; font-family: 'Cambria', serif;">Phone: +91-11 24601142, 24611910, Fax: +91 11 24627549</span>
      //       </p>
      //       <p style="text-align: center">
      //           <strong style="font-size: 8; font-family: 'Cambria', serif;">(CIN: U32202DL1986PTC024575)</strong>
      //       </p>
      //       <p>
      //           <br>
      //       </p>
      //       </div>`

      //       html += `
      //       <p class="ql-align-center" style="text-align: center">
      //         <u>AGENDA</u>
      //       </p>
      //       <br>
      //       <br>
      //       <p class="ql-align-justify"><span class="agenda-details">Agenda for <span class="current_meet"> Rating Committee Meeting (RCM) for the Financial Year ${moment(data.docs_data[0].instruments[0].meeting_at).subtract(1, 'year').format('YYYY')} - ${moment(data.docs_data[0].instruments[0].meeting_at).format('YYYY')} of Infomerics Valuation and Rating Private Limited to be held on ${moment(data.docs_data[0].instruments[0].meeting_at).format('dddd, Do MMMM YYYY').replace(/(\d)(st|nd|rd|th)/g, `$1<sup>$2</sup>`)} at ${moment(data.docs_data[0].instruments[0].meeting_at).format('hh:mm A')}  through ${data.docs_data[0].instruments[0].meeting_type} conference.</span></span></p>
      //       <br>

      //         <table style="border-collapse: collapse;">
      //           <thead>
      //             <tr>
      //               <th class="main-table-heading" colspan=6 style="text-align: center">Agenda</th>
      //             </tr>
      //             <tr>
      //               <th>A</th>
      //               <th colspan=5>To confirm the minutes of the <span class="last_meet"> Committee meeting held on ${data.penultimate_meeting_details.length > 0 ? moment(data.penultimate_meeting_details[0].meeting_at).format('Do MMMM YYYY').replace(/(\d)(st|nd|rd|th)/g, `$1<sup>$2</sup>`) : "Nil"}.</span></th>
      //             </tr>
      //             <tr>
      //               <th>B</th>
      //               <th colspan=5>To consider following proposal for rating: -</th>
      //             </tr>
      //             <tr>
      //               <th></th>
      //               <th>S. No</th>
      //               <th>Name of the Entity</th>
      //               <th>Instrument / Facility</th>
      //               <th>Size (Rs. crore)</th>
      //               <th>Nature of Assignment</th>
      //             <tr>
      //           </thead>
      //           <tbody class="tbody">`
      //             for (let i = 0; i < data.docs_data.length; i++) {
      //               html += `
      //               <tr>
      //                 <td rowspan=${data.docs_data[i].instruments.length + 1}></td>
      //                 <td rowspan=${data.docs_data[i].instruments.length + 1}>${i + 1}.</td>
      //                 <td rowspan=${data.docs_data[i].instruments.length + 1}>${data.docs_data[i].entity_name }</td>
      //               </tr>`
      //               for (let j = 0; j < data.docs_data[i].instruments.length; j++) {
      //                 html += `
      //                 <tr style="border-top: 0; margin-top: 0; padding: 4px">
      //                   <td>${data.docs_data[i].instruments[j].instrument ? data.docs_data[i].instruments[j].instrument : "-" }</td>
      //                   <td style="text-align: right;">${data.docs_data[i].instruments[j].size_in_crore ? data.docs_data[i].instruments[j].size_in_crore.toFixed(2) : "-" }</td>
      //                   <td>${data.docs_data[i].instruments[j].nature_of_assignment ? data.docs_data[i].instruments[j].nature_of_assignment : "-" }</td>
      //                 </tr>
      //                 `
      //               }
      //             }
      //           html += `</tbody>
      //           <p class="date">Date:  ${moment(data.docs_data[0].instruments[0].meeting_at).format('Do MMMM YYYY').replace(/(\d)(st|nd|rd|th)/g, `$1<sup>$2</sup>`)}</p>
      //     </body>`

      //     const doc_url_promise = new Promise((resolve, reject) => {
      //       async function createDoc(html) {
      //         const fileBuffer = await HTMLtoDOCX(html, headerHTMLString, {
      //           table: { row: { cantSplit: true } },
      //           footer: true,
      //           header: true,
      //           pageNumber: false,
      //         });

      //         writeFileSync(path, fileBuffer, (error) => {
      //           if (error) {
      //             console.log("Docx file creation failed");
      //             return;
      //           }
      //         });

      //         const document_link = await UPLOAD_TO_AZURE_STORAGE(fileBuffer, {
      //           path: path,
      //         });

      //         if (!document_link) {
      //           reject({
      //             success: false,
      //             error: "Document Link Not Available",
      //           });
      //         }

      //         await RatingCommitteeMeetingDocument.create({
      //           uuid: uuidv4(),
      //           path: document_link,
      //           is_active: true,
      //           // rating_committee_meeting_id: data.docs_data[0].agenda_table_data_1[0].instruments[0].rating_committee_meeting_id,
      //           doc_type: "docx",
      //           created_at: new Date(),
      //           updated_at: new Date(),
      //           created_by: request.user.id,
      //         });

      //         resolve(document_link);
      //       }
      //       createDoc(html);
      //     });

      //     const document_url = await doc_url_promise;

      //     var response = {};
      //     response["uuid"] = uuidv4();
      //     response["data"] = data
      //     response["document_url"] = document_url;
      //     reply.send(response);
    } catch (error) {
      console.log("Error", error);
      return reply.send({
        error: String(error),
      });
    }
  });

  fastify.post("/agenda/generate/pdf", async (request, reply) => {
    try {
      const header = () => {
        return `
        <div style="text-align: center; width: 100%;">
          <p style="text-align: center">
            <strong style="font-size: 12pt; font-family: Cambria, serif;">I</strong>
            <strong style="font-size: 10pt; font-family: Cambria, serif; margin-right: 4.5rem">NFOMERICS</strong>
            <strong style="font-size: 12pt; font-family: Cambria, serif;">V</strong>
            <strong style="font-size: 10pt; font-family: Cambria, serif; margin-right: 4.5rem">ALUATION AND</strong>
            <strong style="font-size: 12pt; font-family: Cambria, serif;">R</strong>
            <strong style="font-size: 10pt; font-family: Cambria, serif; margin-right: 4.5rem">ATING</strong>
            <strong style="font-size: 12pt; font-family: Cambria, serif;">P</strong>
            <strong style="font-size: 10pt; font-family: Cambria, serif; margin-right: 4.5rem">RIVATE</strong>
            <strong style="font-size: 12pt; font-family: Cambria, serif;">L</strong>
            <strong style="font-size: 10pt; font-family: Cambria, serif;">IMITED</strong>
          </p>
      <br>
      <p style="text-align: center">
          <span style="font-size: 8pt; font-family: Cambria, serif;"><strong>Head Office-</strong> Flat No. 104/106/108, Golf Apartments, Sujan Singh Park, New Delhi-110003</span>
      </p>
      <div style="text-align: center; width: 100%; display: flex; justify-content: center;">
        <p style="text-align: center; width: 80%; margin: 0 auto; padding: 0">
            <span style="font-size: 8pt; font-family: Cambria, serif; text-align: center;"><strong>Corporate Office:</strong>1102, 1103 & 1104 -B Wing, Kanakia Wallstreet, Off. Andheri Kurla Road, Andheri (East), Mumbai-400093.</span>
        </p>
      </div>
      <p style="text-align: center">
          <span style="font-size: 8pt; font-family: Cambria, serif;">Email: </span>
          <a href="mailto:vma@infomerics.com" target="_blank" style="font-size: 8pt; font-family: Cambria, serif; color: rgb(5, 99, 193);">vma@infomerics.com</a>
          <span style="font-size: 8pt; font-family: Cambria, serif;">, Website: </span>
          <span style="font-size: 8pt; font-family: Cambria, serif; color: rgb(5, 99, 193);">www.infomerics.com</span>
      </p>
      <p style="text-align: center">
          <span style="font-size: 8pt; font-family: Cambria, serif;">Phone: +91-11 24601142, 24611910, Fax: +91 11 24627549</span>
      </p>
      <p style="text-align: center">
          <strong style="font-size: 8pt; font-family: Cambria, serif;">(CIN: U32202DL1986PTC024575)</strong>
      </p>
      <p>
          <br>
      </p>
      <p>
          <br>
      </p>
      </div>
        `;
      };

      const footer = () => {
        return `
        <p style="border-top: 1px solid black;font-weight: 600;font-size: 9px;color: #000000;text-align:justify;text-align-last:center; padding:10px 30px;">Corporate Office: Office No. 1105, B Wing, Kanakia Wallstreet,Off. Andheri Kurla Road, Andheri (East), Mumbai-400093, India. Phone : +91-22-43471920 , 40036966 , Email : mumbai@infomerics.com, Website : www.infomerics.com <br />Registered & Head Office : Flat No. 104/108 1st Floor Golf Apartment Sujan Singh Park, New Delhi-110003, India Phone : +91-11-26401142 , 24611910 , 24649428, Fax: +91-11-24627549 , Email : vma@infomerics.com CIN : U32202DL1986PTC024575</p>
        `;
      };

      await CHECK_PERMISSIONS(request, "Rating.Letter");

      const { params } = request.body;

      const document_type_details = await DocumentType.findOne({
        where: {
          name: "agenda",
          is_active: true
        }
      })

      const GENERATE_UUID = uuidv4();

      const path = `generated/output_rating_sheet_${GENERATE_UUID}.pdf`;

      const data = await GET_AGENDA_SHEET_DATA({
        uuid: params["rating_committee_meeting_uuid"],
        is_active: true,
      });

      const browser = await puppeteer.launch({
        headless: true,
        args: ["--headless"],
      });
      const page = await browser.newPage();
      const html = await fastify.view(
        `templates/pdf/${params["filename"]}.pug`,
        { data: data, require: require }
      );
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      await page.addStyleTag({
        content: ".date-time,.pageNumber,.title{ display: none !important; }",
      });
      await page.emulateMediaType("print");
      await page.pdf({
        displayHeaderFooter: true,
        headerTemplate: header(),
        footerTemplate: footer(),
        path: path,
        margin: { top: "180px", right: "10px", bottom: "100px", left: "10px" },
        printBackground: true,
        format: "A4",
      });
      await browser.close();

      const pdf = readFileSync(path);

      const document_url = await UPLOAD_TO_AZURE_STORAGE(pdf, {
        path: path,
      });

      await RatingCommitteeMeetingDocument.create({
        uuid: uuidv4(),
        path: document_url,
        is_active: true,
        rating_committee_meeting_id:
          data.docs_data[0].instruments[0].rating_committee_meeting_id,
        doc_type: "pdf",
        document_type_id: document_type_details.id,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
      });

      var response = {};
      response["uuid"] = uuidv4();
      (response["document_url"] = document_url),
        // (response["data"] = data);
        reply.send(response);
    } catch (error) {
      console.log("Error", error);
      return reply.send({
        error: String(error),
      });
    }
  });
}

module.exports = {
  agenda_docs_routes,
};
