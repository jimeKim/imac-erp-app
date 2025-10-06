#!/bin/bash

# SSH 공개키를 서버에 추가하는 명령어
# DigitalOcean 콘솔에서 root로 로그인 후 실행하세요

mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 공개키 추가
cat >> ~/.ssh/authorized_keys << 'EOF'
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCR/Cpg0y5R9EreM16JUOS+ZoP9sTxYicSreqRriqPd4z0AI0T3Zk1TXxsvWEORRUa0j2yWZbEnaz34a0+g76kPSKu5HQ5ml+2Kn6wYMI5tOzWte6HkfpVmqvs28uPtQLruIxyHm3zijTvixwvGCBKmCU2l+Lr6FUuOZHaxCai8MtqJ5iNKDOfh20eQFxXDyviG4Tw7JmCV8wuSNWryUFuX4eZDLH9qS+rT7l48xwYYrhE/Wtl2zSExhKrQjRQUrOt5UKG25pZ7NJHYDbMurO+Q6YcqB+8tFata/JlED+0a+T+gvpc3piEP36z71PZldmrgLfPg2snwSUd0AS4vxmPpVkUnuyx0e6qtvbu1t9V3d+gPD2abjzftX4ZtrcyweLLauMDg7p/PZJJ8YeLsYm8/UWOm8feuOWTDi1r0xFZxge+aXUDw7oWXBYj0k/VxpsSfddcPyddx84Q4wz/JWVhXH0ak7bl9PemHBjUD9RHNZ7RxH5aHIeXXMqJIxuMifHlxtRCtR4MJXPSDBfoGpXj0TvvJLfyzTagrclusG98BeDQisZxBZvp7zS12Yaucoh8kVKhrdD3rKpCLQQq330AeEa3K6GXwgwDG0HFwMkarhmwIDvbH2da/ywnAzffYg1UGxTZac0MLiaTv4oNZMVYmudj5/deny7iEFxbXf55tAQ== iloveume@naver.com
EOF

chmod 600 ~/.ssh/authorized_keys

echo "✅ SSH 키가 추가되었습니다!"
echo "이제 로컬에서 ssh root@139.59.110.55 로 접속할 수 있습니다."
