variable "aws_region" {
  default = "ap-south-1"
}

variable "mongo_url" {
  type = string
}

variable "jwt_secret" {
  default = "MY_SECRET"
}
