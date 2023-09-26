# LinkedIn Boost Connection
## Overview
LinkedIn Boost Connection is a serverless, automated tool designed to boost your LinkedIn network. Built on the Serverless Framework, it uses Puppeteer to automate the process of sending connection requests based on specified keywords. The application also creates a cron job in AWS to periodically send out these requests.


## Steps
Clone the repository

```bash
git clone https://github.com/iwaduarte/linkedin-boost-connection.git
```
### Navigate to the project directory

```bash
cd linkedin-boost-connection
```
### Configure .env file
```yaml
USER_LOGIN= linkedin_user
PASSWORD= linkedin_password
```

### Install dependencies

```bash
npm install
```
### Deploy to AWS

```bash
serverless deploy
```

## Usage
Once deployed, the AWS cron job will automatically run the application at the interval you've specified, sending out LinkedIn connection requests on your behalf.

## Configuration
### Environment Variables
Create a .env file in the root directory and specify the KEYWORDS you want to use:

**.env**
```yaml
KEYWORDS=Engineer Developer Recruiter
```

### AWS Cron Job
The cron job timing can be adjusted in the serverless.yml file under the functions section.
```yaml
    events:
      - schedule: rate(1 day)
```

License
This project is licensed under the MIT License.


