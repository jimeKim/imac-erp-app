# 🆘 DigitalOcean 서버 접속 복구 가이드

## 현재 상황

웹 콘솔 접속 시 "All configured authentication methods failed" 에러 발생

**원인**: 서버가 publickey 인증만 허용하고 있으며, 등록된 키가 로컬과 다름

---

## ✅ 해결 방법 1: 비밀번호 리셋 (권장 ⭐)

### Step 1: 비밀번호 리셋

1. **DigitalOcean Droplet 페이지 접속**
   - https://cloud.digitalocean.com/droplets/518886670

2. **Access 탭 클릭**
   - 좌측 메뉴 또는 상단 탭에서 "Access" 선택

3. **Reset Root Password**
   - "Reset Root Password" 버튼 클릭
   - 확인 팝업에서 "Reset Root Password" 다시 클릭

4. **이메일 확인**
   - DigitalOcean 계정 이메일에서 새 비밀번호 확인
   - 비밀번호 복사

### Step 2: Recovery Console 접속

1. **Droplet 페이지로 돌아가기**

2. **Access 탭에서 "Launch Recovery Console"**
   - 또는 "Console" → "Launch Droplet Console"

3. **로그인**
   - login: `root`
   - password: 이메일에서 받은 새 비밀번호 붙여넣기
   - (비밀번호는 화면에 표시되지 않음 - 정상)

### Step 3: SSH 키 추가

로그인 성공 후 다음 명령어 실행:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMFik5RDANI/UFoZDeasKaP2XVIQKF4xz2CFoyaPnZ8L iloveume@naver.com" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo "✅ 완료!"
```

### Step 4: 로컬에서 접속 테스트

```bash
ssh root@139.59.110.55
```

성공하면 배포 시작! 🎉

---

## ✅ 해결 방법 2: Recovery Mode (고급)

### Step 1: Recovery Mode로 부팅

1. **Droplet 페이지** → **Power 탭**

2. **Power Off**
   - "Power Off" 버튼 클릭
   - 완전히 종료될 때까지 대기 (30초~1분)

3. **Boot from Recovery ISO**
   - "Boot from Recovery ISO" 버튼 클릭

4. **Recovery Console 접속**
   - "Launch Recovery Console" 버튼 클릭

### Step 2: 파일시스템 마운트

```bash
# 파티션 확인
fdisk -l

# 메인 파티션 마운트 (보통 /dev/vda1 또는 /dev/sda1)
mount /dev/vda1 /mnt

# SSH 키 추가
mkdir -p /mnt/root/.ssh
chmod 700 /mnt/root/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMFik5RDANI/UFoZDeasKaP2XVIQKF4xz2CFoyaPnZ8L iloveume@naver.com" >> /mnt/root/.ssh/authorized_keys
chmod 600 /mnt/root/.ssh/authorized_keys

# 언마운트
umount /mnt

# 재부팅
reboot
```

### Step 3: 정상 부팅 대기

Power 탭에서 "Power On" 클릭 (자동으로 될 수도 있음)

### Step 4: 접속 테스트

```bash
ssh root@139.59.110.55
```

---

## ✅ 해결 방법 3: ssh-copy-id 사용 (비밀번호 알 때만)

만약 root 비밀번호를 알고 계신다면:

```bash
# 비밀번호 인증 활성화 필요
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@139.59.110.55
```

**주의**: 현재 서버는 비밀번호 인증이 비활성화되어 있어 작동하지 않습니다.

---

## ✅ 해결 방법 4: 새 Droplet 생성

### 중요한 데이터가 없는 경우

1. **현재 Droplet Snapshot 생성** (선택사항)
   - Droplet 페이지 → Snapshots 탭
   - "Take Snapshot" 버튼

2. **새 Droplet 생성**
   - Choose Image → Ubuntu 22.04
   - Add SSH Keys → 체크박스에서 키 선택 또는 "New SSH Key" 추가
   - Create Droplet

3. **새 IP로 배포**
   - `deploy.sh`에서 SERVER_IP 변경
   - 배포 진행

---

## 🎯 가장 빠른 방법 요약

1. ✅ **비밀번호 리셋** (5분)
   - Reset Root Password
   - Recovery Console 접속
   - SSH 키 추가
   - 접속 테스트

2. ✅ **Recovery Mode** (10분)
   - 고급 사용자용
   - 파일시스템 직접 수정

3. ✅ **새 Droplet** (15분)
   - 처음부터 다시 시작
   - 가장 깨끗한 방법

---

## 💡 팁

### 비밀번호 리셋 후에도 웹 콘솔이 안 되는 경우

1. **몇 분 기다리기**
   - 비밀번호 리셋 후 1-2분 대기

2. **브라우저 새로고침**
   - Ctrl + Shift + R (강력 새로고침)

3. **다른 브라우저 시도**
   - Chrome → Firefox 또는 반대로

4. **Recovery Console 사용**
   - 일반 Console 대신 Recovery Console 사용

---

## 📞 DigitalOcean 지원

모든 방법이 실패하면:
- https://www.digitalocean.com/support
- 티켓 생성: "Cannot access Droplet console"

---

## ✅ 성공 후 다음 단계

SSH 접속이 성공하면:

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

문제가 해결되지 않으면 알려주세요! 🚀
