const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const { User, Navigation, Role, Permission, MasterCommon, MacroEconomicIndicator, Department } = require('../models/modules/onboarding');

var users = [
  {
    "full_name": "Kishor Kumar Sahu",
    "email": "super-admin@cognitensor123gmail.onmicrosoft.com",
    "login_type": "AZURE",
    "is_super_account": true,
  },
  {
    "full_name": "Rohit Negi (123)",
    "email": "user-123@4i-ir.cognitensor.in",
    "login_type": "PASSWORD",
    "is_super_account": false,
  },
  {
    "full_name": "Abhinav Kumar (126)",
    "email": "user-126@4i-ir.cognitensor.in",
    "login_type": "PASSWORD",
    "is_super_account": false,
  },
  {
    "full_name": "Deepak K (127)",
    "email": "bd@cognitensor123gmail.onmicrosoft.com",
    "login_type": "AZURE",
    "is_super_account": false,
  },
];

users = users.map((row) => {
  row['uuid'] = uuidv4();
  row['password'] = bcrypt.hashSync("Admin@123", 12);
  row['is_active'] = true;
  row['created_at'] = new Date();
  row['updated_at'] = new Date();
  return row;
});

// Roles Starts
var roles = [
  {
    "name": "Group Lead",
    "is_super_seed_role": false,
  },
  {
    "name": "Business Developer",
    "is_super_seed_role": false,
  },
  {
    "name": "System Admin",
    "is_super_seed_role": true,
  },
  {
    "name": "DB Admin",
    "is_super_seed_role": true,
  },
];

roles = roles.map((row) => {
  row['uuid'] = uuidv4();
  row['is_active'] = true;
  row['created_at'] = new Date();
  row['updated_at'] = new Date();
  return row;
});
// Roles Ends

// Permissions Starts
var permissions = [
  {
    "name": "Dashboard.View",
    "seed_path": "/dashboard"
  },
  // {
  //   "name": "Company.List",
  //   "seed_path": "/dashboard/companies"
  // },
  // {
  //   "name": "Company.Create",
  //   "seed_path": "/dashboard/companies/create"
  // },
  // {
  //   "name": "Company.Edit",
  //   "seed_path": "/dashboard/companies/edit"
  // },
  {
    "name": "User.List",
    "seed_path": "/dashboard/users"
  },
  {
    "name": "User.Create",
    "seed_path": "/dashboard/users/create"
  },
  {
    "name": "User.View",
    "seed_path": "/dashboard/users/view"
  },
  {
    "name": "User.Edit",
    "seed_path": "/dashboard/users/edit"
  },
  {
    "name": "Roles.List",
    "seed_path": "/dashboard/roles"
  },
  {
    "name": "Roles.Create",
    "seed_path": "/dashboard/roles/create"
  },
  {
    "name": "Roles.Edit",
    "seed_path": "/dashboard/roles/edit"
  },
  {
    "name": "Permissions.List",
    "seed_path": "/dashboard/permissions"
  },
  {
    "name": "Permissions.Create",
    "seed_path": "/dashboard/permissions/create"
  },
  {
    "name": "Permissions.Edit",
    "seed_path": "/dashboard/permissions/edit"
  },
  {
    "name": "Navigations.List",
    "seed_path": "/dashboard/navigations"
  },
  {
    "name": "Navigations.Create",
    "seed_path": "/dashboard/navigations/create"
  },
  {
    "name": "Navigations.Edit",
    "seed_path": "/dashboard/navigations/edit"
  },
  {
    "name": "Inbox.All",
    "seed_path": "/dashboard/inbox"
  },
  {
    "name": "Settings.All",
    "seed_path": "/dashboard/settings"
  },
  {
    "name": "Notifications.All",
    "seed_path": "/dashboard/notifications"
  },
];

