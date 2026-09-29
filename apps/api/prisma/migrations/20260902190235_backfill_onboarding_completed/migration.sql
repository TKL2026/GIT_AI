-- Backfill : les organisations existantes (créées avant l'onboarding
-- multi-écrans) sont marquées comme ayant déjà terminé l'onboarding, pour
-- qu'aucun compte existant (y compris le compte démo utilisé pour l'audit
-- externe) ne soit renvoyé dans l'assistant d'inscription à sa prochaine
-- connexion.
UPDATE "organizations"
SET "onboardingStep" = 'done',
    "onboardingCompletedAt" = "createdAt"
WHERE "onboardingCompletedAt" IS NULL;
