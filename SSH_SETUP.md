# SSH 접속 설정 가이드

## 현재 상황

DigitalOcean 서버 (139.59.110.55)에 SSH 키 인증이 필요합니다.

## 🔑 SSH 키 등록 방법

### Option 1: DigitalOcean 웹 콘솔 사용 (권장 ⭐)

1. **DigitalOcean 대시보드 접속**
   - https://cloud.digitalocean.com/ 접속
   - 로그인

2. **Droplet 찾기**
   - 좌측 메뉴 → "Droplets"
   - IP가 139.59.110.55인 Droplet 클릭

3. **웹 콘솔 열기**
   - Droplet 페이지 우측 상단 → "Console" 버튼 클릭
   - 또는 "Access" 탭 → "Launch Droplet Console"

4. **root 로그인**
   - Username: `root`
   - Password: 초기 비밀번호 입력 (이메일로 받은 비밀번호)

5. **다음 명령어 한 줄씩 실행**

```bash
# SSH 디렉토리 생성
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 공개키 추가 (전체를 한 번에 복사 붙여넣기)
cat >> ~/.ssh/authorized_keys << 'EOF'
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCR/Cpg0y5R9EreM16JUOS+ZoP9sTxYicSreqRriqPd4z0AI0T3Zk1TXxsvWEORRUa0j2yWZbEnaz34a0+g76kPSKu5HQ5ml+2Kn6wYMI5tOzWte6HkfpVmqvs28uPtQLruIxyHm3zijTvixwvGCBKmCU2l+Lr6FUuOZHaxCai8MtqJ5iNKDOfh20eQFxXDyviG4Tw7JmCV8wuSNWryUFuX4eZDLH9qS+rT7l48xwYYrhE/Wtl2zSExhKrQjRQUrOt5UKG25pZ7NJHYDbMurO+Q6YcqB+8tFata/JlED+0a+T+gvpc3piEP36z71PZldmrgLfPg2snwSUd0AS4vxmPpVkUnuyx0e6qtvbu1t9V3d+gPD2abjzftX4ZtrcyweLLauMDg7p/PZJJ8YeLsYm8/UWOm8feuOWTDi1r0xFZxge+aXUDw7oWXBYj0k/VxpsSfddcPyddx84Q4wz/JWVhXH0ak7bl9PemHBjUD9RHNZ7RxH5aHIeXXMqJIxuMifHlxtRCtR4MJXPSDBfoGpXj0TvvJLfyzTagrclusG98BeDQisZxBZvp7zS12Yaucoh8kVKhrdD3rKpCLQQq330AeEa3K6GXwgwDG0HFwMkarhmwIDvbH2da/ywnAzffYg1UGxTZac0MLiaTv4oNZMVYmudj5/deny7iEFxbXf55tAQ== iloveume@naver.com
EOF

# 권한 설정
chmod 600 ~/.ssh/authorized_keys

# 확인
echo "✅ SSH 키 추가 완료!"
```

6. **로컬에서 접속 테스트**

로컬 터미널에서:
```bash
ssh root@139.59.110.55
```

성공하면 → **배포 계속 진행**
실패하면 → 아래 트러블슈팅 참조

---

### Option 2: DigitalOcean SSH Keys 메뉴에서 추가

1. **DigitalOcean 대시보드**
   - https://cloud.digitalocean.com/
   - 좌측 메뉴 → "Settings" → "Security" → "SSH Keys"

2. **Add SSH Key**
   - "Add SSH Key" 버튼 클릭

3. **공개키 붙여넣기**
   
   다음 내용 전체를 복사하여 붙여넣기:
   ```
   ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCR/Cpg0y5R9EreM16JUOS+ZoP9sTxYicSreqRriqPd4z0AI0T3Zk1TXxsvWEORRUa0j2yWZbEnaz34a0+g76kPSKu5HQ5ml+2Kn6wYMI5tOzWte6HkfpVmqvs28uPtQLruIxyHm3zijTvixwvGCBKmCU2l+Lr6FUuOZHaxCai8MtqJ5iNKDOfh20eQFxXDyviG4Tw7JmCV8wuSNWryUFuX4eZDLH9qS+rT7l48xwYYrhE/Wtl2zSExhKrQjRQUrOt5UKG25pZ7NJHYDbMurO+Q6YcqB+8tFata/JlED+0a+T+gvpc3piEP36z71PZldmrgLfPg2snwSUd0AS4vxmPpVkUnuyx0e6qtvbu1t9V3d+gPD2abjzftX4ZtrcyweLLauMDg7p/PZJJ8YeLsYm8/UWOm8feuOWTDi1r0xFZxge+aXUDw7oWXBYj0k/VxpsSfddcPyddx84Q4wz/JWVhXH0ak7bl9PemHBjUD9RHNZ7RxH5aHIeXXMqJIxuMifHlxtRCtR4MJXPSDBfoGpXj0TvvJLfyzTagrclusG98BeDQisZxBZvp7zS12Yaucoh8kVKhrdD3rKpCLQQq330AeEa3K6GXwgwDG0HFwMkarhmwIDvbH2da/ywnAzffYg1UGxTZac0MLiaTv4oNZMVYmudj5/deny7iEFxbXf55tAQ== iloveume@naver.com
   ```

4. **Name 입력**
   - 예: `imac-erp-macbook`

5. **Add SSH Key**

6. **Droplet에 키 추가**
   - 기존 Droplet (139.59.110.55)에 자동으로 추가되지 않으므로
   - **Option 1의 웹 콘솔 방법**을 함께 사용해야 합니다

---

## 🧪 접속 테스트

SSH 키 추가 후 로컬 터미널에서:

```bash
ssh root@139.59.110.55
```

**성공 시 출력:**
```
Welcome to Ubuntu 22.04.x LTS...
root@droplet-name:~#
```

**실패 시:**
```
Permission denied (publickey).
```
→ 아래 트러블슈팅 참조

---

## 🔧 트러블슈팅

### ❌ "Permission denied (publickey)"

**원인**: SSH 키가 서버에 제대로 등록되지 않음

**해결:**
1. DigitalOcean 웹 콘솔로 다시 접속
2. 다음 명령어로 확인:
   ```bash
   cat ~/.ssh/authorized_keys
   ```
3. 공개키가 없거나 잘못되었다면 위의 명령어 다시 실행

### ❌ "Connection timeout"

**원인**: 방화벽 또는 네트워크 문제

**해결:**
1. DigitalOcean 대시보드에서 Droplet이 "Active" 상태인지 확인
2. Networking → Firewalls → Port 22 (SSH) 열려있는지 확인

### ❌ "Host key verification failed"

**해결:**
```bash
ssh-keygen -R 139.59.110.55
ssh root@139.59.110.55
```

---

## ✅ SSH 설정 완료 후

SSH 접속이 성공하면:

```bash
# 배포 스크립트 실행
./deploy.sh
```

또는 단계별 수동 배포:
```bash
# 1. Supabase 설정
./setup-env.sh

# 2. backend/.env 편집
nano backend/.env

# 3. 배포
./deploy.sh
```

---

## 📌 참고

- SSH 키는 안전하게 보관하세요 (~/.ssh/id_rsa)
- 공개키 (~/.ssh/id_rsa.pub)만 서버에 등록됩니다
- 비밀키는 절대 서버에 복사하지 마세요

---

## 다음 단계

SSH 접속이 완료되면:
1. [QUICKSTART.md](./QUICKSTART.md) - 빠른 배포 가이드
2. [DEPLOYMENT.md](./DEPLOYMENT.md) - 상세 배포 가이드
