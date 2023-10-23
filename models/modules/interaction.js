const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../../db");
const { User, Company, Stakeholder } = require("./onboarding");

const InteractionType = DB_CLIENT.define(
  "interaction_type",
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
    tableName: "interaction_types",
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

const DiligenceData = DB_CLIENT.define(
  "diligence_data",
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
    meeting_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contact_person: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    branch: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    phone_number: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    time_of_interaction: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    place_of_visit: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contact_email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
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
    tableName: "diligence_data",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const DueDiligence = DB_CLIENT.define(
  "due_diligence",
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
      type: DataTypes.TEXT,
      allowNull: false,
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_master: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
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
    tableName: "due_diligences",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const InteractionQuestion = DB_CLIENT.define(
  "interaction_question",
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
      type: DataTypes.TEXT,
      allowNull: false,
    },
    question_order: {
      type: DataTypes.INTEGER,
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
    tableName: "interaction_questions",
    indexes: [
      {
        unique: true,
        fields: ["uuid", "question_order"],
      },
    ],
    underscored: true,
  }
);

const DueDiligenceDocument = DB_CLIENT.define(
  "due_diligence_document",
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
    document: {
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
    tableName: "due_diligence_documents",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

InteractionType.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
InteractionType.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
InteractionType.hasMany(InteractionQuestion, { as: "interaction_type" });

InteractionQuestion.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
InteractionQuestion.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
InteractionQuestion.belongsTo(InteractionType, {
  foreignKey: "interaction_type_id",
  as: "interaction_type",
});

DiligenceData.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
DiligenceData.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
DiligenceData.belongsTo(InteractionType, {
  foreignKey: "interaction_type_id",
  as: "interaction_type",
});
DiligenceData.belongsTo(Company, { foreignKey: "company_id", as: "company" });
DiligenceData.belongsTo(Stakeholder, {
  foreignKey: "stakeholder_id",
  as: "stakeholder",
});

DueDiligence.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
DueDiligence.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
DueDiligence.belongsTo(DiligenceData, {
  foreignKey: "diligence_data_id",
  as: "diligence_data",
});

DueDiligenceDocument.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
DueDiligenceDocument.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
DueDiligenceDocument.belongsTo(DiligenceData, {
  foreignKey: "diligence_data_id",
  as: "diligence_data",
});

const INTERACTION_DB_INSTANCE = DB_CLIENT;

module.exports = {
  INTERACTION_DB_INSTANCE,
  InteractionType,
  InteractionQuestion,
  DiligenceData,
  DueDiligence,
  DueDiligenceDocument,
};
