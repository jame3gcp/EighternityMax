# 태블릿 접근 문제 해결 가이드

같은 PC에서는 접근되지만 태블릿에서는 접근이 안 되는 경우의 해결 방법입니다.

## 문제 원인

가장 가능성 높은 원인: **macOS 방화벽이 외부 접근을 차단**

## 해결 방법

### 방법 1: 방화벽에서 포트 허용 (권장)

1. **시스템 설정 열기**
   - Apple 메뉴 > 시스템 설정

2. **방화벽 설정으로 이동**
   - 네트워크 > 방화벽

3. **방화벽 옵션 열기**
   - "옵션..." 버튼 클릭
   - 관리자 비밀번호 입력

4. **들어오는 연결 허용**
   - ✅ "들어오는 연결 차단" 체크박스 **해제**
   - 또는
   - ✅ "자동으로 서명된 소프트웨어가 받는 들어오는 연결 허용" 체크

5. **특정 앱 허용 (더 안전한 방법)**
   - "+" 버튼 클릭
   - 다음 앱들을 추가:
     - `/usr/local/bin/node` (Node.js)
     - 또는 터미널 앱 (`/Applications/Utilities/Terminal.app`)
     - 또는 실행 중인 프로세스 선택

### 방법 2: 방화벽 임시 비활성화 (테스트용)

**⚠️ 개발 테스트용으로만 사용하세요!**

1. 시스템 설정 > 네트워크 > 방화벽
2. 방화벽 끄기
3. 태블릿에서 접근 테스트
4. 테스트 후 다시 켜기

### 방법 3: 터미널에서 방화벽 규칙 추가

```bash
# Node.js가 들어오는 연결을 허용
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node

# 또는 특정 포트 허용 (macOS 방화벽은 포트별 허용이 제한적)
```

## 추가 확인 사항

### 1. 같은 Wi-Fi 네트워크 확인

**PC에서:**
```bash
# 현재 연결된 Wi-Fi 이름 확인
networksetup -getairportnetwork en0
```

**태블릿에서:**
- Wi-Fi 설정에서 연결된 네트워크 이름 확인
- PC와 **정확히 같은 네트워크**여야 합니다

### 2. 네트워크 AP Isolation 확인

일부 라우터/공유기는 "AP Isolation" 또는 "Client Isolation" 기능으로 
기기 간 통신을 차단합니다.

**확인 방법:**
- 라우터 관리 페이지 접속
- 무선 설정에서 "AP Isolation" 또는 "Client Isolation" 확인
- 켜져 있으면 **끄기**

### 3. IP 주소 재확인

PC의 IP 주소가 변경되었을 수 있습니다:

```bash
# 현재 IP 확인
ipconfig getifaddr en0

# 또는
ifconfig en0 | grep "inet " | awk '{print $2}'
```

IP가 다르면 `.env.development` 파일을 업데이트하고 서버 재시작:

```bash
# frontend/.env.development
VITE_API_URL=http://[새로운IP]:3001
```

### 4. 태블릿에서 연결 테스트

태블릿의 브라우저에서:

1. **ping 테스트** (태블릿에 터미널 앱이 있다면):
   ```
   ping 172.30.29.44
   ```

2. **직접 접근 테스트**:
   ```
   http://172.30.29.44:5173
   ```

3. **에러 메시지 확인**:
   - "연결할 수 없음" → 방화벽 또는 네트워크 문제
   - "타임아웃" → 방화벽 문제 가능성 높음
   - "사이트에 연결할 수 없음" → 네트워크 또는 DNS 문제

## 단계별 해결 체크리스트

- [ ] **1단계**: 방화벽 설정 확인
  - 시스템 설정 > 네트워크 > 방화벽
  - "들어오는 연결 차단" 해제 또는 Node.js 앱 허용

- [ ] **2단계**: 같은 Wi-Fi 네트워크 확인
  - PC와 태블릿이 같은 Wi-Fi에 연결되어 있는지 확인

- [ ] **3단계**: IP 주소 재확인
  ```bash
  ipconfig getifaddr en0
  ```
  - `.env.development`의 IP와 일치하는지 확인

- [ ] **4단계**: 서버 재시작
  ```bash
  # 서버 종료 후 재시작
  kill $(lsof -ti:5173) 2>/dev/null
  kill $(lsof -ti:3001) 2>/dev/null
  cd frontend && npm run dev
  cd backend && npm run dev
  ```

- [ ] **5단계**: 서버 로그 확인
  - "Network: http://172.30.29.44:5173/" 메시지 확인

- [ ] **6단계**: 태블릿에서 접근 테스트
  - `http://172.30.29.44:5173`

## 빠른 테스트

터미널에서 다음 명령어로 진단:

```bash
cd /Users/wilhigh/EighternityMax
./test-connection.sh
```

## 공용 Wi-Fi 사용 시

**스타벅스 등 공용 Wi-Fi는 AP Isolation이 활성화되어 있어 기기 간 통신이 차단됩니다.**

해결 방법:
- ✅ **모바일 핫스팟 사용** (가장 권장)
- ✅ **ngrok 사용** (인터넷 터널링)

자세한 내용: `/docs/PUBLIC_WIFI_SOLUTION.md` 참고

## 여전히 안 되면

1. **라우터 설정 확인** (개인 네트워크인 경우)
   - AP Isolation/Client Isolation 끄기
   - 방화벽 규칙 확인

2. **다른 네트워크 테스트**
   - 모바일 핫스팟으로 테스트
   - 다른 Wi-Fi 네트워크에서 테스트

3. **포트 변경 테스트**
   - Vite 설정에서 포트를 5174로 변경
   - 방화벽이 특정 포트를 차단할 수 있음

4. **방화벽 로그 확인**
   ```bash
   # 방화벽 로그 확인 (관리자 권한 필요)
   sudo log show --predicate 'process == "socketfilterfw"' --last 1h
   ```
