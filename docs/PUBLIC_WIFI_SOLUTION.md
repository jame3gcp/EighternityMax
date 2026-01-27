# 공용 Wi-Fi 환경에서의 접근 문제 해결

## 문제 원인

**스타벅스 등 공용 Wi-Fi는 "AP Isolation" (또는 "Client Isolation") 기능이 활성화되어 있습니다.**

이 기능은 보안상의 이유로:
- 같은 Wi-Fi에 연결된 기기들 간의 직접 통신을 차단합니다
- PC에서 태블릿으로의 직접 접근이 불가능합니다
- 라우터 설정이므로 사용자가 직접 해제할 수 없습니다

## 해결 방법

### 방법 1: 모바일 핫스팟 사용 (가장 권장) ⭐

**가장 간단하고 확실한 방법입니다.**

1. **스마트폰의 모바일 핫스팟 활성화**
   - iPhone: 설정 > 개인용 핫스팟
   - Android: 설정 > 네트워크 > 핫스팟 및 테더링

2. **PC와 태블릿을 모두 핫스팟에 연결**
   - PC: Wi-Fi에서 핫스팟 선택
   - 태블릿: Wi-Fi에서 핫스팟 선택

3. **PC의 IP 주소 확인**
   ```bash
   # 핫스팟 연결 후 IP 확인
   ipconfig getifaddr en0
   # 또는
   ifconfig | grep "inet " | grep -v "127.0.0.1"
   ```

4. **환경 변수 업데이트**
   `frontend/.env.development` 파일에서:
   ```bash
   VITE_API_URL=http://[핫스팟에서의PCIP]:3001
   ```

5. **서버 재시작**
   ```bash
   kill $(lsof -ti:5173) 2>/dev/null
   kill $(lsof -ti:3001) 2>/dev/null
   cd frontend && npm run dev
   cd backend && npm run dev
   ```

6. **태블릿에서 접근**
   `http://[핫스팟에서의PCIP]:5173`

**장점:**
- ✅ 가장 확실한 방법
- ✅ 추가 설정 불필요
- ✅ 보안이 좋음 (개인 네트워크)

**단점:**
- ⚠️ 모바일 데이터 사용량 발생

---

### 방법 2: ngrok 사용 (인터넷 터널링)

**공용 Wi-Fi에서도 작동하는 방법입니다.**

1. **ngrok 설치**
   ```bash
   # Homebrew로 설치
   brew install ngrok
   
   # 또는 직접 다운로드
   # https://ngrok.com/download
   ```

2. **ngrok 계정 생성 및 인증**
   ```bash
   # ngrok.com에서 무료 계정 생성
   ngrok config add-authtoken [YOUR_AUTH_TOKEN]
   ```

3. **프론트엔드 터널 생성**
   ```bash
   ngrok http 5173
   ```
   
   출력 예시:
   ```
   Forwarding  https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:5173
   ```

4. **백엔드 터널 생성 (새 터미널)**
   ```bash
   ngrok http 3001
   ```
   
   출력 예시:
   ```
   Forwarding  https://yyyy-yy-yy-yy-yy.ngrok-free.app -> http://localhost:3001
   ```

5. **환경 변수 업데이트**
   `frontend/.env.development` 파일에서:
   ```bash
   VITE_API_URL=https://[백엔드ngrok주소]
   ```

6. **서버 재시작**
   ```bash
   cd frontend && npm run dev
   cd backend && npm run dev
   ```

7. **태블릿에서 접근**
   - 프론트엔드 ngrok 주소 사용: `https://xxxx-xx-xx-xx-xx.ngrok-free.app`

**장점:**
- ✅ 공용 Wi-Fi에서도 작동
- ✅ 인터넷 어디서나 접근 가능
- ✅ HTTPS 지원

**단점:**
- ⚠️ 무료 버전은 세션당 2시간 제한
- ⚠️ 무료 버전은 URL이 매번 변경됨
- ⚠️ 추가 설정 필요

---

### 방법 3: 다른 네트워크 사용

**개인 Wi-Fi 네트워크나 집/사무실 네트워크 사용**

- AP Isolation이 없는 개인 네트워크 사용
- 라우터 설정에서 AP Isolation 확인 및 해제

---

### 방법 4: USB 테더링 (Android 태블릿)

**Android 태블릿의 경우:**

1. USB로 PC에 태블릿 연결
2. 태블릿에서 USB 테더링 활성화
3. PC에서 USB 네트워크 인터페이스 확인
4. 태블릿은 USB로 연결되어 있으므로 PC와 같은 네트워크

---

## 추천 방법 비교

| 방법 | 난이도 | 비용 | 안정성 | 추천도 |
|------|--------|------|--------|--------|
| 모바일 핫스팟 | ⭐ 쉬움 | 데이터 사용 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| ngrok | ⭐⭐ 보통 | 무료/유료 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 다른 네트워크 | ⭐ 쉬움 | 무료 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| USB 테더링 | ⭐⭐ 보통 | 무료 | ⭐⭐⭐⭐ | ⭐⭐⭐ |

## 빠른 해결 (모바일 핫스팟)

**가장 빠르고 확실한 방법:**

1. **스마트폰 핫스팟 켜기**
2. **PC와 태블릿을 핫스팟에 연결**
3. **PC IP 확인:**
   ```bash
   ipconfig getifaddr en0
   ```
4. **환경 변수 업데이트:**
   ```bash
   # frontend/.env.development
   VITE_API_URL=http://[핫스팟IP]:3001
   ```
5. **서버 재시작**
6. **태블릿에서 접근:**
   `http://[핫스팟IP]:5173`

## ngrok 빠른 시작

```bash
# 1. ngrok 설치 (이미 설치되어 있다면 생략)
brew install ngrok

# 2. ngrok 계정 생성 및 인증
# https://ngrok.com 에서 가입 후
ngrok config add-authtoken [토큰]

# 3. 프론트엔드 터널 (터미널 1)
ngrok http 5173

# 4. 백엔드 터널 (터미널 2)
ngrok http 3001

# 5. 환경 변수 업데이트
# frontend/.env.development
# VITE_API_URL=https://[백엔드ngrok주소]

# 6. 서버 재시작
```

## 주의사항

⚠️ **공용 Wi-Fi의 AP Isolation은 보안 기능이므로 해제할 수 없습니다.**

- 라우터 관리자 권한이 필요
- 공용 Wi-Fi 제공자가 설정한 것
- 사용자가 직접 변경 불가능

따라서 **모바일 핫스팟** 또는 **ngrok** 같은 대안을 사용해야 합니다.
