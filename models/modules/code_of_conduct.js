const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../../db");
const { User, Role, Company, Mandate, UserAttribute } = require("./onboarding");
const { RatingProcess, FinancialYear } = require("./rating-model");

const RelationshipType = DB_CLIENT.define(
  "relationship",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      notEmpty: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
  },
  {
    tableName: "relationship_types",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
      {
        unique: true,
        fields: ["name"],
      },
    ],
    underscored: true,
  }
);

const FormType = DB_CLIENT.define(
  "form_type",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      notEmpty: true,
    },
    form_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      notEmpty: true,
      unique: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      notEmpty: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
  },
  {
    tableName: "form_types",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
      {
        unique: true,
        fields: ["name"],
      },
    ],
    underscored: true,
  }
);

const SecurityType = DB_CLIENT.define(
  "security_type",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      notEmpty: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
  },
  {
    tableName: "security_types",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
      {
        unique: true,
        fields: ["name"],
      },
    ],
    underscored: true,
  }
);

const MaterialEventReason = DB_CLIENT.define(
  "material_event_reason",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      notEmpty: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
  },
  {
    tableName: "material_event_reasons",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
      {
        unique: true,
        fields: ["name"],
      },
    ],
    underscored: true,
  }
);
const MaterialEventStatus = DB_CLIENT.define(
  "material_event_status",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      notEmpty: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
  },
  {
    tableName: "material_event_status",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
      {
        unique: true,
        fields: ["name"],
      },
    ],
    underscored: true,
  }
);

const RatingStatus = DB_CLIENT.define(
  "rating_status",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      notEmpty: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
  },
  {
    tableName: "rating_status",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
      {
        unique: true,
        fields: ["name"],
      },
    ],
    underscored: true,
  }
);

const FormMetadata = DB_CLIENT.define(
  "form_metadata",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      notEmpty: true,
    },
    last_edited: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    signature: {
      type: DataTypes.STRING,
    },
    form_date: {
      type: DataTypes.DATE,
      allowNull: false,
      default: Sequelize.NOW,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    user_name: {
      type: DataTypes.STRING,
      allowNull: false,
      notEmpty: true,
    },
    designation: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.STRING,
    },
    telephone: {
      type: DataTypes.INTEGER,
    },
    branch: {
      type: DataTypes.STRING,
    },

    submission_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    remarks: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
  },
  {
    tableName: "form_metadata",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);
