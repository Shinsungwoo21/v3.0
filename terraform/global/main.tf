# =============================================================================
# IAM User Groups - Global (V1.0)
# =============================================================================

terraform {
  required_version = ">= 1.0.0"

  backend "s3" {
    bucket         = "plcr-s3-an2-tfstate"
    key            = "v3/global/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "plcr-tbl-an2-tfstate-lock"
  }
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-northeast-2"  # IAM은 글로벌이지만 provider 리전 필요
  
  default_tags {
    tags = {
      Project     = "plcr"
      ManagedBy   = "terraform"
    }
  }
}
