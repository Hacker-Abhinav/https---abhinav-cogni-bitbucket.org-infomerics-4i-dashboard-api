const { writeFileSync, readFileSync } = require("fs");
const moment = require("moment");
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const { UPLOAD_TO_AZURE_STORAGE, INWORDS } = require("../../../helpers");
const { CHECK_PERMISSIONS } = require("../../../helpers");
const { RatingCommitteeMeetingDocument } = require("../../../models/modules/rating-committee");
const HTMLtoDOCX = require('html-to-docx');
const { GET_REJECTION_OF_REPRESENTATION_DATA } = require("../../../repositories/RejectionOfRepresentationData");

async function rejection_representation_rl_docs_routes(fastify) {
  fastify.post('/rejection_representation_rating_letter/generate/docx', async (request, reply) => {
    try {

      await CHECK_PERMISSIONS(request, 'Rating.Letter')

      var document_url = ''

      const GENERATE_UUID = uuidv4();

      const path = `generated/rejection_representation_rl_doc_${GENERATE_UUID}.docx`

      const { params } = request.body;

      const data = await GET_REJECTION_OF_REPRESENTATION_DATA({
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
      <header> 
      <section> 
        <h1>Rejection of Representation Rating Letter</h1> 
        <br>
        <p style="margin-bottom: 6rem">Shri/Ms.</p>
      </section>
  </header>
<main>
  <section> 
    <p style="text-align: center; margin-top: 2rem"><strong><u>Confidential</u></strong></p>
    <p>Dear Sir/Madam,</p>
    <p style="text-align: center; margin-top: 2rem"><strong><u>Credit rating for bank facilities</u></strong></p>
    <p style="width: 80%; margin: 0 auto 2rem auto;">Please refer to our provisional communication/Rating letter [I1] dated ${data.mandate_date[0].mandate_date ? data.mandate_date[0].mandate_date : "Nil"}, and your representation Letter/Email dated Month, 20XX on the above subject.</p>
    <p>1. The representation made by you was placed before the Reviewing authority as per the policy of the Company. However,  on  carefully examining  the representation made by you regarding the revision in Credit rating assigned, the committee has not observed any material information which can impact the rating already assigned. Therefore we regret to inform you that the rating assigned to you as under remains unchanged.</p>
  </section>
    <table> 
      <thead> 
        <tr> 
          <th>Facilities</th>
          <th style="text-align: center">Amount (Rs. Crore)</th>
          <th style="text-align: center">Ratings</th>
          <th style="text-align: center">Rating Action</th> 
        </tr>
      </thead>`
      data.rejection_of_representation.forEach(item => {
        html += `
        <tbody>   
          <tr> 
            <td>${item.category_text}</td> 
            <td style="text-align: center">${item.instrument_size_number}</td>
            <td style="text-align: center">${item.rating}</td>
            <td style="text-align: center">${item.rating_action ? item.rating_action : "-"}</td>
          </tr>`
      })
      
    html += `
    <tr class="total">
    <td style="font-weight: 600">Total</td>
    <td style="font-weight: 600; text-transform: capitalize; text-align: center;" class="total_amount">${data.sum_in_rated_facilities.length > 0 ? data.sum_in_rated_facilities[0].total : "-"}</td>
    <td></td>
    <td></td> 
    <td></td>
</tr>
</tbody>
    </table>
  <section> 
    <p>2. Our rating symbols for long-term and short-term ratings and explanatory notes thereon are annexed in <b>Annexure I.</b></p>
    <p>3.<b> In this connection, we assure you that the facts mentioned in your letter under reference were considered while deciding the rating (s).</b></p>
    <p>4. It may please be noted that this is a <b>provisional communication</b> made to you for your conveying the acceptance of the aforesaid rating and this communication cannot be used by you for any purpose. The final rating communication shall be sent to you soon after the acceptance of the aforesaid rating is conveyed to us.</p>
    <p>5. Please send us your acceptance for the aforesaid rating assigned in writing as per the attached <b>Annexure II within a period of five days from the date of this communication to enable us to issue the final rating letter.</b> Please note that the rating shall not be used for any purpose whatsoever if the rating is not accepted and communicated to us as per the prescribed format as aforesaid.</p>
    <p>6. However, in case you still choose not to accept the rating assigned,  Infomerics is entitled to disseminate the rating in its website as “Unaccepted’ within a <b>period of one month from the date of the provisional communication already conveyed to you.</b></p>
  </section>
</main>
<footer> 
  <p>We thank you for the opportunity given to us to serve you.</p>
  <br>
  <p>With regards,</p>
  <br>
  <br>
  <p> 
    <b>(Name):${data.rejection_of_representation.length > 0 ? data.rejection_of_representation[0].company_contact : "-"}</b>
  </p>
  <p>Designation: ${data.rejection_of_representation.length > 0 ? data.rejection_of_representation[0].designation : "-"}</p>
  <p>Email: ${data.rejection_of_representation.length > 0 ? data.rejection_of_representation[0].email : "-"}</p>
</footer>`

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
            rating_committee_meeting_id: data.rejection_of_representation[0].rating_committee_meeting_id,
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

  fastify.post('/rejection_representation_rating_letter/generate/pdf', async (request, reply) => {
    try {

      await CHECK_PERMISSIONS(request, 'Rating.Letter')

      const { params } = request.body

      const GENERATE_UUID = uuidv4();

      const path = `generated/rejection_representation_rl_pdf_${GENERATE_UUID}.pdf`

      const data = await GET_REJECTION_OF_REPRESENTATION_DATA({
        rating_committee_meeting_params: {
        uuid: params["rating_committee_meeting_uuid"],
        is_active: true
        }, company_params: {
          uuid: params["company_uuid"],
          is_active: true
        }})

        let total = 0

        if (data.sum_in_rated_facilities.length > 0) {
          total = INWORDS(data.sum_in_rated_facilities[0].total)
        } else {
          total = ''
        }

      const browser = await puppeteer.launch({
        headless: false,
        args: ['--headless']
      });
      const page = await browser.newPage();
      const html = await fastify.view(`templates/pdf/${params['filename']}.pug`, { data: data, require: require, total: total });
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
        rating_committee_meeting_id: data.rejection_of_representation[0].rating_committee_meeting_id,
        doc_type: "pdf",
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id
      })

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
}

module.exports = {
  rejection_representation_rl_docs_routes
};