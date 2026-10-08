/**
 * Gestion des comptes PLATFORM_ADMIN (back-office /admin) en ligne de
 * commande — jamais via une route API publique, jamais de mot de passe en
 * dur dans le code. Même modèle d'exécution que prisma/seed.ts (PrismaClient
 * direct, hors du contexte NestJS).
 *
 * Usage :
 *   PLATFORM_ADMIN_EMAIL=moi@uge.pro PLATFORM_ADMIN_PASSWORD='...' \
 *   PLATFORM_ADMIN_FIRST_NAME=Prénom PLATFORM_ADMIN_LAST_NAME=Nom \
 *     npm run admin:create
 *
 *   npm run admin:list
 *
 *   PLATFORM_ADMIN_EMAIL=moi@uge.pro npm run admin:deactivate
 *   PLATFORM_ADMIN_EMAIL=moi@uge.pro npm run admin:reactivate
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const MIN_PASSWORD_LENGTH = 12;

async function create() {
  const email = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.PLATFORM_ADMIN_PASSWORD;
  const firstName = process.env.PLATFORM_ADMIN_FIRST_NAME?.trim();
  const lastName = process.env.PLATFORM_ADMIN_LAST_NAME?.trim();

  if (!email || !password || !firstName || !lastName) {
    console.error(
      'Variables requises manquantes : PLATFORM_ADMIN_EMAIL, PLATFORM_ADMIN_PASSWORD, ' +
        'PLATFORM_ADMIN_FIRST_NAME, PLATFORM_ADMIN_LAST_NAME.',
    );
    process.exit(1);
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
    process.exit(1);
  }

  const existing = await prisma.platformAdmin.findUnique({ where: { email } });
  if (existing) {
    console.error(`Un compte PLATFORM_ADMIN existe déjà pour ${email} (id=${existing.id}).`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.platformAdmin.create({
    data: { email, passwordHash, firstName, lastName },
  });

  // Jamais le mot de passe dans les logs — seulement la confirmation.
  console.log(`Compte PLATFORM_ADMIN créé : ${admin.email} (id=${admin.id}).`);
  console.log(`Connexion sur /admin/login avec l'email ci-dessus et le mot de passe fourni.`);
}

async function list() {
  const admins = await prisma.platformAdmin.findMany({ orderBy: { createdAt: 'asc' } });
  if (admins.length === 0) {
    console.log('Aucun compte PLATFORM_ADMIN.');
    return;
  }
  for (const admin of admins) {
    console.log(
      `${admin.isActive ? '[actif]  ' : '[inactif]'} ${admin.email} — ${admin.firstName} ${admin.lastName} ` +
        `(id=${admin.id}, créé le ${admin.createdAt.toISOString()}, ` +
        `dernière connexion : ${admin.lastLoginAt?.toISOString() ?? 'jamais'})`,
    );
  }
}

async function setActive(isActive: boolean) {
  const email = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.error('Variable requise manquante : PLATFORM_ADMIN_EMAIL.');
    process.exit(1);
  }

  const admin = await prisma.platformAdmin.findUnique({ where: { email } });
  if (!admin) {
    console.error(`Aucun compte PLATFORM_ADMIN pour ${email}.`);
    process.exit(1);
  }

  await prisma.platformAdmin.update({ where: { id: admin.id }, data: { isActive } });
  console.log(`Compte ${email} ${isActive ? 'réactivé' : 'désactivé'}.`);
}

async function main() {
  const command = process.argv[2];
  switch (command) {
    case 'create':
      return create();
    case 'list':
      return list();
    case 'deactivate':
      return setActive(false);
    case 'reactivate':
      return setActive(true);
    default:
      console.error('Commande inconnue. Utilisez : create | list | deactivate | reactivate.');
      process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
