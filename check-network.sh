#!/bin/bash

# 네트워크 접근 확인 스크립트

echo "=== 네트워크 설정 확인 ==="
echo ""

# 현재 IP 주소 확인
echo "1. 현재 IP 주소:"
ifconfig | grep -A 1 "inet " | grep -v "127.0.0.1" | grep "inet " | awk '{print $2}' | head -3
echo ""

# 포트 사용 확인
echo "2. 포트 5173 사용 중인 프로세스:"
lsof -ti:5173 2>/dev/null && echo "✅ 포트 5173 사용 중" || echo "❌ 포트 5173 사용 안 함"
echo ""

echo "3. 포트 3001 사용 중인 프로세스:"
lsof -ti:3001 2>/dev/null && echo "✅ 포트 3001 사용 중" || echo "❌ 포트 3001 사용 안 함"
echo ""

# 방화벽 상태 확인
echo "4. 방화벽 상태:"
/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null || echo "방화벽 상태 확인 불가"
echo ""

echo "=== 서버 재시작 필요 ==="
echo ""
echo "설정 변경 후 서버를 재시작하세요:"
echo ""
echo "1. 기존 서버 종료:"
echo "   kill \$(lsof -ti:5173)"
echo "   kill \$(lsof -ti:3001)"
echo ""
echo "2. 새로 시작:"
echo "   cd frontend && npm run dev"
echo "   cd backend && npm run dev"
echo ""
echo "3. 서버 로그에서 다음 메시지 확인:"
echo "   Network: http://172.30.29.44:5173/"
echo ""
