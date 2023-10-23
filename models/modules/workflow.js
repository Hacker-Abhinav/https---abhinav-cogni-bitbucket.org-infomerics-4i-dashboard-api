const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../../db");
const { User, Role, Company, Mandate } = require("./onboarding");
const { RatingProcess, FinancialYear } = require("./rating-model");

const Activity = DB_CLIENT.define(
  "activity",
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
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      notEmpty: true,
    },
    completion_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    alert_message: {
      type: DataTypes.STRING,
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
    }
  },
  {
    tableName: 'activities',
    indexes: [
      {
        unique: true,
        fields: ['uuid']
      },
      {
        unique: true,
        fields: ['name']
      },
      {
        unique: true,
        fields: ['code']
      }
    ],
    underscored: true,
  }
);

const WorkflowConfig = DB_CLIENT.define(
  "workflow_config",
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
    serial_number: {
      type: DataTypes.INTEGER,
    },
    is_last_activity: {
      type: DataTypes.BOOLEAN,
      default: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    tat: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_parallel: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: false,
    },
    sub_workflow: {
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
    }
  },
  {
    tableName: 'workflow_configs',
    indexes: [
      {
        unique: true,
        fields: ['uuid']
      },
    ],
    underscored: true,
  }
);

const WorkflowInstance = DB_CLIENT.define(
  "workflow_instance",
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
    assigned_at: {
      type: DataTypes.DATE,
    },
    performed_at: {
      type: DataTypes.DATE,
    }
  },
  {
    tableName: 'workflow_instances',
    indexes: [
      {
        unique: true,
        fields: ['uuid']
      },
    ],
    underscored: true,
  }
);

const WorkflowInstanceLog = DB_CLIENT.define(
  "workflow_instance_log",
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
    log: {
      type: DataTypes.STRING,
    },
    ip_address: {
      type: DataTypes.STRING,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true
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
    }
  },
  {
    tableName: 'workflow_instances_log',
    indexes: [
      {
        unique: true,
        fields: ['uuid']
      },
    ],
    underscored: true,
  }
);

const WorkflowDocument = DB_CLIENT.define(
  "workflow_document",
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
    provisional_communication: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rating_letter: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    press_release: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rating_sheet: {
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
    model_rating_sheet: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remark: {
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
    }
  },
  {
    tableName: 'workflow_documents',
    indexes: [
      {
        unique: true,
        fields: ['uuid']
      }
    ],
    underscored: true,
  }
);

const WorkflowRollbackLog = DB_CLIENT.define(
  "workflow_rollback_log",
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
    remark: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    activity_code: {
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
    }
  },
  {
    tableName: "workflow_rollback_log",
    indexes: [
      {
        unique: true,
        fields: ['uuid']
      },
    ],
    underscored: true,
  }
);

const WorkflowDocumentRemark = DB_CLIENT.define(
  "workflow_document_remark",
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
    remark: {
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
    }
  },
  {
    tableName: 'workflow_document_remarks',
    indexes: [
      {
        unique: true,
        fields: ['uuid']
      }
    ],
    underscored: true,
  }
);

const ActivityConfigurator = DB_CLIENT.define(
  "activity_configurator",
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
    field_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    field_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    in_table: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: false,
    },
    is_required: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: false,
    },
    redirection: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: false,
    },
    redirection_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_selection: {
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
    }
  },
  {
    tableName: 'activity_configurators',
    indexes: [
      {
        unique: true,
        fields: ['uuid']
      }
    ],
    underscored: true,
  }
);

Activity.belongsTo(User, { foreignKey: 'created_by', as: 'created_by_user' });
Activity.belongsTo(User, { foreignKey: 'updated_by', as: 'updated_by_user' });

WorkflowConfig.belongsTo(User, { foreignKey: 'created_by', as: 'created_by_user' });
WorkflowConfig.belongsTo(User, { foreignKey: 'updated_by', as: 'updated_by_user' });
WorkflowConfig.belongsTo(Activity, { foreignKey: 'current_activity_id', as: 'current_activity' });
WorkflowConfig.belongsTo(Activity, { foreignKey: 'next_activity_id', as: 'next_activity' });
WorkflowConfig.belongsTo(Role, { foreignKey: 'assigner_role_id', as: 'assigner_role' });
WorkflowConfig.belongsTo(Role, { foreignKey: 'performer_role_id', as: 'performer_role' });
WorkflowConfig.belongsTo(RatingProcess, { foreignKey: 'rating_process_id', as: 'rating_process' });