permissions = permissions.map((row) => {
  row['uuid'] = uuidv4();
  row['is_active'] = true;
  row['is_super_seed_permission'] = true;
  row['created_at'] = new Date();
  row['updated_at'] = new Date();
  return row;
});
// Permissions Ends

// Navigations Starts
var navigations = [
  {
    "name": "Dashboard",
    "path": "/dashboard",
    "is_sidebar_visible": true,
  },
  // {
  //   "name": "Companies",
  //   "path": "/dashboard/companies",
  //   "is_sidebar_visible": true,
  // },
  // {
  //   "name": "Company Create",
  //   "path": "/dashboard/companies/create",
  //   "is_sidebar_visible": true,
  // },
  // {
  //   "name": "Company Edit",
  //   "path": "/dashboard/companies/edit",
  //   "is_sidebar_visible": false,
  // },
  {
    "name": "Users",
    "path": "/dashboard/users",
    "is_sidebar_visible": true,
  },
  {
    "name": "User Create",
    "path": "/dashboard/users/create",
    "is_sidebar_visible": true,
  },
  {
    "name": "User View",
    "path": "/dashboard/users/view",
    "is_sidebar_visible": true,
  },
  {
    "name": "User Edit",
    "path": "/dashboard/users/edit",
    "is_sidebar_visible": false,
  },
  {
    "name": "Roles",
    "path": "/dashboard/roles",
    "is_sidebar_visible": true,
  },
  {
    "name": "Role Create",
    "path": "/dashboard/roles/create",
    "is_sidebar_visible": true,
  },
  {
    "name": "Role Edit",
    "path": "/dashboard/roles/edit",
    "is_sidebar_visible": false,
  },
  {
    "name": "Permissions",
    "path": "/dashboard/permissions",
    "is_sidebar_visible": true,
  },
  {
    "name": "Permission Create",
    "path": "/dashboard/permissions/create",
    "is_sidebar_visible": true,
  },
  {
    "name": "Permission Edit",
    "path": "/dashboard/permissions/edit",
    "is_sidebar_visible": false,
  },
  {
    "name": "Navigations",
    "path": "/dashboard/navigations",
    "is_sidebar_visible": true,
  },
  {
    "name": "Navigation Create",
    "path": "/dashboard/navigations/create",
    "is_sidebar_visible": true,
  },
  {
    "name": "Navigation Edit",
    "path": "/dashboard/navigations/edit",
    "is_sidebar_visible": false,
  },
  {
    "name": "Inbox",
    "path": "/dashboard/inbox",
    "is_sidebar_visible": true,
  },
  {
    "name": "Settings",
    "path": "/dashboard/settings",
    "is_sidebar_visible": true,
  },
  {
    "name": "Notifications",
    "path": "/dashboard/notifications",
    "is_sidebar_visible": false,
  },
];

navigations = navigations.map((row, idx) => {
  row['uuid'] = uuidv4();
  row['is_active'] = true;
  row['menu_position'] = (idx + 1);
  row['created_at'] = new Date();
  row['updated_at'] = new Date();
  return row;
});
// Navigations Ends

