const { QueryTypes, Op } = require("sequelize");
const { DB_CLIENT } = require("../../../db");
const { error_logger } = require("../../../loki-push-agent");
const { MisDataMart } = require("../../../models/mis-data-mart");
const { PRDataMart } = require("../../../models/mis-data-mart/prModel");
const {MisReportType} = require("../../../models/mis-data-mart/report-category");
const { PR_REPORT_HEADER, RATING_MIS_REPORT, RATINGSUMMARY, INVESTMENTMAP,DOWNGRADE,UPGRADE,ANNEXUREIIAREPORT } = require("../../../lang/index");
const { forIn } = require("lodash");
const { parse } = require("path");
const { Exception } = require("handlebars");
const { v4: uuidv4 } = require("uuid");
async function mis_data_mart_routes(fastify) {

    // for mis report category
    fastify.post("/mis-report-category-insert", async (request, reply) => {
        try
        {   
            const {type,name} =request?.body;
            request.body.uuid=uuidv4();
            
            let nameCheck = await MisReportType.findAll({
                where: {
                    name:name,
                },
            });
            console.log("Response => ",nameCheck);

            if (nameCheck?.length>0) { throw new Exception('Category Already Exist', `Category name already exist!`,) }
            let data = await MisReportType.create(request?.body)

            reply.send({
                success: true,
                message:"Data Inserted Successfully"
                
            });
        }catch(error)
        {
            error_logger.debug("error in getting mis report category" + error)
            reply.statusCode = 422;
            reply.send({
                success: false,
                error: error["errors"] ?? String(error),
            });
        }
    })
    fastify.post("/mis-report-category", async (request, reply) => {
        try
        {   
            let {type,name, limit,offset,from,to,is_active,sortBy,sortOrder} =request?.body;
            if (undefined == sortBy) { sortBy = 'name' }
            if (undefined == sortOrder) { sortOrder = 'ASC' }
            let where={}
            if(type!==undefined && type!==null)
            {
                where= { type:type  } 
            }
            
            if(name!==undefined && name!==null)
            {
                where= {
                    ...where, 
                     name:name 
                    } 
            }
            if(is_active!==undefined && is_active!==null)
            {
                where= {
                    ...where, 
                    is_active:is_active 
                    } 
            }
            if (to != undefined) {
                where = from ? {
                    ...where,
                    meeting_date: {
                        [Op.between]: [from, to]
                    }
                } : {
                    ...where,
                    meeting_date: {
                        [Op.lte]: to
                    }
                }
            }
            let data = await MisReportType.findAndCountAll({
                where: {
                    ...where,
                },
                attributes: {
                    exclude: ['uuid','created_at', 'updated_at', 'trashed_at'],
                },
                limit: limit,
                offset: offset,
                order: [[String(sortBy), String(sortOrder)]],logging:true
            });
            reply.send({
                success: true,
                count:data.count,
                data: data
                
            });
        }catch(error)
        {
            error_logger.debug("error in getting mis report category" + error)
            reply.statusCode = 422;
            reply.send({
                success: false,
                error: error["errors"] ?? String(error),
            });
        }
    });


    fastify.post("/mis-data-marts/reports", async (request, reply) => {
        try {
            const { type, from, to,reportId } = request.body;
            let data = []
            switch (reportId) {
                case 1:
                    data = await prMisReport(request);
                    break;
                case 2:
                    data = await ratingMisReport(request);
                    break;
                case 3:
                    request.body.reportId=3
                    data = await annexureIAreport(request);
                    break;     
                case 4:
                    request.body.reportId=4
                    data = await annexureIIAreport(request);
                    break;
                case 5:
                    request.body.reportId=5
                    data = await annexureIIAreport(request);
                    break;    
                case 6:
                    data = await ratingSummaryReport(request);
                    break;
                    default:
                    data = await prMisReport(request);
            }
            reply.send({
                success: true,
                count:data.count,
                data: data.data
                
            });
        }
        catch (err) {
            error_logger.debug("error in getting data from mis-data-marts table" + err)
            reply.statusCode = 422;
            reply.send({
                success: false,
                error: err["errors"] ?? String(err),
            });
        }
    });

    // for pr mis report as client provide for master dump
    async function prMisReport(request, response) {
        try {
            let { from, to, limit,substype, offset, sortBy, sortOrder,reportId } = request.body;
            if (undefined == sortBy) { sortBy = 'company_name' }
            if (undefined == sortOrder) { sortOrder = 'ASC' }
            const data = await DB_CLIENT.query(
                `exec getMisRatingReport @fromDate = :from, @toDate=:to, @reportId=:reportId, @limit=:limit, @offset=:offset, @sortBy=:sortBy, @sortOrder=:sortOrder,@substype=:substype`,
               {
                replacements: {
                   from: from,
                   to: to,
                   reportId: reportId,
                   limit:limit,
                   offset:offset,
                   sortBy:sortBy,
                   sortOrder:sortOrder,
                  substype:substype
              
               },
                type: QueryTypes.SELECT,
                }
               );
               console.log("data: ::",data);
           count=0
           if(data.length>0)
           {
               count=data[0]?.count
           }
           let responseData =
           {
               count :count,
               data:data,
           };
           return Promise.resolve(responseData);
        }
        catch (error) {
             error_logger.debug("error in getting data from prMisReport report" + error)
            return Promise.reject(error);
        }
    }
  // for rating MIS sheet as they provide for master dump 
    async function ratingMisReport(request, response) {
        try {
            let { from, to, limit,reportId, offset, sortBy, sortOrder,substype} = request.body;

            if (undefined == sortBy) { sortBy = 'company_name' }
            if (undefined == sortOrder) { sortOrder = 'ASC' }
            const data = await DB_CLIENT.query(
                `exec getMisRatingReport @fromDate = :from, @toDate=:to, @reportId=:reportId, @limit=:limit, @offset=:offset, @sortBy=:sortBy, @sortOrder=:sortOrder,@substype=:substype`,
               {
                replacements: {
                   from: from,
                   to: to,
                   reportId: reportId,
                   limit:limit,
                   offset:offset,
                   sortBy:sortBy,
                   sortOrder:sortOrder,
                   substype:substype
              
               },
                type: QueryTypes.SELECT,
                }
               );
           count=0
           if(data.length>0)
           {
               count=data[0]?.count
           }
           let responseData =
           {
               count :count,
               data:data,
           };
            return Promise.resolve(responseData);
        }
        catch (error) {
            error_logger.debug("error in getting data from ratingMisReport report" + error)
            return Promise.reject(error);
        }
    }
}
// 
async function ratingSummaryReport(request, response) {
    let { from, to, limit, offset, sortBy, sortOrder } = request.body;
    try {

        if (undefined == sortBy) { sortBy = 'company_name' }
        if (undefined == sortOrder) { sortOrder = 'ASC' }
        let where = {}
        // where = {
        //     previous_rat: {
        //         [Op.eq]: null
        //     },
        //     nature_of_assignment: {
        //         [Op.like]: 'Fresh'
        //     }
        // }
        if (to != undefined) {
            where = from ? {
                ...where,
                meeting_date: {
                    [Op.between]: [from, to]
                }
            } : {
                ...where,
                meeting_date: {
                    [Op.lte]: to
                }
            }
        }
        let data = await MisDataMart.findAndCountAll({
            where: {
                ...where,
            },
            attributes: {
                exclude: ['id','uuid', 'company_id', 'created_at', 'updated_at', 'deleted_at'],
            }
        });
        // New Rating details
        let Response1=await getTotalCountSize(data?.rows);
        // getting upgrade details
        let Response2=await getUpgradeRatingSummary(data?.rows);
        // mergining two object array
        Array.prototype.push.apply(Response1,Response2); 
        let responseData = {};
        responseData.count = data.length;
        responseData.data= {};
        responseData.data.count= 0;
        responseData.data.rows= Response1;
        responseData.data.header = RATINGSUMMARY;
        return Promise.resolve(responseData);

    }
    catch (error) {
        error_logger.debug("error in getting data from rating summary report" + error)
        return Promise.reject(error);
    }
}
// getting total row count and size total for new rating 
async function getTotalCountSize(data)
{       let count=0;
        let size=0.0;
        try{
            for(let i=0;i<data.length;i++)
            {
                if(data[i]['nature_of_assignment']==='Fresh' || data[i]['nature_of_assignment']==='Initial')
                {
                let parseSize=parseFloat(data[i]['size']);
                if(!isNaN(parseSize))
                {
                    size=size+parseSize; 
                }
                count++;
                }
            }
            let response =[{
                key:'1',
                name:'New Ratings',
                no_of_ratings:count,
                amount:roundToTwo(size)
            }]
            return Promise.resolve(response);
        }
        catch(error)
        {
            error_logger.debug("error in getting data from getTotalCountSize report" + error)
            return Promise.reject(error);
        }
}
// gettting upgrade rating summary
async function getUpgradeRatingSummary(data)
{   
        let count=0;
        let countInventment=0;
        let countDownGrade=0;
        let countDownGradeInvestToNonInvest=0;
        let size=0.0;
        let sizeInventment=0.0;
        let sizeDownGrade=0.0;
        let sizeDownGradeInvestToNonInvest=0.0;
        let recordId=[];
        let recordIdInventment=[];
        let recordDownGrade=[];
        let recordDownGradeInvestToNonInvest=[];
        // for Surveillance
        let countSurveillanceIssuer=0; 
        let sizeSurveillanceIssuer=0; 
        // fot Surveillance : Rating that have undergone revision post appeal by Issuer
        let countSurveillanceIssuerDiff=0; 
        let sizeSurveillanceIssuerDiff=0;
        // for withdrawn
        let countWithdrawn=0;
        let sizeWithdrawn=0.0;
        // final AAA
        let aaaTotal=0.0;
        let aaaCount=0;
        let aaTotal=0.0;
        let aaCount=0;
        let aTotal=0.0;
        let aCount=0;
        let bbbTotal=0.0;
        let bbbCount=0;
        let bbTotal=0.0;
        let bbCount=0;
        let bTotal=0.0;
        let bCount=0;
        let cTotal=0.0;
        let cCount=0;
        let dTotal=0.0;
        let dCount=0;
        try{
            for(let i=0;i<data.length;i++)
            {
                // getting previous rating sum
                let oldRatingSum=0.0;  
                let currRatingSum=0.0;
                let oldRatingSumLt=0.0;
                let oldRatingSumSt=0.0; 
                let currRatingSumLt=0.0;
                let currRatingSumSt=0.0;
                // for surveillance
                let oldRatingSum_SurveillanceIssuerDiff=0.0;  
                let currRatingSum_SurveillanceIssuerDiff=0.0;
                let oldRatingSumLt_SurveillanceIssuerDiff=0.0;
                let oldRatingSumSt_SurveillanceIssuerDiff=0.0; 
                let currRatingSumLt_SurveillanceIssuerDiff=0.0;
                let currRatingSumSt_SurveillanceIssuerDiff=0.0;

                if(i==0)
                {
                        oldRatingSumLt=parseFloat(data[i]['previous_lt_rat_no']);
                        oldRatingSumSt=parseFloat(data[i]['previous_st_rat_grade_no']);    
                        if(!isNaN(oldRatingSumLt))
                        {
                            oldRatingSum=oldRatingSum+oldRatingSumLt; 
                        }

                        if(!isNaN(oldRatingSumSt))
                        {
                            oldRatingSum=oldRatingSum+oldRatingSumSt; 
                        }
                        // current rating sum
                        currRatingSumLt=parseFloat(data[i]['curr_lt_rat_grade_no']);
                        currRatingSumSt=parseFloat(data[i]['curr_st_rat_grade_no']);    
                        if(!isNaN(currRatingSumLt))
                        {
                            currRatingSum=currRatingSum+currRatingSumLt; 
                        }
                        if(!isNaN(currRatingSumSt))
                        {
                            currRatingSum=currRatingSum+currRatingSumSt; 
                        }
                }
                else if(data[i]['company_name']!==data[i-1]['company_name'] )
                {
                oldRatingSumLt=parseFloat(data[i]['previous_lt_rat_no']);
                oldRatingSumSt=parseFloat(data[i]['previous_st_rat_grade_no']);    
                if(!isNaN(oldRatingSumLt))
                {
                    oldRatingSum=oldRatingSum+oldRatingSumLt; 
                }
                if(!isNaN(oldRatingSumSt))
                {
                    oldRatingSum=oldRatingSum+oldRatingSumSt; 
                }
                // current rating sum
                currRatingSumLt=parseFloat(data[i]['curr_lt_rat_grade_no']);
                currRatingSumSt=parseFloat(data[i]['curr_st_rat_grade_no']);    
                if(!isNaN(currRatingSumLt))
                {
                    currRatingSum=currRatingSum+currRatingSumLt; 
                }
                if(!isNaN(currRatingSumSt))
                {
                    currRatingSum=currRatingSum+currRatingSumSt; 
                }
                }

               // for checking upgrades
                if(currRatingSum>oldRatingSum && oldRatingSum>0)
                {
                    count++;
                    recordId.push(data[i]['company_name']);
                }
                
                // from non investment/ below investment to Investment
                if(currRatingSum>oldRatingSum && oldRatingSum>0 && oldRatingSum<10 && currRatingSum>10 )
                {
                    countInventment++;
                    recordIdInventment.push(data[i]['company_name']);
                }
                // for checking downgrades
                if(oldRatingSum>currRatingSum)
                {
                    countDownGrade++;
                    recordDownGrade.push(data[i]['company_name']);
                }
                // downgrade and investment to non-investment/below investment
                if(oldRatingSum>currRatingSum && currRatingSum<10)
                {
                    countDownGradeInvestToNonInvest++;
                    recordDownGradeInvestToNonInvest.push(data[i]['company_name']);
                }
                // Surveillance report data
                if(data[i]['nature_of_assignment']=='Surveillance')
                {
                    countSurveillanceIssuer++;
                    let parseSize=parseFloat(data[i]['size']);
                    if(!isNaN(parseSize))
                    {
                        sizeSurveillanceIssuer=sizeSurveillanceIssuer+parseSize; 
                    }
                        // for checking revision of rating post appeal
                        oldRatingSumLt_SurveillanceIssuerDiff=parseFloat(data[i]['previous_lt_rat_no']);
                        oldRatingSumSt_SurveillanceIssuerDiff=parseFloat(data[i]['previous_st_rat_grade_no']); 

                        if(!isNaN(oldRatingSumLt_SurveillanceIssuerDiff))
                        {
                            oldRatingSum_SurveillanceIssuerDiff=oldRatingSum_SurveillanceIssuerDiff+oldRatingSumLt_SurveillanceIssuerDiff; 
                        }

                        if(!isNaN(oldRatingSumSt_SurveillanceIssuerDiff))
                        {
                            oldRatingSum_SurveillanceIssuerDiff=oldRatingSum_SurveillanceIssuerDiff+oldRatingSumSt_SurveillanceIssuerDiff; 
                        }
                        // current rating sum
                        currRatingSumLt_SurveillanceIssuerDiff=parseFloat(data[i]['curr_lt_rat_grade_no']);
                        currRatingSumSt_SurveillanceIssuerDiff=parseFloat(data[i]['curr_st_rat_grade_no']);    
                        if(!isNaN(currRatingSumLt_SurveillanceIssuerDiff))
                        {
                            currRatingSum_SurveillanceIssuerDiff=currRatingSum_SurveillanceIssuerDiff+currRatingSumLt_SurveillanceIssuerDiff; 
                        }
                        if(!isNaN(currRatingSumSt_SurveillanceIssuerDiff))
                        {
                            currRatingSum_SurveillanceIssuerDiff=currRatingSum_SurveillanceIssuerDiff+currRatingSumSt_SurveillanceIssuerDiff; 
                        }
                        // checking main diff
                        if(oldRatingSum_SurveillanceIssuerDiff!==currRatingSum_SurveillanceIssuerDiff)
                        {
                            countSurveillanceIssuerDiff++;
                            let parseSize=parseFloat(data[i]['size']);
                            if(!isNaN(parseSize))
                            {
                                sizeSurveillanceIssuerDiff=sizeSurveillanceIssuerDiff+parseSize; 
                            }
                        }
                }
                // for getting count and size for rating withdrawn
                if(data[i]['curr_lt_rat_grade_by_cmte']==='Withdrawn')
                {
                    countWithdrawn++;
                    let parseSize=parseFloat(data[i]['size']);
                    if(!isNaN(parseSize))
                    {
                        sizeWithdrawn=sizeWithdrawn+parseSize; 
                    }
                }
                // AAA
                if(data[i]['curr_lt_rat_grade_by_cmte']==='IVR AAA')
                {
                    aaaCount++;
                    let parseSize=parseFloat(data[i]['size']);
                    if(!isNaN(parseSize))
                    {
                        aaaTotal=aaaTotal+parseSize; 
                    }
                }
                // for total count for AA
                if(data[i]['curr_lt_rat_grade_by_cmte']==='IVR AA')
                {
                    aaCount++;
                    let parseSize=parseFloat(data[i]['size']);
                    if(!isNaN(parseSize))
                    {
                        aaTotal=aaTotal+parseSize; 
                    }
                }
                if(data[i]['curr_lt_rat_grade_by_cmte']==='IVR A')
                {
                    aCount++;
                    let parseSize=parseFloat(data[i]['size']);
                    if(!isNaN(parseSize))
                    {
                        aTotal=aTotal+parseSize; 
                    }
                }
                if(data[i]['curr_lt_rat_grade_by_cmte']==='IVR BBB')
                {
                    bbbCount++;
                    let parseSize=parseFloat(data[i]['size']);
                    if(!isNaN(parseSize))
                    {
                        bbbTotal=bbbTotal+parseSize; 
                    }
                }
                if(data[i]['curr_lt_rat_grade_by_cmte']==='IVR BB')
                {
                    bbCount++;
                    let parseSize=parseFloat(data[i]['size']);
                    if(!isNaN(parseSize))
                    {
                        bbTotal=bbTotal+parseSize; 
                    }
                }
                if(data[i]['curr_lt_rat_grade_by_cmte']==='IVR B')
                {
                    bCount++;
                    let parseSize=parseFloat(data[i]['size']);
                    if(!isNaN(parseSize))
                    {
                        bTotal=bTotal+parseSize; 
                    }
                }
                if(data[i]['curr_lt_rat_grade_by_cmte']==='IVR C')
                {
                    cCount++;
                    let parseSize=parseFloat(data[i]['size']);
                    if(!isNaN(parseSize))
                    {
                        cTotal=cTotal+parseSize; 
                    }
                }
                if(data[i]['curr_lt_rat_grade_by_cmte']==='IVR D')
                {
                    dCount++;
                    let parseSize=parseFloat(data[i]['size']);
                    if(!isNaN(parseSize))
                    {
                        dTotal=dTotal+parseSize; 
                    }
                }
            }
           
            for(let i=0;i<data.length;i++)
            {
                if(recordId.includes(data[i]['company_name']))
                {
                    let parseSize=parseFloat(data[i]['size']);
                    if(!isNaN(parseSize))
                    {
                        size=size+parseSize; 
                    }
                }
                // invsetment grades
                if(recordIdInventment.includes(data[i]['company_name']))
                {
                    let parseSize2=parseFloat(data[i]['size']);
                    if(!isNaN(parseSize2))
                    {
                        sizeInventment=sizeInventment+parseSize2; 
                    }
                }
                // down grades
                if(recordDownGrade.includes(data[i]['company_name']))
                {
                    let parseSize3=parseFloat(data[i]['size']);
                    if(!isNaN(parseSize3))
                    {
                        sizeDownGrade=sizeDownGrade+parseSize3; 
                    }
                }
                // down grade and inestment to non investment
                if(recordDownGradeInvestToNonInvest.includes(data[i]['company_name']))
                {
                    let parseSize4=parseFloat(data[i]['size']);
                    if(!isNaN(parseSize4))
                    {
                        sizeDownGradeInvestToNonInvest=sizeDownGradeInvestToNonInvest+parseSize4; 
                    }
                }
            }
           
            let response =
            [
            {
                key:'2',
                name:'Upgrades',
                no_of_ratings:'',
                amount:''    
            },    
            {
                key:'a',
                name:'Total Upgrades',
                no_of_ratings:count,
                amount:roundToTwo(size),
                
            },
            {
                key:'b',
                name:'Upgrades from Non-Investment to Investment Grade',
                no_of_ratings:countInventment,
                amount:roundToTwo(sizeInventment)
            },
            {
                key:'3',
                name:'Downgrades',
                no_of_ratings:'',
                amount:''
            },
            {
                key:'a',
                name:'Total Downgrades',
                no_of_ratings:countDownGrade,
                amount:roundToTwo(sizeDownGrade)
            },
            {
                key:'b',
                name:'Downgrades from Investment to Non - Investment Grade',
                no_of_ratings:countDownGradeInvestToNonInvest,
                amount:roundToTwo(sizeDownGradeInvestToNonInvest)
            },
            {
                key:'4',
                name:'Defaults',
                no_of_ratings:'',
                amount:''
            },
            {
                key:'a',
                name:'Total Defaults',
                no_of_ratings:'',
                amount:''
            }
            ,
            {
                key:'b',
                name:'Default from Non- Investment Grade',
                no_of_ratings:'',
                amount:''
            },
            {
                key:'c',
                name:'Default from Investment Grade',
                no_of_ratings:'',
                amount:''
            },
            {
                key:'c',
                name:'Default from Investment Grade',
                no_of_ratings:'',
                amount:''
            },
            {
                key:'',
                name:'AAA',
                no_of_ratings:'',
                amount:''
            },
            {
                key:'',
                name:'AA',
                no_of_ratings:'',
                amount:''
            },
            {
                key:'',
                name:'A',
                no_of_ratings:'',
                amount:''
            },
            {
                key:'',
                name:'BBB',
                no_of_ratings:'',
                amount:''
            },
            {
                key:'5',
                name:'Change in Ratings assigned post appeal by Issuer in surveillance cases',
                no_of_ratings:'',
                amount:''
            },
            {
                key:'a',
                name:'Ratings appealed by the Issuer',
                no_of_ratings:countSurveillanceIssuer,
                amount:roundToTwo(sizeSurveillanceIssuer)
            },
            {
                key:'b',
                name:'Rating that have undergone revision post appeal by Issuer',
                no_of_ratings:countSurveillanceIssuerDiff,
                amount:roundToTwo(sizeSurveillanceIssuerDiff)
            },
            {
                key:'6',
                name:'Ratings Withdrawn',
                no_of_ratings:countWithdrawn,
                amount:roundToTwo(sizeWithdrawn)
            },
            {
                key:'7',
                name:'Rating Distribution for outstanding ratings as on 30th September 2021.',
                no_of_ratings:'',
                amount:''
            }
            ,
            {
                key:'a',
                name:'AAA',
                no_of_ratings:aaaCount,
                amount:roundToTwo(aaaTotal)
            }
            ,
            {
                key:'b',
                name:'AA',
                no_of_ratings:aaCount,
                amount:roundToTwo(aaTotal)
            }
            ,
            {
                key:'c',
                name:'A',
                no_of_ratings:aCount,
                amount:roundToTwo(aTotal)
            }
            ,
            {
                key:'d',
                name:'BBB',
                no_of_ratings:bbbCount,
                amount:roundToTwo(bbbTotal)
            },
            {
                key:'e',
                name:'BB',
                no_of_ratings:bbCount,
                amount:roundToTwo(bbTotal)
            }
            ,
            {
                key:'f',
                name:'B',
                no_of_ratings:bCount,
                amount:roundToTwo(bTotal)
            }
            ,
            {
                key:'g',
                name:'C',
                no_of_ratings:cCount,
                amount:roundToTwo(cTotal)
            }
            ,
            {
                key:'h',
                name:'D',
                no_of_ratings:dCount,
                amount:roundToTwo(dTotal)
            }
            

            
            
            ]
            return Promise.resolve(response);

    }
    catch(error)
    {
        error_logger.debug("error in getting data from getUpgradeRatingSummary report" + error)
        return Promise.reject(error);
    }

}

