const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../../db");
const {
  User,
  Company,
  SubIndustry,
  Mandate,
  Industry,
  MasterCommon,
} = require("./onboarding");

const RatingModel = DB_CLIENT.define(
  "ratingmodel",
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
    tableName: "rating_models",
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

const CompanyRatingModel = DB_CLIENT.define(
  "company_rating_model",
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
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    turnover: {
      type: DataTypes.INTEGER,
      allowNull: false,
      notEmpty: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
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
    tableName: "company_rating_models",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const NotchingModel = DB_CLIENT.define(
  "notchingmodel",
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
    sequence_number: {
      type: DataTypes.DECIMAL(10,4),
      allowNull: false,
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
    tableName: "notching_models",
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

const RiskType = DB_CLIENT.define(
  "risktype",
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
    },
    weightage: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    sequence_number: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
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
    tableName: "risk_types",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const RatingModelHasRiskType = DB_CLIENT.define(
  "ratingmodelhasrisktype",
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
    weightage: {
      type: DataTypes.DECIMAL(10,3),
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
    tableName: "rating_model_has_risk_types",
    indexes: [
      {
        unique: true,
        fields: ["uuid", "rating_model_id", "risk_type_id"],
      },
    ],
    underscored: true,
  }
);

const RatingModelHasNotching = DB_CLIENT.define(
  "ratingmodelhasnotching",
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
    tableName: "rating_model_has_notchings",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const Factor = DB_CLIENT.define(
  "factor",
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
    question: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    max_score: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    coefficient: {
      type: DataTypes.REAL,
      allowNull: false,
    },
    sequence_number: {  
      type: DataTypes.DECIMAL(10,4),
      allowNull: false,
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
    tableName: "factors",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
      {
        unique: true,
        fields: ["question"],
      },
    ],
    underscored: true,
  }
);

const FactorParameter = DB_CLIENT.define(
  "factorparameter",
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
    },
    score: {
      type: DataTypes.STRING,
      allowNull: false,
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
    tableName: "factor_parameters",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const FinancialYear = DB_CLIENT.define(
  "financialyear",
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
    reference_date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    is_current_fy: {
      type: DataTypes.BOOLEAN,
      default: false,
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
    tableName: "financial_years",
    indexes: [
      {
        unique: true,
        fields: ["uuid", "reference_date"],
      },
    ],
    underscored: true,
  }
);

const RatingMatrix = DB_CLIENT.define(
  "ratingmatrix",
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
    rating_symbol: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lower_weightage: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    higher_weightage: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    rating_grade_number: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    st_rating_symbol: {
      type: DataTypes.STRING,
      allowNull: false,
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
    tableName: "rating_matrix",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const RatingMetadata = DB_CLIENT.define(
  "ratingmetadata",
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
    factor_uuid: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    factor: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    factor_parameter: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    assigned_score: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    assigned_weight: {
      type: DataTypes.REAL,
      allowNull: true,
    },
    is_draft: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    is_required: {
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
    tableName: "rating_metadata",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const RatingSheet = DB_CLIENT.define(
  "ratingsheet",
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
    management_risk: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    business_risk: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    financial_risk: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    industry_risk: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    intercept: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    total_risk_score: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    total_score: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    model_based_long_term_rating: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    model_based_short_term_rating: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    model_based_rating_grade_number: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    general_notching: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    project_notching: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    total_notch_down: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    standalone_rating_grade_post_notch_down: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    notching_based_rating_grade_number: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    parent_notching: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    rating_grade_post_parent_notching: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    long_term_rating_post_notching: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    inc_notch_down: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    rating_grade_post_inc_notch_down: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    rating_post_inc_notch_down: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    parent_rating_grade_number: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    final_rating_grade_number: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    proposed_long_term_rating: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    proposed_short_term_rating: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    proposed_outlook: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    final_rating_grade_number: {
      type: DataTypes.DECIMAL(10,3),
      allowNull: false,
    },
    is_draft: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: false,
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
    tableName: "rating_sheets",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const RiskTypeRatingSheet = DB_CLIENT.define(
  "risk_type_rating_sheet",
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
    weighted_score: {
      type: DataTypes.REAL,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    is_required: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: false,
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
    tableName: "risk_type_rating_sheets",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const TransactionInstrument = DB_CLIENT.define(
  "transaction_instrument",
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
    instrument_size: {
      type: DataTypes.DECIMAL(24, 2),
      allowNull: false,
    },
    complexity_level: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remark: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    issuance_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    instrument_listing_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      default: true,
    },
    placed_date: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: "transaction_instruments",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const InstrumentCategory = DB_CLIENT.define(
  "instrument_category",
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
    category_name: {
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
    tableName: "instrument_categories",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const InstrumentSubCategory = DB_CLIENT.define(
  "instrument_sub_category",
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
    category_name: {
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
    tableName: "instrument_sub_categories",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const Instrument = DB_CLIENT.define(
  "instrument",
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
    },
    short_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_servelliance_required: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_long_term: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_short_term: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
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
    tableName: "instruments",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const InstrumentDetail = DB_CLIENT.define(
  "instrumentdetail",
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
    instrument_size: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    annual_result: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    annual_result_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    quarterly_result: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rating_acceptance_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    press_release_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    provisional_communication_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rating_letter_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rating_acceptance_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    trigger_event: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    is_workflow_done: {
      type: DataTypes.BOOLEAN,
      default: false,
    },
    reduce_enhancement: {
      type: DataTypes.DECIMAL(10, 3),
      default: 0,
      allowNull: true,
    },
    model_based_short_term_rating: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    model_based_long_term_rating: {
      type: DataTypes.STRING,
      allowNull: true,
        },
    proposed_long_term_rating: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    proposed_short_term_rating: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    proposed_outlook: {
      type: DataTypes.STRING,
      allowNull: true,
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
    tableName: "instrument_details",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const BankerLender = DB_CLIENT.define(
  "banker_lender",
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
    isin: {
      type: DataTypes.STRING,
    },

    interest_frequency: {
      type: DataTypes.STRING,
      allowNull: true
    },
    principle_repayment_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    instrument_size: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    placed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    coupon_rate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    interest_due_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    maturity_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_copied: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    rated_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    outstanding_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    sanction_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    interest_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    asset_classification: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remark: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    purpose: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    repayment_terms: {
      type: DataTypes.TEXT,
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
    tableName: "banker_lenders",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const RatingScale = DB_CLIENT.define(
  "rating_scale",
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
    },
    // Long Term , Short term , recovery rating
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
    tableName: "rating_scales",
    indexes: [
      {
        unique: true,
        fields: ["uuid", "name"],
      },
    ],
    underscored: true,
  }
);

const RatingSymbolMaster = DB_CLIENT.define(
  "rating_symbol_master",
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
    rating_symbol: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    grade: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rating_grade_number: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
    },
    weightage: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
    },
    lower_weightage: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
    },
    higher_weightage: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
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
    tableName: "rating_symbol_masters",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const RatingSymbolCategory = DB_CLIENT.define(
  "rating_symbol_category",
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
    symbol_type_category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Credit Rating Scale , Recovery Rating Scale
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
    tableName: "rating_symbol_categories",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const RatingSymbolMapping = DB_CLIENT.define(
  "rating_symbol_mapping",
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
    prefix: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    suffix: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    final_rating: {
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
    tableName: "rating_symbol_mappings",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const IndustryScore = DB_CLIENT.define(
  "industryscores",
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
    score: {
      type: DataTypes.REAL,
      allowNull: false,
    },
    weightage: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
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
    tableName: "industry_scores",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const IndustryModelMapping = DB_CLIENT.define(
  "industrymodelmapping",
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
    tableName: "industry_models_mapping",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const RatingProcess = DB_CLIENT.define(
  "rating_process",
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
      unique: true,
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
    tableName: "rating_processes",
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

const IndustryCoefficient = DB_CLIENT.define(
  "industry_coefficient",
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
    coefficient: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
    tableName: "industry_coefficients",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const OtherRatingAgency = DB_CLIENT.define(
  "other_rating_agency",
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
    amount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    last_rating_action: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    financial_base_last_rating_action: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    last_press_release_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    outlook: {
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
    tableName: "other_rating_agencies",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

RatingModel.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingModel.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
RatingModel.belongsTo(RatingModel, {
  foreignKey: "parent_rating_model_id",
  as: "parent_rating_model",
});
RatingModel.hasMany(RatingModelHasRiskType);

CompanyRatingModel.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
CompanyRatingModel.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
CompanyRatingModel.belongsTo(RatingModel, {
  foreignKey: "rating_model_id",
  as: "model_type",
});
CompanyRatingModel.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});
CompanyRatingModel.belongsTo(Industry, {
  foreignKey: "industry_id",
  as: "industry",
});

NotchingModel.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
NotchingModel.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
NotchingModel.belongsTo(NotchingModel, {
  foreignKey: "parent_notching_model_id",
  as: "parent_notching_model",
});

RiskType.belongsTo(User, { foreignKey: "created_by", as: "created_by_user" });
RiskType.belongsTo(User, { foreignKey: "updated_by", as: "updated_by_user" });
RiskType.belongsTo(RiskType, {
  foreignKey: "parent_risk_type_id",
  as: "parent_risk_type",
});
RiskType.hasMany(RatingModelHasRiskType, { as: "risk_type" });

Factor.belongsTo(User, { foreignKey: "created_by", as: "created_by_user" });
Factor.belongsTo(User, { foreignKey: "updated_by", as: "updated_by_user" });
Factor.belongsTo(Factor, {
  foreignKey: "parent_factor_id",
  as: "parent_factor",
});
Factor.belongsTo(RatingModelHasRiskType, {
  foreignKey: "rating_model_risk_type_id",
  as: "factor_rating_model_risk_type",
});
Factor.hasMany(FactorParameter, { as: "factor_parameters" });
Factor.belongsTo(NotchingModel, {
  foreignKey: "notching_model_id",
  as: "notching_model",
});
Factor.belongsTo(RatingModelHasNotching, {
  foreignKey: "rating_model_notching_id",
  as: "rating_model_notching",
});

FactorParameter.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
FactorParameter.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
FactorParameter.belongsTo(FactorParameter, {
  foreignKey: "parent_factor_parameter_id",
  as: "parent_factor_parameter",
});
FactorParameter.belongsTo(Factor, { foreignKey: "factor_id", as: "factor" });

FinancialYear.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
FinancialYear.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

RatingMatrix.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingMatrix.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
RatingMatrix.belongsTo(FinancialYear, {
  foreignKey: "financial_year_id",
  as: "financial_year",
});

RatingModelHasRiskType.belongsTo(RiskType, {
  foreignKey: "risk_type_id",
  as: "risk_type",
});
RatingModelHasRiskType.belongsTo(RatingModel, {
  foreignKey: "rating_model_id",
  as: "rating_model",
});
RatingModelHasRiskType.hasMany(Factor, {
  foreignKey: "rating_model_risk_type_id",
  as: "factor_rating_model_risk_type",
});

RatingModelHasNotching.belongsTo(NotchingModel, {
  foreignKey: "notching_model_id",
  as: "notching_model",
});
RatingModelHasNotching.belongsTo(RatingModel, {
  foreignKey: "rating_model_id",
  as: "rating_model",
});

RatingMetadata.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingMetadata.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
RatingMetadata.belongsTo(Company, { foreignKey: "company_id", as: "company" });
RatingMetadata.belongsTo(RatingModel, {
  foreignKey: "rating_model_id",
  as: "rating_model",
});
RatingMetadata.belongsTo(RiskType, {
  foreignKey: "risk_type_id",
  as: "risk_type",
});
RatingMetadata.belongsTo(NotchingModel, {
  foreignKey: "notching_id",
  as: "notching",
});

RatingSheet.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingSheet.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
RatingSheet.belongsTo(NotchingModel, {
  foreignKey: "notching_id",
  as: "notching",
});
RatingSheet.belongsTo(Company, { foreignKey: "company_id", as: "company" });
RatingSheet.belongsTo(RatingModel, {
  foreignKey: "rating_model_id",
  as: "rating_model",
});


RatingSymbolCategory.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingSymbolCategory.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

RatingScale.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingScale.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

RatingSymbolMaster.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingSymbolMaster.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
RatingSymbolMaster.belongsTo(RatingScale, {
  foreignKey: "rating_scale_id",
  as: "rating_scale",
});

RatingSymbolMapping.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingSymbolMapping.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
RatingSymbolMapping.belongsTo(RatingSymbolCategory, {
  foreignKey: "rating_symbol_category_id",
  as: "rating_symbol_category",
});
RatingSymbolMapping.belongsTo(RatingSymbolMaster, {
  foreignKey: "rating_symbol_master_id",
  as: "rating_symbol_master",
});

IndustryScore.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
IndustryScore.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
IndustryScore.belongsTo(SubIndustry, {
  foreignKey: "sub_industry_id",
  as: "sub_industry",
});
IndustryScore.belongsTo(FinancialYear, {
  foreignKey: "financial_year_id",
  as: "financial_year",
});

Instrument.belongsTo(User, { foreignKey: "created_by", as: "created_by_user" });
Instrument.belongsTo(User, { foreignKey: "updated_by", as: "updated_by_user" });
Instrument.belongsTo(InstrumentCategory, {
  foreignKey: "instrument_category_id",
  as: "instrument_category",
});
Instrument.belongsTo(InstrumentSubCategory, {
  foreignKey: "instrument_sub_category_id",
  as: "instrument_sub_category",
});
Instrument.belongsTo(RatingSymbolCategory, {
  foreignKey: "rating_symbol_category_id",
  as: "rating_symbol_category",
});

TransactionInstrument.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
TransactionInstrument.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
TransactionInstrument.belongsTo(Mandate, {
  foreignKey: "mandate_id",
  as: "mandate",
});
TransactionInstrument.belongsTo(InstrumentCategory, {
  foreignKey: "instrument_category_id",
  as: "instrument_category",
});
TransactionInstrument.belongsTo(InstrumentSubCategory, {
  foreignKey: "instrument_sub_category_id",
  as: "instrument_sub_category",
});
TransactionInstrument.belongsTo(Instrument, {
  foreignKey: "instrument_id",
  as: "instrument",
});
TransactionInstrument.hasOne(InstrumentDetail, {
  foreignKey: "transaction_instrument_id",
  as: "instrument_detail",
});
// TransactionInstrument.belongsTo(OtherRatingAgency, { foreignKey: 'other_rating_agency_id', as: 'other_rating_agency' })

InstrumentCategory.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
InstrumentCategory.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
InstrumentCategory.hasMany(InstrumentSubCategory, {
  foreignKey: "instrument_category_id",
  as: "instrument_category",
});
InstrumentCategory.belongsToMany(
  MasterCommon,
  { through: "instrument_category_has_mandate_types", as: "mandate_types" },
  { underscored: true }
);

InstrumentSubCategory.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
InstrumentSubCategory.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
InstrumentSubCategory.belongsTo(InstrumentCategory, {
  foreignKey: "instrument_category_id",
  as: "instrument_category",
});

InstrumentDetail.belongsTo(FinancialYear, {
  foreignKey: "financial_year_id",
  as: "financial_year",
});
InstrumentDetail.belongsTo(RatingSheet, {
  foreignKey: "rating_sheet_id",
  as: "rating_sheet",
});
InstrumentDetail.belongsTo(RatingProcess, {
  foreignKey: "rating_process_id",
  as: "rating_process",
});
InstrumentDetail.belongsTo(RatingProcess, {
  foreignKey: "agenda_type_id",
  as: "agenda_type",
});
InstrumentDetail.belongsTo(TransactionInstrument, {
  foreignKey: "transaction_instrument_id",
  as: "transaction_instrument",
});
InstrumentDetail.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
InstrumentDetail.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
InstrumentDetail.belongsTo(Mandate, {
  foreignKey: "child_mandate_id",
  as: "child_mandate",
});

BankerLender.belongsTo(Company, { foreignKey: "bank_id", as: "bank" });
BankerLender.belongsTo(InstrumentDetail, {
  foreignKey: "instrument_detail_id",
  as: "instrument_detail",
});
BankerLender.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
BankerLender.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

IndustryModelMapping.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
IndustryModelMapping.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
IndustryModelMapping.belongsTo(RatingModel, {
  foreignKey: "rating_model_id",
  as: "rating_model",
});
IndustryModelMapping.belongsTo(SubIndustry, {
  foreignKey: "sub_industry_id",
  as: "sub_industry",
});

RatingModelHasNotching.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingModelHasNotching.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
RatingModelHasNotching.belongsTo(RatingModel, {
  foreignKey: "rating_model_id",
  as: "rating_models",
});
// RatingModelHasNotching.belongsTo(NotchingModel, { foreignKey: 'notching_model_id', as: 'notching_model' });

RatingProcess.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingProcess.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

RiskTypeRatingSheet.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RiskTypeRatingSheet.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
RiskTypeRatingSheet.belongsTo(RiskType, {
  foreignKey: "risk_type_id",
  as: "risk_type",
});
RiskTypeRatingSheet.belongsTo(NotchingModel, {
  foreignKey: "notching_model_id",
  as: "notching_model",
});
RiskTypeRatingSheet.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});
IndustryCoefficient.belongsTo(User, {
  foreignKey: "create_by",
  as: "create_by_user",
});
IndustryCoefficient.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

OtherRatingAgency.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
OtherRatingAgency.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
OtherRatingAgency.belongsTo(MasterCommon, {
  foreignKey: "credit_rating_agency_id",
  as: "credit_rating_agency",
});
OtherRatingAgency.belongsTo(InstrumentDetail, {
  foreignKey: "instrument_detail_id",
  as: "instrument_detail",
});
OtherRatingAgency.belongsTo(MasterCommon, {
  foreignKey: "mandate_type_id",
  as: "mandate_type",
});
OtherRatingAgency.belongsTo(InstrumentCategory, {
  foreignKey: "instrument_category_id",
  as: "instrument_category",
});
OtherRatingAgency.belongsTo(InstrumentSubCategory, {
  foreignKey: "instrument_sub_category_id",
  as: "instrument_sub_category",
});
OtherRatingAgency.belongsTo(Instrument, {
  foreignKey: "instrument_id",
  as: "instrument",
});
OtherRatingAgency.belongsTo(RatingSymbolMaster, {
  foreignKey: "short_term_rating_id",
  as: "short_term_rating",
});
OtherRatingAgency.belongsTo(RatingSymbolMaster, {
  foreignKey: "long_term_rating_id",
  as: "long_term_rating",
});
// OtherRatingAgency.belongsTo(Outlook, { foreignKey: 'outlook_id', as: 'outlook' })
const RATING_DB_INSTANCE = DB_CLIENT;

module.exports = {
  RATING_DB_INSTANCE,
  RatingModel,
  RiskType,
  RatingModelHasRiskType,
  Factor,
  FactorParameter,
  FinancialYear,
  RatingMatrix,
  RatingMetadata,
  RatingSheet,
  NotchingModel,
  RatingSymbolMaster,
  RatingSymbolCategory,
  RatingSymbolMapping,
  IndustryScore,
  Instrument,
  TransactionInstrument,
  InstrumentCategory,
  InstrumentSubCategory,
  InstrumentDetail,
  RatingScale,
  CompanyRatingModel,
  IndustryModelMapping,
  RatingModelHasNotching,
  BankerLender,
  RatingProcess,
  RiskTypeRatingSheet,
  OtherRatingAgency,
};