WorkflowInstance.belongsTo(User, { foreignKey: 'created_by', as: 'created_by_user' });
WorkflowInstance.belongsTo(User, { foreignKey: 'updated_by', as: 'updated_by_user' });
WorkflowInstance.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
WorkflowInstance.belongsTo(Mandate, { foreignKey: 'mandate_id', as: 'mandate' });
WorkflowInstance.belongsTo(WorkflowConfig, { foreignKey: 'workflow_config_id', as: 'workflow_config' });
WorkflowInstance.belongsTo(FinancialYear, { foreignKey: 'financial_year_id', as: 'financial_year' });
WorkflowInstance.belongsTo(RatingProcess, { foreignKey: 'rating_process_id', as: 'rating_process' });

WorkflowInstanceLog.belongsTo(User, { foreignKey: 'created_by', as: 'created_by_user' });
WorkflowInstanceLog.belongsTo(User, { foreignKey: 'updated_by', as: 'updated_by_user' });
WorkflowInstanceLog.belongsTo(User, { foreignKey: 'assigned_by', as: 'assigned_by_user' });
WorkflowInstanceLog.belongsTo(User, { foreignKey: 'performed_by', as: 'performed_by_user' });
WorkflowInstanceLog.belongsTo(WorkflowInstance, { foreignKey: 'workflow_instance_id', as: 'workflow_instance' });
WorkflowInstanceLog.belongsTo(WorkflowConfig, { foreignKey: 'workflow_config_id', as: 'workflow_config' });

WorkflowDocument.belongsTo(User, { foreignKey: 'created_by', as: 'created_by_user' });
WorkflowDocument.belongsTo(User, { foreignKey: 'updated_by', as: 'updated_by_user' });
WorkflowDocument.belongsTo(Mandate, { foreignKey: 'mandate_id', as: 'mandate' });
WorkflowDocument.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
WorkflowDocument.belongsTo(WorkflowInstance, { foreignKey: 'workflow_instance_id', as: 'workflow_instance' });
WorkflowDocument.belongsTo(WorkflowConfig, { foreignKey: 'workflow_config_id', as: 'workflow_config' });
WorkflowDocument.belongsTo(FinancialYear, { foreignKey: 'financial_year_id', as: 'financial_year' });
WorkflowDocument.belongsTo(RatingProcess, { foreignKey: 'rating_process_id', as: 'rating_process' });
WorkflowDocument.belongsTo(Role, { foreignKey: 'role_id', as: 'created_by_role' });

WorkflowRollbackLog.belongsTo(User, { foreignKey: 'created_by', as: 'created_by_user' });
WorkflowRollbackLog.belongsTo(User, { foreignKey: 'updated_by', as: 'updated_by_user' });
WorkflowRollbackLog.belongsTo(WorkflowInstance, { foreignKey: 'workflow_instance_id', as: 'workflow_instance' });
WorkflowRollbackLog.belongsTo(RatingProcess, { foreignKey: 'rating_process_id', as: 'rating_process' });

WorkflowDocumentRemark.belongsTo(User, { foreignKey: 'created_by', as: 'created_by_user' });
WorkflowDocumentRemark.belongsTo(User, { foreignKey: 'updated_by', as: 'updated_by_user' });
WorkflowDocumentRemark.belongsTo(WorkflowDocument, { foreignKey: 'workflow_document_id', as: 'workflow_document' });

ActivityConfigurator.belongsTo(User, { foreignKey: 'created_by', as: 'created_by_user' });
ActivityConfigurator.belongsTo(User, { foreignKey: 'updated_by', as: 'updated_by_user' });
ActivityConfigurator.belongsTo(RatingProcess, { foreignKey: 'rating_process_id', as: 'rating_process' });
ActivityConfigurator.belongsTo(Activity, { foreignKey: 'activity_code_id', as: 'activity_code' });

const WORKFLOW_DB_INSTANCE = DB_CLIENT;

module.exports = {
  WORKFLOW_DB_INSTANCE,
  Activity,
  WorkflowConfig,
  WorkflowInstance,
  WorkflowInstanceLog,
  WorkflowDocument,
  WorkflowRollbackLog,
  WorkflowDocumentRemark,
  ActivityConfigurator
}