const Relative = DB_CLIENT.define(
  "relative",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      notEmpty: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
  },
  {
    tableName: "relatives",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const FormInvestmentData = DB_CLIENT.define(
  "form_investment",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    face_value: {
      type: DataTypes.INTEGER,
    },
    num_securities_acquired: {
      type: DataTypes.INTEGER,
    },
    consideration_paid: {
      type: DataTypes.INTEGER,
    },
    num_securities_disposed: {
      type: DataTypes.INTEGER,
    },
    consideration_received: {
      type: DataTypes.INTEGER,
    },
    folio: {
      type: DataTypes.INTEGER,
    },
    investment_approval_date: {
      type: DataTypes.DATE,
    },
    investment_approval_valid_till: {
      type: DataTypes.DATE,
    },
    num_securities_held: {
      type: DataTypes.INTEGER,
    },

    num_securities_held_fny_start: {
      type: DataTypes.INTEGER,
    },

    num_securities_held_fny_end: {
      type: DataTypes.INTEGER,
    },

    num_securities_to_be_dealt: {
      type: DataTypes.INTEGER,
    },
    nature_of_transaction: {
      type: DataTypes.STRING,
    },
    source: {
      type: DataTypes.STRING,
    },
    acquisition_date: {
      type: DataTypes.DATE,
    },
    reason_for_min_period_waiver: {
      type: DataTypes.STRING,
    },

    num_securities_to_be_disposed: {
      type: DataTypes.INTEGER,
    },

    approval_status: {
      type: DataTypes.BOOLEAN,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    approval_required: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
  },
  {
    tableName: "form_investments",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const FormWitnesses = DB_CLIENT.define(
  "form_witnesses",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      notEmpty: true,
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    telephone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    signature: {
      type: DataTypes.STRING,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
  },
  {
    tableName: "form_witnesses",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const DirectorInvestment = DB_CLIENT.define(
  "director_investments",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    nature_of_interest: {
      type: DataTypes.STRING,
    },
    shareholding: {
      type: DataTypes.INTEGER,
    },
    interest_occurence_date: {
      type: DataTypes.DATE,
    },
    name: {
      type: DataTypes.STRING,
    },
    din: {
      type: DataTypes.STRING,
    },
    place: {
      type: DataTypes.STRING,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    father_name: {
      type: DataTypes.STRING,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
  },
  {
    tableName: "director_investments",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const InvestmentTransaction = DB_CLIENT.define(
  "investments_transactions",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    face_value: {
      type: DataTypes.INTEGER,
    },

    opening_stock: {
      type: DataTypes.INTEGER,
      // set(nouse) {
      //   let opening_stock_val=0
      //   const {
      //     created_by,
      //     company_id,
      //     face_value,
      //     security_type_id,
      //     financial_year_id,
      //   } = this;
      //   // Calculate the opening stock using a SQL query
      //   const query = `SELECT TOP 1 COALESCE(closing_stock,0) as closing_stock from investments_transactions
      //    WHERE created_by = ${created_by} AND company_id = ${company_id} AND face_value = ${face_value} AND
      //     security_type_id = ${security_type_id} AND financial_year_id = ${financial_year_id} ORDER BY created_at DESC`;
      //   DB_CLIENT.query(query, {
      //     type: Sequelize.QueryTypes.SELECT,
      //   }).then(([result]) =>
      //     opening_stock_val= result? result["closing_stock"] : 0

      //   );
      //   this.setDataValue("opening_stock", opening_stock_val);
      // },
    },
    num_securities_acquired: {
      type: DataTypes.INTEGER,
    },
    consideration_paid: {
      type: DataTypes.INTEGER,
    },
    num_securities_disposed: {
      type: DataTypes.INTEGER,
    },
    consideration_received: {
      type: DataTypes.INTEGER,
    },
    closing_stock: {
      type: DataTypes.INTEGER,
      // set(nouse) {
      //   let adjustedClosingStock=0
      //   console.log("called");
      //   const {
      //     created_by,
      //     company_id,
      //     face_value,
      //     security_type_id,
      //     num_securities_acquired,
      //     num_securities_disposed,
      //   } = this;
      //   // Calculate the closing stock using a SQL query
      //   const query = `
      //   SELECT TOP 1 COALESCE(closing_stock,0) as closing_stock from investments_transactions
      //   WHERE created_by = ${created_by} AND company_id = ${company_id} AND
      //    face_value = ${face_value} AND security_type_id = ${security_type_id} ORDER BY created_at DESC`;
      //   DB_CLIENT.query(query, {
      //     type: Sequelize.QueryTypes.SELECT,
      //   }).then(([result]) => {
      //     console.log(result);
      //     const latestClosingStock = result ? result.closing_stock : 0;
      //     adjustedClosingStock =
      //       latestClosingStock +
      //       num_securities_acquired -
      //       num_securities_disposed;

      //   });
      //    this.setDataValue("closing_stock", adjustedClosingStock);
      // },
      // set(value) {
      //   this.setDataValue("closing_stock", value);
      // },
    },
    aggregate_cons_paid: {
      type: DataTypes.INTEGER,
      // type: DataTypes.VIRTUAL, // Define as virtual column
      // get() {
      //   const { user_id, company_id, face_value, sec_id, financial_year } =
      //     this;
      //   // Calculate the sum of cons_paid using a SQL query
      //   const query = `
      //   SELECT SUM(cons_paid) AS aggregate_cons_paid
      //   FROM investment_transactions
      //   WHERE user_id = ${user_id}
      //     AND company_id = ${company_id}
      //     AND face_value = ${face_value}
      //     AND sec_id = ${sec_id}
      //     AND financial_year = ${financial_year}
      // `;
      //   return DB_CLIENT.query(query, {
      //     type: Sequelize.QueryTypes.SELECT,
      //   }).then(([result]) => (result ? result.aggregate_cons_paid : 0));
      // },
    },
    aggregate_cons_received: {
      type: DataTypes.INTEGER,
      // type: DataTypes.VIRTUAL, // Define as virtual column
      // get() {
      //   const { user_id, company_id, face_value, sec_id, financial_year } =
      //     this;
      //   // Calculate the sum of cons_recv using a SQL query
      //   const query = `
      //   SELECT SUM(cons_recv) AS aggregate_cons_recv
      //   FROM investment_transactions
      //   WHERE user_id = ${user_id}
      //     AND company_id = ${company_id}
      //     AND face_value = ${face_value}
      //     AND sec_id = ${sec_id}
      //     AND financial_year = ${financial_year}
      // `;
      //   return DB_CLIENT.query(query, {
      //     type: Sequelize.QueryTypes.SELECT,
      //   }).then(([result]) => (result ? result.aggregate_cons_recv : 0));
      // },
    },
    num_aggregate_acquired: {
      type: DataTypes.INTEGER,
      // type: DataTypes.VIRTUAL, // Define as virtual column
      // get() {
      //   const { user_id, company_id, face_value, sec_id, financial_year } =
      //     this;
      //   // Calculate the sum of acquired using a SQL query
      //   const query = `
      //   SELECT SUM(acquired) AS aggregate_acquired
      //   FROM investment_transactions
      //   WHERE user_id = ${user_id}
      //     AND company_id = ${company_id}
      //     AND face_value = ${face_value}
      //     AND sec_id = ${sec_id}
      //     AND financial_year = ${financial_year}
      // `;
      //   return DB_CLIENT.query(query, {
      //     type: Sequelize.QueryTypes.SELECT,
      //   }).then(([result]) => (result ? result.aggregate_acquired : 0));
      // },
    },
    num_aggregate_disposed: {
      type: DataTypes.INTEGER,
      // type: DataTypes.VIRTUAL, // Define as virtual column
      // get() {
      //   const { user_id, company_id, face_value, sec_id, financial_year } =
      //     this;
      //   // Calculate the sum of disposed using a SQL query
      //   const query = `
      //   SELECT SUM(disposed) AS aggregate_disposed
      //   FROM investment_transactions
      //   WHERE user_id = ${user_id}
      //     AND company_id = ${company_id}
      //     AND face_value = ${face_value}
      //     AND sec_id = ${sec_id}
      //     AND financial_year = ${financial_year}
      // `;
      //   return DB_CLIENT.query(query, {
      //     type: Sequelize.QueryTypes.SELECT,
      //   }).then(([result]) => (result ? result.aggregate_disposed : 0));
      // },
    },
    // closing_stock_worth: {
    // type: DataTypes.INTEGER,
    // type: DataTypes.VIRTUAL, // Define as virtual column
    // get() {
    //   const { user_id, company_id, face_value, sec_id, created_at } = this;
    // Calculate the closing stock worth using a SQL query
    //   const query = `
    //   SELECT closing_stock + (
    //     SELECT SUM(cons_paid) - SUM(cons_recv)
    //     FROM investment_transactions
    //     WHERE user_id = ${user_id}
    //       AND company_id = ${company_id}
    //       AND face_value = ${face_value}
    //       AND sec_id = ${sec_id}
    //       AND created_at <= '${created_at.toISOString()}'
    //   ) AS closing_stock_worth
    //   FROM investment_transactions
    //   WHERE user_id = ${user_id}
    //     AND company_id = ${company_id}
    //     AND face_value = ${face_value}
    //     AND sec_id = ${sec_id}
    //   ORDER BY created_at DESC
    //   LIMIT 1
    // `;
    //   return DB_CLIENT.query(query, {
    //     type: Sequelize.QueryTypes.SELECT,
    //   }).then(([result]) => (result ? result.closing_stock_worth : 0));
    // },
    // },

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
  },
  {
    tableName: "investments_transactions",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

FormWitnesses.belongsTo(FormMetadata, {
  foreignKey: "form_id",
  as: "coc_user_data",
});
FormWitnesses.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
FormWitnesses.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

FormMetadata.belongsTo(UserAttribute, {
  foreignKey: "user_id",
  as: "user_data",
});
FormMetadata.belongsTo(User, {
  foreignKey: "approved_by",
  as: "approved_by_user",
});
FormMetadata.belongsTo(FormType, {
  foreignKey: "form_type_id",
  as: "coc_form_type",
});
FormMetadata.belongsTo(FinancialYear, {
  foreignKey: "financial_year",
  as: "coc_financial_year",
});
FormMetadata.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
FormMetadata.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

Relative.belongsTo(FormMetadata, { foreignKey: "form_id", as: "coc_form" });
Relative.belongsTo(User, { foreignKey: "created_by", as: "created_by_user" });
Relative.belongsTo(User, { foreignKey: "updated_by", as: "updated_by_user" });
Relative.belongsTo(RelationshipType, {
  foreignKey: "relationship_id",
  as: "coc_relationship",
});

InvestmentTransaction.belongsTo(FinancialYear, {
  foreignKey: "financial_year_id",
  as: "financial_year_as",
});

InvestmentTransaction.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_as",
});

InvestmentTransaction.belongsTo(Relative, {
  foreignKey: "relative_id",
  as: "relative_id_as",
});
InvestmentTransaction.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_as",
});

InvestmentTransaction.belongsTo(FormMetadata, {
  foreignKey: "form_id",
  as: "form_id_as",
});

InvestmentTransaction.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company_id_as",
});
InvestmentTransaction.belongsTo(SecurityType, {
  foreignKey: "security_type_id",
  as: "security_type_id_as",
});

SecurityType.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});

SecurityType.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

MaterialEventReason.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
MaterialEventReason.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
MaterialEventStatus.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
MaterialEventStatus.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

RatingStatus.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingStatus.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

DirectorInvestment.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});

