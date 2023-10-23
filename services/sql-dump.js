// const { DB_CLIENT } = require('../db');
// const { QueryTypes } = require("sequelize");

//   const _backup = async ()=> {
//     await DB_CLIENT.query(`BACKUP DATABASE [4i_concept_api] 
//     TO DISK = 'C:\Users\Hp\AdventureWorks.BAK'`, {
//       type: QueryTypes.BACKUP,
//     });
// };

// module.exports = _backup;


const backup_database = () => {
  // extract credentials from .env
  const dbName = process.env.DB_NAME;
  const dbPass = process.env.DB_PASS;
  const dbHost = process.env.DB_HOST;
  const dbUser = process.env.DB_USER;
  const dbPort = process.env.DB_PORT;
  const format = "backup"; // sql/backup/dump
  // create a custom backup file name with date info
  const date = new Date();
  const currentDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
  const backupFilePath = `/Users/<username>/<path_to_dir>/${dbName}-${currentDate}.${format}`;
  // execute node child process(exec)
  exec(`sh ./backup.sh ${dbPass} ${dbHost} ${dbUser} ${dbPort} ${dbName} ${backupFilePath}`,
    (error, stdout, stderr) => {
      if (error) {
        return console.error(`exec error: ${error}`);
      };
      if (stderr) {
        return console.error(`stderr: ${stderr}`);
      };
      console.log(`Created a backup of ${dbName} at ${date.toLocaleString()} successfully: ${stdout}`);
    })
  };

  module.exports = backup_database;
