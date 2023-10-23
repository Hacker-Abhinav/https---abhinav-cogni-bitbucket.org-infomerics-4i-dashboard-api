const { default: puppeteer } = require("puppeteer");
const moment = require("moment");
const { GET_OUTPUT_RATING_SHEET_DATA } = require("../../../repositories/outputRatingSheet");

const header = () => {
    return `
    <div style=" display: flex; align-items: center; justify-content: center;padding:0 30px">
      <div>
        <svg width="64" height="63" viewBox="0 0 64 63" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M35.0316 23.7129L27.705 34.4689H33.4389L32.6379 36.799C32.6379 36.799 23.5199 37.1631 23.2984 36.799C23.077 36.4349 29.6617 27.4573 29.6617 27.4573L28.8427 27.662L28.2775 25.4014L35.0316 23.7129Z" fill="black"/>
          <path d="M41.1554 23.691C41.1554 24.6562 40.373 25.4386 39.4078 25.4386C38.4426 25.4386 37.6602 24.6562 37.6602 23.691C37.6602 22.7258 38.4426 21.9434 39.4078 21.9434C40.373 21.9434 41.1554 22.7258 41.1554 23.691Z" fill="#2B58BF"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M22.4856 18.7884C25.8626 16.5115 30.0211 15.5359 34.1202 16.0466C38.2197 16.5574 41.9758 18.5199 44.6189 21.5573C47.264 24.5971 48.5935 28.4851 48.3177 32.4331C48.042 36.3805 46.1841 40.0651 43.1453 42.7463C40.1369 45.4007 36.9551 46.7609 32.7844 46.7609C32.1084 46.7609 31.5604 46.2129 31.5604 45.537C31.5604 44.861 32.1084 44.313 32.7844 44.313C36.3032 44.313 38.9212 43.2089 41.5258 40.9108C44.1001 38.6394 45.6465 35.5454 45.8758 32.2625C46.1051 28.9802 45.0028 25.7275 42.7723 23.1642C40.5397 20.5985 37.3412 18.9148 33.8175 18.4757C30.2934 18.0366 26.7307 18.8785 23.8541 20.818C20.9793 22.7563 19.0128 25.6387 18.3281 28.8679C17.6438 32.0953 18.2854 35.452 20.1356 38.2619C21.9876 41.0746 24.9183 43.1359 28.3476 44.0057C29.0028 44.1719 29.3993 44.8378 29.2331 45.493C29.0669 46.1482 28.401 46.5446 27.7458 46.3785C23.7499 45.3649 20.2933 42.9525 18.0911 39.6081C15.8872 36.261 15.1113 32.2382 15.9335 28.3602C16.7554 24.4838 19.1068 21.0666 22.4856 18.7884Z" fill="#2B58BF"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M31.6209 44.2981L36.7182 28.7879L39.194 28.4238L34.0967 44.2253C35.4802 44.371 38.757 43.4971 40.4318 42.3321L41.3057 43.4971C39.1211 45.2448 35.4569 46.0717 34.0967 46.2642C33.4702 46.3529 32.7288 46.426 32.2747 46.1634C31.9454 45.9729 31.6676 45.6583 31.5606 45.2327C31.4679 44.8642 31.5338 44.5334 31.6209 44.2981Z" fill="#2B58BF"/>
          <path d="M11.71 31.2261C11.71 34.4597 9.08859 37.081 5.85498 37.081C2.62136 37.081 0 34.4597 0 31.2261C0 27.9925 2.62136 25.3711 5.85498 25.3711C9.08859 25.3711 11.71 27.9925 11.71 31.2261Z" fill="black"/>
          <path d="M63.7529 31.2261C63.7529 34.4597 61.1316 37.081 57.8979 37.081C54.6643 37.081 52.043 34.4597 52.043 31.2261C52.043 27.9925 54.6643 25.3711 57.8979 25.3711C61.1316 25.3711 63.7529 27.9925 63.7529 31.2261Z" fill="black"/>
          <path d="M11.71 5.85498C11.71 9.08859 9.08859 11.71 5.85498 11.71C2.62136 11.71 0 9.08859 0 5.85498C0 2.62136 2.62136 0 5.85498 0C9.08859 0 11.71 2.62136 11.71 5.85498Z" fill="black"/>
          <path d="M37.7334 5.85498C37.7334 9.08859 35.112 11.71 31.8784 11.71C28.6448 11.71 26.0234 9.08859 26.0234 5.85498C26.0234 2.62136 28.6448 0 31.8784 0C35.112 0 37.7334 2.62136 37.7334 5.85498Z" fill="black"/>
          <path d="M63.7529 5.85498C63.7529 9.08859 61.1316 11.71 57.8979 11.71C54.6643 11.71 52.043 9.08859 52.043 5.85498C52.043 2.62136 54.6643 0 57.8979 0C61.1316 0 63.7529 2.62136 63.7529 5.85498Z" fill="black"/>
          <path d="M11.71 56.5972C11.71 59.8308 9.08859 62.4521 5.85498 62.4521C2.62136 62.4521 0 59.8308 0 56.5972C0 53.3636 2.62136 50.7422 5.85498 50.7422C9.08859 50.7422 11.71 53.3636 11.71 56.5972Z" fill="black"/>
          <path d="M37.7334 56.5972C37.7334 59.8308 35.112 62.4521 31.8784 62.4521C28.6448 62.4521 26.0234 59.8308 26.0234 56.5972C26.0234 53.3636 28.6448 50.7422 31.8784 50.7422C35.112 50.7422 37.7334 53.3636 37.7334 56.5972Z" fill="black"/>
          <path d="M63.7529 56.5972C63.7529 59.8308 61.1316 62.4521 57.8979 62.4521C54.6643 62.4521 52.043 59.8308 52.043 56.5972C52.043 53.3636 54.6643 50.7422 57.8979 50.7422C61.1316 50.7422 63.7529 53.3636 63.7529 56.5972Z" fill="black"/>
        </svg>
        <p style="color:#1998d1;font-size: 16px;line-height:1;margin:0;text-align:center;">Infomerics <br/> Rating</p>
      </div>
      <div style="padding-left:20px">
        <h2 style="text-transform: uppercase;font-weight: 900;font-size: 16px;color: #000000;margin-bottom:1px;">infomerics valuation and rating pvt. ltd.</h2>
        <p  style="text-transform: uppercase;font-weight: 500;font-size: 9px;color: #000000;">Integrated Financial Omnibus Metric Research of international Corporate System</p>
      </div>
    </div>
    `;
  };

async function get_output_rating_sheet_pdf(params){
try{
    console.log("HIIIIIII");
    const current_time = moment().format();
    const path = `generated/${params.company_name}/output_rating_sheet.pdf`;
    console.log("path======================>", path);
    const data = await GET_OUTPUT_RATING_SHEET_DATA ({
    company_id : params.company_id
  });

  console.log("data: ", data);

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--headless"],
  });
  const page = await browser.newPage();
  const html = await params.fastify.view(
    `templates/pdf/outputRatingSheet.pug`,
    { data: data, require: require }
  );
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  await page.emulateMediaType("screen");

  await page.pdf({
    displayHeaderFooter: true,  
    headerTemplate: header(),
    path: 'generated/sample_rating_sheet.pdf',
    margin: { top: "180px", right: "10px", bottom: "100px", left: "10px" },
    printBackground: true,
    format: "A4",
  });
  await browser.close();

  console.log("page====================>", page);

  console.log("path:",path)



//   const pdf = readFile('/generated/sample_rating_sheet.pdf');
//   console.log("pdf:",pdf)

  return;
}catch(error){
    console.log("error: ", error);
}
}


module.exports = {
    get_output_rating_sheet_pdf
}