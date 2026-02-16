-- 개인정보 수집·이용 동의 시각 컬럼 추가 (동의 전에는 서비스 메뉴 접근 불가)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "privacy_consent_at" timestamp;
