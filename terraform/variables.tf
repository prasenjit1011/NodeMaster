variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "mongo_uri" {
  type = string
}

variable "jwt_secret" {
  type    = string
}

variable "project_name" {
  type    = string
  default = "employee-system"
}