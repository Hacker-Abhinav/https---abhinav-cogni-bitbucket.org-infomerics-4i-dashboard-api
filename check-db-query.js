const { Mandate, User, BranchOffice, Company } = require("./models/modules/onboarding");

// For Mandates
async function CHECK_DB_QUERY() {
  return new Promise(async (resolve, reject) => {

    const mandates = await Mandate.findAll({
      where: {
        company_id: 27,
        is_active: true,
      },
      include: [
        {
          model: User,
          as: "group_head",
          attributes: ["uuid", "full_name"],
        },
        {
          model: User,
          as: "rating_analyst",
          attributes: ["uuid", "full_name"],
        },
        {
          model: User,
          as: "rating_head",
          attributes: ["uuid", "full_name"],
        },
        {
          model: User,
          as: "business_developer",
          attributes: ["uuid", "full_name"],
        },
        {
          model: BranchOffice,
          as: "branch_office",
          attributes: ["uuid", "name"],
        },
        {
          model: Company,
          as: "company_mandate",
          attributes: ["uuid", "name"],
        },
      ],
    });

    resolve(mandates);
  });
}

(async () => {
  const result = await CHECK_DB_QUERY();
  console.log("CHECK_DB_QUERY", result);
})();