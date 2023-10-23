var nodemailer = require("nodemailer");
var handlebars = require("handlebars");
var fs = require("fs");
const { AES_ENCRYPT_DATA } = require("../helpers");
const { URLSearchParams } = require("url");
const { v4: uuidv4 } = require("uuid");
const { STORE_MAIL_IN_DB } = require("../routes/modules/compliance");
const {
  EMAIL_TEMPLATE,
  PRESS_RELEASE_ALERT_DAY,
} = require("../constants/constant");
const moment = require("moment");
async function SEND_EMAIL_IN_BATCHES(emails_data, email_type) {
  console.log("SEND_EMAIL_IN_BATCHES");
  const batchSize = 200;
  let batches = Math.ceil(emails_data.length / batchSize);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  let d = new Date();

  for (let i = 0; i < batches; i++) {
    let start = i * batchSize;
    let end = start + batchSize;
    let batchEmails = emails_data.slice(start, end);

    try {
      // Create an array of promises for all emails in the batch
      let emailPromises = batchEmails.map((emails_data_item) => {
        SEND_AND_STORE_NDS_REMINDER_MAIL({
          sender: "info.infomerics@gmail.com",
          recipient: emails_data_item.email,
          cc: [
            emails_data_item.ra_email,
            emails_data_item.gh_email,
            emails_data_item.bd_email,
          ],
          subject:
            email_type == "Monthly NDS First Mail"
              ? `Monthly NDS First Mail ${emails_data_item.company_name} ${
                  monthNames[d.getMonth()]
                }`
              : email_type == "Monthly NDS Reminder 1"
              ? "Monthly NDS Reminder 1"
              : email_type == "Monthly NDS Reminder 2"
              ? "Monthly NDS Reminder 2"
              : email_type == "Monthly NDS Reminder 3"
              ? "Monthly NDS Reminder 3"
              : "",
          uuid: uuidv4(),
          email_type,
        });
      });

      // Send emails for this batch and wait for all to finish
      await Promise.all(emailPromises);

      console.log(`Batch ${i + 1} sent successfully.`);

      // Wait for 2 seconds after sending each batch
      if (i < batches - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Error sending batch ${i + 1}: ${error.message}`);
    }
  }
}

const ndsTransporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  auth: {
    user: "info.infomerics@gmail.com",
    pass: "sfaagramzgctgsir",
  },
});

let htmlTemplate = fs.readFileSync("templates/pdf/sample.html", {
  encoding: "utf-8",
});

// console.log("htmlTemplate: ",htmlTemplate);

// Sending NDS reminder mails
async function SEND_AND_STORE_NDS_REMINDER_MAIL({
  sender,
  recipient,
  cc,
  subject,
  uuid,
  email_type,
}) {
  try {
    console.log("SEND_NDS_REMINDER called");
    let emailObj = {};
    let bodyTemplate = fs.readFileSync(
      `templates/pdf/${email_type.split(" ").join("")}.html`,
      {
        encoding: "utf-8",
      }
    );

    let bodyTemplateHandlebars = handlebars.compile(bodyTemplate);

    let currentDate = new Date();
    const dayOfMonth = currentDate.getDate();
    const lastDateOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );
    const last_day = lastDateOfMonth.getDate();

    function addDays(date, days) {
      let result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    }

    let replaceVars = {
      nds_url: `${
        process.env["DASHBOARD_DOMAIN"]
      }/nds-verify/${AES_ENCRYPT_DATA(uuid)}`,
      month_ended_date: lastDateOfMonth,
      reminder1_date: addDays(lastDateOfMonth, 2),
      reminder2_date: addDays(lastDateOfMonth, 5),
    };

    let body = bodyTemplateHandlebars(replaceVars);

    let mailOpt = {
      from: sender,
      to: recipient,
      cc: cc,
      subject: subject,
      html: body,
    };

    ndsTransporter.sendMail(mailOpt, async function (error, info) {
      new Promise((resolve, reject) => {
        if (error) {
          emailObj = {
            sender: sender,
            recipient: recipient,
            subject: subject,
            uuid: uuid,
            body: body,
            status: info.response,
            error: JSON.stringify(error),
          };
          console.log(error);
          reject(error);
        } else {
          emailObj = {
            sender: sender,
            recipient: recipient,
            subject: subject,
            uuid: uuid,
            body: JSON.stringify(body),
            status: info.response,
          };
          resolve(info);
        }
      })
        .then(async (data) => {
          await STORE_MAIL_IN_DB(emailObj);
        })
        .catch((err) => {});
    });
  } catch (err) {
    console.log(err);
  }
}

async function addWorkingDays(startDate, numDays) {
  // Copy the startDate to avoid modifying the original date
  let newDate = new Date(startDate);
  // Function to check if a given date is a weekend (Saturday or Sunday)

  // Loop to add numDays working days
  let daysToAdd = numDays;
  while (daysToAdd > 0) {
    newDate.setDate(newDate.getDate() + 1); // Add one day
    // If it's a working day, reduce the days left to add
    if (newDate.getDay() == 0 && newDate.getDay() == 6) {
      daysToAdd++;
    }
    console.log("newDate: ", newDate);
    daysToAdd--;
  }
  return newDate;
}
// getting date difference
async function dateDifferenceInDays(date1, date2) {
  // Convert the dates to UTC to ensure consistency in calculations
  const utcDate1 = new Date(
    Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate())
  );
  const utcDate2 = new Date(
    Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate())
  );
  // Calculate the difference in milliseconds between the two dates
  const differenceInMilliseconds = Math.abs(utcDate2 - utcDate1);
  // Convert milliseconds to days (1 day = 1000 ms * 60 s * 60 min * 24 hours)
  const differenceInDays = Math.floor(
    differenceInMilliseconds / (1000 * 60 * 60 * 24)
  );
  return differenceInDays;
}

async function mailSenderConfig() {
  try {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      maxConnections: 1000,
      pool: true,
      auth: {
        user: "info.infomerics@gmail.com",
        pass: "sfaagramzgctgsir",
      },
    });
    return transporter;
  } catch (error) {
    console.log("Error in creating mailer object", error);
  }
}

async function commonMailler(to, subject, bodyContent, cc, attachment) {
  console.log("commonMailler called");
  try {
    if (cc === undefined) {
      cc = "";
    }
    if (attachment === undefined) {
      attachment = [];
    }
    const mailer = await mailSenderConfig();
    var mailOptions = {
      from: "info.infomerics@gmail.com",
      to: to,
      cc: cc,
      attachments: attachment,
      subject: subject,
      html: bodyContent,
    };

    mailer.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  } catch (error) {
    console.log("Error in sending mail in mailBody =>", error);
  }
}

// common activity email sender
async function SEND_GENERAL_EMAIL(params) {
  try {
    const URL = process.env.DASHBOARD_DOMAIN;

    let {
      to_user_email,
      rating_process,
      company,
      template_type,
      cc,
      attachment,
    } = params;
    let data = "";
    let subject;
    switch (template_type) {
      case EMAIL_TEMPLATE.WORKFLOW_ASSIGNMENT:
        data = await workflow_assignment(params, URL);
        subject = rating_process + " Case Assignment: " + company;
        break;
      case EMAIL_TEMPLATE.WORKFLOW_PROVISIONAL_COMMUNICATION:
        data = await workflow_provisional_communication(params, URL);
        subject =
          "Provisional Communication  to client for " + company + " is pending";
        break;
      case EMAIL_TEMPLATE.WORKFLOW_RATING_LETTER:
        data = await workflow_rating_letter(params, URL);
        subject = "Rating letter  to client for " + company + " is pending";
        break;
      case EMAIL_TEMPLATE.WORKFLOW_PRESS_RELEASE:
        console.log("WORKFLOW_PRESS_RELEASE params:: ", params);
        data = await workflow_press_release(
          params,
          URL,
          PRESS_RELEASE_ALERT_DAY
        );
        subject = "Publish Press Release for " + company;
        console.log("WORKFLOW_PRESS_RELEASE data:: ", data);
        break;
      case EMAIL_TEMPLATE.DUE_DILLIGENCE:
        data = await due_dilligence(params, URL);
        subject = "Complete due diligence for " + company;
        break;
      case EMAIL_TEMPLATE.COMPLETE_RATING_MODEL:
        data = await complete_rating_model(params, URL);
        subject = "Complete Rating Model for " + company;
        break;
      case EMAIL_TEMPLATE.INC_CASE_ENCOUNTERED:
        data = await inc_case_encountered(params);
        subject =
          "INC case encountered for " + company + " by " + rating_process;
        break;
      case EMAIL_TEMPLATE.RATING_HEAD_WORKFLOW_ALERT:
        data = await rating_head_workflow_alert(params);
        subject =
          "Press Release not Published within 5 Days for " +
          company +
          " by " +
          rating_process;
        break;
      case EMAIL_TEMPLATE.SHARE_PRICE:
        data = await share_price(params, URL);
        subject =
          "Material Event:Share price decline by more than 20% " + company;
        break;
      case EMAIL_TEMPLATE.DUE_DILIGENCE_MOM:
        data = await due_dilligence_mom(params);
        subject =
          "MoM of Interaction with " +
          " " +
          params.interaction_type +
          " - " +
          params.user +
          " of " +
          params.company;
        break;
      case EMAIL_TEMPLATE.WORKFLOW_PROVISIONAL_COMMUNICATION_TO_CLIENT:
        data = await client_pc_data(params);
        subject = "Request for acceptance of the rating assigned - " + company;
        break;
      case EMAIL_TEMPLATE.WORKFLOW_RATING_LETTER_TO_CLIENT:
        data = await client_rl_data(params);
        subject = "Rating Letter - " + company;
        break;
      case EMAIL_TEMPLATE.WORKFLOW_PRESS_RELEASE_TO_CLIENT:
        data = await client_pr_data(params);
        subject = "Press Release - " + company;
        break;

      default:
    }

    // var template = handlebars.compile(data);
    // var htmlToSend = template(data);
    // calling email sender
    await commonMailler(to_user_email, subject, data, cc, attachment);
  } catch (error) {
    console.log("Error in sending mail => ", error);
  }
}

async function workflow_assignment(params, URL) {
  let {
    to_user_name,
    from_user_name,
    rating_process,
    company,
    mandate_type,
    total_size,
  } = params;
  let content = "<html><head>";
  content +=
    "<style>table, th, td { border: 1px solid black;border-collapse: collapse;text-align:left;}</style>";
  content += "</head><body style='width:600px;'>";
  content += "Dear " + to_user_name + ",<br><br>";
  content += "Greetings of the day!!<br><br>";
  content +=
    "This is to inform you that " +
    rating_process.toLowerCase() +
    " case has been assigned by " +
    from_user_name +
    " to carry out the ratings for <b>" +
    company +
    "</b><br><br>";
  content +=
    "<table class='tblBorder'><tr class='tblBorder'><th class='tblBorder'>Nature of Assignment</th><th class='tblBorder'>Company Name</th><th class='tblBorder'>Mandate Type</th><th class='tblBorder' style='text-align:right;'>Size</th></tr>";
  content +=
    "<tr class='tblBorder'><td class='tblBorder'>" +
    rating_process +
    "</td><td class='tblBorder'>" +
    company +
    "</td><td class='tblBorder'>" +
    mandate_type +
    "</td><td class='tblBorder' style='text-align:right;'>" +
    total_size +
    "</td></tr></table><br><br>";
  content +=
    "Click on the below link to login and navigate the Company Management Modules to view more details. <a href='" +
    URL +
    "'>Click here</a><br><br>";
  content += "Thanks. <br><b>Team Infomerics</b><br>";
  content +=
    "<p style='background-color:red;color:#ffffff;'>Note: This is a system generated email ! please do not reply directly to this email</p></body></html>";
  return content;
}

async function workflow_provisional_communication(params, URL) {
  let {
    to_user_name,
    from_user_name,
    rating_process,
    company,
    mandate_type,
    rating,
    meeting_id,
    meeting_date,
  } = params;
  let content = "<html><head>";
  content +=
    "<style>table, th, td { border: 1px solid black;border-collapse: collapse;}</style>";
  content += "</head><body style='width:600px;'>";
  content += "Dear " + to_user_name + ",<br><br>";
  content += "Greetings of the day!!<br><br>";
  content +=
    "This is to inform you that Rating Committee " +
    meeting_id +
    " has assigned below rating to the <b>" +
    company +
    "</b> on " +
    meeting_date +
    "<br><br>";

  content +=
    "<table class='tblBorder'><tr><th class='tblBorder'>Nature of Assignment</th><th class='tblBorder'>Company Name</th><th class='tblBorder'>Mandate Type</th><th class='tblBorder'>Ratings</th></tr>";

  for (let i = 0; i < mandate_type.length; i++) {
    content +=
      "<tr class='tblBorder'><td class='tblBorder'>" +
      rating_process +
      "</td><td class='tblBorder'>" +
      company +
      "</td><td class='tblBorder'>" +
      mandate_type[i] +
      "</td><td class='tblBorder'>" +
      rating[i] +
      "</td></tr></table>";
  }

  content += "<br></br>";

  content +=
    "Click on the below link  to login and navigate the Rating Committee module to see more details. <a href='" +
    URL +
    "'>Click here</a><br><br>";
  content += "Thanks. <br><b>Team Infomerics</b><br>";
  content +=
    "<p style='background-color:red;color:#ffffff;'>Note: This is a system generated email ! please do not reply directly to this email</p></body></html>";
  return content;
}

async function workflow_rating_letter(params, URL) {
  let {
    to_user_name,
    from_user_name,
    rating_process,
    company,
    mandate_type,
    rating,
    meeting_id,
    meeting_date,
  } = params;
  let rating_var = rating.join(",");
  let content = "<html><head>";
  content +=
    "<style> table, th, td { border: 1px solid black;border-collapse: collapse;}</style>";
  content += "</head><body style='width:600px;'>";
  content += "Dear " + to_user_name + ",<br><br>";
  content += "Greetings of the day!!<br><br>";
  content +=
    "This is to inform you that  Rating Committee " +
    meeting_id +
    " has assigned below rating to the <b>" +
    company +
    "</b> on " +
    meeting_date +
    "<br><br>";
  content +=
    "<table class='tblBorder'><tr class='tblBorder'><th class='tblBorder'>Nature of Assignment</th><th class='tblBorder'>Company Name</th><th class='tblBorder'>Mandate Type</th><th class='tblBorder'>Ratings</th></tr>";
  content +=
    "<tr class='tblBorder'><td class='tblBorder'>" +
    rating_process +
    "</td><td class='tblBorder'>" +
    company +
    "</td><td class='tblBorder'>" +
    mandate_type +
    "</td><td class='tblBorder'>" +
    rating_var +
    "</td></tr></table><br><br>";
  content +=
    "Please send the Rating Letter to the client for rating acceptance before <a href='" +
    URL +
    "'>Click here</a><br><br>";
  content +=
    "Click on the below link  to login and navigate the Rating Committee module to see more details. <a href='" +
    URL +
    "'>Click here</a><br><br>";
  content += "Thanks. <br><b>Team Infomerics</b><br>";
  content +=
    "<p style='background-color:red;color:#ffffff;'>Note: This is a system generated email ! please do not reply directly to this email</p></body></html>";
  return content;
}

// for creating email format press release
const workflow_press_release = async (params, PRESS_RELEASE_ALERT_DAY) => {
  try {
    const currentDate = new Date();
    let { to_user_name, company, meeting_date } = params;
    const meetingDate = new Date(meeting_date);

    let nextDate = await addWorkingDays(meetingDate, PRESS_RELEASE_ALERT_DAY);
    console.log("workflow_press_release: nextDate ", nextDate);

    let dateDiff = await dateDifferenceInDays(currentDate, nextDate);
    console.log("workflow_press_release: dateDiff ", dateDiff);

    nextDate =
      nextDate.getFullYear() +
      "/" +
      (nextDate.getMonth() + 1) +
      "/" +
      nextDate.getDate();

    let content = "<html><head></head><body>";
    content += "Dear " + to_user_name + ",<br><br>";
    content += "Greetings of the day!!<br><br>";
    content +=
      "This is to inform you that Press Release publication on the website is pending for " +
      company +
      " Please do the needful before <b>" +
      nextDate +
      ", only " +
      dateDiff +
      " days are left. </b><br><br>";
    content += "Thanks. <br><b>Team Infomerics</b><br>";
    content +=
      "<p style='background-color:red;color:#ffffff;'>Note: This is a system generated email ! please do not reply directly to this email</p></body></html>";
    console.log("workflow_press_release: ", content);
    return content;
  } catch (error) {
    console.log("error: ", error);
  }
};

// due dilligence email
const due_dilligence = async (params, URL) => {
  let { to_user_name, company, meeting_date } = params;
  let content = "<html><head></head><body>";
  content += "Dear " + to_user_name + ",<br><br>";
  content += "Greetings of the day!!<br><br>";
  content +=
    "This is to inform you that due diligence with stakeholders of " +
    company +
    " is pending. Please do needful before the case is sent to committee.</b><br><br>";
  content +=
    "Click on the link below to initiate due diligence. <a href='" +
    URL +
    "'>Click here</a><br><br>";
  content += "Thanks. <br><b>Team Infomerics</b><br>";
  content +=
    "<p style='background-color:red;color:#ffffff;'>Note: This is a system generated email ! please do not reply directly to this email</p></body></html>";
  return content;
};

// due dilligence MOM email
const due_dilligence_mom = async (params, URL) => {
  let { table, to_user_name } = params;
  let content = "<html><head></head><body>";
  content += "Dear Sir/Ma'am ,<br><br>";
  if (params.hasOwnProperty("date")) {
    content += `Please find below the summary of our discussion held on ${moment(
      params.date
    ).format("DD/MM/YYYY")}<br><br>`;
  }

  if (params.hasOwnProperty("attendees")) {
    content += "List of Attendees:<br>";
    content += "<ul>";
    params?.attendees?.map((user) => {
      content += `<li style="margin-left: 1rem;">${user?.name} (${user?.designation})</li>`;
    });
    content += "</ul><br>";
  }
  content += "Greetings from the Infomerics Team!!<br><br>";
  content +=
    "We would like to thank you for your time and cooperation to carry out our due diligence process.We are pleased to share the summary of our interactions with you.</b><br><br>";
  content += table + "<br><br>";
  content += "Thanks. <br><b>Team Infomerics</b><br>";
  content +=
    "<p style='background-color:red;color:#ffffff;'>Note: This is a system generated email ! please do not reply directly to this email</p></body></html>";
  return content;
};

// Alerts to RA for Rating Model completion:
const complete_rating_model = async (params, URL) => {
  let { to_user_name, company, meeting_date } = params;
  let content = "<html><head></head><body>";
  content += "Dear " + to_user_name + ",<br><br>";
  content += "Greetings of the day!!<br><br>";
  content +=
    "This is to inform you that the Rating Model sheet  Output is pending for " +
    company +
    ".  Please do needful before the case is sent to committee.</b><br><br>";
  content +=
    "Click on the link below to initiate rating Model. <a href='" +
    URL +
    "'>Click here</a><br><br>";
  content += "Thanks. <br><b>Team Infomerics</b><br>";
  content +=
    "<p style='background-color:red;color:#ffffff;'>Note: This is a system generated email ! please do not reply directly to this email</p></body></html>";
  return content;
};
// Alerts to BD if INC case happens during the  Mandate creation
const inc_case_encountered = async (params, URL) => {
  let { to_user_name, company, meeting_date, rating_agency } = params;
  let content = "<html><head></head><body>";
  content += "Dear " + to_user_name + ",<br><br>";
  content += "Greetings of the day!!<br><br>";
  content +=
    "This is to inform you that the " +
    company +
    " has been encountered as an <b>INC case</b> by another " +
    rating_agency +
    ".</b> for more than <b>12 Months</b>. So as per SEBI guidelines ,no other Rating Agency can start  Rating for the same<br><br>";
  content += "Thanks.<br><b>Team Infomerics</b><br>";
  content +=
    "<p style='background-color:red;color:#ffffff;'>Note: This is a system generated email ! please do not reply directly to this email</p></body></html>";
  return content;
};

//
async function rating_head_workflow_alert(params) {
  let { to_user_name, company, meeting_date, rating_agency } = params;
  let content = "<html><head></head><body>";
  content += "Dear " + to_user_name + ",<br><br>";
  content += "Greetings of the day!!<br><br>";
  content +=
    "This is to inform you that the Press Release is not published for the " +
    company +
    " within the given time frame i.e 5 days.<br><br>";
  content += "Please act accordingly<br>";
  content += "Thanks.<br><b>Team Infomerics</b><br>";
  content +=
    "<p style='background-color:red;color:#ffffff;'>Note: This is a system generated email ! please do not reply directly to this email</p></body></html>";
  return content;
}
// Alert when Share price decline by more than 20%
async function share_price(params, URL) {
  let { to_user_name, company } = params;
  let content = "<html><head></head><body>";
  content += "Dear " + to_user_name + ",<br><br>";
  content += "Greetings of the day!!<br><br>";
  content +=
    "This is to inform you that the share price of " +
    company +
    " has declined by more than 20%. An entry of material event has been added in the system.<br><br>";
  content +=
    "Click on the below link to access the details and take action on the same  <a href='" +
    URL +
    "'>Click here</a><br>";
  content += "Thanks.<br><b>Team Infomerics</b><br>";
  content +=
    "<p style='background-color:red;color:#ffffff;'>Note: This is a system generated email ! please do not reply directly to this email</p></body></html>";
  return content;
}

// Provisional communication to client
async function client_pc_data(params) {
  let { to_user_name, company, meeting_date, rating_agency } = params;
  let content = "<html><head></head><body>";
  content += "Dear " + to_user_name + ",<br><br>";
  content += "Greetings from Infomerics Valuation & Rating Pvt. Ltd<br><br>";
  content +=
    "We are pleased to share with you that Rating Committee of Infomerics has assigned the rating which can be found in the attached Provisional Letter. We would like to request you to provide your acceptance on the same by sending us the Acceptance Letter which can be found on the last page of the Provisional Letter.";

  content += "Thanks.<br>";

  content +=
    "<p><strong>Infomerics Valuation and Rating Pvt. Ltd.</strong></p>" +
    "<p><strong>(RBI & SEBI Registered Credit Rating Agency)</strong></p>" +
    "<p>108/106/104, Golf Apartments, Sujan Singh Park,</p>" +
    "<p>Maharishi Raman Marg, New Delhi, 110003.</p>" +
    `<p>Web: <a href="//www.infomerics.com" target="_blank">www.infomerics.com</a></p>` +
    "<p>Mobile: 8929802915, 011-41410244</p>" +
    "<p>Fax: +91 11 24627549</p>";

  return content;
}

// Rating letter to client
async function client_rl_data(params) {
  let { to_user_name, company, meeting_date, rating_agency } = params;
  let content = "<html><head></head><body>";
  content += "Dear " + to_user_name + ",<br><br>";
  content += "Greetings from Infomerics Valuation & Rating Pvt. Ltd<br><br>";
  content +=
    "We are pleased to share with you that Rating Committee of Infomerics has assigned the rating which can be found in the attached Rating Letter.";

  content += "Thanks.<br>";

  content +=
    "<p><strong>Infomerics Valuation and Rating Pvt. Ltd.</strong></p>" +
    "<p><strong>(RBI & SEBI Registered Credit Rating Agency)</strong></p>" +
    "<p>108/106/104, Golf Apartments, Sujan Singh Park,</p>" +
    "<p>Maharishi Raman Marg, New Delhi, 110003.</p>" +
    `<p>Web: <a href="//www.infomerics.com" target="_blank">www.infomerics.com</a></p>` +
    "<p>Mobile: 8929802915, 011-41410244</p>" +
    "<p>Fax: +91 11 24627549</p>";

  content +=
    "<p style='background-color:red;color:#ffffff;'>Note: This is a system generated email ! please do not reply directly to this email</p></body></html>";

  return content;
}

// Press release to client
async function client_pr_data(params) {
  let { to_user_name, company, meeting_date, rating_agency } = params;
  let content = "<html><head></head><body>";
  content += "Dear " + to_user_name + ",<br><br>";
  content += "Greetings from Infomerics Valuation & Rating Pvt. Ltd<br><br>";
  content +=
    "We are pleased to share with you that Rating Committee of Infomerics has assigned the rating which can be found in the attached Press Release.";

  content += "Thanks.<br>";

  content +=
    "<p><strong>Infomerics Valuation and Rating Pvt. Ltd.</strong></p>" +
    "<p><strong>(RBI & SEBI Registered Credit Rating Agency)</strong></p>" +
    "<p>108/106/104, Golf Apartments, Sujan Singh Park,</p>" +
    "<p>Maharishi Raman Marg, New Delhi, 110003.</p>" +
    `<p>Web: <a href="//www.infomerics.com" target="_blank">www.infomerics.com</a></p>` +
    "<p>Mobile: 8929802915, 011-41410244</p>" +
    "<p>Fax: +91 11 24627549</p>";

  content +=
    "<p style='background-color:red;color:#ffffff;'>Note: This is a system generated email ! please do not reply directly to this email</p></body></html>";

  return content;
}

module.exports = {
  SEND_AND_STORE_NDS_REMINDER_MAIL,
  SEND_EMAIL_IN_BATCHES,
  SEND_GENERAL_EMAIL,
  client_pc_data,
  client_rl_data,
  client_pr_data,
};
