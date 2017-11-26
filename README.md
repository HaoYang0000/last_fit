#Health Companion
http://health-companion-uiuc.azurewebsites.net/

## Introduction
Health Companion is a healthcare informatics project in which an intelligent interface for activity tracking and exercise planning will be designed. The key idea of this project is to plan exercise according to the activity events recorded by wearable devices and specified by users. 

## How to Deploy Code
- In the local terminal, change to the working directory, and then add a remote to the local Git repository. You only need to do it for the first time.

```bash
git remote add azure https://health_companion_uiuc@health-companion-uiuc.scm.azurewebsites.net:443/health-companion-uiuc.git
```

- Push to the azure remote to finish the automatic deployment. Use the same password as for Fitbit. You should see `remote: Deployment successful.` after this command.

```bash
git push azure master
```

## Tips for Using Azure
- Using Azure Portal (https://portal.azure.com) to monitor the web application and check logs. The username is `health.companion.uiuc@gmail.com`, and the password is the same as for Fitbit.
	- In the Diagnostics Logs section, turn on Application Logging, Detailed error messages and Failed request tracing.
	- In the Log Stream section, you can check all the application logs.

- Using Azure Diagnostic Console (https://health-companion-uiuc.scm.azurewebsites.net/DebugConsole) to install npm package and modify local files such as .env and database files. The username is `health.companion.uiuc@gmail.com`, and the password is the same as for Fitbit.
	- Go to D:\home\site\wwwroot, which is the repository where the content is served by the web server.
	- The files that are pushed into Git repository will be automatically copied here.
	- You can install npm package, modify local files such as .env and package.json, or delete db files.   	
