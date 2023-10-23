const { Sequelize, DataTypes, QueryTypes } = require("sequelize");

const { User, Company, Mandate, ListingDetail, DocumentType } = require("./onboarding");
const { DB_CLIENT } = require("../../db");
const { FinancialYear,  InstrumentDetail, InstrumentCategory, InstrumentSubCategory, TransactionInstrument, Instrument, RatingModel, RatingSymbolMaster, RatingProcess } = require("./rating-model");
const { DiligenceData } = require("./interaction");

const RatingCommitteeType = DB_CLIENT.define(
  "rating_committee_type",
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
    short_name: {
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
    tableName: "rating_committee_types",
    indexes: [
      {
        unique: true,
        fields: ["uuid", "name", "short_name"],
      },
    ],
    underscored: true,
  }
);

const RatingCommitteeMeetingCategory = DB_CLIENT.define(
  "rating_committee_meeting_category",
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
    description: {
      type: DataTypes.TEXT,
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
    tableName: "rating_committee_meeting_categories",
    indexes: [
      {
        unique: true,
        fields: ["uuid", "name"],
      },
    ],
    underscored: true,
  }
);

const RatingCommitteeMeetingAttendenceConf = DB_CLIENT.define(
  "rating_committee_meeting_attendence_conf",
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
    conf_day: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_chairman: {
      type: DataTypes.BOOLEAN,
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
    tableName: "rating_committee_meeting_attendence_conf",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

  const RatingCommitteeAttendence = DB_CLIENT.define(
    "rating_committee_attendence",
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
      tableName: 'rating_committee_attendences',
      indexes: [
        {
          unique: true,
          fields: ['uuid']
        }
      ],
      underscored: true,
    }
  );
  
  const RatingCommitteeMeeting = DB_CLIENT.define(
    "rating_committee_meeting",
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
      /// financial year should come here 
      meeting_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      number_of_cases: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      meeting_type: {
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
      tableName: 'rating_committee_meetings',
      indexes: [
        {
          unique: true,
          fields: ['uuid']
        }
      ],
      underscored: true,
    }
  );
  
  const Outlook = DB_CLIENT.define(
    "outlook",
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
      tableName: 'outlooks',
      indexes: [
        {
          unique: true,
          fields: ['uuid', 'name']
        }
      ],
      underscored: true,
    }
  );
  
  const RatingCommitteeMeetingRegister = DB_CLIENT.define(
    "rating_committee_meeting_register",
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
      category_text: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sub_category_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      instrument_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      instrument_size_number: {
        type: DataTypes.REAL,
        allowNull: false,
      },
      long_term_rating_assgined_text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      short_term_rating_assgined_text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      long_term_outlook: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      short_term_outlook: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      previous_rating: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      previous_outlook: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      long_term_outlook_recommendation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      short_term_outlook_recommendation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      long_term_rating_recommendation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      short_term_rating_recommendation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      agenda: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      remark: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      voting_status: {
        type: DataTypes.STRING,
        allowNull: true,
        default: 'Upcoming'
      },
      overall_status: {
        type: DataTypes.STRING,
        allowNull: true,
        default: "SENT_TO_COMMITTEE"
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        default: true,
      },
      is_fresh: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        default: true,
      },
      is_long_term: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        default: false,
      },
      is_short_term: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        default: false,
      },
      rating_action: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_deferred: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
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
      tableName: 'rating_committee_meeting_registers',
      indexes: [
        {
          unique: true,
          fields: ['uuid']
        }
      ],
      underscored: true,
    }
  );
  
  const RatingCommitteeMeetingDocument = DB_CLIENT.define(
    "rating_committee_meeting_document",
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
      path: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      doc_type: {
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
      tableName: 'rating_committee_meeting_documents',
      indexes: [
        {
          unique: true,
          fields: ['uuid']
        }
      ],
      underscored: true,
    }
  );