// Annexure I Areport
async function annexureIAreport(request)
    {
    let { from, to, limit,substype, offset, sortBy, sortOrder,reportId } = request.body;
    try{
            if (undefined == sortBy) { sortBy = 'company_name' }
            if (undefined == sortOrder) { sortOrder = 'ASC' }
            if(substype==undefined){ substype=DOWNGRADE}
            const data = await DB_CLIENT.query(
                 `exec getMisRatingReport @fromDate = :from, @toDate=:to, @reportId=:reportId, @limit=:limit, @offset=:offset, @sortBy=:sortBy, @sortOrder=:sortOrder,@substype=:substype`,
                {
                 replacements: {
                    from: from,
                    to: to,
                    reportId: reportId,
                    limit:limit,
                    offset:offset,
                    sortBy:sortBy,
                    sortOrder:sortOrder,
                    substype:substype

                },
                 type: QueryTypes.SELECT,
                 }
                );
            count=0
            if(data.length>0)
            {
                count=data[0]?.count
            }
            let responseData =
            {
                count :count,
                data:data,
            };
            return Promise.resolve(responseData);
        }
        catch (error) {
             error_logger.debug("error in getting data from Annexure I Areport report" + error)
            return Promise.reject(error);
        }
    }

// for round the number to 2 decimal
function roundToTwo(num) {
    return +(Math.round(num + "e+2")  + "e-2");
}

