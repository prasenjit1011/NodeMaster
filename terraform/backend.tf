terraform {
  backend "gcs" {
    bucket = "nodejs-tf-state-unique-12345"
    prefix = "state"
  }
}