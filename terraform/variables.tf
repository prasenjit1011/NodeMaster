variable "aws_region" {
  type = string,
  default = "ap-south-1"
}

variable "mongo_url" {
  type = string
}

variable "jwt_secret" {
  default = "MY_SECRET"
}

variable "project_name" {
  default = "employee-system"
}
