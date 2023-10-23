const { writeFileSync, readFileSync } = require("fs");
const moment = require("moment");
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const { UPLOAD_TO_AZURE_STORAGE } = require("../../../helpers");
const { CHECK_PERMISSIONS } = require("../../../helpers");
const { RatingCommitteeMeetingDocument } = require("../../../models/modules/rating-committee");
const HTMLtoDOCX = require('html-to-docx');
const { GET_REMOVAL_CREDIT_WATCH_DATA } = require("../../../repositories/RemovalOfCreditWatch");

async function removal_of_credit_watch_docs_routes(fastify) {
  fastify.post('/removal_credit_watch/generate/docx', async (request, reply) => {
    try {

      await CHECK_PERMISSIONS(request, 'Rating.Letter')

      const GENERATE_UUID = uuidv4();

      const path = `generated/removal_credit_watch_doc_${GENERATE_UUID}.docx`

      const { params } = request.body;

      const data = await GET_REMOVAL_CREDIT_WATCH_DATA({
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
        padding: 1rem;
      }
      .header > p {
        font-size: 0.9rem;
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
      .data, .rated-facilities{
        line-height: 1.5rem;
      }
      .disclaimer{
        line-height: 1rem;
        border: 1px solid black;
        margin: 1rem 0.5rem;
        font-size: 0.8rem;
        padding: 0.4rem;
      }
      </style>
      </head>
      <body style="font-family: 'Arial';">`
    
      var html = header
          html += `
          <main>
          <section class="header"> 
            <h4>Date: ${moment(data.removal_credit_watch_data[0].rating_letter_date).format("Do MMMM YYYY")}</h4>    
            <br>
            <b>To,</b>
            <br>
            <b>Mr Arun Kumar Singh, Chief Executive Officer</b>
            <br>
            <b>M/s. ${data.removal_credit_watch_data[0].company_name}</b>
            <p>${data.removal_credit_watch_data[0].address_1}</p>
            <br>
            <p style="text-align: center"><strong>Review of rating of the bank facilities of ${data.removal_credit_watch_data[0].company_name}</strong></p>
            <br>
            <p style="line-height: 1.5rem">After taking into account all the recent developments, including operational and financial performance of your company for FYxx (audited/provisional) and Q1FYxx/H1FYxx/9MFYxx, our Rating Committee has reviewed the following ratings:</p>
          </section>
          <section class="data">
              <table> 
                <thead> 
                  <tr> 
                    <th>Instrument / Facility</th>
                    <th>Amount (Rs. Crore)</th>
                    <th>Current Ratings</th>
                    <th>Previous Ratings</th>
                    <th>Rating Action</th>
                  </tr>
                </thead>`
                data.removal_credit_watch_data.forEach(item => {
                  html += `
                  <tbody>
                    <tr>  
                      <td>${item.category_text}</td>
                      <td>${item.instrument_size_number}</td>
                      <td>${item.rating}</td> 
                      <td>${item.previous_rating ? item.previous_rating : "-"}</td>
                      <td>${item.rating_action ? item.rating_action : "-"}</td>
                    </tr>
                  <tr>
                    <td style="font-weight: 600">Total</td>
                    <td style="font-weight: 600; text-transform: capitalize;" class="total">${data.sum_in_rated_facilities[0].total}</td>
                    <td></td>
                    <td></td> 
                    <td></td>
                  </tr> 
                </tbody>`
                })
                
              html += `
              </table>
            <p>2. Details of the credit facilities are attached in Annexure I. Our rating symbols for long-term and short-term ratings and explanatory notes there on are attached in Annexure II.</p>
            <p>3. The press release / rationale for the rating will be communicated to you shortly.</p>
            <p>4. The above rating is valid for a period of one year from the date of our initial communication of rating to you i.e <strong>14th June 2021 and our annual surveillance shall fall due on 14th June 2022.</strong></p>
            <p>5. A formal surveillance/review of the rating is conducted within 12 months from the date of initial rating/last review of the rating. However, INFOMERICS reserves the right to undertake a surveillance/review of the rating more than once a year if in the opinion of INFOMERICS, circumstances warrant such surveillance/review.</p>
            <p>6. This is to mention that all the clauses mention in the initial rating letter are also stands applicable.</p>
            <p>7. In case you require any clarification, you are welcome to communicate with us in this regard.</p>
            <br>
            <br>
            <pThanking You</p>
            <pWith Regards,</p>
            <br>
            <div style="display: flex;">
              <div>  
                <p><strong>${data.removal_credit_watch_data[0].rating_analyst}</strong></p>
                <p>Rating Analyst</p>
                <a href="mailto:nds@Infomerics.com" target="_blank" rel="noreferrer">${data.removal_credit_watch_data[0].rating_analyst_email}</a>
              </div>
              <div> 
                <p><strong>${data.removal_credit_watch_data[0].group_head}</strong></p>
                <p>Assistant Vice President</p>
                <a href="mailto:nds@Infomerics.com" target="_blank" rel="noreferrer">${data.removal_credit_watch_data[0].group_head_email}</a>
              </div>
            </div>
          </section> 
          <br>
          <br>
          <br>
          <br>
          <br>
          <p style="line-height: 1rem; border: 1px solid black; margin: 1rem 0.5rem; font-size: 12.8px; padding: 0.4rem;">
            <strong>Disclaimer:</strong> Infomerics ratings are based on information provided by the issuer on an ‘as is where is’ basis. Infomerics credit ratings are an opinion on the credit risk of the issue / issuer and not a recommendation to buy, hold or sell securities.  Infomerics reserves the right to change, suspend or withdraw the credit ratings at any point in time. Infomerics ratings are opinions on financial statements based on information provided by the management and information obtained from sources believed by it to be accurate and reliable. The credit quality ratings are not recommendations to sanction, renew, disburse or recall the concerned bank facilities or to buy, sell or hold any security. We, however, do not guarantee the accuracy, adequacy or completeness of any information which we accepted and presumed to be free from misstatement, whether due to error or fraud. We are not responsible for any errors or omissions or for the results obtained from the use of such information. Most entities whose bank facilities/instruments are rated by us have paid a credit rating fee, based on the amount and type of bank facilities/instruments. In case of partnership/proprietary concerns/Association of Persons (AOPs), the rating assigned by Infomerics is based on the capital deployed by the partners/proprietor/ AOPs and the financial strength of the firm at present. The rating may undergo change in case of withdrawal of capital or the unsecured loans brought in by the partners/proprietor/ AOPs in addition to the financial performance and other relevant factors.</p>
          <section class="rated-facilities"> 
            <p style="text-align: center">
              <u>
                <strong>Annexure I</strong>
              </u>
            </p>
            <p>
              <strong>Details of Rated Facilities:</strong>
            </p>
            <div class="rating-facilities-data">
              <p style="margin: 1rem 0.4rem"> 
                <b>1. Long Term/Short Term: Fund Based Facilities</b>
              </p>
              <div class="table-div">
                <table> 
                  <thead> 
                    <tr> 
                      <th>Sr. No.</th>
                      <th>Name of Bank</th>
                      <th>Type of Facility</th>
                      <th>Amount</th>
                      <th>Tenure</th>
                   </tr>
                  </thead>`
                  data.long_short_term_fund_facilites.forEach((item, index) => {
                  html +=  `
                  <tbody>        
                      <tr> 
                        <td>${index + 1}.</td>
                        <td>${item.name}</td>
                        <td>${item.instrument_text}</td>
                        <td>${item.instrument_size_number}</td>
                        <td>${item.tenure ? item.tenure : "-"}</td>
                      </tr>
                    <tr class="total">
                      <td></td>
                      <td style="font-weight: 600">Total</td>
                      <td></td> 
                      <td style="font-weight: 600; text-transform: capitalize; " class="fund_based_amount">${data.sum_in_rated_facilities[0].total}</td>
                      <td></td>
                    </tr>
                  </tbody>`
                  })
                  
               html += `
               </table>
              </div>
              <p style="margin: 1.5rem 0.4rem"> 
                <b>2. Short Term Facilities - Non fund-Based Limits:</b>
              </p>
                <table> 
                  <thead> 
                    <tr> 
                      <th>Sr. No.</th>
                      <th>Name of Bank</th>
                      <th>Type of Facility</th>
                      <th>Amount</th>
                      <th>Tenure</th>
                    </tr>
                  </thead>`

                  data.short_term_non_fund_facilites?.forEach((item, index) => {
                    html += `
                    <tbody>        
                      <tr> 
                        <td>${index + 1}.</td>
                        <td>${item.name}</td> 
                        <td>${item.instrument_text}</td>
                        <td>${item.instrument_size_number}</td>
                        <td>${item.tenure ? item.tenure : "-"}</td>
                      </tr>  
                      <tr class="total">
                        <td></td>
                        <td style="font-weight: 600">Total</td>
                        <td></td>
                        <td style="font-weight: 600; text-transform: capitalize; " class="non_fund_based_amount">${data.sum_in_rated_facilities_short_term[0].total}</td>
                        <td></td>
                      </tr>
                   </tbody>
                  `
                  })

               html += `
               </table>
             </div>
            <div> 
              <p style="text-align: center">   
                <u> 
                  <b>ANNEXURE II</b>  
                </u>
              </p>
              <p style="text-align: center"> 
                <b>INFOMERICS Rating Scale for Long Term Instruments & Borrowing Programmes</b>
              </p>
              <div class="table-div">
                <table> 
                  <thead>
                    <tr>  
                      <th>Rating Scale</th>
                      <th>Definition</th>
                    </tr>
                  </thead>`

                  data.lt_bp_annexure.forEach(item => {
                    html += `
                    <tbody>
                      <tr> 
                        <td>${item.rating_scale}</td>
                        <td>${item.definition}</td>
                      </tr>
                  </tbody>
                  `
                  })
                  
                html += `
                </table>
              </div>
            <section style="margin-top: -1rem"> 
              <i>INFOMERICS may apply '+' (plus) signs for ratings assigned from ‘IVR A1' to ‘IVR A4' to indicate their relative standing within the category.</i>
              <br>
              <br>      
              <p style="text-align: center">
                <b>INFOMERICS Rating Scale for Short Term Instruments & Borrowing Programmes</b>
              </p>
                <table> 
                  <thead>
                    <tr>  
                      <th>Rating Scale</th>
                      <th>Definition</th>
                    </tr>
                  </thead>`
                  data.st_bp_annexure.forEach(item => {
                    html += `
                    <tbody>
                      <tr> 
                        <td>${item.rating_scale}</td>
                        <td>${item.definition}</td>
                      </tr>
                  </tbody>
                  `
                  })
                  
                html += `
                </table>
            </section>
            <section style="margin-top: -1rem"> 
              <i>INFOMERICS may apply '+' (plus) signs for ratings assigned from ‘IVR A1' to ‘IVR A4' to indicate their relative standing within the category.</i>
              <br>
              <br>
            </section>
          </section>
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

  fastify.post('/removal_credit_watch/generate/pdf', async (request, reply) => {
    try {

      await CHECK_PERMISSIONS(request, 'Rating.Letter')

      const { params } = request.body

      const GENERATE_UUID = uuidv4();

      const path = `generated/removal_credit_watch_pdf_${GENERATE_UUID}.pdf`

      const data = await GET_REMOVAL_CREDIT_WATCH_DATA({
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
        path: "document_url",
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
      response['document_status'] = true
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
    removal_of_credit_watch_docs_routes
};