const { writeFileSync, readFileSync } = require("fs");
const moment = require("moment");
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const { UPLOAD_TO_AZURE_STORAGE } = require("../../../helpers");
const { CHECK_PERMISSIONS } = require("../../../helpers");
const { RatingCommitteeMeetingDocument } = require("../../../models/modules/rating-committee");
const { GET_RATING_LETTER_DATA } = require("../../../repositories/RatingLetterData");
const HTMLtoDOCX = require('html-to-docx');

async function rating_letter_docs_routes(fastify) {
  fastify.post('/rating_letter/generate/docx', async (request, reply) => {
    try {

      await CHECK_PERMISSIONS(request, 'Rating.Letter')

      const GENERATE_UUID = uuidv4();

      const path = `generated/rating_letter_doc_${GENERATE_UUID}.docx`

      const { params } = request.body;

      const data = await GET_RATING_LETTER_DATA({
        rating_committee_meeting_params: {
        uuid: params["rating_committee_meeting_uuid"],
        is_active: true
        }, company_params: {
        uuid: params["company_uuid"],
        is_active: true
      }})

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
      <title>MOM-DOC</title>
      <head>
      <style>
        * {
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Arial';
        }
        section{
          margin: 0 1.5rem;
        }
        ol {
          margin-left: 2rem;
        }
        p{
        
        }
        .letter-date{
          text-align: right;
        }
        .table-div{
          overflow-x: auto;
          margin: 1rem
        }
        table {
          border-collapse: collapse;
          width: 100%;
          border: 1px solid black;
          border-spacing: 0;
        }
        thead {
          color: #111;
          height: 25px;
        }
        th, td{
          border: 1px solid black;
          text-align: left;
          padding: 8px;
        }
      </style>
      </head>
      <body style="font-family: 'Arial';">`
    
      var html = header
          html += `
          <main> 
          <section style="margin: 0 1.5rem;">
            <p>Shri/Mr. ${data[0].company_contact}</p>
            <p>${data[0].designation}</p>
            <p>${data[0].company_name}</p>
            <p>${data[0].address_1}</p>
            <p class="letter-date" style="text-align: right;">${moment(data.rating_letter_date).format('dddd, Do MMMM YYYY')}</p>
          </section>
      
          <section style="margin: 0 1.5rem;">
            <p>Dear Sir,</p> 
            <strong>Assignment of rating to the Bank facilities/NCD of ${data[0].company_name}/ Assignment of Issuer rating</strong>
            <p>Please refer to the Mandate contract dated <strong>Month XX, 20XX on the captioned subject and your letter/E-Mail dated</strong> <strong>Month XX, 20XX accepting our rating & use thereof.</strong>
            </p>
            <p>1. Our Rating Committee has assigned the following ratings:</p>
          </section>
          <div style="overflow-x: auto; margin: 1rem">
            <table style="border-collapse: collapse; width: 100%; border: 1px solid black; border-spacing: 0;"> 
              <thead style="color: #111; height: 25px;"> 
                <tr> 
                  <th style="border: 1px solid black; text-align: left; padding: 8px;">Instrument / Facility</th>
                  <th style="border: 1px solid black; text-align: left; padding: 8px;">Amount (Rs. Crore)</th>
                  <th style="border: 1px solid black; text-align: left; padding: 8px;">Ratings</th> 
                  <th style="border: 1px solid black; text-align: left; padding: 8px;">Rating Action</th> 
                </tr>
              </thead>`

              data.forEach(item => {
                html += `
                <tbody> 
                  <tr> 
                    <td style="border: 1px solid black; text-align: left; padding: 8px;">${getInstrumentType(item)} ${item.category_text}</td>
                    <td style="border: 1px solid black; text-align: left; padding: 8px;">${item.instrument_size_number}</td>
                    <td style="border: 1px solid black; text-align: left; padding: 8px;">${item.rating}</td>
                    <td style="border: 1px solid black; text-align: left; padding: 8px;">${item.rating_action ? item.rating_action : "-"}</td>
                  </tr>
                </tbody>`
              })

            html += `
            </table>
            </div>
          <section style="margin: 0 1.5rem;"> 
            <p>2. Details of the credit facilities are attached in <strong>Annexure I. Our rating symbols for long-term and short-term ratings and explanatory notes thereon are attached in</strong> <strong>Annexure II.</strong>
            </p>
            <p>3. The press release for the rating(s) will be communicated to you shortly.</p>
            <p>4. If the proposed long term / short term facility (if any) is not availed within a period of six months / three months respectively from the date of this letter, then the rating may please be revalidated from us before availing the facility.</p>
            <p>5. The above rating is normally valid for a period of one year from the date of our <strong>initial communication of rating to you (that is. <strong>Month XX, 20XX).</strong> 
            </p>
            <p>6. A formal surveillance/review of the rating is normally conducted within 12 months from the date of initial rating/last review of the rating. However, INFOMERICS reserves the right to undertake a surveillance/review of the rating more than once a year if in the opinion of INFOMERICS, circumstances warrant such surveillance/review.</p>
            <p>7. Further in terms of the mandate executed with us, you have undertaken to comply with the following: -
              <ol style="margin-left: 2rem;">
                <li>Inform INFOMERICS before availing any new bank facility/ies and/or of any changes in the terms, conditions and/or size of the facilities rated.</li>
                <li>Furnish all material information and any other information in a timely manner as may be required by INFOMERICS, for monitoring the Rating assigned during the tenure of the bank facilities rated by INFOMERICS.</li>
                <li>Co-operate with and enable INFOMERICS to arrive at and maintain a true and fair rating and in particular, provide INFOMERICS with true, adequate, accurate, fair, and timely information for the purpose.</li>
                <li>Inform INFOMERICS, in writing and in a timely manner, of any other developments which may have a direct or indirect impact on the CLIENT’s debt servicing capability including any proposal for re-schedulement or postponement of the repayment programs of the dues/ debts of the CLIENT with any lender (s)/ investor (s) within seven days from the date of such developments/ proposal.</li>
              </ol>
            </p>
            <p>8. <strong>You shall provide us a No Default Statement as at the last date of the month on the first date of succeeding month without fail.</strong>The NDS shall be mailed every month to 
              <a href="mailto:nds@Infomerics.com" target="_blank" rel="noreferrer">nds@Infomerics.com</a> and to the mail id of the undersigned.
            </p>
            <p> 
              <strong>You shall provide the quarterly performance results/quarterly operational data (being submitted to Banks) to us within 6 weeks from the close of each calendar quarter for our review/monitoring.</strong>
            </p>
            <p>10. You shall furnish all material information and any other information called for by INFOMERICS in a timely manner, for monitoring the rating assigned by INFOMERICS. In the event of failure on your part in furnishing such information, to carry out continuous monitoring of the rating of the bank facilities, INFOMERICS shall carry out the review/annual surveillance on the basis of best available information throughout the lifetime of such bank facilities as per the policy of INFOMERICS.</p>
            <p>11.  INFOMERICS reserves the right to withdraw/revise/reaffirm the rating assigned on the basis of new information. INFOMERICS is also entitled to publicise/disseminate such withdrawal/revision in the assigned rating in any manner considered appropriate by it, without reference to you.</p>
            <p>12. Please note that INFOMERICS ratings are not recommendations to buy, sell or hold any security or to sanction, renew, disburse or recall the bank facilities. INFOMERICS do not take into account the sovereign risk, if any, attached to the foreign currency loans, and the ratings are applicable only to the rupee equivalent of these loans.</p>
            <p>13. In case you require any clarification, you are welcome to communicate with us in this regard.</p>
            <br>
            <p>Thanking you,</p>
            <p>With Regards,</p>
            <br>
            <div style="display: flex; justify-content: space-between;"> 
              <div>  
                <p> 
                  <strong>(Name)</strong>
                </p>
                <p>Designation</p> 
                <p>Email:</p> 
              </div>
              <div> 
                <p> 
                  <strong>(Name)</strong>
                </p>
                <p>Designation</p> 
                <p>Email:</p>
              </div>
            </div>
            <br>
            <br>
          </section>
          <p style="border: 1px solid black; margin: 0 1rem; font-size: 1rem">
            <strong>Disclaimer:</strong>  
            Infomerics ratings are based on information provided by the issuer on an ‘as is where is’ basis. Infomerics credit ratings are an opinion on the credit risk of the issue / issuer and not a recommendation to buy, hold or sell securities.  Infomerics reserves the right to change, suspend or withdraw the credit ratings at any point in time. Infomerics ratings are opinions on financial statements based on information provided by the management and information obtained from sources believed by it to be accurate and reliable. The credit quality ratings are not recommendations to sanction, renew, disburse or recall the concerned bank facilities or to buy, sell or hold any security. We, however, do not guarantee the accuracy, adequacy or completeness of any information which we accepted and presumed to be free from misstatement, whether due to error or fraud. We are not responsible for any errors or omissions or for the results obtained from the use of such information. Most entities whose bank facilities/instruments are rated by us have paid a credit rating fee, based on the amount and type of bank facilities/instruments. In case of partnership/proprietary concerns/Association of Persons (AOPs), the rating assigned by Infomerics is based on the capital deployed by the partners/proprietor/ AOPs and the financial strength of the firm at present. The rating may undergo change in case of withdrawal of capital or the unsecured loans brought in by the partners/proprietor/ AOPs in addition to the financial performance and other relevant factors.
          </p>
        </main>
        </body>
        </html>`
         
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
                rating_committee_meeting_id: data.rating_committee_meeting_id,
                doc_type: "docx",
                created_at: new Date(),
                updated_at: new Date(),
                created_by: request.user.id
              })
    
              resolve(document_link)
            }
            createDoc(html)
          })
    
          const document_url = await doc_url_promise
    
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

  fastify.post('/rating_letter/generate/pdf', async (request, reply) => {
    try {

      await CHECK_PERMISSIONS(request, 'Rating.Letter')

      const { params } = request.body

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
          <span style="font-size: 8pt; font-family: Cambria, serif;">Head Office - Flat No. 104/106/108, Golf Apartments, Sujan Singh Park,</span>
      </p>
      <p style="text-align: center">
          <span style="font-size: 8pt; font-family: Cambria, serif;">&nbsp;New Delhi-110003,</span>
      </p>
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

      const GENERATE_UUID = uuidv4();

      const path = `generated/rating_letter_pdf_${GENERATE_UUID}.pdf`

      const data = await GET_RATING_LETTER_DATA({
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
        headerTemplate: header(),
        path: path,
        margin: { top: '160px', bottom: '100px' },
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
        rating_committee_meeting_id: data.rating_committee_meeting_id,
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
    rating_letter_docs_routes
};