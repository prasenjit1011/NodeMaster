# employee-system Full Source Code

```text
employee-system/
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── terraform/
│   ├── main.tf
│   ├── lambda.tf
│   ├── api.tf
│   ├── stepfunction.tf
│   ├── iam.tf
│   ├── variables.tf
│   └── outputs.tf
│
├── lambdas/
│   │
│   ├── login/
│   │   ├── index.js
│   │   └── package.json
│   │
│   ├── validateJwt/
│   │   ├── index.js
│   │   └── package.json
│   │
│   ├── createEmployee/
│   │   ├── index.js
│   │   └── package.json
│   │
│   ├── uploadImage/
│   │   ├── index.js
│   │   └── package.json
│   │
│   └── updateEmployee/
│       ├── index.js
│       └── package.json
│
└── stepfunction/
    └── employee-flow.json
```

---

# .github/workflows/deploy.yml
# terraform/main.tf
# terraform/variables.tf
# terraform/iam.tf
# terraform/lambda.tf
# terraform/api.tf
# terraform/stepfunction.tf
# terraform/outputs.tf
# lambdas/login/index.js
# lambdas/login/package.json
# lambdas/validateJwt/index.js
# lambdas/validateJwt/package.json
# lambdas/createEmployee/index.js
# lambdas/createEmployee/package.json
# lambdas/uploadImage/index.js
# lambdas/uploadImage/package.json
# lambdas/updateEmployee/index.js
# lambdas/updateEmployee/package.json
# stepfunction/employee-flow.json
# Deploy Commands

```bash
git init
git add .
git commit -m "employee system"

terraform init
terraform apply -auto-approve
```

---

# API Testing

## Login API

```bash
POST /login

{
  "username": "admin",
  "password": "admin123"
}
```

## Create Employee API

```bash
POST /employee
Authorization: Bearer TOKEN

{
  "name": "John",
  "email": "john@gmail.com",
  "mobile": "9999999999",
  "department": "IT"
}
```

## Upload Image API

```bash
POST /upload-image
Authorization: Bearer TOKEN

{
  "base64Image": "BASE64_STRING"
}
```
