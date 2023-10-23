const { Sequelize, DataTypes } = require("sequelize");
const { DB_CLIENT } = require("../../db");
const { User, Mandate, Company } = require("./onboarding");
const {
  RatingCommitteeMeetingRegister,
  RatingCommitteeMeeting,
  RatingCommitteeType,
  RatingCommitteeMeetingCategory,
} = require("./rating-committee");
const { InstrumentDetail } = require("./rating-model");

const NdsQuestions = DB_CLIENT.define(
  "nds_questions",
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
    ques_num: {
      type: DataTypes.INTEGER,
      allowNull: false,
      notEmpty: true,
    },
    ques_content: {
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
    tableName: "nds_questions",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const NdsFormResponses = DB_CLIENT.define(
  "nds_form_responses",
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
    ques_response: {
      type: DataTypes.BOOLEAN,
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
    tableName: "nds_form_responses",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const NDSBankPaymentDefault = DB_CLIENT.define(
  "nds_bank_payment_defaults",
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
    name_of_lender: {
      type: DataTypes.STRING,
   
    },
    nature_of_obligation: {
      type: DataTypes.STRING,
     
    },

    date_of_default: {
      type: DataTypes.DATE,
    
    },
    current_default_amount: {
      type: DataTypes.INTEGER,
     
    },
    amount_to_be_paid: {
      type: DataTypes.INTEGER,
     
    },
    date_of_payment: {
      type: DataTypes.DATE,
    },
    remarks: {
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
    tableName: "nds_bank_payment_defaults",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const NDSDebtPaymentDefault = DB_CLIENT.define(
  "nds_debt_payment_defaults",
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
    name_of_instrument: {
      type: DataTypes.STRING,
   
    },
    isin: {
      type: DataTypes.STRING,
    },
    amount_to_be_paid: {
      type: DataTypes.INTEGER,
     
    },
    due_date_of_payment: {
      type: DataTypes.DATE,
     
    },

    date_of_payment: {
      type: DataTypes.DATE,
    },
    remarks: {
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
    tableName: "nds_debt_payment_defaults",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const ComplianceInitialPendingStatus = DB_CLIENT.define(
  "compliance_initial_pending_status",
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
    remarks: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
    },
    expected_date: {
      type: DataTypes.DATE,
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
    tableName: "compliance_initial_pending_status",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
  }
);

const ComplianceSurveillancePendingStatus = DB_CLIENT.define(
  "compliance_surveillance_pending_status",
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
    remarks: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
    },
    expected_date: {
      type: DataTypes.DATE,
    },
    revised_expected_date: {
      type: DataTypes.TEXT,
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
    tableName: "compliance_surveillance_pending_status",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
  }
);

const QuarterlyReviewProcess = DB_CLIENT.define(
  "quarterly_review_process",
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
    quarterly_review_period: {
      type: DataTypes.STRING,
    },
    total_nds_recv: {
      type: DataTypes.INTEGER,
    },
    banker_feedback_recv: {
      type: DataTypes.BOOLEAN,
    },
    quarterly_result_received: {
      type: DataTypes.BOOLEAN,
    },

    review_required: {
      type: DataTypes.BOOLEAN,
    },
    quarterly_review_process: {
      type: DataTypes.BOOLEAN,
    },
    quarterly_note_file_link: {
      type: DataTypes.STRING,
    },
    status: {
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
    tableName: "quarterly_review_process",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const DelayPeriodicReview = DB_CLIENT.define(
  "delay_periodic_review",
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
    email_status: {
      type: DataTypes.STRING,
    },
    remarks: {
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
    tableName: "delay_periodic_reviews",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const DebentureInterestPayment = DB_CLIENT.define(
  "debenture_interest_payments",
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
    interest_due_on: {
      type: DataTypes.DATE,
    },
    principal_due_on: {
      type: DataTypes.DATE,
    },
    interest_paid_on: {
      type: DataTypes.DATE,
    },
    principal_paid_on: {
      type: DataTypes.DATE,
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
    tableName: "debenture_interest_payments",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const MaterialEventTracking = DB_CLIENT.define(
  "material_event_tracking",
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
    },
    reason: {
      type: DataTypes.STRING,
    },
    ig_nig: {
      type: DataTypes.STRING,
    },
    material_event_date: {
      type: DataTypes.DATE,
    },
    remarks: {
      type: DataTypes.STRING,
    },
    closed_by_name: {
      type: DataTypes.STRING,
    },
    closed_by_role: {
      type: DataTypes.STRING,
    },
    closed_at: {
      type: DataTypes.DATE,
    },
    meeting_date: {
      type: DataTypes.DATE,
    },
    workflow_trigger: { type: DataTypes.STRING },
    document: { type: DataTypes.STRING },
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
    tableName: "material_event_trackings",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);
const MonthlyNDS = DB_CLIENT.define(
  "monthly_nds",
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
    nds_recieved: {
      type: DataTypes.BOOLEAN,
    },
    nds_recieved_month: {
      type: DataTypes.STRING,
    },
    nds_recieved_on: {
      type: DataTypes.DATE,
    },
    rating_status: {
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
    tableName: "monthly_nds",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const SentMails = DB_CLIENT.define(
  "sent_mails",
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
    sender: {
      type: DataTypes.STRING,
    },
    recipient: {
      type: DataTypes.STRING,
    },
    subject: {
      type: DataTypes.STRING,
    },
    body: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
    },
    error: {
      type: DataTypes.STRING,
    },
    otp: {
      type: DataTypes.INTEGER,
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
    tableName: "sent_mails",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

DelayPeriodicReview.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
DelayPeriodicReview.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

MaterialEventTracking.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
MaterialEventTracking.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
MaterialEventTracking.belongsTo(Company, {
  foreignKey: "company_id",
  as: "met_company",
});
MaterialEventTracking.belongsTo(RatingCommitteeType, {
  foreignKey: "meeting_type",
  as: "met_meeting_type",
});
MaterialEventTracking.belongsTo(RatingCommitteeMeetingCategory, {
  foreignKey: "meeting_category",
  as: "met_meeting_category",
});

MonthlyNDS.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
MonthlyNDS.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
MonthlyNDS.belongsTo(RatingCommitteeMeetingRegister, {
  foreignKey: "register_id",
  as: "nds_register",
});

QuarterlyReviewProcess.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
QuarterlyReviewProcess.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
QuarterlyReviewProcess.belongsTo(InstrumentDetail, {
  foreignKey: "instrument_detail_id",
  as: "instrument_detail_id_as",
});

ComplianceSurveillancePendingStatus.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company_id_data",
});
ComplianceSurveillancePendingStatus.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
ComplianceSurveillancePendingStatus.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

ComplianceInitialPendingStatus.belongsTo(Mandate, {
  foreignKey: "mandate_id",
  as: "mandate_data_id",
});
ComplianceInitialPendingStatus.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company_data_id",
});
ComplianceInitialPendingStatus.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
ComplianceInitialPendingStatus.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

DebentureInterestPayment.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_as",
});
DebentureInterestPayment.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_as",
});
DebentureInterestPayment.belongsTo(InstrumentDetail, {
  foreignKey: "instrument_detail_id",
  as: "instrument_detail_id_as",
});

NdsQuestions.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_as",
});
NdsQuestions.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_as",
});



NdsFormResponses.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company_id_as",
});

