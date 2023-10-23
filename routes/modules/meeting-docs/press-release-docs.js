const { writeFileSync, readFileSync } = require("fs");
const moment = require("moment");
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const { UPLOAD_TO_AZURE_STORAGE } = require("../../../helpers");
const { CHECK_PERMISSIONS } = require("../../../helpers");
const { RatingCommitteeMeetingDocument } = require("../../../models/modules/rating-committee");
const { GET_PRESS_RELEASE_DATA } = require("../../../repositories/PressReleaseData");
const HTMLtoDOCX = require('html-to-docx');

async function press_release_docs_routes(fastify) {
  fastify.post('/press_release/generate/docx', async (request, reply) => {
    try {

      await CHECK_PERMISSIONS(request, 'Rating.Letter')

      const GENERATE_UUID = uuidv4();

      const path = `generated/press_release_doc_${GENERATE_UUID}.docx`

      const { params } = request.body;

      const data = await GET_PRESS_RELEASE_DATA({
        rating_committee_meeting_params: {
        uuid: params["rating_committee_meeting_uuid"],
        is_active: true
        }, company_params: {
        uuid: params["company_uuid"],
        is_active: true
      }})

      console.log("press release data=========>", data);

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
      <title>Press Release Document</title>
      <head>
      <style>
      * {
        margin: 0;
        padding: 0;
      }
      body {
        font-family: arial;
        background-image: url('https://4i-ir.api.cognitensor.in/public/images/press_release_background_img.jpg');
        background-size: cover;
        width: 100%;
        height: 29.7cm;
        margin: 0;
        background-repeat: repeat;
      }
      .head{
        text-align: center;
      }
      img{
        height: 100px;
        width: 100px;
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
      p,li{
        line-height: 1.5rem;
      }
      .no-list-style > li{
        list-style: none;
      }
      .no-list-style {
        margin: 0.6rem  1rem;
      }
      .disclaimer{
        font-size: 0.8rem;
        line-height: 1rem;
        border: 1px solid black;
      }
      </style>
      </head>
      <body style="font-family: arial; background-image: url('https://4i-ir.api.cognitensor.in/public/images/press_release_background_img.jpg'); background-size: cover; width: 100%; height: 29.7cm; margin: 0; background-repeat: repeat; position: absolute">`
    
      var html = header
          html += `
    <main style="position: relative">
      <br>
      <br>
      <br>
      <br>
      <br>
      <br>
      <br>
      <br>
      <br>
      <br>
      <br>
      <br>
      <br>
      <br>
      <br>
      <br>
      <br>
      <br>
      <br>
      <section class="head" style="text-align: center"> 
        <br>
        <h3 style="text-align: center;">
          <u>${data.rating_data[0].company_name}</u>
        </h3>
        <br>
        <h3 style="text-align: center;">${moment(data.rating_data[0].rating_letter_date).format('MMMM d, YYYY')}</h3>
      </section>
      <div class='table-div'> 
      <h4>Ratings</h4>
      <table>
        <thead>
          <tr> 
            <th>Instrument / Facility</th>
            <th>Amount (Rs. Crore)</th>
            <th>Ratings</th>
            <th>Rating Action</th>  
            <th>Compexity Indicator (Simple/Complex/Highly Complex)</th>
          </tr>
        </thead>`

        data.rating_data.forEach(item => {
          html += `<tbody>
          each data in rating_data
            <tr>
              <td>${item.category_text}</td>
              <td>${item.instrument_size_number}</td>
              <td>${item.rating}</td>
              <td>${item.rating_action}</td>
              <td>${item.complexity_level}</td> 
            </tr>
          <tr>
            <td style="font-weight: 600">Total</td>
            <td style="font-weight: 600; text-transform: capitalize" class="total_text"></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </tbody> `
        })
      html += `</table>
      <h4>Details of Facilities are in Annexure 1</h4>
      <br>
      <h4>Detailed Rationale</h4> 
      <br>
      <br>
      <h4>Key Rating Sensitivities:</h4>
      <br>
      <h4>Upward Factors
      <ul style="margin-left: 2rem">
        each factor in upward_factors
          <li>#{factor}</li>
      </ul>
      <br>
      <h4>Downward Factors</h4>
      <ul style="margin-left: 2rem">
        each factor in downward_factors
          <li>#{factor}</li>
      </ul>
      <br>
      <br>
      <h4>List of Key Rating Drivers with Detailed Description</h4>
      <br>
      <h4>Key Rating Strengths 
      <br>
      <ul style="margin-left: 1rem">
        each strength in rating_strengths
          <li>#{strength}</li>
      </ul>
      <br>
      <h4>Key Rating Weaknesses</h4>
      <br>
      <ul style="margin-left: 1rem">
        each weakness in rating_weakness
          <li>#{weakness}</li>
      </ul>
      <br>
      <br>
      <p><strong> Analytical Approach: Standalone/Consolidated</strong>
      </p>
      <br>
      <p><strong>Applicable Criteria:</strong></p>
      <ul class="no-list-style"> 
        <li>Rating Methodology for XXX</li>
        <li>Financial Ratios & Interpretation (Financial Sector/Non- Financial Sector)</li>
        <li>Rating methodology for Structure Debt Transaction (Non-securitisation transaction)</li>
        <li>Policy on provisional ratings</li>
        <li>Guidelines on what constitutes Non-Cooperation by clients</li>
        <li>Criteria on Default Recognition and Post-Default Curing Period</li>
      </ul>
      <br>
      <br>
      <h4><u>Liquidity - Strong/Adequate/Poor/Stressed</u></h4>
      <br>
      <br>
      <h4><u>About the Company/Firm/Entity/Society</u></h4>
      <br>
      <br>
      <h4>Financials (Standalone/Combined/Consolidated):</h4>
      <br>
      <br>
      <br>
      <h4> Status of non-cooperation with previous CRA:</h4>
      <br>
      <h4> Any other information:</h4>
      <br>
      <h4> Rating History for last three years:</h4>
      <br>
    <div>
  </main>
    <div class="table-div">
      <table>
        <thead>
          <tr> 
            <th>Sr. No.</th> 
            <th>Name of Instrument / Facilities </th>
            <th colspan="3" >Current Ratings (Year ${moment().subtract(1, 'year').format('YYYY')} - ${moment().format('YY')})</th>
            <th colspan="3">Rating History for the past 3 years</th>
          </tr>
          <tr> 
            <th> 
            <th> 
            <th>Type</th>
            <th>Amount Outstanding (Rs. Crore)
            <th>Rating</th> 
            <th>Date(s) & Rating(s) assigned in ${moment().subtract(2, 'year').format('YYYY')} - ${moment().subtract(1, 'year').format('YY')}</th>
            <th>Date(s) & Rating(s) assigned in ${moment().subtract(3, 'year').format('YYYY')} - ${moment().subtract(2, 'year').format('YY')}</th>
            <th>Date(s) & Rating(s) assigned in ${moment().subtract(4, 'year').format('YYYY')} - ${moment().subtract(3, 'year').format('YY')}</th>
          </tr>
        </thead>`
        data.rating_history.forEach((item, index) => {
          html += `<tbody>
            <tr>
              <td>${index + 1}
              <td>${item.instrument}</td>
              <td>${item.current_type}</td> 
              <td>${item.amount_outstanding}</td> 
              <td>${item.rating}/${item.rating_outlook}</td> 
              <td>${item.rating}/${item.rating_outlook} (${item.reference_date})</td>
              <td>${item.rating}/${item.rating_outlook} (${item.reference_date})</td>
              <td>${item.rating}/${item.rating_outlook} (${item.reference_date})</td>
            </tr>
        </tbody>`
        })
      html += `</table>
    </div>
    <h4 style="margin-left: 2rem">Name and Contact Details of the Rating Analyst:</h4>
    <div style="display: flex; margin: 1rem 1.7rem;  align-items: center;">
      <div style="border: 1px solid black; width: 30%; padding:  0.5rem">
        <p>Name:${data.rating_history[0].rating_analyst}</p>
        <p>Tel: </p>
        <p>Email:${data.rating_history[0].email}</p> 
      </div>
      <div style="border: 1px solid black; width: 30%; padding:  0.5rem"> 
        <p>Name:${data.rating_history[0].rating_analyst}</p>
        <p>Tel: </p>
        <p>Email:${data.rating_history[0].email}</p>
      </div>
    </div>
    <section class="about" style="margin: 1rem 2rem"> 
      <h4>About Infomerics:</h4>
      <p>Infomerics was founded in the year 1986 by a team of highly experienced and knowledgeable finance professionals. Subsequently, after obtaining Securities Exchange Board of India registration and RBI accreditation and the activities of the company are extended to External Credit Assessment Institution (ECAI).
        <br>Adhering to best International Practices and maintaining high degree of ethics, the team of knowledgeable analytical professionals deliver credible evaluation of rating.
        <br>Infomerics evaluates wide range of debt instruments which helps corporates open horizons to raise capital and provides investors enlightened investment opportunities. The transparent, robust and credible rating has gained the confidence of Investors and Banks. 
        <br>Infomerics has a pan India presence with Head Office in Delhi, branches in major cities and representatives in several locations.
        <br>For more information visit 
        <a href="www.infomerics.com" alt="Infomerics official website">www.infomerics.com</a>
      </p>
      <br>
      <p class="disclaimer">
        <strong>Disclaimer: Infomerics ratings are based on information provided by the issuer on an ‘as is where is’ basis. Infomerics credit ratings are an opinion on the credit risk of the issue / issuer and not a recommendation to buy, hold or sell securities.  Infomerics reserves the right to change, suspend or withdraw the credit ratings at any point in time. Infomerics ratings are opinions on financial statements based on information provided by the management and information obtained from sources believed by it to be accurate and reliable. The credit quality ratings are not recommendations to sanction, renew, disburse or recall the concerned bank facilities or to buy, sell or hold any security. We, however, do not guarantee the accuracy, adequacy or completeness of any information, which we accepted and presumed to be free from misstatement, whether due to error or fraud. We are not responsible for any errors or omissions or for the results obtained from the use of such information. Most entities whose bank facilities/instruments are rated by us have paid a credit rating fee, based on the amount and type of bank facilities/instruments. In case of partnership/proprietary concerns/Association of Persons (AOPs), the rating assigned by Infomerics is based on the capital deployed by the partners/proprietor/ AOPs and the financial strength of the firm at present. The rating may undergo change in case of withdrawal of capital or the unsecured loans brought in by the partners/proprietor/ AOPs in addition to the financial performance and other relevant factors.
        </strong>
      </p>
    </section>
    <div class="table-div">
      <h4>Annexure 1: Details of Facilities</h4>
      <table> 
        <thead> 
          <th>Name of Facility</th>
          <th>Date of Issuance</th>
          <th>Coupon Rate/ IRR</th>
          <th>Maturity Date</th>
          <th>Size of Facility (Rs. Crore)</th>
          <th>Rating Assigned/Outlook</th>
        </thead>
        <tbody> 
          <td> - </td>
          <td> - </td>
          <td> - </td>
          <td> - </td>
          <td> - </td>
          <td> - </td>
        </tbody>
      </table>
      <br>
      <br>
      <h4>Annexure 2: List of companies considered for consolidated analysis: Not Applicable.</h4>
      <br>
      <table> 
        <thead> 
          <th>Name of the company</th>
          <th>Consolidation Approach</th> 
        </thead>
        <tbody> 
          <td> - </td>
          <td> - </td>
        </tbody>
      </table>
      <br>
      <br>
      <h4>Annexure 3: Facility wise lender details (Hyperlink to be added)</h4>
      <br>
      <h4>Annexure 4: Detailed explanation of covenants of the rated instrument/facilities: Not Applicable</h4>
      <br>
      <table> 
        <thead> 
          <th colspan="2">Name of the Instrument</th>
          <th style="text-align: center;">Detailed Explanation</th> 
        </thead>
        <tbody> 
          <td></td> 
          <td style="font-weight: 600">Financial Convenant</td>
          <td></td>  
        </tbody>
        <tbody> 
          <td></td>
          <td style="font-weight: 600">i.</td>
          <td></td>
        </tbody>
        <tbody> 
          <td></td> 
          <td style="font-weight: 600">ii.</td>
          <td></td>
        </tbody>
        <tbody> 
          <td></td> 
          <td style="font-weight: 600">Non-financial Convenant</td>
          <td></td>
        </tbody>  
        <tbody> 
          <td></td>
          <td style="font-weight: 600">i.</td>
          <td></td>
        </tbody>
        <tbody> 
          <td></td>
          <td style="font-weight: 600">ii.</td>
          <td></td>
        </tbody>
      </table>
      <br>
      <p><strong> Note on complexity levels of the rated instrument: Infomerics has classified instruments rated by it on the basis of complexity and a note thereon is available at www.infomerics.com.</strong>
      </p>
    </div>
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
                rating_committee_meeting_id: data.rating_data[0].rating_committee_meeting_id,
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

  fastify.post('/press_release/generate/pdf', async (request, reply) => {
    try {

      await CHECK_PERMISSIONS(request, 'Rating.Letter')

      const { params } = request.body

      const GENERATE_UUID = uuidv4();

      const path = `generated/press_release_pdf_${GENERATE_UUID}.pdf`

      const data = await GET_PRESS_RELEASE_DATA({
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
      await page.setContent(html);
      await page.emulateMediaType('screen');
      await page.pdf({
        path: path,
        margin: { top: '100px', right: '50px', bottom: '100px', left: '50px' },
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
        rating_committee_meeting_id: data.rating_data[0].rating_committee_meeting_id,
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
    press_release_docs_routes
};