// Master Starts
var master_commons = [
  {
    group: "gender",
    name: "Male",
    value: "MALE",
    type: "text",
    group_position: 1
  },
  {
    group: "gender",
    name: "Female",
    value: "FEMALE",
    type: "text",
    group_position: 2
  },
  {
    group: "gender",
    name: "Other",
    value: "OTHERS",
    type: "text",
    group_position: 3
  },
  {
    group: "employment_status",
    name: "Permanent",
    value: "PERMANENT",
    type: "text", 
    group_position: 1
  },
  {
    group: "employment_status",
    name: "Contractual",
    value: "CONTRACTUAL",
    type: "text",
    group_position: 2
  },
  {
    group: "designation",
    name: "Analyst",
    value: "Analyst",
    type: "text",
    group_position: 1
  },
  {
    group: "designation",
    name: "Senior Analyst",
    value: "Senior Analyst",
    type: "text",
    group_position: 2
  },
  {
    group: "designation",
    name: "Manager Rating",
    value: "Manager Rating",
    type: "text",
    group_position: 3
  },
  {
    group: "designation",
    name: "Senior Manager Rating",
    value: "Senior Manager Rating",
    type: "text",
    group_position: 4
  },
  {
    group: "designation",
    name: "Rating Analyst",
    value: "Senior Rating Analyst",
    type: "text",
    group_position: 5
  },
  {
    group: "location",
    name: "REGISTERED & H.O - New Delhi",
    value: "REGISTERED & H.O - New Delhi",
    type: "text",
    group_position: 1
  },
  {
    group: "location",
    name: "CORPORATE OFFICE-Mumbai",
    value: "CORPORATE OFFICE-Mumbai",
    type: "text",
    group_position: 2
  },
  {
    group: "location",
    name: "EAST INDIA OFFICE-Kolkata",
    value: "EAST INDIA OFFICE-Kolkata",
    type: "text",
    group_position: 3
  },
  {
    group: "location",
    name: "WEST INDIA OFFICE-Ahmedabad",
    value: "WEST INDIA OFFICE-Ahmedabad",
    type: "text",
    group_position: 4
  },
];

master_commons = master_commons.map((row, idx) => {
  row['uuid'] = uuidv4();
  row['is_active'] = true;
  row['created_at'] = new Date();
  row['updated_at'] = new Date();
  return row;
});
// Master Ends

// Department Starts
var departments = [
  {
    name: "IT Department",
  },
  {
    name: "HR Department",
  },
  {
    name: "Rating Department",
  },
  {
    name: "QCMT",
  },
  {
    name: "Compliance",
  },
  {
    name: "Risk Modelling",
  },
];

departments = departments.map((row) => {
  row['uuid'] = uuidv4();
  row['is_active'] = true;
  row['created_at'] = new Date();
  row['updated_at'] = new Date();
  return row;
});
// Department Ends

var macro_economic_indicators = [
  {
    name: "Automobiles",
  }
];

macro_economic_indicators = macro_economic_indicators.map((row) => {
  row['uuid'] = uuidv4();
  row['is_active'] = true;
  row['created_at'] = new Date();
  row['updated_at'] = new Date();
  return row;
});


(async() => {
  console.log("Seed started.");

  console.log("Users DONE.");
  await User.bulkCreate(users);

  console.log("Navigations DONE.");
  await Navigation.bulkCreate(navigations);

  console.log("Permissions DONE.");
  await Permission.bulkCreate(permissions);

  console.log("Roles DONE.");
  await Role.bulkCreate(roles);

  const admin_user = await User.findOne({ where: {is_super_account: true} });
  const admin_roles = await Role.findAll({ where: {is_super_seed_role: true} });
  const admin_permissions = await Permission.findAll({ where: {is_super_seed_permission: true} });
  const admin_navigations = await Navigation.findAll();

  admin_permissions.forEach(async (permission) => {
    admin_navigations.forEach(async (navigation) => {
      if (permission['seed_path'] === navigation['path']) {
        await permission.setNavigations(navigation);
      }
    });
  });
  
  console.log("Admin Role Permissions DONE.");
  admin_roles.forEach(async (admin_role) => {
    await admin_role.setPermissions(admin_permissions);
  });

  console.log("Admin User Role DONE.");
  await admin_user.setRoles(admin_roles);

  console.log("Initial Masters DONE.");
  await MasterCommon.bulkCreate(master_commons);

  console.log("Departments DONE.");
  await Department.bulkCreate(departments);
  
  await MacroEconomicIndicator.bulkCreate(macro_economic_indicators);

  const admin_departments = await Department.findAll({ where: {name: "Administrations"} });
  await admin_user.setDepartments(admin_departments);
  console.log("Admin User Department DONE.");

  console.log("Seed completed.");
})();