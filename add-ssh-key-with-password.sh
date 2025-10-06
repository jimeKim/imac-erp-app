#!/bin/bash

# SSH 키를 비밀번호로 추가하는 스크립트

echo "🔑 SSH 키 추가 스크립트"
echo ""
echo "다음 명령어를 수동으로 실행해주세요:"
echo ""
echo "1. 터미널에서 SSH 접속 시도:"
echo "   ssh root@139.59.110.55"
echo ""
echo "2. 비밀번호 입력 (붙여넣기):"
echo "   097d4a97e96a21d70227f831e3"
echo ""
echo "3. 접속 성공 후 다음 명령어 실행:"
echo ""
cat << 'EOF'
mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMFik5RDANI/UFoZDeasKaP2XVIQKF4xz2CFoyaPnZ8L iloveume@naver.com" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo "✅ SSH 키 추가 완료!"
EOF
echo ""
echo "4. exit 입력하여 나가기"
echo ""
echo "5. 키 없이 재접속 테스트:"
echo "   ssh root@139.59.110.55"
echo ""