NdsFormResponses.belongsTo(NdsQuestions, {
  foreignKey: "nds_question_id",
  as: "nds_question_id_as",
});
NdsFormResponses.belongsTo(SentMails, {
  foreignKey: "sent_mail_id",
  as: "sent_mail_id_as",
});

NDSBankPaymentDefault.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_as",
});

NDSBankPaymentDefault.belongsTo(NdsFormResponses, {
  foreignKey: "nds_form_responses_id",
  as: "nds_form_responses_id_as",
});
NDSBankPaymentDefault.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_as",
});

NDSDebtPaymentDefault.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_as",
});
NDSDebtPaymentDefault.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_as",
});

NDSDebtPaymentDefault.belongsTo(NdsFormResponses, {
  foreignKey: "nds_form_responses_id",
  as: "nds_form_responses_id_as",
});

const COMPLIANCE_DB_INSTANCE = DB_CLIENT;

module.exports = {
  COMPLIANCE_DB_INSTANCE,
  ComplianceInitialPendingStatus,
  ComplianceSurveillancePendingStatus,
  QuarterlyReviewProcess,
  DelayPeriodicReview,
  MaterialEventTracking,
  MonthlyNDS,
  DebentureInterestPayment,
  NdsQuestions,
  NdsFormResponses,
  NDSBankPaymentDefault,
  NDSDebtPaymentDefault,
  SentMails,
};
