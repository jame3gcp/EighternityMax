import { db } from '../models/db.js';
import { users, profiles, lifeProfiles, jobs, records, refreshTokens, sajuAnalyses } from '../models/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { ApiError } from '../middleware/error.js';
import { solarToSaju, lunarToSaju, getSeunSinsalByYear, getDaeunSinsalByGapja } from '../services/saju.js';
import { computeSajuSignature } from '../services/sajuSignature.js';
import { analyzeSajuWithChatGPT } from '../services/chatgptSajuAnalyzer.js';
import { isOpenAIAvailable } from '../services/openaiClient.js';
import { config } from '../config/index.js';

export const userController = {
  async getInternalUserId(supabaseId) {
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.providerUserId, supabaseId)
    });
    return user ? user.id : null;
  },

  /** Supabase 유저가 우리 users 테이블에 없으면 생성 후 internal id 반환 (OAuth 콜백을 거치지 않은 요청 대응) */
  async ensureUserFromSupabase(supabaseUser) {
    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.providerUserId, supabaseUser.id)
    });
    if (existing) return existing.id;
    const provider = supabaseUser.app_metadata?.provider || 'google';
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db.insert(users).values({
      id,
      provider,
      providerUserId: supabaseUser.id,
      email: supabaseUser.email ?? null,
      displayName: supabaseUser.user_metadata?.full_name || `${provider} 사용자`,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    });
    return id;
  },

  async getMe(req, res, next) {
    try {
      const internalId = await userController.getInternalUserId(req.supabaseId);
      if (!internalId) throw new ApiError(404, 'User not found');
      
      const user = await db.query.users.findFirst({ where: eq(users.id, internalId) });
      if (!user) throw new ApiError(404, 'User not found');
      res.json({
        ...user,
        privacy_consent_given: !!user.privacyConsentAt,
      });
    } catch (error) {
      next(error);
    }
  },

  /** 프로필 조회 (생년월일·성별·saju 등 개인정보 포함) */
  async getProfile(req, res, next) {
    try {
      const internalId = await userController.getInternalUserId(req.supabaseId);
      if (!internalId) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[getProfile] User not found. Token may be for a user not in DB (e.g. OAuth callback not run).');
        }
        throw new ApiError(404, 'User not found');
      }

      const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, internalId) });
      if (!profile) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[getProfile] Profile not found for user. Save may have failed or profile not yet created.');
        }
        throw new ApiError(404, 'Profile not found');
      }

      // 저장된 saju 대신 항상 현재 계산식으로 재계산 (시주 등 수정 반영, 참조 만세력과 일치)
      let saju = profile.saju ?? null;
      if (profile.birthDate && profile.gender) {
        const calendarType = profile.saju?.calendarType ?? 'solar';
        const isIntercalation = !!profile.saju?.isIntercalation;
        const recalc = calendarType === 'lunar'
          ? lunarToSaju(profile.birthDate, isIntercalation, profile.birthTime ?? undefined, profile.gender)
          : solarToSaju(profile.birthDate, profile.birthTime ?? undefined, profile.gender);
        if (recalc) {
          recalc.calendarType = calendarType;
          recalc.isIntercalation = isIntercalation;
          saju = recalc;
        }
      }

      // 대운(大运) 신살 보정: 저장된 구 saju는 천간십성 기준이라 대부분 null. 응답 시 지지 기준으로 채움.
      if (saju?.daeun?.steps?.length) {
        for (const s of saju.daeun.steps) {
          if (s.gapja && (s.sinsal == null || s.sinsal === '')) {
            s.sinsal = getDaeunSinsalByGapja(s.gapja);
          }
        }
      }

      // 세운(년운) 신살 보정: 저장된 구 saju는 천간십성 기준이라 대부분 null. 응답 시 지지 기준으로 채움.
      if (saju?.seun?.length) {
        for (const s of saju.seun) {
          if (s.year != null && (s.sinsal == null || s.sinsal === '')) {
            s.sinsal = getSeunSinsalByYear(s.year);
          }
        }
      }

      res.json({
        profileId: profile.id,
        userId: profile.userId,
        birthDate: profile.birthDate,
        birthTime: profile.birthTime ?? null,
        gender: profile.gender,
        region: profile.region ?? null,
        saju,
        createdAt: profile.createdAt?.getTime?.() ?? profile.createdAt,
        updatedAt: profile.updatedAt?.getTime?.() ?? profile.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  },

  /** 개인정보 수집·이용 동의 저장. 동의 후에만 서비스 메뉴 접근 가능 */
  async saveConsent(req, res, next) {
    try {
      const internalId = await userController.getInternalUserId(req.supabaseId);
      if (!internalId) throw new ApiError(404, 'User not found');

      await db.update(users)
        .set({ privacyConsentAt: new Date() })
        .where(eq(users.id, internalId));

      res.json({
        success: true,
        privacy_consent_given: true,
      });
    } catch (error) {
      next(error);
    }
  },

  async saveProfile(req, res, next) {
    try {
      const { birth_date, birth_time, gender, region, calendar_type = 'solar', is_intercalation } = req.body;
      const internalId = await userController.getInternalUserId(req.supabaseId);
      if (!internalId) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[saveProfile] User not found for supabaseId (providerUserId). Ensure OAuth callback created the user.');
        }
        throw new ApiError(404, 'User not found');
      }

      if (!birth_date || !gender) {
        throw new ApiError(400, 'birth_date and gender are required');
      }

      let saju;
      let canonicalBirthDate = birth_date;

      if (calendar_type === 'lunar') {
        saju = lunarToSaju(birth_date, !!is_intercalation, birth_time || undefined, gender);
        if (saju?.solar) {
          const { year, month, day } = saju.solar;
          canonicalBirthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      } else {
        saju = solarToSaju(birth_date, birth_time || undefined, gender);
      }
      // 가입 시 입력한 양력/음력 정보를 saju에 포함 (프로필 표시용)
      if (saju) {
        saju.calendarType = calendar_type;
        saju.isIntercalation = !!is_intercalation;
      }

      let profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, internalId) });

      if (profile) {
        await db.update(profiles)
          .set({
            birthDate: canonicalBirthDate,
            birthTime: birth_time || null,
            gender,
            region: region || null,
            saju: saju || undefined,
            updatedAt: new Date(),
          })
          .where(eq(profiles.userId, internalId));
      } else {
        const profileId = `profile-${Date.now()}`;
        await db.insert(profiles).values({
          id: profileId,
          userId: internalId,
          birthDate: canonicalBirthDate,
          birthTime: birth_time || null,
          gender,
          region: region || null,
          saju: saju || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        profile = { id: profileId };
      }

      // 저장 직후 조회하여 응답에 프로필 포함 (가입 시 입력 데이터 확인 및 프론트 표시용)
      const saved = await db.query.profiles.findFirst({ where: eq(profiles.userId, internalId) });
      if (process.env.NODE_ENV !== 'production' && saved) {
        console.log('[saveProfile] OK profile_id=', saved.id, 'userId=', internalId);
      }

      let sajuAnalysisId = null;
      let sajuAnalysisStatus = 'skipped';

      if (saved?.saju) {
        const signature = computeSajuSignature(saved.saju, {
          birthDate: saved.birthDate,
          birthTime: saved.birthTime ?? undefined,
          gender: saved.gender,
          calendarType: saved.saju.calendarType || calendar_type,
          isIntercalation: !!saved.saju.isIntercalation,
        });

        const existing = await db.query.sajuAnalyses.findFirst({
          where: and(
            eq(sajuAnalyses.profileId, saved.id),
            eq(sajuAnalyses.sajuSignature, signature)
          ),
        });

        if (existing) {
          sajuAnalysisId = existing.id;
          sajuAnalysisStatus = existing.status;
        } else if (isOpenAIAvailable()) {
          const analysisId = `saju-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          await db.insert(sajuAnalyses).values({
            id: analysisId,
            userId: internalId,
            profileId: saved.id,
            sajuSignature: signature,
            inputSaju: saved.saju,
            analysis: null,
            model: null,
            promptVersion: config.openaiPromptVersion || '1',
            status: 'queued',
            errorMessage: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          sajuAnalysisId = analysisId;
          sajuAnalysisStatus = 'queued';

          setImmediate(async () => {
            try {
              const result = await analyzeSajuWithChatGPT(saved.saju);
              if (result) {
                await db.update(sajuAnalyses)
                  .set({
                    analysis: result.analysis,
                    model: result.model,
                    status: 'done',
                    errorMessage: null,
                    updatedAt: new Date(),
                  })
                  .where(eq(sajuAnalyses.id, analysisId));
              } else {
                await db.update(sajuAnalyses)
                  .set({
                    status: 'failed',
                    errorMessage: 'OpenAI 분석 실패 또는 파싱 오류',
                    updatedAt: new Date(),
                  })
                  .where(eq(sajuAnalyses.id, analysisId));
              }
            } catch (err) {
              if (process.env.NODE_ENV !== 'production') {
                console.warn('[saveProfile] Saju analysis job failed:', err.message);
              }
              await db.update(sajuAnalyses)
                .set({
                  status: 'failed',
                  errorMessage: err.message || 'Unknown error',
                  updatedAt: new Date(),
                })
                .where(eq(sajuAnalyses.id, analysisId));
            }
          });
        }
      }

      res.json({
        profile_id: profile.id,
        status: 'saved',
        next_step: 'generate_life_profile',
        saju_analysis_id: sajuAnalysisId,
        saju_analysis_status: sajuAnalysisStatus,
        profile: saved
          ? {
              profileId: saved.id,
              userId: saved.userId,
              birthDate: saved.birthDate,
              birthTime: saved.birthTime ?? null,
              gender: saved.gender,
              region: saved.region ?? null,
              saju: saved.saju ?? null,
            }
          : undefined,
      });
    } catch (error) {
      next(error);
    }
  },

  /** 사주 분석 조회 (현재 프로필 기준 최신 1건). 다른 메뉴에서 재사용용 */
  async getSajuAnalysis(req, res, next) {
    try {
      const internalId = await userController.getInternalUserId(req.supabaseId);
      if (!internalId) throw new ApiError(404, 'User not found');

      const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, internalId) });
      if (!profile) throw new ApiError(404, 'Profile not found');

      const rows = await db.query.sajuAnalyses.findMany({
        where: eq(sajuAnalyses.profileId, profile.id),
        orderBy: [desc(sajuAnalyses.updatedAt)],
        limit: 1,
      });
      const row = rows[0];
      if (!row) {
        return res.status(200).json({
          status: 'not_found',
          message: '사주 분석이 없습니다. 프로필을 저장하면 자동 생성됩니다.',
        });
      }

      res.json({
        id: row.id,
        status: row.status,
        analysis: row.status === 'done' ? row.analysis : undefined,
        error_message: row.errorMessage ?? undefined,
        updated_at: row.updatedAt?.getTime?.() ?? row.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  },

  /** 저장된 프로필의 사주로 OpenAI 사주 분석 생성 (버튼 클릭 시 호출) */
  async generateSajuAnalysis(req, res, next) {
    try {
      const internalId = await userController.getInternalUserId(req.supabaseId);
      if (!internalId) throw new ApiError(404, 'User not found');

      const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, internalId) });
      if (!profile) throw new ApiError(404, 'Profile not found');
      if (!profile.saju) {
        throw new ApiError(400, '사주 정보가 없습니다. 프로필에 생년월일·출생시간 등이 저장되어 있는지 확인해 주세요.');
      }
      if (!isOpenAIAvailable()) {
        throw new ApiError(503, 'OpenAI 설정이 되어 있지 않습니다.');
      }

      const signature = computeSajuSignature(profile.saju, {
        birthDate: profile.birthDate,
        birthTime: profile.birthTime ?? undefined,
        gender: profile.gender,
        calendarType: profile.saju.calendarType || 'solar',
        isIntercalation: !!profile.saju.isIntercalation,
      });

      const existing = await db.query.sajuAnalyses.findFirst({
        where: and(
          eq(sajuAnalyses.profileId, profile.id),
          eq(sajuAnalyses.sajuSignature, signature)
        ),
      });

      if (existing) {
        return res.status(200).json({ id: existing.id, status: existing.status });
      }

      const analysisId = `saju-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      await db.insert(sajuAnalyses).values({
        id: analysisId,
        userId: internalId,
        profileId: profile.id,
        sajuSignature: signature,
        inputSaju: profile.saju,
        analysis: null,
        model: null,
        promptVersion: config.openaiPromptVersion || '1',
        status: 'queued',
        errorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setImmediate(async () => {
        try {
          const result = await analyzeSajuWithChatGPT(profile.saju);
          if (result) {
            await db.update(sajuAnalyses)
              .set({
                analysis: result.analysis,
                model: result.model,
                status: 'done',
                errorMessage: null,
                updatedAt: new Date(),
              })
              .where(eq(sajuAnalyses.id, analysisId));
          } else {
            await db.update(sajuAnalyses)
              .set({
                status: 'failed',
                errorMessage: 'OpenAI 분석 실패 또는 파싱 오류',
                updatedAt: new Date(),
              })
              .where(eq(sajuAnalyses.id, analysisId));
          }
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[generateSajuAnalysis] job failed:', err.message);
          }
          await db.update(sajuAnalyses)
            .set({
              status: 'failed',
              errorMessage: err.message || 'Unknown error',
              updatedAt: new Date(),
            })
            .where(eq(sajuAnalyses.id, analysisId));
        }
      });

      return res.status(201).json({ id: analysisId, status: 'queued' });
    } catch (error) {
      next(error);
    }
  },

  async deleteAccount(req, res, next) {
    try {
      const internalId = await userController.getInternalUserId(req.supabaseId);
      if (!internalId) throw new ApiError(404, 'User not found');

      // 트랜잭션으로 모든 관련 데이터 삭제
      await db.transaction(async (tx) => {
        // 1. Refresh tokens 삭제
        await tx.delete(refreshTokens).where(eq(refreshTokens.userId, internalId));

        // 2. Records 삭제
        await tx.delete(records).where(eq(records.userId, internalId));

        // 3. Jobs 삭제
        await tx.delete(jobs).where(eq(jobs.userId, internalId));

        // 4. Life Profile 삭제 (CASCADE로 자동 삭제되지만 명시적으로)
        await tx.delete(lifeProfiles).where(eq(lifeProfiles.userId, internalId));

        // 5. Profile 삭제 (CASCADE로 자동 삭제되지만 명시적으로)
        await tx.delete(profiles).where(eq(profiles.userId, internalId));

        // 6. User 삭제 (마지막에 삭제 - CASCADE로 나머지도 정리)
        await tx.delete(users).where(eq(users.id, internalId));
      });

      res.json({
        success: true,
        message: '계정이 삭제되었습니다',
      });
    } catch (error) {
      next(error);
    }
  }
};
