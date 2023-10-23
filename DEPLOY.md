### Deployment steps
Please use following command in Terminal.

- Navigate to API source code folder : `cd /home/cogadmin/apps/backend`
- Start REDIS Server : `sudo service redis start`
- Remove any PM2 app running : `pm2 delete all`
- Start API server as PM2 app : `pm2 start "npm run-script start:main" --name="backend-api"`
- Save config : `pm2 save`
- API should be now working based on Port specified in `.env`. 
