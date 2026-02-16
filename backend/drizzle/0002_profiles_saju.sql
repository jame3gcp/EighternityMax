-- 만세력/명리학 변환 결과 저장 (다른 기능 기본정보 활용)
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "saju" jsonb;
