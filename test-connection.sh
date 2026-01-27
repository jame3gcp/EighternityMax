#!/bin/bash

# 네트워크 연결 테스트 스크립트

echo "=== 네트워크 연결 진단 ==="
echo ""

# 현재 IP 주소 확인
echo "1. 현재 네트워크 IP 주소:"
CURRENT_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
if [ -z "$CURRENT_IP" ]; then
    echo "   ⚠️ IP 주소를 찾을 수 없습니다."
    echo "   수동으로 확인: ifconfig | grep 'inet ' | grep -v '127.0.0.1'"
else
    echo "   ✅ 현재 IP: $CURRENT_IP"
    echo ""
    echo "   .env.development 파일의 IP가 이것과 일치하는지 확인하세요!"
fi
echo ""

# 포트 바인딩 확인
echo "2. 포트 바인딩 상태:"
echo "   포트 5173:"
lsof -i :5173 2>/dev/null | grep LISTEN | head -1
echo ""
echo "   포트 3001:"
lsof -i :3001 2>/dev/null | grep LISTEN | head -1
echo ""

# 방화벽 상태
echo "3. 방화벽 상태:"
FW_STATE=$(/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null | grep "Firewall is")
if [ -z "$FW_STATE" ]; then
    echo "   ⚠️ 방화벽 상태 확인 불가"
else
    echo "   $FW_STATE"
    if echo "$FW_STATE" | grep -q "On"; then
        echo "   ⚠️ 방화벽이 켜져 있습니다. 포트를 허용해야 합니다."
    fi
fi
echo ""

echo "=== 태블릿에서 접근 불가 시 확인 사항 ==="
echo ""
echo "1. 같은 Wi-Fi 네트워크인지 확인:"
echo "   - PC와 태블릿이 같은 Wi-Fi에 연결되어 있어야 합니다"
echo "   - 공용 Wi-Fi나 게스트 네트워크는 기기 간 통신이 차단될 수 있습니다"
echo ""
echo "2. 방화벽에서 포트 허용:"
echo "   시스템 설정 > 네트워크 > 방화벽 > 옵션"
echo "   - '들어오는 연결 차단' 해제"
echo "   - 또는 Node.js/터미널 앱 추가"
echo ""
echo "3. 태블릿에서 ping 테스트:"
echo "   태블릿의 터미널 앱에서: ping $CURRENT_IP"
echo ""
echo "4. IP 주소 재확인:"
echo "   PC IP가 변경되었을 수 있습니다. 위의 현재 IP를 확인하세요."
