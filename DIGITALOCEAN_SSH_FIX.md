# DigitalOcean SSH 접속 문제 최종 해결 가이드

## 현재 상황
- 서버가 publickey 인증만 허용
- 비밀번호 인증 비활성화됨
- 웹 콘솔 접속 불가

## ✅ 해결 방법 (순서대로 시도)

---

## 방법 1: DigitalOcean에 SSH 키 등록 + Droplet 재빌드

### Step 1: SSH 키를 DigitalOcean에 등록

1. **DigitalOcean 대시보드 접속**
   - https://cloud.digitalocean.com/account/security

2. **SSH Keys 섹션으로 이동**
   - 좌측 메뉴 → Settings → Security → SSH Keys

3. **Add SSH Key 클릭**

4. **다음 공개키 붙여넣기**
   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMFik5RDANI/UFoZDeasKaP2XVIQKF4xz2CFoyaPnZ8L iloveume@naver.com
   ```

5. **Name 입력**
   - 예: `ERP-MacBook-2024`

6. **Add SSH Key 클릭**

### Step 2: Droplet에 키 주입 (중요!)

기존 Droplet에는 자동으로 추가되지 않으므로 다음 중 하나 선택:

#### Option A: Rebuild Droplet (데이터 삭제됨!)

⚠️ **경고**: 모든 데이터가 삭제됩니다!

1. Droplet 페이지 → **Destroy** 탭
2. **Rebuild Droplet** 선택
3. 이미지: Ubuntu 22.04
4. **SSH Keys**: 방금 추가한 키 체크
5. Rebuild 실행

#### Option B: Recovery Mode로 키 추가 (권장)

1. **Droplet Power Off**
   - Droplet 페이지 → Power → Power Off
   - 완전히 꺼질 때까지 대기 (1분)

2. **Recovery ISO로 부팅**
   - Power → **Boot from Recovery ISO**

3. **Recovery Console 접속**
   - Access → Launch Recovery Console
   - 비밀번호: `097d4a97e96a21d70227f831e3`

4. **파일시스템 마운트**
   ```bash
   # 파티션 확인
   lsblk
   
   # 메인 디스크 마운트 (보통 vda1 또는 sda1)
   mount /dev/vda1 /mnt
   
   # 확인
   ls /mnt/root
   ```

5. **SSH 키 추가**
   ```bash
   mkdir -p /mnt/root/.ssh
   chmod 700 /mnt/root/.ssh
   echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMFik5RDANI/UFoZDeasKaP2XVIQKF4xz2CFoyaPnZ8L iloveume@naver.com" >> /mnt/root/.ssh/authorized_keys
   chmod 600 /mnt/root/.ssh/authorized_keys
   
   # 확인
   cat /mnt/root/.ssh/authorized_keys
   ```

6. **언마운트 및 재부팅**
   ```bash
   umount /mnt
   sync
   reboot
   ```

7. **정상 부팅 대기**
   - Droplet 페이지 → Power → Power On (자동일 수도 있음)

8. **로컬에서 접속 테스트**
   ```bash
   ssh root@139.59.110.55
   ```

---

## 방법 2: 새 Droplet 생성 (가장 깨끗한 방법)

### 기존 데이터가 없거나 중요하지 않은 경우

1. **현재 Droplet 스냅샷 생성** (선택사항)
   - Droplet 페이지 → Snapshots → Take Snapshot

2. **새 Droplet 생성**
   - Create → Droplets
   - Choose Image: Ubuntu 22.04 LTS
   - Size: 원하는 크기 (최소 $6/월)
   - Datacenter: Singapore (가장 가까움)
   - **Authentication**: SSH keys 선택
   - ✅ **ERP-MacBook-2024** 키 체크박스 선택
   - Create Droplet

3. **새 IP 확인**
   - 생성 완료 후 새 IP 주소 확인

4. **배포 스크립트 업데이트**
   ```bash
   # deploy.sh 파일에서 IP 변경
   nano deploy.sh
   # SERVER_IP="새로운IP"
   ```

5. **SSH 접속 테스트**
   ```bash
   ssh root@새로운IP
   ```

6. **배포 진행**
   ```bash
   ./deploy.sh
   ```

---

## 방법 3: DigitalOcean API 사용 (고급)

DigitalOcean API를 통해 SSH 키를 Droplet에 주입할 수 있습니다.

### 준비물
- DigitalOcean Personal Access Token

### 실행
```bash
# 토큰 설정
export DO_TOKEN="your-token-here"

# SSH 키 ID 확인
curl -X GET \
  -H "Authorization: Bearer $DO_TOKEN" \
  "https://api.digitalocean.com/v2/account/keys"

# Droplet ID: 518886670
# 키를 Droplet에 추가 (API로는 직접 불가능)
```

**참고**: API로는 기존 Droplet에 SSH 키를 직접 추가할 수 없습니다.  
Rebuild 또는 새 Droplet 생성만 가능합니다.

---

## 🎯 가장 빠른 방법 요약

| 방법 | 시간 | 데이터 손실 | 난이도 |
|------|------|------------|--------|
| **Recovery Mode** | 10분 | ❌ 없음 | ⭐⭐⭐ 중 |
| **새 Droplet** | 5분 | ✅ 있음 | ⭐ 쉬움 |
| **Rebuild** | 5분 | ✅ 있음 | ⭐ 쉬움 |

### 추천: Recovery Mode (방법 1 - Option B)

데이터가 손실되지 않고, SSH 키를 추가할 수 있습니다.

---

## ✅ 성공 확인

SSH 키 추가 후:

```bash
ssh root@139.59.110.55
```

성공하면:
```bash
Welcome to Ubuntu 22.04.x LTS...
root@erp-server-1:~#
```

---

## 🚀 성공 후 다음 단계

```bash
# 1. 환경 설정
./setup-env.sh

# 2. Supabase 정보 입력
nano backend/.env

# 3. 배포 실행
./deploy.sh

# 4. 상태 확인
./server-status.sh
```

---

## 💡 Prevention (재발 방지)

앞으로 이런 문제를 방지하려면:

1. **DigitalOcean에 SSH 키 미리 등록**
   - 새 Droplet 생성 시 자동으로 추가됨

2. **비밀번호 인증 활성화** (선택사항)
   ```bash
   # /etc/ssh/sshd_config
   PasswordAuthentication yes
   
   # 재시작
   systemctl restart sshd
   ```
   
   ⚠️ **보안 주의**: 비밀번호 인증은 brute-force 공격에 취약

3. **여러 SSH 키 등록**
   - 백업 키를 추가로 등록

---

## 문의

문제가 계속되면:
- DigitalOcean Support: https://www.digitalocean.com/support
- 티켓 제목: "Cannot access Droplet via SSH or Console"
