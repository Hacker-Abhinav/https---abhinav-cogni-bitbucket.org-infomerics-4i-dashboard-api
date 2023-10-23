const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const { DB_CLIENT } = require("../../db");
const { User, MasterCommon, Company } = require("./onboarding");
const { TransactionInstrument, InstrumentCategory, InstrumentSubCategory, Instrument, RatingSymbolMaster, InstrumentDetail } = require("./rating-model");

const CorporateGuarantee = DB_CLIENT.define(
    "corporate_guarantee",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: {
        type: DataTypes.STRING,
        unique: true,
      },
      guarantor: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      rated_amount: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      press_release_date: {
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
      tableName: "corporate_guarantees",
      indexes: [
        {
          unique: true,
          fields: ["uuid"],
        },
      ],
      underscored: true,
    }
);

CorporateGuarantee.belongsTo(User, { foreignKey: "created_by", as: "created_by_user" });
CorporateGuarantee.belongsTo(User, { foreignKey: "updated_by", as: "updated_by_user" });
CorporateGuarantee.belongsTo(Company, { foreignKey: 'company_id', as: 'company' })
CorporateGuarantee.belongsTo(MasterCommon, { foreignKey: 'mandate_types_id', as: 'mandate_type' })
CorporateGuarantee.belongsTo(InstrumentCategory,  { foreignKey: 'instrument_category_id', as: 'instrument_category' })
CorporateGuarantee.belongsTo(InstrumentSubCategory, { foreignKey: 'instrument_sub_category_id', as: 'instrument_sub_category' })
CorporateGuarantee.belongsTo(Instrument, { foreignKey: 'instrument_id', as: 'instrument' })
CorporateGuarantee.belongsTo(RatingSymbolMaster, { foreignKey: 'short_term_rating_id', as: 'short_term_rating' })
CorporateGuarantee.belongsTo(RatingSymbolMaster, { foreignKey: 'long_term_rating_id',  as: 'long_term_rating' })
CorporateGuarantee.belongsToMany(TransactionInstrument, { through: 'corporate_guarantee_has_transaction_instruments', as: 'transaction_instruments' }, { underscored: true })
CorporateGuarantee.belongsTo(InstrumentDetail, { foreignKey: 'instrument_detail_id', as: 'instrument_detail' })

module.exports = {
    CorporateGuarantee
}