const { writeFileSync, readFileSync } = require("fs");
const moment = require("moment");
const puppeteer = require("puppeteer");
const { v4: uuidv4 } = require("uuid");
const { UPLOAD_TO_AZURE_STORAGE } = require("../../../helpers");
const { CHECK_PERMISSIONS } = require("../../../helpers");
const {
  RatingCommitteeMeetingDocument,
} = require("../../../models/modules/rating-committee");
const { GET_MOM_SHEET_DATA } = require("../../../repositories/MOMSheetData");
const HTMLtoDOCX = require("html-to-docx");
const { DocumentType } = require("../../../models/modules/onboarding");

async function mom_docs_routes(fastify) {
  fastify.post("/mom/generate/docx", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Rating.Letter");

      const GENERATE_UUID = uuidv4();

      const path = `generated/mom_doc_${GENERATE_UUID}.docx`;

      const document_type_details = await DocumentType.findOne({
        where: {
          name: "mom",
          is_active: true
        }
      })

      const { params } = request.body;

      let data = await GET_MOM_SHEET_DATA({
        uuid: params["rating_committee_meeting_uuid"],
        is_active: true,
      });

      const minutes = data.minutes;

      const date = new Date();

      const newData = data.docs_data.map((item, index) => {
        let newArr = [];
        let obj = {
          ...item,
        };
        for (let i = 0; i < item.agenda_table_data_1.length; i++) {
          delete item.agenda_table_data_1[i + 1];
        }
        newArr = item.agenda_table_data_1.filter((a) => a != undefined);
        obj.agenda_table_data_1 = newArr;
        return obj;
      });

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

      var header = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><title>MOM-DOC</title></head><body>`;

      var html = header;

      var headerHTMLString = `<div style="text-align: center; width: 100%; line-height: 20px">
      <p style="text-align: center">
        <strong style="font-size: 12pt; font-family: 'Cambria', serif;">I</strong>
        <strong style="font-size: 12pt; font-family: 'Cambria', serif;">NFOMERICS</strong>
        <strong style="font-size: 12pt; font-family: 'Cambria', serif;"> V</strong>
        <strong style="font-size: 10pt; font-family: 'Cambria', serif; margin-right: 4.5rem">ALUATION AND</strong>
        <strong style="font-size: 12pt; font-family: 'Cambria', serif;"> R</strong>
        <strong style="font-size: 10pt; font-family: 'Cambria', serif; margin-right: 4.5rem">ATING</strong>
        <strong style="font-size: 12pt; font-family: 'Cambria', serif;"> P</strong>
        <strong style="font-size: 10pt; font-family: 'Cambria', serif; margin-right: 4.5rem">RIVATE</strong>
        <strong style="font-size: 12pt; font-family: 'Cambria', serif;"> L</strong>
        <strong style="font-size: 10pt; font-family: 'Cambria', serif;">IMITED</strong>
      </p>
      <p style="text-align: center">
          <span style="font-size: 8pt; font-family: 'Cambria', serif;"><strong>Head Office-</strong>Flat No. 104/106/108, Golf Apartments, Sujan Singh Park, New Delhi-110003</span>
      </p>
      <div style="text-align: center; width: 100%; display: flex; justify-content: center;">
  <p style="text-align: center; width: 80%; margin: 0 auto; padding: 0">
      <span style="font-size: 8pt; font-family: Cambria, serif; text-align: center;"><strong>Corporate Office:</strong>1102, 1103 & 1104 -B Wing, Kanakia Wallstreet, Off. Andheri Kurla Road, Andheri (East), Mumbai-400093.</span>
  </p>
</div>
      <p style="text-align: center">
          <span style="font-size: 8pt; font-family: 'Cambria', serif;">Email: </span>
          <a href="mailto:vma@infomerics.com" target="_blank" style="font-size: 8pt; font-family: 'Cambria', serif; color: rgb(5, 99, 193);">vma@infomerics.com</a>
          <span style="font-size: 8pt; font-family: 'Cambria', serif;">, Website: </span>
          <span style="font-size: 8pt; font-family: 'Cambria', serif; color: rgb(5, 99, 193);">www.infomerics.com</span>
      </p>
      <p style="text-align: center">
          <span style="font-size: 8pt; font-family: 'Cambria', serif;">Phone: +91-11 24601142, 24611910, Fax: +91 11 24627549</span>
      </p>
      <p style="text-align: center">
          <strong style="font-size: 8; font-family: 'Cambria', serif;">(CIN: U32202DL1986PTC024575)</strong>
      </p>
      </div>`;

      html += `
        <main style="line-height: 1.5rem;">
        <p>
              <strong>Minutes of </strong>
              <span>${
                data.docs_data[0].agenda_table_data_1[0].instruments[0]
                  .rating_committee_meeting_id
              }<sup>${suffixes(
        data.docs_data[0].agenda_table_data_1[0].instruments[0]
          .rating_committee_meeting_id
      )}</sup></span>/ ${moment(
        data.docs_data[0].agenda_table_data_1[0].instruments[0].meeting_at
      )
        .subtract(1, "year")
        .format("YYYY")} - ${moment(
        data.docs_data[0].agenda_table_data_1[0].instruments[0].meeting_at
      ).format(
        "YYYY"
      )} meeting of the Rating Committee duly convened on ${moment(
        data.docs_data[0].agenda_table_data_1[0].instruments[0].meeting_at
      ).format("dddd, Do MMMM YYYY")} at ${moment(
        data.docs_data[0].agenda_table_data_1[0].instruments[0].meeting_at
      ).format("hh:mm a")}  through ${
        data.docs_data[0].agenda_table_data_1[0].meeting_type[0] == "Virtual"
          ? "video"
          : data.docs_data[0].agenda_table_data_1[0].meeting_type[0]
      } conference.</span>
          </p> 
            <p style="border-top: 2px dashed #000; padding-top: 1rem; margin-top: 0.2rem; width: 75%;"></p>
            <p style="padding-top: 1rem; margin-top: 0.2rem;">
              <u>Rating Committee Members Present:</u>
            </p>`;

      for (let i = 0; i < data.rating_committee_members_present.length; i++) {
        html += `
              <p>${i + 1}. ${
          data.rating_committee_members_present[i]
            .rating_committee_members_present
            ? data.rating_committee_members_present[i]
                .rating_committee_members_present
            : "NA"
        }</p>
              `;
      }

      html += `<br>
            <p>   
              <u>Persons attended the ${newData[0].agenda_table_data_1[0].committee_type[0]}:</u> 
            </p>`;

      for (let i = 0; i < data.persons_rcm.length; i++) {
        html += `
              <p>${i + 1}. ${
          data.persons_rcm[i].name ? data.persons_rcm[i].name : "NA"
        }, ${
          data.persons_rcm[i].position ? data.persons_rcm[i].position : "NA"
        }</p>
              `;
      }

      html += `<br>
            <p>
              <i> 
                <u>Item No. 1</u>
              </i>
            </p>
            <p>
              <i> 
                <u>Chairman</u>
              </i>
            </p>
            <p>  
              <strong>${data.chairman}</strong> was unanimously appointed as the Chairman of the meeting. The Chairman occupied the chair and declared the commencement of meeting after confirming the presence of the required quorum for the meeting.
            </p>
            <p>
              <i> 
                <u>Item No. 2</u>
              </i>
            </p>
              <u>Leave of Absence</u>
            <p>All Committee members were present at the meeting.</p>
            <p>
              <i> 
                <u>Item No. 3: Agenda No. A </u>
              </i>
            </p>
            <p>  `;
      if (data.penultimate_meeting_details.length > 0) {
        html += `<u>To confirm the minutes of ${
          data.penultimate_meeting_details.length > 0
            ? `<span>${data.penultimate_meeting_details[0].rating_committee_meeting_id}<sup>${suffixes(data.penultimate_meeting_details[0].rating_committee_meeting_id)}</sup></span>`
            : "Nil"
        } ${newData[0].agenda_table_data_1[0].committee_type[0]}/ ${moment(
          data.docs_data[0].agenda_table_data_1[0].instruments.meeting_at
        )
          .subtract(1, "year")
          .format("YYYY")} - ${moment(
          data.docs_data[0].agenda_table_data_1[0].instruments.meeting_at
        ).format("YYYY")}  held on ${moment(
          data.penultimate_meeting_details[0].meeting_at
        )
          .format("Do MMMM YYYY")
          .replace(/(\d)(st|nd|rd|th)/g, `$1<sup>$2</sup>`)}</u>`;
      } else {
        html += `<p>Nil</p>`;
      }

      `</p>

            <p>The Minutes of the <strong><span class="last_meet">${newData[0].agenda_table_data_1[0].committee_type[0]} <span>${
              data.docs_data[0].agenda_table_data_1[0].instruments[0]
                .rating_committee_meeting_id
            }<sup>${suffixes(
        data.docs_data[0].agenda_table_data_1[0].instruments[0]
          .rating_committee_meeting_id
      )}</sup></span>/ ${moment(
        data.docs_data[0].agenda_table_data_1[0].instruments.meeting_at
      )
        .subtract(1, "year")
        .format("YYYY")} - ${moment(
        data.docs_data[0].agenda_table_data_1[0].instruments.meeting_at
      ).format("YYYY")}  held on ${moment(
        data.docs_data[0].agenda_table_data_1[0].instruments.meeting_at
      )
        .format("Do MMMM YYYY")
        .replace(
          /(\d)(st|nd|rd|th)/g,
          `$1<sup>$2</sup>`
        )}</span></strong> were circulated to all the members vied email dated<strong> ${moment(
        data.docs_data[0].agenda_table_data_1[0].instruments.meeting_at
      )
        .format("Do MMMM YYYY")
        .replace(
          /(\d)(st|nd|rd|th)/g,
          `$1<sup>$2</sup>`
        )}</strong> for confirmation and the same was confirmed by all the members through email.
            </p>`;

      for (let index = 0; index < newData.length; index++) {
        html += `
                  <p>
                    <i>
                      <u>Item No. ${4 + index}: Agenda No. B${index + 1}</u>
                    </i>
                  </p>
                    <p>To consider the Rating Proposal of <strong>${
                      newData[index].entity_name
                    }</strong>
                    </p>
                      
                      <table style="width: 100%">  
                      <tbody>
                        <tr>
                          <td>Name of the Rated Entity</td>  
                            <td colspan=${
                              newData[index].agenda_table_data_1[0].size.length
                            }> <strong>${newData[index].entity_name}</strong></td>
                        </tr>
                        <tr>
                        <td>Nature of Instrument</td>`
                        for (let i = 0; i < newData[index].agenda_table_data_1[0].instruments[0].instrument.length; i++) {
                          html += `<td> <strong>${newData[index].agenda_table_data_1[0].instruments[0].instrument[i]}</strong></td>`
                        }
                        html += `</tr>;
                          <tr>
                        <td>Size (Rs. Crore)</td>`;
        for (
          let i = 0;
          i < newData[index].agenda_table_data_1[0].size.length;
          i++
        ) {
          html += `<td>${
            newData[index].agenda_table_data_1[0].size[i]
              ? `<strong>${newData[index].agenda_table_data_1[0].size[i].toFixed(2)}</strong>`
              : "NA"
          }</td>`;
        }

        html += `</tr>
                        <tr>
                        <td>Fresh Rating/ Surveillance</td>`;
        for (
          let i = 0;
          i < newData[index].agenda_table_data_1[0].rating_process.length;
          i++
        ) {
          html += `<td> ${
            newData[index].agenda_table_data_1[0].rating_process[i]
              ? `<strong>${newData[index].agenda_table_data_1[0].rating_process[i]}</strong>`
              : "NA"
          }</td>`;
        }

        html += ` </tr>
                        <tr>
                        <td>Existing Rating</td>`;
        for (
          let i = 0;
          i < newData[index].agenda_table_data_1[0].existing_rating.length;
          i++
        ) {
          html += `<td> ${
            newData[index].agenda_table_data_1[0].existing_rating[i]
              ? `<strong>${newData[index].agenda_table_data_1[0].existing_rating[i]}</strong>`
              : "NA"
          }</td>`;
        }

        html += `</tr>
                        <tr>
                        <td>Proposed Rating</td>`;
        for (
          let i = 0;
          i < newData[index].agenda_table_data_1[0].proposed_rating.length;
          i++
        ) {
          html += `<td> ${
            newData[index].agenda_table_data_1[0].proposed_rating[i]
              ? `<strong>${newData[index].agenda_table_data_1[0].proposed_rating[i]}</strong>`
              : "NA"
          }</td>`;
        }

        html += `</tr>
                        <tr>
                        <td>Current Rating Assigned</td>`;
        for (
          let i = 0;
          i <
          newData[index].agenda_table_data_1[0].current_assigned_rating.length;
          i++
        ) {
          html += `<td> ${
            newData[index].agenda_table_data_1[0].current_assigned_rating[i]
              ? `<strong>${newData[index].agenda_table_data_1[0].current_assigned_rating[i]}</strong>`
              : "NA"
          }</td>`;
        }

        html += `</tr>
                        <tr>
                        <td>Name of the Analyst</td>
                          <td colspan=${newData[index].agenda_table_data_1[0].size.length}><strong> ${data.rating_analyst}<?strong></td>
                        </tr>
                      `;

        html += `</tbody>
                  </table>
        
                <strong>The case was presented by the Rating Analyst and the key salient features mentioned are as below:</strong>     
                <br/>`;

        for (let i = 0; i < minutes.length; i++) {
          html += `${minutes[i] ? minutes[i].rating_analyst_points : "NA"}`;
        }

        html += `<br>
              <strong>Post the presentation, the committee discussed the following issues:</strong>
              <br/>
`;

        for (let i = 0; i < minutes.length; i++) {
          html += `${
            minutes[i]
              ? minutes[i].post_presentation_committee_discussed_issue
              : "NA"
          }`;
        }
        html += `
              <br>
              <strong>Rating Analyst clarified the following points to the committee:</strong>
              <br>
              <p> The company has formed Foreign Exchange Risk Management Policy. As per policy recommended hedge ratio is as follows:</p>
              <br>
              <strong>  
                <u>Exports
              </strong>
              <br>
              <p>The Unhedged foreign currency exposure as on September 30, 2022 is Rs.11.43 crore (Receivable).</p>
              <p><strong>After the brief discussion on the agenda papers, the Rating Committee assigned the rating as proposed.</strong></p>
              <p>
                <u>Vote of Thanks
              </p>
              <p>The meeting concluded with a vote of thanks to the chair at 5:30 pm.</p>
              <br>`;
      }

      html += `<strong>Dissent (if any) by any ${newData[0].agenda_table_data_1[0].committee_type[0]} member - </strong>`;
      for (let i = 0; i < data.dissent_remark.length; i++) {
        html += `<span>${data.dissent_remark[i].dissent_remark}</span>
        <br>`;
      }
      html += `<table style="width: '1200px'; border: 2px solid; border-color: red;">
            <tr style="border: '0px'; border-color: 'white'; text-align: 'right';">
              <th style="text-align: 'start'; margin-left: '0px'; border: 0px">Date: ${moment(
                date
              ).format("DD/MM/YYYY")}</th>
              <th style="text-align: 'center'; margin: '50px'; padding: '100px';">${
                data.chairman
              }</th>
            </tr>
            <tr style="border: '0px'; border-color: 'white'; text-align: 'right';">
              <th style="text-align: 'start'; margin-left: '0px';">Place: New Delhi</th>
              <th style="text-align: 'center'; margin: '50px'; padding: '100px';">Chairman</th>
            </tr>
        </table>
      `;

      const doc_url_promise = new Promise((resolve, reject) => {
        async function createDoc(html) {
          const fileBuffer = await HTMLtoDOCX(html, headerHTMLString, {
            table: { row: { cantSplit: true } },
            footer: true,
            header: true,
            pageNumber: false,
          });

          writeFileSync(path, fileBuffer, (error) => {
            if (error) {
              console.log("Docx file creation failed");
              return;
            }
          });

          const document_link = await UPLOAD_TO_AZURE_STORAGE(fileBuffer, {
            path: path,
          });

          if (!document_link) {
            reject({
              success: false,
              error: "Document Link Not Available",
            });
          }

          await RatingCommitteeMeetingDocument.create({
            uuid: uuidv4(),
            path: document_link,
            is_active: true,
            rating_committee_meeting_id:
              data.docs_data[0].agenda_table_data_1[0].instruments[0]
                .rating_committee_meeting_id,
            document_type_id: document_type_details.id,
            doc_type: "docx",
            created_at: new Date(),
            updated_at: new Date(),
            created_by: request.user.id,
          });

          resolve(document_link);
        }
        createDoc(html);
      });

      const document_url = await doc_url_promise;

      var response = {};
      response["uuid"] = uuidv4();
      response["document_url"] = document_url;
      reply.send(response);
    } catch (error) {
      console.log("Error", error);
      return reply.send({
        error: String(error),
      });
    }
  });

  fastify.post("/mom/generate/pdf", async (request, reply) => {
    try {
      await CHECK_PERMISSIONS(request, "Rating.Letter");

      const { params } = request.body;

      const GENERATE_UUID = uuidv4();

      const path = `generated/mom_pdf_${GENERATE_UUID}.pdf`;

      const document_type_details = await DocumentType.findOne({
        where: {
          name: "mom",
          is_active: true
        }
      })

      const data = await GET_MOM_SHEET_DATA({
        uuid: params["rating_committee_meeting_uuid"],
        is_active: true,
      });

      const newData = data.docs_data.map((item, index) => {
        let newArr = [];
        let obj = {
          ...item,
        };
        for (let i = 0; i < item.agenda_table_data_1.length; i++) {
          delete item.agenda_table_data_1[i + 1];
        }
        newArr = item.agenda_table_data_1.filter((a) => a != undefined);
        obj.agenda_table_data_1 = newArr;
        return obj;
      });

      console.log("newData==============>", newData);

      const header = () => {
        return `
        <div style="text-align: center; width: 100%; margin-bottom: 1rem;">
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
          <span style="font-size: 8pt; font-family: Cambria, serif;"><strong>Head Office-</strong> - Flat No. 104/106/108, Golf Apartments, Sujan Singh Park, New Delhi-110003</span>
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
        return `<p></p>`
      }

      const browser = await puppeteer.launch({
        headless: false,
        args: ["--headless"],
      });
      // const page = await browser.newPage();
      const pages = await browser.pages();
      const page = pages[0];

      const dissent_remark = data?.dissent_remark;

      const agenda_table_data = data?.docs_data;

      const rating_committee_members_present =
        data?.rating_committee_members_present;
      const minutes_points = data?.minutes;
      const html = await fastify.view(
        `templates/pdf/${params["filename"]}.pug`,
        {
          data: data,
          minutes_points: minutes_points,
          rating_committee_members_present: rating_committee_members_present,
          agenda_table_data: agenda_table_data,
          dissent_remark: dissent_remark,
          require: require,
        }
      );
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      await page.addStyleTag({ content:  '.date-time,.pageNumber,.title{ display: none !important; }' });
      await page.emulateMediaType("screen");
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
          data.docs_data[0].agenda_table_data_1[0].instruments[0]
            .rating_committee_meeting_id,
        document_type_id: document_type_details.id,
        doc_type: "pdf",
        created_at: new Date(),
        updated_at: new Date(),
        created_by: request.user.id,
      });

      var response = {};
      response["uuid"] = uuidv4();
      response['newData'] = newData;
      (response["document_url"] = document_url), reply.send(response);
    } catch (error) {
      console.log("Error", error);
      return reply.send({
        error: String(error),
      });
    }
  });
}

module.exports = {
  mom_docs_routes,
};
