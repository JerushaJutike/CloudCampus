# Prepared AWS deployment

Status: deployment files prepared and locally validated. No AWS resource has been created or charged by this task. The owner chose to deploy later.

## Architecture

The supplied CloudFormation template runs the combined frontend/API container in App Runner, uses private RDS PostgreSQL, stores uploads in a private encrypted S3 bucket, and injects credentials from Secrets Manager. App Runner supplies application/service logs to CloudWatch; RDS PostgreSQL logs are also exported. An AWS Budget sends an email at 80% of the chosen monthly budget. A budget is an alert, not a spending cap.

The backend serves the frontend from the same origin. CloudFront is an optional later addition; the current deployment does not require a second frontend origin. When using a custom domain or CloudFront, configure `CORS_ORIGIN` to the exact public origin and pass `/api/*` through without caching authorization responses.

## Prerequisites

- An AWS account, selected region, AWS CLI v2 and Docker Desktop running.
- Check current service availability, [App Runner pricing](https://aws.amazon.com/apprunner/pricing/), [RDS pricing](https://aws.amazon.com/rds/postgresql/pricing/) and your account's [Free Tier eligibility](https://aws.amazon.com/free/) before deploying. This template makes no free-operation claim.
- A VPC with two private subnets in different Availability Zones and their route table IDs. The template adds an S3 gateway endpoint. Do not supply route tables with an existing duplicate S3 endpoint route.
- A trusted private migration host reachable through SSM or a VPN, with a security group in that VPC. Its group is supplied as `BootstrapSecurityGroupId`; the template permits its database traffic without opening PostgreSQL to the internet.
- The migration host must be able to reach Secrets Manager, for example through an existing interface endpoint or controlled outbound access. The application itself uses the S3 gateway endpoint for storage.

App Runner's [VPC connector](https://docs.aws.amazon.com/apprunner/latest/dg/network-vpc.html) provides private outgoing connectivity. Referenced [runtime secrets](https://docs.aws.amazon.com/apprunner/latest/dg/env-variable.html) are injected without placing their values in the template.

## Deploy the container and infrastructure

Copy `deploy/parameters.example.json` to a private parameter file. Replace the VPC, subnet, route table, security group and budget-email values with your own. These are configuration placeholders, not working account resources.

```powershell
.\deploy\deploy.ps1 -Region 'your-region' -ParametersFile '.\deploy\parameters.local.json'
```

The script authenticates to ECR, builds and pushes the container, validates and deploys CloudFormation, then prints resource identifiers. It creates billable resources; run it only when you have reviewed the account, region and budget. App Runner may start before schema bootstrap; its process health check is separate from `/api/ready`.

## Initialize the NEW cloud database

From the trusted migration host, obtain the stack outputs and set these environment variables to resource identifiers:

```powershell
$env:AWS_REGION = 'your-region'
$env:RDS_HOST = 'DatabaseHost-output'
$env:RDS_MASTER_SECRET_ARN = 'MasterSecretArn-output'
$env:APP_DB_SECRET_ARN = 'AppSecretArn-output'
$env:NODE_EXTRA_CA_CERTS = 'path-to-AWS-RDS-global-bundle.pem'
Set-Location .\backend
npm ci --ignore-scripts
node scripts/bootstrap-cloud.js
```

Download the CA bundle from the [official RDS trust store](https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem). The container downloads this bundle during its build and verifies database certificates. Do not disable TLS verification.

The bootstrap script fetches master/application credentials through the official AWS SDK, refuses a database that already contains tables, restores the schema, applies migrations and seeds, and creates the dedicated `cloudcampus_app` login. The application role gets data access, not schema ownership. Grant the migration host permission to read only those two database secrets; the App Runner role cannot read the RDS master secret.

For migration of existing local student data to AWS, take and verify a private backup first, restore it into a separate cloud database, apply the reviewed additive migrations and grant the application role access. The new-database bootstrap must not be used for that workflow.

## Verify and monitor

1. Confirm the stack's service URL returns `/api/health` and `/api/ready` successfully.
2. Register a new student, enroll, complete a lesson, take a quiz and submit a project.
3. Upload a supported file, download it as its owner, and confirm another account cannot access it.
4. Confirm App Runner application logs and the RDS log group appear in CloudWatch. Use [App Runner service metrics](https://docs.aws.amazon.com/apprunner/latest/dg/monitor-cw.html) to add alarms for `5xxStatusResponses` and request latency.
5. Confirm the budget email subscription and monitor billing. S3 and RDS are retained when the stack is removed; RDS also uses deletion protection and snapshot policies. Review retained resources explicitly after a demonstration.

## Operational limits and rotation

Rate limits are held in each running instance. App Runner uses a reverse proxy, and this build deliberately leaves Express proxy trust disabled; multiple clients behind one proxy can share an IP-based limit. For a public service, add a reviewed WAF/API gateway or shared rate-limit store and test its actual proxy chain before opening broad access. The current files target a bounded student demonstration.

Secrets injected as environment variables require a service update/redeployment after rotation. Coordinate application database-password rotation with the PostgreSQL role, then refresh the service. Do not rotate only one side. Rotate JWT secrets by redeploying; existing sessions become invalid. Automatic coordinated rotation is not configured by this template.

Docker execution, real RDS connections, S3 operations and live CloudWatch/billing alerts remain to be verified in the owner's AWS account. CloudFormation lint success does not prove a cloud deployment or cost estimate.
