const { sortBy, uniq } = require("lodash");
const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../../db");
const { ENCODE_JWT_DATA } = require("../../helpers");
const { User, Company, Mandate, DocumentType } = require("./onboarding");
const { RatingProcess, Instrument } = require("./rating-model");
const { RatingCommitteeMeeting } = require("./rating-committee");

const TemplateType = DB_CLIENT.define(
  "template_type",
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
    tableName: "template_types",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const TemplateList = DB_CLIENT.define(
  "template_list",
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
    template_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    html_string: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    letter_id: {
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
    tableName: "template_lists",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const LetterList = DB_CLIENT.define(
  "letter_list",
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
    //   type: {
    //     type: DataTypes.STRING,
    //     allowNull: false,
    //     unique: true,
    //   },
    //   multiple_mandates: {
    //     type: DataTypes.STRING,
    //     allowNull: false,
    //     unique: true,
    //   },
    letter_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    financial_year: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    e_sign: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    letter_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parsed_html_string: {
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
    tableName: "letter_lists",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const TemplateConfig = DB_CLIENT.define(
  "template_config",
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
    replacement_variable: {
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
    tableName: "template_configs",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

TemplateType.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
TemplateType.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

TemplateList.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
TemplateList.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
TemplateList.belongsTo(TemplateType, {
  foreignKey: "template_type_id",
  as: "template_type",
});
TemplateList.belongsTo(RatingProcess, {
  foreignKey: "rating_process_id",
  as: "rating_process",
});
TemplateList.belongsTo(Instrument, {
  foreignKey: "instrument_id",
  as: "instrument",
});

LetterList.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
LetterList.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
LetterList.belongsTo(Company, { foreignKey: "company_id", as: "company" });
LetterList.belongsTo(RatingCommitteeMeeting, {
  foreignKey: "committee_date_id",
  as: "rating_committee_meeting",
});
LetterList.belongsTo(TemplateList, {
  foreignKey: "template_list_id",
  as: "template_list",
});
LetterList.belongsTo(RatingProcess, {
  foreignKey: "rating_process_id",
  as: "rating_process",
});
LetterList.belongsToMany(
  Mandate,
  { through: "letter_lists_has_mandates", as: "mandates" },
  { underscored: true }
);
LetterList.belongsTo(DocumentType, { foreignKey: "document_type_id", as: "document_type"})

TemplateConfig.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
TemplateConfig.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
TemplateConfig.belongsTo(TemplateList, {
  foreignKey: "template_list_id",
  as: "template_list",
});

// Instance
const DB_INSTANCE = DB_CLIENT;

module.exports = {
  DB_INSTANCE,
  TemplateType,
  TemplateList,
  LetterList,
  TemplateConfig,
};
