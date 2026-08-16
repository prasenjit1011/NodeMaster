# NodeMaster SNS notifier

TypeScript app that publishes messages to **Amazon SNS** from **AWS Lambda**. Infrastructure is one Terraform file in `terraform/`. GitHub Actions builds, tests, and deploys it.

```
POST /notify  →  API Gateway HTTP API  →  Lambda  →  SNS topic  →  email (optional)
```

## Local development

```powershell
npm install
$env:SNS_TOPIC_ARN = "arn:aws:sns:us-east-1:123456789012:nodemaster-notifications"
npm run dev
```

```powershell
curl -X POST http://localhost:3000/notify -H "Content-Type: application/json" -d "{\"message\":\"Hello from NodeMaster\",\"subject\":\"Test\"}"
```

```powershell
npm test
npm run build
```

## Terraform

All infrastructure is in `terraform/main.tf`. Build TypeScript first so Lambda can zip `dist/handler.js`.

```powershell
npm run build
cd terraform
terraform init
terraform apply -var="notification_email=you@example.com"
```

Confirm the SNS subscription email, then:

```powershell
curl -X POST "$(terraform -chdir=terraform output -raw api_endpoint)" -H "Content-Type: application/json" -d "{\"message\":\"Hello from Lambda\",\"subject\":\"NodeMaster\"}"
```

## GitHub Actions

`.github/workflows/deploy.yml` runs tests and `tsc` on every push/PR, then `terraform plan`. It applies on `main` / `master`.

**Variables:** `AWS_REGION` (default `us-east-1`), `NOTIFICATION_EMAIL`

**Secrets:** `AWS_ROLE_ARN` (GitHub OIDC role), `TF_STATE_BUCKET` (S3 state bucket)
