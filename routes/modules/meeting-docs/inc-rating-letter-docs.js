const { writeFileSync, readFileSync } = require("fs");
const moment = require("moment");
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const { UPLOAD_TO_AZURE_STORAGE } = require("../../../helpers");
const { CHECK_PERMISSIONS } = require("../../../helpers");
const { RatingCommitteeMeetingDocument } = require("../../../models/modules/rating-committee");
const HTMLtoDOCX = require('html-to-docx');
const { GET_INC_RATING_LETTER_DATA } = require("../../../repositories/INCRatingLetterData");

async function inc_rating_letter_docs_routes(fastify) {
  fastify.post('/inc_rating_letter/generate/docx', async (request, reply) => {
    try {

      await CHECK_PERMISSIONS(request, 'Rating.Letter')

      const GENERATE_UUID = uuidv4();

      const path = `generated/inc_rating_letter_doc_${GENERATE_UUID}.docx`

      const { params } = request.body;

      const data = await GET_INC_RATING_LETTER_DATA({
        rating_committee_meeting_params: {
        uuid: params["rating_committee_meeting_uuid"],
        is_active: true
        }, company_params: {
        uuid: params["company_uuid"],
        is_active: true
      }})

      console.log("data in inc rating letter=======>", data);

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
      <html lang="en">
      <head>
      <meta charset="UTF-8" />
      <title>INC-Rating-Letter-DOC</title>
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
    `
    
      var html = header
          html += `
            <body> 
             <header> 
               <section> 
                 <h1>INC Rating Letter</h1> 
                 <br>
                 <p style="margin-bottom: 6rem">Shri/Ms.</p>
                 <p style="text-align: center"><strong><u>Confidential</u></strong></p>
                 <p>Dear Sir/Madam,</p>
                 <p style="text-align: center; margin-top: 2rem"><strong><u>Credit rating for bank facilities/NCD/CP/Other</u></strong></p>
               </section>
             </header>
             <main> 
               <section> 
                 <ol> 
                   <li>This is with reference to our rating agreement  dated Month XX, 20XX, wherein your company/entity had agreed to provide information including No Default statement on monthly basis and to pay annual surveillance fee [I1] to INFOMERICS to monitor and conduct the surveillance/review of the Rating(s) over the lifetime of the rated Debt Instrument</li>
                   <li>Your company/entity has not submitted No default statement (NDS), data for review, despite repeated requests by INFOMERICS (last E-Mail dated<strong>Month XX, 20XX)</strong></li>
                   <li>In the absence of adequate co-operation from your end despite repeated requests, Our Rating Committee has reviewed the following ratings:</li>
                 </ol>
                       <table> 
                         <thead> 
                           <tr> 
                             <th>Facilities/Instruments</th>
                             <th style="text-align: center">Amount (Rs. Crore)</th>
                             <th style="text-align: center">Current Ratings</th>
                             <th style="text-align: center">Previous Ratings</th> 
                             <th style="text-align: center">Rating Action</th> 
                           </tr>
                         </thead>`

                         data.forEach(item => {
                            html += `
                            <tbody>
                            each company, key in table_data     
                             <tr> 
                                <td>${getInstrumentType(item)} ${item.category_text}</td>
                                <td style="text-align: center">${item.instrument_size_number != null ? item.instrument_size_number : "-"}</td>
                                <td style="text-align: center">${item.rating != null ? item.rating : "-"}</td>
                                <td style="text-align: center">${item.previous_rating != null ? item.previous_rating : "-"}</td>
                                <td style="text-align: center">${item.rating_action != null ? item.rating_action : "-"}</td>
                              </tr>`
                         })
                         
                    html += `<tr class="total">
                               <td style="font-weight: 600">Total</td>
                               <td style="font-weight: 600; text-transform: capitalize; text-align: center;" class="amount">XX</td>
                               <td></td>
                               <td></td> 
                               <td></td>
                           </tr>
                         </tbody>
                       </table>
                 <ol style="list-style-type: circle;">
                    <li>
                     <p>* Issuer not cooperating; Based on best available information</p>
                    </li>
                   <li>The current rating action has been taken by INFOMERICS in accordance with SEBI’s Circular no. SEBI/HO/MIRSD/MIRSD4/CIR/P/2016/119 dated November 1, 2016 on the basis of best available information on the company’s performance.
                     <ol style="margin: 0 1rem">
                       <li>Our rating symbols for long-term and short-term ratings and explanatory notes thereon are attached in <strong>Annexure I.</strong></li>
                       <li>We would be issuing a Press Release  to inform the regulators, investors and public at large. The press release for the rating(s) will be communicated to you shortly.</li>
                       <li>INFOMERICS reserves the right to undertake a surveillance/review of the rating(s) from time to time, based on circumstances warranting such review till such time the rated debt continues as per our policy on Non Cooperation by clients on our website.</li>
                       <li> 
                         <strong>However in  the meanwhile, you shall continue to provide us with a No Default Statement as at the last date of the month on the first date of succeeding month without fail.</strong>The NDS shall be mailed every month to <a href="mailto:nds@Infomerics.com" target="_blank" rel="noreferrer">nds@Infomerics.com</a> and to the mail id of the undersigned.
                       </li>
                       <li>As and when your company commences active cooperation with Infomerics by way of furnishing requisite information/ surveillance fees as applicable, the rating would be reviewed in order to remove it from Issuer Not Cooperating (INC) Category</li>
                       <li>Please note that INFOMERICS ratings are not recommendations to buy, sell or hold any security or to sanction, renew, disburse or recall the bank facilities. INFOMERICS do not take into account the sovereign risk, if any, attached to the foreign currency loans, and the ratings are applicable only to the rupee equivalent of these loans.</li>
                       <li>Users of this rating may kindly refer our website <a rel="noreferrer" href="https://www.infomerics.com/" target="_blank">www.infomerics.com</a> for latest update on the outstanding rating.
                       </li>
                     </ol>
                   </li>
                 </ol>
               </section>
             </main>
             <footer> 
               <p>Thanking You</p> 
               <p>Yours faithfully,</p>
               <br>
               <div style="display: flex;"> 
                   <div style="display: flex;">  
                     <p><strong>${data[0].rating_analyst}</strong></p>
                     <p>Rating Analyst</p> 
                     <a href=${`mailto:ra_email`} target="_blank" rel="noreferrer">${data[0].rating_analyst_email}</a> 
                   </div>
                   <div> 
                     <p><strong>${data[0].group_head}</strong></p>
                     <p>Group Head</p>
                     <a href=${`mailto:gh_email`} target="_blank" rel="noreferrer">${data[0].group_head_email}</a>
                   </div>
               </div>
             </footer>
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

  fastify.post('/inc_rating_letter/generate/pdf', async (request, reply) => {
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

      const path = `generated/inc_rating_letter_pdf_${GENERATE_UUID}.pdf`

      const data = await GET_INC_RATING_LETTER_DATA({
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
    inc_rating_letter_docs_routes
};