#!/bin/bash

echo "🔍 SSH 접속 테스트 중..."
echo ""

if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@139.59.110.55 "echo '✅ 접속 성공!'; hostname; uptime" 2>/dev/null; then
    echo ""
    echo "🎉 SSH 접속이 정상적으로 작동합니다!"
    echo ""
    echo "이제 배포를 시작할 수 있습니다:"
    echo "  ./deploy.sh"
    exit 0
else
    echo ""
    echo "❌ SSH 접속 실패"
    echo ""
    echo "다시 시도:"
    echo "1. DigitalOcean 웹 콘솔에서 키 추가 명령어 실행"
    echo "2. 몇 초 기다린 후 다시 테스트"
    echo ""
    exit 1
fi