// for annexure II Areport
async function annexureIIAreport(request)
    {
    let { from, to, limit,substype, offset, sortBy, sortOrder,reportId } = request.body;
    try{
            if (undefined == sortBy) { sortBy = 'company_name' }
            if (undefined == sortOrder) { sortOrder = 'ASC' }
            if(reportId==4)
            {
                substype=DOWNGRADE
            }
            if(reportId==5)
            {
                substype=UPGRADE
            }
            const data = await DB_CLIENT.query(
                 `exec getMisRatingReport @fromDate = :from, @toDate=:to, @reportId=:reportId, @limit=:limit, @offset=:offset, @sortBy=:sortBy, @sortOrder=:sortOrder,@substype=:substype`,
                {
                 replacements: {
                    from: from,
                    to: to,
                    reportId: reportId,
                    limit:limit,
                    offset:offset,
                    sortBy:sortBy,
                    sortOrder:sortOrder,
                    substype:substype

                },
                 type: QueryTypes.SELECT,
                 }
                );
            count=0
            if(data.length>0)
            {
                count=data[0]?.count
            }
            let responseData =
            {
                count :count,
                data:data,
            };
            return Promise.resolve(responseData);
        }
        catch (error) {
             error_logger.debug("error in getting data from annexureIIAreport report" + error)
            return Promise.reject(error);
        }
    }

// for round the number to 2 decimal
function roundToTwo(num) {
    return +(Math.round(num + "e+2")  + "e-2");
}

module.exports = {
    mis_data_mart_routes
};