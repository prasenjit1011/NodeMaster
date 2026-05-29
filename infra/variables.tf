variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "ap-south-1"
}

variable "mongo_uri" {
  description = "MongoDB Atlas Connection URI"
  type        = string
  sensitive   = true
}