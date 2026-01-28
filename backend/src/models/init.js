// Drizzle ORM을 사용하므로 초기화는 마이그레이션으로 처리됩니다.
// 데이터베이스 스키마는 `npm run db:push` 또는 Drizzle 마이그레이션으로 관리됩니다.
// 
// 마이그레이션 실행 방법:
// 1. `npm run db:push` - 스키마를 직접 푸시 (개발 환경)
// 2. 또는 Drizzle 마이그레이션 파일을 수동으로 실행

export const initDb = () => {
  // Drizzle ORM을 사용하므로 SQLite 스타일의 exec()는 사용하지 않습니다.
  // 스키마는 src/models/schema.js에 정의되어 있고,
  // 마이그레이션은 drizzle/ 디렉토리에 있습니다.
  // 
  // 데이터베이스 초기화가 필요한 경우:
  // npm run db:push
  console.log('ℹ️  Database schema is managed by Drizzle migrations.');
  console.log('ℹ️  Run "npm run db:push" to apply schema changes.');
};