const CommitteeDocument = DB_CLIENT.define(
  "committee_document",
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
    rating_note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    financial: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    other_document: {
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
    tableName: "committee_documents",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const RatingCommitteeVoting = DB_CLIENT.define(
  "rating_committee_voting",
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
    voted_rating: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    voted_outlook: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    voted_weightage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dissent_remark: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dissent: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: false,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: false,
    },
    is_chairman: {
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
    tableName: "rating_committee_votings",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const RatingCommitteeVotingMetadata = DB_CLIENT.define(
  "rating_committee_voting_metadata",
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
    rating: {
      type: DataTypes.STRING,
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
    tableName: "rating_committee_voting_metadata",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const MeetingHasMember = DB_CLIENT.define(
  "meeting_has_member",
  {
    is_chairman: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
  },
  {
    tableName: "meeting_has_members",
    underscored: true,
  }
);

const CommitteeMinutes = DB_CLIENT.define(
  "committee_minutes",
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
    discussion_paragraph: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    comments_paragraph: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dissent_remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rating_analyst: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    group_head: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_verify: {
      type: DataTypes.BOOLEAN,
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
    tableName: "committee_minutes",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const LatestShareClosePrice = DB_CLIENT.define(
  "latest_share_close_price",
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
    scrip_code: {
      type: DataTypes.STRING,
  
    },
    share_price_today: {
      type: DataTypes.DECIMAL(10, 2),
    },
    percentage_change_from_last_review: {
      type: DataTypes.DECIMAL(5, 2),
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
    tableName: "latest_share_close_price",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);
LatestShareClosePrice.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
LatestShareClosePrice.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
LatestShareClosePrice.belongsTo(ListingDetail, {
  foreignKey: "listing_detail_id",
  as: "listing_detail_id_as",
});

RatingCommitteeType.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingCommitteeType.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

RatingCommitteeMeetingCategory.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingCommitteeMeetingCategory.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

RatingCommitteeMeetingAttendenceConf.belongsTo(User, {
  foreignKey: "member_id",
  as: "member",
});
RatingCommitteeMeetingAttendenceConf.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingCommitteeMeetingAttendenceConf.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
RatingCommitteeMeetingAttendenceConf.belongsTo(RatingCommitteeType, {
  foreignKey: "rating_committee_type_id",
  as: "rating_committee_type",
});
RatingCommitteeMeetingAttendenceConf.belongsTo(RatingCommitteeMeetingCategory, {
  foreignKey: "rating_committee_meeting_category_id",
  as: "rating_committee_meeting_category",
});

RatingCommitteeMeeting.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingCommitteeMeeting.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
RatingCommitteeMeeting.belongsTo(RatingCommitteeType, {
  foreignKey: "rating_committee_type_id",
  as: "rating_committee_type",
});
RatingCommitteeMeeting.belongsTo(FinancialYear, {
  foreignKey: "financial_year_id",
  as: "financial_year",
});
RatingCommitteeMeeting.belongsTo(RatingCommitteeMeetingCategory, {
  foreignKey: "rating_committee_meeting_category_id",
  as: "rating_committee_meeting_category",
});

MeetingHasMember.belongsTo(
  RatingCommitteeMeeting,
  {
    foreign_key: "rating_committee_meeting_id",
    as: "rating_committee_meeting",
  },
  { underscored: true }
);
MeetingHasMember.belongsTo(
  User,
  { foreign_key: "member_id", as: "member" },
  { underscored: true }
);

Outlook.belongsTo(User, { foreignKey: "created_by", as: "created_by_user" });
Outlook.belongsTo(User, { foreignKey: "updated_by", as: "updated_by_user" });

RatingCommitteeMeetingRegister.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingCommitteeMeetingRegister.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
RatingCommitteeMeetingRegister.belongsTo(RatingCommitteeMeeting, {
  foreignKey: "rating_committee_meeting_id",
  as: "rating_committee_meeting",
});

RatingCommitteeMeetingRegister.belongsTo(RatingCommitteeType, {
  foreignKey: "rating_committee_type_id",
  as: "rating_committee_type",
});
RatingCommitteeMeetingRegister.belongsTo(RatingCommitteeMeetingCategory, {
  foreignKey: "rating_committee_meeting_category_id",
  as: "rating_committee_meeting_category",
});
RatingCommitteeMeetingRegister.belongsTo(Instrument, {
  foreignKey: "instrument_id",
  as: "instrument",
});
RatingCommitteeMeetingRegister.belongsTo(InstrumentCategory, {
  foreignKey: "instrument_category_id",
  as: "instrument_category",
});
RatingCommitteeMeetingRegister.belongsTo(InstrumentSubCategory, {
  foreignKey: "instrument_sub_category_id",
  as: "instrument_sub_category",
});
RatingCommitteeMeetingRegister.belongsTo(Mandate, {
  foreignKey: "mandate_id",
  as: "mandate",
});
RatingCommitteeMeetingRegister.belongsTo(TransactionInstrument, {
  foreignKey: "transaction_instrument_id",
  as: "transaction_instrument",
});
RatingCommitteeMeetingRegister.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});
RatingCommitteeMeetingRegister.belongsTo(InstrumentDetail, {
  foreignKey: "instrument_detail_id",
  as: "instrument_detail",
});

RatingCommitteeMeetingDocument.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingCommitteeMeetingDocument.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
RatingCommitteeMeetingDocument.belongsTo(RatingCommitteeMeeting, {
  foreignKey: "rating_committee_meeting_id",
  as: "rating_committee_meeting",
});
RatingCommitteeMeetingDocument.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});
RatingCommitteeMeetingDocument.belongsTo(DocumentType, {
  foreignKey: "document_type_id",
  as: "document_type",
});

CommitteeDocument.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
CommitteeDocument.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
CommitteeDocument.belongsTo(RatingCommitteeMeetingRegister, {
  foreignKey: "rating_committee_meeting_register_id",
  as: "rating_committee_meeting_register",
});

RatingCommitteeAttendence.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingCommitteeAttendence.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
RatingCommitteeAttendence.belongsTo(User, {
  foreignKey: "member_id",
  as: "member",
});

RatingCommitteeVoting.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingCommitteeVoting.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
RatingCommitteeVoting.belongsTo(User, {
  foreignKey: "member_id",
  as: "member",
});
RatingCommitteeVoting.belongsTo(RatingCommitteeMeeting, {
  foreignKey: "rating_committee_meeting_id",
  as: "rating_committee_meeting",
});
RatingCommitteeVoting.belongsTo(InstrumentDetail, {
  foreignKey: "instrument_detail_id",
  as: "instrument_detail",
});
// RatingCommitteeVoting.belongsTo(RatingSymbolMaster, { foreignKey: 'long_term_symbol_master_id', as: 'long_term_symbol_master' });
// RatingCommitteeVoting.belongsTo(RatingSymbolMaster, { foreignKey: 'short_term_symbol_master_id', as: 'short_term_symbol_master' });

RatingCommitteeVotingMetadata.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
RatingCommitteeVotingMetadata.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
RatingCommitteeVotingMetadata.belongsTo(RatingCommitteeMeeting, {
  foreignKey: "rating_committee_meeting_id",
  as: "rating_committee_meeting",
});
RatingCommitteeVotingMetadata.belongsTo(InstrumentDetail, {
  foreignKey: "instrument_detail_id",
  as: "instrument_detail",
});
// RatingCommitteeVotingMetadata.belongsTo(RatingSymbolMaster, { foreignKey: 'long_term_symbol_master_id', as: 'long_term_symbol_master' });
// RatingCommitteeVotingMetadata.belongsTo(RatingSymbolMaster, { foreignKey: 'short_term_symbol_master_id', as: 'short_term_symbol_master' });

CommitteeMinutes.belongsTo(User, { foreignKey: 'created_by', as: 'created_by_user' });
CommitteeMinutes.belongsTo(User, { foreignKey: 'updated_by', as: 'updated_by_user' });
CommitteeMinutes.belongsTo(RatingCommitteeMeeting, { foreignKey: 'rating_committee_meeting_id', as: 'rating_committee_meeting' })
CommitteeMinutes.belongsTo(Company, { foreignKey: 'company_id', as: 'company' })
CommitteeMinutes.belongsTo(RatingProcess, { foreignKey: 'rating_process_id', as: 'rating_process' })

const RATING_COMMITTEE_DB_INSTANCE = DB_CLIENT;

module.exports = {
  RATING_COMMITTEE_DB_INSTANCE,
  RatingCommitteeType,
  RatingCommitteeMeetingCategory,
  RatingCommitteeMeetingAttendenceConf,
  RatingCommitteeMeeting,
  Outlook,
  RatingCommitteeMeetingRegister,
  RatingCommitteeMeetingDocument,
  RatingCommitteeAttendence,
  RatingCommitteeVoting,
  RatingCommitteeVotingMetadata,
  CommitteeDocument,
  MeetingHasMember,
  CommitteeMinutes,
  LatestShareClosePrice,
};
