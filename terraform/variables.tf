variable "aws_region" {
  default = "ap-south-1"
}

variable "mongo_url" {
  default = "mongodb+srv://myuser:password@cluster0.hlicuim.mongodb.net/demodb?retryWrites=true&w=majority&appName=Cluster0"
}

variable "jwt_secret" {
  default = "MY_SECRET"
}
