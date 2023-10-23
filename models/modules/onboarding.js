const { sortBy, uniq } = require("lodash");
const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../../db");
const { ENCODE_JWT_DATA } = require("../../helpers");

const User = DB_CLIENT.define(
  "user",
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
    employee_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    login_type: {
      type: DataTypes.ENUM({
        values: ["PASSWORD", "AZURE"],
      }),
      default: "PASSWORD",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    is_super_account: {
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
    trashed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
      {
        unique: true,
        fields: ["email"],
      },
      {
        name: "users_index",
        fields: ["full_name"],
      },
    ],
    underscored: true,
  }
);

const UserAttribute = DB_CLIENT.define(
  "user_attribute",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    office_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    designation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    profile_image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    employment_status: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    gender: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contact_number: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    office_contact_number: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    marital_status: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    date_of_birth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    date_of_joining: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    date_of_termination: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    e_sign_image: {
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
    tableName: "user_attributes",
    indexes: [
      {
        unique: true,
        fields: ["user_id"],
      },
    ],
    underscored: true,
  }
);

const Company = DB_CLIENT.define(
  "company",
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
    short_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    registered: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    former_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    group_of_company: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sez: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    legal_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_listed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_infomerics_client: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    cin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    controlling_office: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pan: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    tan: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    gst: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    website: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    date_of_incorporation: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    is_crm: {
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
    tableName: "companies",
    indexes: [
      {
        unique: true,
        fields: ["uuid", "name", "short_code", "pan", "tan", "gst"],
      },
    ],
    underscored: true,
  }
);

const Tag = DB_CLIENT.define(
  "tag",
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
    tableName: "tags",
    indexes: [
      {
        unique: true,
        fields: ["uuid", "name"],
      },
    ],
    underscored: true,
  }
);

const MacroEconomicIndicator = DB_CLIENT.define(
  "macroeconomicindicator",
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
    tableName: "macro_economic_indicators",
    indexes: [
      {
        unique: true,
        fields: ["uuid", "name"],
      },
    ],
    underscored: true,
  }
);

const Sector = DB_CLIENT.define(
  "sector",
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
    tableName: "sectors",
    indexes: [
      {
        unique: true,
        fields: ["uuid", "name"],
      },
    ],
    underscored: true,
  }
);

const Industry = DB_CLIENT.define(
  "industry",
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
    sector: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
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
    tableName: "industries",
    indexes: [
      {
        unique: true,
        fields: ["uuid", "name"],
      },
    ],
    underscored: true,
  }
);

const SubIndustry = DB_CLIENT.define(
  "subindustry",
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
    tableName: "sub_industries",
    indexes: [
      {
        unique: true,
        fields: ["uuid", "name"],
      },
    ],
    underscored: true,
  }
);

const CompanyDocument = DB_CLIENT.define(
  "CompanyDocument",
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
    pan: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tan: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gst: {
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
    tableName: "company_documents",
    indexes: [
      {
        unique: true,
        fields: ["uuid", "company_id"],
      },
    ],
    underscored: true,
  }
);

