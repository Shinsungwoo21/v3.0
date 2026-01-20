# =============================================================================
# Variables
# =============================================================================

variable "project_name" {
  description = "프로젝트 이름"
  type        = string
  default     = "plcr"
}

variable "environment" {
  description = "환경 (production, staging, development)"
  type        = string
  default     = "production"
}
