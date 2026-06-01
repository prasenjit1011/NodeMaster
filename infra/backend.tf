terraform {
  backend "s3" {
    bucket  = "terraform-state-fn-2026"
    key     = "nodemaster-employee-leave-workflow/dev/terraform.tfstate"
    region  = "ap-south-1"
    encrypt = true
  }
}