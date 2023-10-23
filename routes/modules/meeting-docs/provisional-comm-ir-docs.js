const { writeFileSync, readFileSync } = require("fs");
const moment = require("moment");
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const { UPLOAD_TO_AZURE_STORAGE } = require("../../../helpers");
const { CHECK_PERMISSIONS } = require("../../../helpers");
const { RatingCommitteeMeetingDocument } = require("../../../models/modules/rating-committee");
const { GET_PROV_COMM_BLR_DATA } = require("../../../repositories/ProvisionalCommBLRData");
const HTMLtoDOCX = require('html-to-docx');

async function provisional_comm_ir_docs_routes(fastify) {
  fastify.post('/prov_comm_ir/generate/docx', async (request, reply) => {
    try {

      await CHECK_PERMISSIONS(request, 'Rating.Letter')

      var document_url = ''

      const GENERATE_UUID = uuidv4();

      const path = `generated/prov_comm_ir_doc_${GENERATE_UUID}.docx`

      const { params } = request.body;

      const data = await GET_PROV_COMM_BLR_DATA({
        rating_committee_meeting_params: {
        uuid: params["rating_committee_meeting_uuid"],
        is_active: true
        }, company_params: {
        uuid: params["company_uuid"],
        is_active: true
        }
      })

      function getInstrumentType(item) {
        if (item.is_long_term) {
          return "Long Term"
        } else if (item.is_short_term) {
          return "Short Term"
        } else {
          return "Long Term / Short Term"
        }
      }

      var header = `
      <!DOCTYPE html>
      <html lang="en"><head><meta charset="UTF-8" />
      <title>Provisional Communication BLR Document</title>
      <head>
      <style>
        * {
        margin: 0;
        padding: 0;
        }
        body {
          font-family: 'Arial';
        }
        section {
          margin: 0 1.5rem;
        }
        .table-div{
          margin: 0 1rem;
        }
        table{
          width: 100%;
        }
        th, td{
          border: 1px solid black;
          text-align: left;
          padding: 8px;
        }
        .text-center{
          text-align: center;
        }
        .text-underline{
          text-decoration: underline;
        }
      </style>
      </head>
      <body>`

      var html = header
      html += `
  <main> 
    <section>
      <p>Date</p>
      <p>Shri/Mr. ${data.meeting_data[0].company_contact}</p>
      <p>${data.meeting_data[0].designation}</p>
      <p>${data.meeting_data[0].company_name}</p>
      <p>${data.meeting_data[0].address_1}</p>
    </section>
    <h4 class="text-center text-underline">Request for Acceptance</h4>
    <section>
      <p>Dear Sir,</p>
      <br>
      <p>We have for reference the Mandate contract dated <strong>#{moment(date).format('MMMM, Do YYYY')} signed by you for Issuer rating of your company. The Rating Committee of Infomerics has assigned the following ratings:</strong></p> 
    </section>
        <table>
          <thead>  
            <tr>
              <th class="main-table-heading">Instrument / Facility</th>
              <th class="main-table-heading">Ratings</th>
              <th class="main-table-heading">Rating Action</th>
            </tr>
          </thead>`
          for (let i = 0; i < data.meeting_data.length; i++) {
            html +=  `<tbody>
            each instrument in instrument_data_1
              <tr>
                <td class="entity-name">${data.meeting_data[i].category_text}</td> 
                <td>${data.meeting_data[i].rating}</td>
                <td>${data.meeting_data[i].rating_action}</td> 
              </tr>
          </tbody>
        </table>`
          }
          
    html += `<section> 
      <p>It may please be noted that this is a provisional communication made to you for your conveying the acceptance of the aforesaid rating and this communication cannot be used by you for any purpose. The final rating communication shall be sent to you soon after the acceptance of the aforesaid rating is conveyed to us.</p>
      <p>Our rating symbols for Issuer rating along with explanatory notes thereon are annexed in <strong>Annexure I.</strong></p>
      <p>Please send us your aforesaid acceptance in writing as per the attached <strong>Annexure II</strong> and use there of within a maximum period of five days from the date of this communication. Please note that the rating shall not be used for any purpose whatsoever if the rating is not accepted and communicated to us as per the prescribed format as aforesaid. However, Infomerics is entitled to disseminate the rating in its website within a period of one month from the date of this communication even if the rating is not accepted.</p>
      <br>
      <p>Thanking you,</p>
      <br>
      <p>With regards,</p>
      <br> 
      <p><strong>(Name)</strong></p>
      <p>Designation</p>
      <p>Email:</p>
      <br>
    </section>
    <div class="disclaimer"> 
      <strong>Disclaimer:</strong> 
      <span>Infomerics ratings are based on information provided by the issuer on an ‘as is where is’ basis. Infomerics credit ratings are an opinion on the credit risk of the issue / issuer and not a recommendation to buy, hold or sell securities.  Infomerics reserves the right to change, suspend or withdraw the credit ratings at any point in time. Infomerics ratings are opinions on financial statements based on information provided by the management and information obtained from sources believed by it to be accurate and reliable. The credit quality ratings are not recommendations to sanction, renew, disburse or recall the concerned bank facilities or to buy, sell or hold any security. We, however, do not guarantee the accuracy, adequacy or completeness of any information which we accepted and presumed to be free from misstatement, whether due to error or fraud. We are not responsible for any errors or omissions or for the results obtained from the use of such information. Most entities whose bank facilities/instruments are rated by us have paid a credit rating fee, based on the amount and type of bank facilities/instruments. In case of partnership/proprietary concerns/Association of Persons (AOPs), the rating assigned by Infomerics is based on the capital deployed by the partners/proprietor/ AOPs and the financial strength of the firm at present. The rating may undergo change in case of withdrawal of capital or the unsecured loans brought in by the partners/proprietor/ AOPs in addition to the financial performance and other relevant factors.</span>
    </div>
    <br>
    <br>
    <h3 class="text-center">ANNEXURE I</h3>
    <br>
    <h4 style="margin-left: 2rem ">INFOMERICS Rating Scale for Issuer rating</h4>
    <div class='table-div'>
      <table>
        <thead>
          <tr>
            <th style="text-align: center;">Rating Scale</th>
            <th style="text-align: center;">Definition</th>
          </tr>
        </thead>
        <tbody> 
          each scale in rating_scale_data_1
            <tr>
              <td>#{scale.rating_scale}</td>
              <td>#{scale.definition}</td>
            </tr>
        </tbody>
      </table>
    </div>
    <section> 
      <i>INFOMERICS may apply '+' (plus) or '-' (minus) signs for ratings assigned ‘IVR AA' to ‘IVR C' to indicate their relative standing within the category.</i>
      <i>INFOMERICS may assign rating outlooks for ratings from IVR ‘AAA' to IVR ‘B'.</i>
      <br>
      <br>
    </section>
    <h3 class="text-center">ANNEXURE II</h3>
    <br>
    <p style="text-align: center;">(To be typed in the letterhead of the rated entity)</p>
    <section> 
      <p>Date:</p>
      <p>Infomerics Valuation and Rating Private Limited </p>
      <p>104/108, Golf Apartments, Sujan Singh Park </p>
      <p>New Delhi 110013</p>
      <p>Dear Sir,</p>
      <h class="text-center">Acceptance of Rating</h>
      <p>We hereby convey our acceptance to the following rating from Infomerics Valuation and Rating Private Limited as tabulated below:</p>
    </section>
    <div class='table-div'>
      <table>
        <thead>
          <tr>
            <th style="text-align: center;">Instrument / Facility</th>
            <th style="text-align: center;">Ratings</th>
            <th style="text-align: center;">Rating Action</th>
          </tr>
        </thead>
        <tbody> 
          each instrument in instrument_data_2
            <tr>
              <td>#{instrument.instrument_facility}</td>
              <td>#{instrument.ratings}</td>
              <td>#{instrument.rating_action}</td>
            </tr>
        </tbody>
      </table>
    </div>
    <section> 
      <p>For ${data.meeting_data[0].company_name}</p>
      <p>Authorised Signatory</p>
      <b>
      <p>Name: ${data.meeting_data[0].company_contact}</p>
      <p>Designation: ${data.meeting_data[0].designation}</p>
    </section>
  </main>
</body>`

    const doc_url_promise = new Promise((resolve, reject) => {
        async function createDoc(html) {
          const fileBuffer = await HTMLtoDOCX(html, null, {
            table: { row: { cantSplit: true } },
            footer: true,
            pageNumber: true,
          });
        
          writeFileSync(path, fileBuffer, (error) => {
            if (error) {
              console.log('Docx file creation failed');
              return;
            }
          });
      
          const document_link = await UPLOAD_TO_AZURE_STORAGE(fileBuffer, {
            path: path
          })

          if (!document_link) {
            reject({
              success: false,
              error: "Document Link Not Available"
            })
          }

          await RatingCommitteeMeetingDocument.create({
            uuid: uuidv4(),
            path: document_link,
            is_active: true,
            rating_committee_meeting_id: data.meeting_data[0].rating_committee_meeting_id,
            doc_type: "docx",
            created_at: new Date(),
            updated_at: new Date(),
            created_by: request.user.id
          })

          resolve(document_link)
        }
        createDoc(html)
      })

      document_url = await doc_url_promise

      var response = {};
      response['uuid'] = uuidv4();
      response['document_url'] = document_url
      reply.send(response);
    } catch (error) {
      console.log("Error", error);
      return reply.send({
        "error": String(error),
      })
    }
  });

  fastify.post('/prov_comm_ir/generate/pdf', async (request, reply) => {
    try {

      await CHECK_PERMISSIONS(request, 'Rating.Letter')

      const { params } = request.body

      const GENERATE_UUID = uuidv4();

      const path = `generated/prov_comm_ir_pdf_${GENERATE_UUID}.pdf`

      const data = await GET_PROV_COMM_BLR_DATA({
        rating_committee_meeting_params: {
        uuid: params["rating_committee_meeting_uuid"],
        is_active: true
        }, company_params: {
          uuid: params["company_uuid"],
          is_active: true
        }})

      const browser = await puppeteer.launch({
        headless: false,
        args: ['--headless']
      });
      const page = await browser.newPage();
      const html = await fastify.view(`templates/pdf/${params['filename']}.pug`, { data: data, require: require });
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      await page.emulateMediaType('screen');
      await page.pdf({
        displayHeaderFooter: true,
        path: path,
        margin: { top: '160px', right: '10px', bottom: '100px', left: '10px' },
        printBackground: true,
        format: 'A4',
      });
      await browser.close();

      const pdf = readFileSync(path)

      const document_url = await UPLOAD_TO_AZURE_STORAGE(pdf, {
        path: path
      })

      await RatingCommitteeMeetingDocument.create({
        uuid: uuidv4(),
        path: document_url,
        is_active: true,
        // rating_committee_meeting_id: data.prov_comm_blr_ratings[0].rating_committee_meeting_id ,
        doc_type: "pdf",
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id
      })

      var response = {};
      response['uuid'] = uuidv4();
      response['document_url'] = document_url,
      response['data'] = data
      reply.send(response);
    } catch (error) {
      console.log("Error", error);
      return reply.send({
        "error": String(error),
      })
    }
  });
}

module.exports = {
  provisional_comm_ir_docs_routes
};