DirectorInvestment.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

DirectorInvestment.belongsTo(FormMetadata, {
  foreignKey: "form_id",
  as: "form_data",
});
DirectorInvestment.belongsTo(Company, {
  foreignKey: "company_id",
  as: "dir_company_data",
});
DirectorInvestment.belongsTo(UserAttribute, {
  foreignKey: "user_id",
  as: "user_data",
});
FormInvestmentData.belongsTo(Relative, {
  foreignKey: "relative_id",
  as: "coc_relative",
});

FormInvestmentData.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company_id_as",
});
FormInvestmentData.belongsTo(FormMetadata, {
  foreignKey: "form_id",
  as: "coc_form",
});
FormInvestmentData.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
FormInvestmentData.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

FormInvestmentData.belongsTo(SecurityType, {
  foreignKey: "securities_acquired_id",
  as: "securities_acquired_id_as",
});

FormInvestmentData.belongsTo(SecurityType, {
  foreignKey: "securities_disposed_id",
  as: "securities_disposed_id_as",
});
FormInvestmentData.belongsTo(SecurityType, {
  foreignKey: "securities_held_id",
  as: "securities_held_id_as",
});

FormInvestmentData.belongsTo(SecurityType, {
  foreignKey: "securities_held_fny_start_id",
  as: "securities_held_fny_start_id_as",
});

FormInvestmentData.belongsTo(SecurityType, {
  foreignKey: "securities_held_fny_end_id",
  as: "securities_held_fny_end_id_as",
});

FormInvestmentData.belongsTo(SecurityType, {
  foreignKey: "securities_to_be_dealt_id",
  as: "securities_to_be_dealt_id_as",
});

FormInvestmentData.belongsTo(SecurityType, {
  foreignKey: "securities_to_be_disposed_id",
  as: "securities_to_be_disposed_id_as",
});

const COC_DB_INSTANCE = DB_CLIENT;

module.exports = {
  COC_DB_INSTANCE,
  Relative,
  FormInvestmentData,
  FormMetadata,
  FormType,
  FormWitnesses,
  RelationshipType,
  DirectorInvestment,
  SecurityType,
  InvestmentTransaction,
  MaterialEventReason,
  MaterialEventStatus,
  RatingStatus,
};
