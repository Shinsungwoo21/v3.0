# =============================================================================
# EC2 Instances with Auto Scaling - Seoul Test
# =============================================================================
# Web, App 인스턴스 모두 Private Subnet에 배치
# user_data를 통해 Git, Node.js, PM2 설치 → 소스 복제 → 빌드 → 서비스 시작 자동화
# =============================================================================

# -----------------------------------------------------------------------------
# Launch Template - Web (Private Subnet)
# -----------------------------------------------------------------------------
resource "aws_launch_template" "web" {
  name_prefix   = "${var.project_name}-Web-LT-"
  image_id      = var.base_ami_id
  instance_type = var.instance_type
  key_name      = var.key_pair_name

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [aws_security_group.web.id]

  # User Data - 전체 설치 및 서비스 시작 자동화
  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -e
    
    # 로그 파일 설정
    exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
    echo "=== User Data Script Started: $(date) ==="
    
    # 사용자 설정 (ec2-user로 실행)
    USER_HOME=/home/ec2-user
    
    # 1. Git 설치 (Amazon Linux 2023)
    echo "=== Installing Git ==="
    dnf install git -y
    
    # 2. ec2-user 홈 디렉토리 권한 확인
    chown ec2-user:ec2-user $USER_HOME
    
    # 3. NVM 설치 (ec2-user 권한으로)
    echo "=== Installing NVM ==="
    sudo -u ec2-user bash -c 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash'
    
    # 4. Node.js 설치
    echo "=== Installing Node.js ==="
    sudo -u ec2-user bash -c 'source $HOME/.nvm/nvm.sh && nvm install 24.12.0'
    
    # 5. PM2 전역 설치
    echo "=== Installing PM2 ==="
    sudo -u ec2-user bash -c 'source $HOME/.nvm/nvm.sh && npm install -g pm2'
    
    # 6. 소스코드 복제
    echo "=== Cloning Repository ==="
    sudo -u ec2-user bash -c 'cd $HOME && rm -rf megaticket && git clone ${var.github_repo}'
    
    # 6.1 누락된 빌드 파일 복구 (안전장치 - GitHub 유실 대비)
    echo "=== Restoring Missing Build Files (Fail-safe) ==="
    sudo -u ec2-user bash -c 'cd $HOME/megaticket && (
        if [ ! -f package.json ]; then
            echo "Restoring package.json..."
            echo "ewogICAgIm5hbWUiOiAibWVnYS10aWNrZXQiLAogICAgInByaXZhdGUiOiB0cnVlLAogICAgIndvcmtzcGFjZXMiOiBbCiAgICAgICAgImFwcHMvKiIsCiAgICAgICAgInBhY2thZ2VzLyoiCiAgICBdLAogICAgInNjcmlwdHMiOiB7CiAgICAgICAgImRldiI6ICJ0dXJibyBydW4gZGV2IiwKICAgICAgICAiZGV2OndlYiI6ICJ0dXJibyBydW4gZGV2IC0tZmlsdGVyPXdlYiIsCiAgICAgICAgImRldjphcHAiOiAidHVyYm8gcnVuIGRldiAtLWZpbHRlcj1hcHAiLAogICAgICAgICJidWlsZCI6ICJ0dXJibyBydW4gYnVpbGQiLAogICAgICAgICJidWlsZDp3ZWIiOiAidHVyYm8gcnVuIGJ1aWxkIC0tZmlsdGVyPXdlYiIsCiAgICAgICAgImJ1aWxkOmFwcCI6ICJ0dXJibyBydW4gYnVpbGQgLS1maWx0ZXI9YXBwIiwKICAgICAgICAibGludCI6ICJ0dXJibyBydW4gbGludCIsCiAgICAgICAgImNsZWFuIjogInR1cmJvIHJ1biBjbGVhbiIsCiAgICAgICAgImNsZWFuOmZvcmNlIjogImVjaG8gXCJXYXJuaW5nOiBUaGlzIG1heSBmYWlsIGlmIGZpbGVzIGFyZSBsb2NrZWQuXCIgJiYgdHVyYm8gcnVuIGNsZWFuIC0tbm8tZGFlbW9uICYmIGlmIGV4aXN0IG5vZGVfbW9kdWxlcyBybWRpciAvcyAvcSBub2RlX21vZHVsZXMiLAogICAgICAgICJ0ZXN0LWNoYXRib3QiOiAibm9kZSBkaWFnbm9zZV92N185LmpzIgogICAgfSwKICAgICJkZXZEZXBlbmRlbmNpZXMiOiB7CiAgICAgICAgIkBhd3Mtc2RrL2NyZWRlbnRpYWwtcHJvdmlkZXJzIjogIl4zLjk1OC4wIiwKICAgICAgICAicHJldHRpZXIiOiAiXjMuMS4wIiwKICAgICAgICAidHVyYm8iOiAiXjIuMy4zIiwKICAgICAgICAidHlwZXNjcmlwdCI6ICJeNS4zLjAiCiAgICB9LAogICAgInBhY2thZ2VNYW5hZ2VyIjogIm5wbUAxMC4yLjUiCn0=" | base64 -d > package.json
        fi
        if [ ! -f turbo.json ]; then
            echo "Restoring turbo.json..."
            echo "ewogICAgIiRzY2hlbWEiOiAiaHR0cHM6Ly90dXJiby5idWlsZC9zY2hlbWEuanNvbiIsCiAgICAiZ2xvYmFsRGVwZW5kZW5jaWVzIjogWwogICAgICAgICIuZW52IgogICAgXSwKICAgICJ0YXNrcyI6IHsKICAgICAgICAiYnVpbGQiOiB7CiAgICAgICAgICAgICJkZXBlbmRzT24iOiBbCiAgICAgICAgICAgICAgICAiXmJ1aWxkIgogICAgICAgICAgICBdLAogICAgICAgICAgICAib3V0cHV0cyI6IFsKICAgICAgICAgICAgICAgICIubmV4dC8qKiIsCiAgICAgICAgICAgICAgICAiIS5uZXh0L2NhY2hlLyoqIiwKICAgICAgICAgICAgICAgICJkaXN0LyoqIgogICAgICAgICAgICBdCiAgICAgICAgfSwKICAgICAgICAiZGV2IjogewogICAgICAgICAgICAiY2FjaGUiOiBmYWxzZSwKICAgICAgICAgICAgInBlcnNpc3RlbnQiOiB0cnVlCiAgICAgICAgfSwKICAgICAgICAiY2xlYW4iOiB7CiAgICAgICAgICAgICJjYWNoZSI6IGZhbHNlCiAgICAgICAgfSwKICAgICAgICAibGludCI6IHt9CiAgICB9Cn0=" | base64 -d > turbo.json
        fi
        if [ ! -f tsconfig.base.json ]; then
            echo "Restoring tsconfig.base.json..."
            echo "ewogICAgImNvbXBpbGVyT3B0aW9ucyI6IHsKICAgICAgICAidGFyZ2V0IjogIkVTMjAyMCIsCiAgICAgICAgImxpYiI6IFsKICAgICAgICAgICAgImRvbSIsCiAgICAgICAgICAgICJkb20uaXRlcmFibGUiLAogICAgICAgICAgICAiZXNuZXh0IgogICAgICAgIF0sCiAgICAgICAgInN0cmljdCI6IHRydWUsCiAgICAgICAgImVzTW9kdWxlSW50ZXJvcCI6IHRydWUsCiAgICAgICAgIm1vZHVsZSI6ICJlc25leHQiLAogICAgICAgICJza2lwTGliQ2hlY2siOiB0cnVlLAogICAgICAgICJiYXNlVXJsIjogIi4iLAogICAgICAgICJwYXRocyI6IHsKICAgICAgICAgICAgIkBtZWdhLXRpY2tldC9zaGFyZWQtdHlwZXMiOiBbCiAgICAgICAgICAgICAgICAicGFja2FnZXMvc2hhcmVkLXR5cGVzL3NyYyIKICAgICAgICAgICAgXSwKICAgICAgICAgICAgIkBtZWdhLXRpY2tldC9zaGFyZWQtdXRpbHMiOiBbCiAgICAgICAgICAgICAgICAicGFja2FnZXMvc2hhcmVkLXV0aWxzL3NyYyIKICAgICAgICAgICAgXQogICAgICAgIH0KICAgIH0KfQ==" | base64 -d > tsconfig.base.json
        fi
    )' || true

    
    # 7. 의존성 설치
    echo "=== Installing Dependencies ==="
    sudo -u ec2-user bash -c 'source $HOME/.nvm/nvm.sh && cd $HOME/megaticket && npm install'
    
    # 8. 환경변수 설정
    echo "=== Setting Environment Variables ==="
    # .bashrc에 추가 (SSH 접속 시 사용) - 명시적 경로 사용
    echo 'export AWS_REGION=${var.aws_region}' >> /home/ec2-user/.bashrc
    echo 'export NEXT_PUBLIC_AWS_REGION=${var.aws_region}' >> /home/ec2-user/.bashrc
    echo 'export INTERNAL_API_URL=http://${aws_lb.nlb.dns_name}:3001' >> /home/ec2-user/.bashrc
    chown ec2-user:ec2-user /home/ec2-user/.bashrc
    
    # 9. Web 앱 빌드 (환경변수 inline 전달 - NEXT_PUBLIC_* 는 빌드 시점에 bake-in 됨)
    echo "=== Building Web App ==="
    sudo -u ec2-user bash -c "source \$HOME/.nvm/nvm.sh && cd \$HOME/megaticket && AWS_REGION=${var.aws_region} NEXT_PUBLIC_AWS_REGION=${var.aws_region} INTERNAL_API_URL=http://${aws_lb.nlb.dns_name}:3001 npm run build:web"
    
    # 10. PM2로 Web 서비스 시작 (환경변수 inline 전달)
    echo "=== Starting Web Service with PM2 ==="
    sudo -u ec2-user bash -c "source \$HOME/.nvm/nvm.sh && cd \$HOME/megaticket/apps/web && AWS_REGION=${var.aws_region} INTERNAL_API_URL=http://${aws_lb.nlb.dns_name}:3001 pm2 start npm --name \"web-frontend\" -- start"
    
    # 11. PM2 저장 및 startup 설정
    echo "=== Setting up PM2 Startup ==="
    sudo -u ec2-user bash -c 'source $HOME/.nvm/nvm.sh && pm2 save'
    
    # PM2 startup - NVM 경로를 포함하여 직접 실행
    NODE_PATH=$(sudo -u ec2-user bash -c 'source $HOME/.nvm/nvm.sh && dirname $(which node)')
    sudo env PATH=$NODE_PATH:$PATH $(sudo -u ec2-user bash -c 'source $HOME/.nvm/nvm.sh && which pm2') startup systemd -u ec2-user --hp /home/ec2-user --service-name pm2-ec2-user || true
    
    echo "=== User Data Script Completed: $(date) ==="
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-Web"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# -----------------------------------------------------------------------------
# Launch Template - App (Private Subnet)
# -----------------------------------------------------------------------------
resource "aws_launch_template" "app" {
  name_prefix   = "${var.project_name}-App-LT-"
  image_id      = var.base_ami_id
  instance_type = var.instance_type
  key_name      = var.key_pair_name

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  vpc_security_group_ids = [aws_security_group.app.id]

  # User Data - 전체 설치 및 서비스 시작 자동화
  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -e
    
    # 로그 파일 설정
    exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
    echo "=== User Data Script Started: $(date) ==="
    
    # 사용자 설정 (ec2-user로 실행)
    USER_HOME=/home/ec2-user
    
    # 1. Git 설치 (Amazon Linux 2023)
    echo "=== Installing Git ==="
    dnf install git -y
    
    # 2. ec2-user 홈 디렉토리 권한 확인
    chown ec2-user:ec2-user $USER_HOME
    
    # 3. NVM 설치 (ec2-user 권한으로)
    echo "=== Installing NVM ==="
    sudo -u ec2-user bash -c 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash'
    
    # 4. Node.js 설치
    echo "=== Installing Node.js ==="
    sudo -u ec2-user bash -c 'source $HOME/.nvm/nvm.sh && nvm install 24.12.0'
    
    # 5. PM2 전역 설치
    echo "=== Installing PM2 ==="
    sudo -u ec2-user bash -c 'source $HOME/.nvm/nvm.sh && npm install -g pm2'
    
    # 6. 소스코드 복제
    echo "=== Cloning Repository ==="
    sudo -u ec2-user bash -c 'cd $HOME && rm -rf megaticket && git clone ${var.github_repo}'
    
    # 6.1 누락된 빌드 파일 복구 (안전장치 - GitHub 유실 대비)
    echo "=== Restoring Missing Build Files (Fail-safe) ==="
    sudo -u ec2-user bash -c 'cd $HOME/megaticket && (
        if [ ! -f package.json ]; then
            echo "Restoring package.json..."
            echo "ewogICAgIm5hbWUiOiAibWVnYS10aWNrZXQiLAogICAgInByaXZhdGUiOiB0cnVlLAogICAgIndvcmtzcGFjZXMiOiBbCiAgICAgICAgImFwcHMvKiIsCiAgICAgICAgInBhY2thZ2VzLyoiCiAgICBdLAogICAgInNjcmlwdHMiOiB7CiAgICAgICAgImRldiI6ICJ0dXJibyBydW4gZGV2IiwKICAgICAgICAiZGV2OndlYiI6ICJ0dXJibyBydW4gZGV2IC0tZmlsdGVyPXdlYiIsCiAgICAgICAgImRldjphcHAiOiAidHVyYm8gcnVuIGRldiAtLWZpbHRlcj1hcHAiLAogICAgICAgICJidWlsZCI6ICJ0dXJibyBydW4gYnVpbGQiLAogICAgICAgICJidWlsZDp3ZWIiOiAidHVyYm8gcnVuIGJ1aWxkIC0tZmlsdGVyPXdlYiIsCiAgICAgICAgImJ1aWxkOmFwcCI6ICJ0dXJibyBydW4gYnVpbGQgLS1maWx0ZXI9YXBwIiwKICAgICAgICAibGludCI6ICJ0dXJibyBydW4gbGludCIsCiAgICAgICAgImNsZWFuIjogInR1cmJvIHJ1biBjbGVhbiIsCiAgICAgICAgImNsZWFuOmZvcmNlIjogImVjaG8gXCJXYXJuaW5nOiBUaGlzIG1heSBmYWlsIGlmIGZpbGVzIGFyZSBsb2NrZWQuXCIgJiYgdHVyYm8gcnVuIGNsZWFuIC0tbm8tZGFlbW9uICYmIGlmIGV4aXN0IG5vZGVfbW9kdWxlcyBybWRpciAvcyAvcSBub2RlX21vZHVsZXMiLAogICAgICAgICJ0ZXN0LWNoYXRib3QiOiAibm9kZSBkaWFnbm9zZV92N185LmpzIgogICAgfSwKICAgICJkZXZEZXBlbmRlbmNpZXMiOiB7CiAgICAgICAgIkBhd3Mtc2RrL2NyZWRlbnRpYWwtcHJvdmlkZXJzIjogIl4zLjk1OC4wIiwKICAgICAgICAicHJldHRpZXIiOiAiXjMuMS4wIiwKICAgICAgICAidHVyYm8iOiAiXjIuMy4zIiwKICAgICAgICAidHlwZXNjcmlwdCI6ICJeNS4zLjAiCiAgICB9LAogICAgInBhY2thZ2VNYW5hZ2VyIjogIm5wbUAxMC4yLjUiCn0=" | base64 -d > package.json
        fi
        if [ ! -f turbo.json ]; then
            echo "Restoring turbo.json..."
            echo "ewogICAgIiRzY2hlbWEiOiAiaHR0cHM6Ly90dXJiby5idWlsZC9zY2hlbWEuanNvbiIsCiAgICAiZ2xvYmFsRGVwZW5kZW5jaWVzIjogWwogICAgICAgICIuZW52IgogICAgXSwKICAgICJ0YXNrcyI6IHsKICAgICAgICAiYnVpbGQiOiB7CiAgICAgICAgICAgICJkZXBlbmRzT24iOiBbCiAgICAgICAgICAgICAgICAiXmJ1aWxkIgogICAgICAgICAgICBdLAogICAgICAgICAgICAib3V0cHV0cyI6IFsKICAgICAgICAgICAgICAgICIubmV4dC8qKiIsCiAgICAgICAgICAgICAgICAiIS5uZXh0L2NhY2hlLyoqIiwKICAgICAgICAgICAgICAgICJkaXN0LyoqIgogICAgICAgICAgICBdCiAgICAgICAgfSwKICAgICAgICAiZGV2IjogewogICAgICAgICAgICAiY2FjaGUiOiBmYWxzZSwKICAgICAgICAgICAgInBlcnNpc3RlbnQiOiB0cnVlCiAgICAgICAgfSwKICAgICAgICAiY2xlYW4iOiB7CiAgICAgICAgICAgICJjYWNoZSI6IGZhbHNlCiAgICAgICAgfSwKICAgICAgICAibGludCI6IHt9CiAgICB9Cn0=" | base64 -d > turbo.json
        fi
        if [ ! -f tsconfig.base.json ]; then
            echo "Restoring tsconfig.base.json..."
            echo "ewogICAgImNvbXBpbGVyT3B0aW9ucyI6IHsKICAgICAgICAidGFyZ2V0IjogIkVTMjAyMCIsCiAgICAgICAgImxpYiI6IFsKICAgICAgICAgICAgImRvbSIsCiAgICAgICAgICAgICJkb20uaXRlcmFibGUiLAogICAgICAgICAgICAiZXNuZXh0IgogICAgICAgIF0sCiAgICAgICAgInN0cmljdCI6IHRydWUsCiAgICAgICAgImVzTW9kdWxlSW50ZXJvcCI6IHRydWUsCiAgICAgICAgIm1vZHVsZSI6ICJlc25leHQiLAogICAgICAgICJza2lwTGliQ2hlY2siOiB0cnVlLAogICAgICAgICJiYXNlVXJsIjogIi4iLAogICAgICAgICJwYXRocyI6IHsKICAgICAgICAgICAgIkBtZWdhLXRpY2tldC9zaGFyZWQtdHlwZXMiOiBbCiAgICAgICAgICAgICAgICAicGFja2FnZXMvc2hhcmVkLXR5cGVzL3NyYyIKICAgICAgICAgICAgXSwKICAgICAgICAgICAgIkBtZWdhLXRpY2tldC9zaGFyZWQtdXRpbHMiOiBbCiAgICAgICAgICAgICAgICAicGFja2FnZXMvc2hhcmVkLXV0aWxzL3NyYyIKICAgICAgICAgICAgXQogICAgICAgIH0KICAgIH0KfQ==" | base64 -d > tsconfig.base.json
        fi
    )' || true

    
    # 7. 의존성 설치
    echo "=== Installing Dependencies ==="
    sudo -u ec2-user bash -c 'source $HOME/.nvm/nvm.sh && cd $HOME/megaticket && npm install'
    
    # 8. 환경변수 설정
    echo "=== Setting Environment Variables ==="
    # .bashrc에 추가 (SSH 접속 시 사용) - 명시적 경로 사용
    echo 'export AWS_REGION=${var.aws_region}' >> /home/ec2-user/.bashrc
    echo 'export DYNAMODB_RESERVATIONS_TABLE=${var.dynamodb_table_prefix}-reservations' >> /home/ec2-user/.bashrc
    echo 'export DYNAMODB_PERFORMANCES_TABLE=${var.dynamodb_table_prefix}-performances' >> /home/ec2-user/.bashrc
    echo 'export DYNAMODB_VENUES_TABLE=${var.dynamodb_table_prefix}-venues' >> /home/ec2-user/.bashrc
    echo 'export DYNAMODB_SCHEDULES_TABLE=${var.dynamodb_table_prefix}-schedules' >> /home/ec2-user/.bashrc
    chown ec2-user:ec2-user /home/ec2-user/.bashrc
    
    # 9. App 빌드 (.bashrc에서 환경변수 로드)
    echo "=== Building App ==="
    sudo -u ec2-user bash -c "source /home/ec2-user/.bashrc && source \$HOME/.nvm/nvm.sh && cd \$HOME/megaticket && npm run build:app"
    
    # 10. PM2로 App 서비스 시작 (.bashrc에서 환경변수 로드)
    echo "=== Starting App Service with PM2 ==="
    sudo -u ec2-user bash -c "source /home/ec2-user/.bashrc && source \$HOME/.nvm/nvm.sh && cd \$HOME/megaticket/apps/app && pm2 start npm --name 'app-backend' -- start"
    
    # 11. PM2 저장 및 startup 설정
    echo "=== Setting up PM2 Startup ==="
    sudo -u ec2-user bash -c 'source $HOME/.nvm/nvm.sh && pm2 save'
    
    # PM2 startup - NVM 경로를 포함하여 직접 실행
    NODE_PATH=$(sudo -u ec2-user bash -c 'source $HOME/.nvm/nvm.sh && dirname $(which node)')
    sudo env PATH=$NODE_PATH:$PATH $(sudo -u ec2-user bash -c 'source $HOME/.nvm/nvm.sh && which pm2') startup systemd -u ec2-user --hp /home/ec2-user --service-name pm2-ec2-user || true
    
    echo "=== User Data Script Completed: $(date) ==="
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-App"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# -----------------------------------------------------------------------------
# Auto Scaling Group - Web (Private Subnet)
# -----------------------------------------------------------------------------
resource "aws_autoscaling_group" "web" {
  name                = "${var.project_name}-Web-ASG"
  min_size            = var.web_asg_min
  max_size            = var.web_asg_max
  desired_capacity    = var.web_asg_desired
  vpc_zone_identifier = [aws_subnet.private_a.id, aws_subnet.private_c.id]
  target_group_arns   = [aws_lb_target_group.web.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 600  # 빌드 시간 고려하여 10분

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-Web"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

# -----------------------------------------------------------------------------
# Auto Scaling Group - App (Private Subnet)
# -----------------------------------------------------------------------------
resource "aws_autoscaling_group" "app" {
  name                = "${var.project_name}-App-ASG"
  min_size            = var.app_asg_min
  max_size            = var.app_asg_max
  desired_capacity    = var.app_asg_desired
  vpc_zone_identifier = [aws_subnet.private_a.id, aws_subnet.private_c.id]
  target_group_arns   = [aws_lb_target_group.app.arn, aws_lb_target_group.app_nlb.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 600  # 빌드 시간 고려하여 10분

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-App"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}