const ListingDetail = DB_CLIENT.define(
  "listingdetail",
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
    exchange: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    scrip_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    listed_status: {
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
    tableName: "listing_details",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const BoardOfDirector = DB_CLIENT.define(
  "boardofdirector",
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
    din: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    position: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    director_function: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    qualification: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_defaulter: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: false,
    },
    total_experiance: {
      type: DataTypes.REAL,
      allowNull: true,
    },
    past_experiance: {
      type: DataTypes.REAL,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    date_of_joining: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    last_working_day: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      default: Sequelize.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "board_of_directors",
    indexes: [
      {
        unique: true,
        fields: ["uuid", "din"],
      },
    ],
    underscored: true,
  }
);

const Shareholding = DB_CLIENT.define(
  "shareholding",
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
    holding_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    holder_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    holding_percentage: {
      type: DataTypes.REAL,
      allowNull: false,
    },
    pledge_share: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    as_on_date: {
      type: DataTypes.DATE,
      allowNull: false,
      default: Sequelize.NOW,
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
    tableName: "shareholdings",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const ContactDetail = DB_CLIENT.define(
  "contactdetail",
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    landline: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_primary_contact: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    send_provisional_communication_letter: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    send_rating_letter: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    send_nds_email: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    send_press_release: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    is_key_managerial_person: {
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
    tableName: "contact_details",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const Stakeholder = DB_CLIENT.define(
  "stakeholder",
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
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contact_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    landline: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    designation: {
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
    tableName: "stakeholders",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const Department = DB_CLIENT.define(
  "department",
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
      type: DataTypes.STRING,
      allowNull: true,
    },
    head_of_department_history: {
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
    tableName: "departments",
    indexes: [
      {
        unique: true,
        fields: ["uuid", "name", "head_of_department_id"],
      },
    ],
    underscored: true,
  }
);

const Role = DB_CLIENT.define(
  "role",
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
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    is_super_seed_role: {
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
    tableName: "roles",
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

const Permission = DB_CLIENT.define(
  "permission",
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
      allowNull: true,
    },
    module: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sub_priority: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    is_super_seed_permission: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: false,
    },
    seed_path: {
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
    tableName: "permissions",
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

const Navigation = DB_CLIENT.define(
  "navigation",
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
    path: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    parent_navigation_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
    is_sidebar_visible: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: false,
    },
    menu_position: {
      type: DataTypes.DECIMAL(10, 3),
    },
    icon: {
      type: DataTypes.TEXT,
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
    tableName: "navigations",
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

const AccessToken = DB_CLIENT.define(
  "access_token",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
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
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "user_access_tokens",
    underscored: true,
  }
);

const UserActivity = DB_CLIENT.define(
  "user_activity",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    activity: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    params: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
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
    tableName: "user_activities",
    underscored: true,
  }
);

const Country = DB_CLIENT.define(
  "country",
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
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
  },
  {
    tableName: "countries",
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

const State = DB_CLIENT.define(
  "state",
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
  },
  {
    tableName: "states",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const City = DB_CLIENT.define(
  "city",
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true,
    },
  },
  {
    tableName: "cities",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const MasterCommon = DB_CLIENT.define(
  "master_common",
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
    group: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    group_position: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    data_order: {
      type: DataTypes.INTEGER,
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
    tableName: "master_commons",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
      {
        unique: true,
        fields: ["group", "name"],
      },
    ],
    underscored: true,
  }
);

const Mandate = DB_CLIENT.define(
  "mandate",
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
    mandate_id: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mandate_status: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mandate_source: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mandate_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    received_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    mandate_type: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    total_size: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    initial_fee_charged: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    bases_point: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    surveillance_fee_charged: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    surveillance_bases_point: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    minimum_surveillance_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    is_verified: {
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
    tableName: "mandates",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const CompanyCasesStatus = DB_CLIENT.define(
  "company_cases_status",
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
    tableName: "company_cases_status",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const MandateDocument = DB_CLIENT.define(
  "mandatedocument",
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
    mandate_part_1_document: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mandate_part_2_document: {
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
    tableName: "mandate_documents",
    indexes: [
      {
        unique: true,
        fields: ["uuid", "mandate_id"],
      },
    ],
    underscored: true,
  }
);

const CompanyAddress = DB_CLIENT.define(
  "company_address",
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
    address_1: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    address_2: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    landmark: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lat: {
      type: DataTypes.REAL,
      allowNull: true,
    },
    lng: {
      type: DataTypes.REAL,
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contact_number: {
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
    tableName: "company_addresses",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const Subsidiary = DB_CLIENT.define(
  "subsidiary",
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
    stake: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
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
    tableName: "subsidiaries",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const BranchOffice = DB_CLIENT.define(
  "branch_office",
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
    tableName: "branch_offices",
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

const IncCasesRating = DB_CLIENT.define(
  "inc_cases_rating",
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
    agency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rating_date: {
      type: DataTypes.DATE,
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
    tableName: "inc_cases_ratings",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const CrmDataDump = DB_CLIENT.define(
  "crm_data_dump",
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
    leadname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    leadmandatef: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shipcountry: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shipstate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shipcity: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pano: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gstino: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    servicesname: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    conpersonnamee: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    conemailid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    primaryphonenumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    conmobile: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    condesignation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    primaryphonenumbercode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    primaryphonenumberextension: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    secondryphonenumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    secondryphonenumbercode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    secondryphonenumberextension: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otherphonenumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otherphonenumbercode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otherphonenumberextension: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    secondryconpersonnamee: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    secondryconemailid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    secondryconmobile: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    secondrycondesignation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otherconpersonnamee: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otherconemailid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otherconmobile: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    othercondesignation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    companytanno: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    companysector: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    companylist: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mandateupload: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    scannedupload: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fullname: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    leadiamount: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    leadfees: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ratingapprovedby: {
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
    action_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      default: Sequelize.NOW,
    },
  },
  {
    tableName: "crm_data_dump",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const MandateAllocationHistory = DB_CLIENT.define(
  "mandate_allocation_history",
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
    tableName: "mandate_allocation_history",
    indexes: [
      {
        unique: true,
        fields: ["uuid"],
      },
    ],
    underscored: true,
  }
);

const DocumentType = DB_CLIENT.define(
  "document_type",
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
    tableName: "document_types",
    indexes: [
      {
        unique: true,
        fields: ["uuid", "name"],
      },
    ],
    underscored: true,
  }
);

// Associations
User.belongsToMany(Company, { through: "user_has_companies" });
User.hasMany(AccessToken);
User.hasMany(UserActivity);
User.belongsTo(User, { foreignKey: "created_by", as: "created_by_user" });
User.belongsTo(User, { foreignKey: "updated_by", as: "updated_by_user" });
User.belongsTo(User, { foreignKey: "trashed_by", as: "trashed_by_user" });
User.hasOne(UserAttribute);
User.belongsToMany(
  Role,
  { through: "user_has_roles", as: "roles" },
  { underscored: true }
);
User.belongsToMany(
  User,
  { through: "user_reports_to", as: "report_to_user" },
  { underscored: true }
);
User.belongsToMany(
  Department,
  { through: "user_has_departments", as: "departments" },
  { underscored: true }
);

Role.belongsToMany(
  Permission,
  { through: "role_has_permissions" },
  { underscored: true }
);
Role.belongsToMany(
  User,
  { through: "user_has_roles", as: "users" },
  { underscored: true }
);
Permission.belongsToMany(
  Navigation,
  { through: "permission_has_navigations" },
  { underscored: true }
);
Navigation.belongsTo(Navigation, {
  foreignKey: "parent_navigation_id",
  as: "parent_navigation",
});

UserAttribute.belongsTo(User, { foreignKey: "user_id", as: "user" });
UserAttribute.belongsTo(User, {
  foreignKey: "created_by",
  as: "user_attr_created_by",
});
UserAttribute.belongsTo(User, {
  foreignKey: "updated_by",
  as: "user_attr_updated_by",
});

Company.belongsTo(MacroEconomicIndicator, {
  foreignKey: "macro_economic_indicator_id",
  as: "company_macro_economic_indicator",
});
Company.belongsTo(Sector, { foreignKey: "sector_id", as: "company_sector" });
Company.belongsTo(Industry, {
  foreignKey: "industry_id",
  as: "company_industry",
});
Company.belongsTo(SubIndustry, {
  foreignKey: "sub_industry_id",
  as: "company_sub_industry",
});
Company.belongsTo(User, { foreignKey: "created_by", as: "company_created_by" });
Company.belongsTo(User, { foreignKey: "updated_by", as: "company_updated_by" });
Company.belongsToMany(
  Company,
  { through: "company_has_subsidiaries", as: "subsidiaries" },
  { underscored: true }
);
Company.belongsToMany(
  Company,
  { through: "company_has_stakeholders", as: "stakeholder_companies" },
  { underscored: true }
);
Company.belongsToMany(
  Tag,
  { through: "company_has_tags", as: "tags" },
  { underscored: true }
);
Company.belongsTo(CompanyCasesStatus, {
  foreignKey: "company_cases_status_id",
  as: "company_cases_status_id_as",
});
Company.hasMany(CompanyAddress);
Company.hasOne(CompanyDocument, {
  foreignKey: "company_id",
  as: "company_document",
});
Company.hasMany(ListingDetail);
Company.hasMany(Shareholding);
Company.hasMany(Stakeholder);
Company.hasMany(Mandate, { as: "company_mandate" });
Company.hasMany(ContactDetail);
Company.hasMany(BoardOfDirector);

CompanyAddress.belongsTo(Country, {
  foreignKey: "country_id",
  as: "company_country",
});
CompanyAddress.belongsTo(State, {
  foreignKey: "state_id",
  as: "company_state",
});
CompanyAddress.belongsTo(City, { foreignKey: "city_id", as: "company_city" });
CompanyAddress.belongsTo(Company, { foreignKey: "company_id", as: "company" });
CompanyAddress.belongsTo(User, {
  foreignKey: "created_by",
  as: "company_address_created_by",
});
CompanyAddress.belongsTo(User, {
  foreignKey: "updated_by",
  as: "company_address_updated_by",
});

CompanyDocument.belongsTo(
  Company,
  { foreignKey: "company_id", as: "company_document" },
  { underscored: true }
);
CompanyDocument.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
CompanyDocument.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

MasterCommon.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
MasterCommon.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

Department.belongsTo(User, { foreignKey: "created_by", as: "created_by_user" });
Department.belongsTo(User, { foreignKey: "updated_by", as: "updated_by_user" });
Department.belongsTo(User, {
  foreignKey: "head_of_department_id",
  as: "head_of_department",
});

Mandate.belongsTo(User, { foreignKey: "created_by", as: "created_by_user" });
Mandate.belongsTo(User, { foreignKey: "updated_by", as: "updated_by_user" });
Mandate.belongsTo(User, { foreignKey: "bd_id", as: "business_developer" });
Mandate.belongsTo(User, { foreignKey: "gh_id", as: "group_head" });
Mandate.belongsTo(User, { foreignKey: "ra_id", as: "rating_analyst" });
Mandate.belongsTo(User, { foreignKey: "rh_id", as: "rating_head" });
Mandate.belongsTo(Company, { foreignKey: "company_id", as: "company_mandate" });
Mandate.belongsTo(BranchOffice, {
  foreignKey: "branch_office_id",
  as: "branch_office",
});
Mandate.belongsTo(Mandate, {
  foreignKey: "parent_mandate_id",
  as: "parent_mandate",
});

MandateDocument.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
MandateDocument.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
MandateDocument.belongsTo(Mandate, { foreignKey: "mandate_id", as: "mandate" });

MacroEconomicIndicator.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
MacroEconomicIndicator.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
MacroEconomicIndicator.hasMany(Sector, {
  foreignKey: "macro_economic_indicator_id",
  as: "macro_economic_indicator",
});

Sector.belongsTo(MacroEconomicIndicator, {
  foreignKey: "macro_economic_indicator_id",
  as: "macro_economic_indicator",
});
Sector.belongsTo(User, { foreignKey: "created_by", as: "created_by_user" });
Sector.belongsTo(User, { foreignKey: "updated_by", as: "updated_by_user" });
Sector.hasMany(Industry, { as: "industry" });

Industry.belongsTo(Sector, { foreignKey: "sector_id", as: "industry_sector" });
Industry.belongsTo(User, { foreignKey: "created_by", as: "created_by_user" });
Industry.belongsTo(User, { foreignKey: "updated_by", as: "updated_by_user" });
Industry.hasMany(SubIndustry, { as: "sub_industry" });

SubIndustry.belongsTo(Industry, { foreignKey: "industry_id", as: "industry" });
SubIndustry.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
SubIndustry.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

ListingDetail.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company_listing_detail",
});
ListingDetail.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
ListingDetail.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

BoardOfDirector.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company_board",
});
BoardOfDirector.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
BoardOfDirector.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

Shareholding.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company_shareholding",
});
Shareholding.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
Shareholding.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

Stakeholder.belongsTo(Country, {
  foreignKey: "country_id",
  as: "stakeholder_country",
});
Stakeholder.belongsTo(State, {
  foreignKey: "state_id",
  as: "stakeholder_state",
});
Stakeholder.belongsTo(City, { foreignKey: "city_id", as: "stakeholder_city" });
Stakeholder.belongsTo(Department, {
  foreignKey: "department_id",
  as: "stakeholder_department",
});
Stakeholder.belongsTo(Company, {
  foreignKey: "company_id",
  as: "parent_company",
});
Stakeholder.belongsTo(Company, {
  foreignKey: "stakeholder_company_id",
  as: "stakeholder_company",
});
Stakeholder.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
Stakeholder.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

ContactDetail.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company_contact",
});
ContactDetail.belongsTo(Department, {
  foreignKey: "department_id",
  as: "department",
});
ContactDetail.belongsTo(Stakeholder, {
  foreignKey: "stakeholder_id",
  as: "stakeholder_contact",
});
ContactDetail.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
ContactDetail.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

Country.belongsTo(User, { foreignKey: "created_by", as: "created_by_user" });
Country.belongsTo(User, { foreignKey: "updated_by", as: "updated_by_user" });
Country.hasMany(State, { foreignKey: "country_id", as: "country" });

State.hasMany(City, { foreignKey: "state_id", as: "state" });
State.belongsTo(Country, { foreignKey: "country_id", as: "country" });
State.belongsTo(User, { foreignKey: "created_by", as: "created_by_user" });
State.belongsTo(User, { foreignKey: "updated_by", as: "updated_by_user" });

City.belongsTo(State, { foreignKey: "state_id", as: "state" });
City.belongsTo(User, { foreignKey: "created_by", as: "created_by_user" });
City.belongsTo(User, { foreignKey: "updated_by", as: "updated_by_user" });

Tag.belongsToMany(
  MasterCommon,
  { through: "tag_has_master_commons", as: "master_commons" },
  { underscored: true }
);
Tag.belongsToMany(
  Company,
  { through: "company_has_tags", as: "tag_companies" },
  { underscored: true }
);
Tag.belongsTo(User, { foreignKey: "created_by", as: "created_by_user" });
Tag.belongsTo(User, { foreignKey: "updated_by", as: "updated_by_user" });

MasterCommon.belongsToMany(
  Tag,
  { through: "tag_has_master_commons", as: "master_common_tags" },
  { underscored: true }
);

Subsidiary.belongsTo(User, { foreignKey: "created_by", as: "created_by_user" });
Subsidiary.belongsTo(User, { foreignKey: "updated_by", as: "updated_by_user" });
Subsidiary.belongsTo(Company, {
  foreignKey: "company_id",
  as: "parent_company",
});
Subsidiary.belongsTo(Company, {
  foreignKey: "subsidiary_company_id",
  as: "subsidiary_company",
});

BranchOffice.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
BranchOffice.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

IncCasesRating.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
IncCasesRating.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
IncCasesRating.belongsTo(Company, { foreignKey: "company_id", as: "company" });

CompanyCasesStatus.belongsTo(MasterCommon, {
  foreignKey: "master_commons_id",
  as: "master_commons_id_as",
});
CompanyCasesStatus.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
CompanyCasesStatus.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

CrmDataDump.belongsTo(Sector, {
  foreignKey: "sector_id",
  as: "sector",
});
CrmDataDump.belongsTo(Industry, {
  foreignKey: "industry_id",
  as: "crm_industry",
});
CrmDataDump.belongsTo(Country, {
  foreignKey: "country_id",
  as: "country",
});
CrmDataDump.belongsTo(State, {
  foreignKey: "state_id",
  as: "state",
});
CrmDataDump.belongsTo(City, {
  foreignKey: "city_id",
  as: "city",
});

MandateAllocationHistory.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
MandateAllocationHistory.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});
MandateAllocationHistory.belongsTo(User, {
  foreignKey: "to_user_id",
  as: "to_user",
});
MandateAllocationHistory.belongsTo(Role, {
  foreignKey: "to_role_id",
  as: "to_role",
});
MandateAllocationHistory.belongsTo(User, {
  foreignKey: "from_user_id",
  as: "from_user",
});
MandateAllocationHistory.belongsTo(Role, {
  foreignKey: "from_role_id",
  as: "from_role",
});
MandateAllocationHistory.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});
MandateAllocationHistory.belongsTo(Mandate, {
  foreignKey: "mandate_id",
  as: "mandate",
});

DocumentType.belongsTo(User, {
  foreignKey: "created_by",
  as: "created_by_user",
});
DocumentType.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updated_by_user",
});

// Functions
User.prototype.apiInstance = async function () {
  var user = this;
  var roles = [];

  profile_image = await DB_CLIENT.query(
    `SELECT profile_image FROM user_attributes WHERE user_id=:user_id `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        user_id: this.id,
      },
    }
  );

  var roleIds = await this.getRoles({
    attributes: ["id"],
    order: [["created_at", "ASC"]],
  });
  roleIds = roleIds.map((r) => r["id"]);

  const rolesFromDb = await Role.getByIds(roleIds);
  rolesFromDb.forEach(async (role) => {
    var navigations_path = [];
    var menu = [];
    var permissions_name = [];

    if (role) {
      role["permissions"].forEach((permission) => {
        if (permission && permission["navigations"]) {
          permission["navigations"].forEach((nav) => {
            if (nav["is_sidebar_visible"]) {
              menu.push({
                uuid: nav["uuid"],
                name: nav["name"],
                path: nav["path"],
                icon: nav["icon"],
                menu_position: nav["menu_position"],
                icon: nav["icon"],
                parent_navigation: nav["parent_navigation"]
                  ? nav["parent_navigation"]["uuid"]
                  : null,
              });
            }
            navigations_path.push(nav["path"]);
            permissions_name.push(permission["name"]);
          });
        }
      });
      menu = sortBy(menu, "menu_position");

      var parent_navigations = {};
      menu.forEach((row) => {
        var parent_navigation_uuid = row["parent_navigation"];
        if (parent_navigation_uuid) {
          if (!parent_navigations[parent_navigation_uuid]) {
            parent_navigations[parent_navigation_uuid] = [];
          }
          parent_navigations[parent_navigation_uuid].push(row);
        }
      });

      menu = menu.map((row) => {
        if (!row["parent_navigation"]) {
          row["inner_menu"] = parent_navigations[row["uuid"]];
        }
        return row;
      });

      menu = menu.filter((row) => {
        return row["parent_navigation"] === null;
      });
    }

    var access_token = await ENCODE_JWT_DATA({
      user_id: user.id,
      role_name: role["name"],
      role_id: role["id"],
      // permissions: uniq(permissions_name),
    });

    roles.push({
      uuid: role["uuid"],
      name: role["name"],
      is_active: role["is_active"],
      navigations_path: navigations_path,
      menu: menu,
      role: role,
      access_token: access_token,
    });
  });

  return {
    id: this.id,
    uuid: this.uuid,
    full_name: this.full_name,
    email: this.email,
    is_active: this.is_active,
    profile_image:
      profile_image.length > 0 ? profile_image[0].profile_image : null,
    is_super_account: this.is_super_account,
    roles: roles,
  };
};

User.prototype.isReportsTo = async function (report_to_user_id) {
  await DB_CLIENT.query(`DELETE FROM user_reports_to WHERE user_id=:user_id`, {
    replacements: {
      user_id: this.id,
    },
    type: QueryTypes.DELETE,
  });

  await DB_CLIENT.query(
    `INSERT INTO user_reports_to (user_id, report_to_user_id) VALUES (:user_id, :report_to_user_id);`,
    {
      replacements: {
        user_id: this.id,
        report_to_user_id: report_to_user_id,
      },
      type: QueryTypes.INSERT,
    }
  );
};

Permission.prototype.assignToSystemAdmin = async function (role_id) {
  await DB_CLIENT.query(
    `INSERT INTO role_has_permissions (role_id, permission_id) VALUES (:role_id, :permission_id);`,
    {
      replacements: {
        role_id: role_id,
        permission_id: this.id,
      },
      type: QueryTypes.INSERT,
    }
  );
};

Role.getByIds = async function (ids) {
  const conf = {
    attributes: ["id", "uuid", "name", "description"],
    include: {
      model: Permission,
      attributes: ["uuid", "name", "description"],
      include: {
        model: Navigation,
        attributes: [
          "id",
          "uuid",
          "name",
          "path",
          "description",
          "menu_position",
          "is_sidebar_visible",
          "icon",
        ],
        include: {
          model: Navigation,
          as: "parent_navigation",
          attributes: ["id", "uuid", "name", "path", "description"],
        },
      },
    },
    order: [["id", "ASC"]],
  };
  const roles = await Role.findAll({
    where: {
      id: ids,
      is_active: true,
    },
    ...conf,
  });
  return roles;
};

// Instance
const DB_INSTANCE = DB_CLIENT;

module.exports = {
  DB_INSTANCE,
  User,
  UserActivity,
  UserAttribute,
  Company,
  Role,
  Permission,
  Navigation,
  CompanyAddress,
  MasterCommon,
  Mandate,
  Department,
  MacroEconomicIndicator,
  Sector,
  Industry,
  SubIndustry,
  CompanyDocument,
  ListingDetail,
  BoardOfDirector,
  Shareholding,
  ContactDetail,
  Stakeholder,
  Country,
  State,
  City,
  Tag,
  Subsidiary,
  MandateDocument,
  BranchOffice,
  IncCasesRating,
  CrmDataDump,
  MandateAllocationHistory,
  CompanyCasesStatus,
  DocumentType,
};
