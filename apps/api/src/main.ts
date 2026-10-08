import "./instrument";

import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService);

  // Limite JSON par défaut (100kb) trop basse pour l'import en masse de
  // produits (quelques milliers de lignes) ; 5mb reste raisonnable et ne
  // touche pas à `rawBody` (requis par la vérification de signature du
  // webhook CamPay).
  app.useBodyParser("json", { limit: "5mb" });

  // CSP désactivée : cette API ne sert pas de HTML applicatif (seule
  // exception, Swagger UI sur /api/docs, qu'une CSP par défaut casserait).
  // Les autres protections (X-Frame-Options, HSTS, X-Content-Type-Options...)
  // restent actives.
  app.use(helmet({ contentSecurityPolicy: false }));

  app.enableCors({
    origin: configService.get<string>("CORS_ORIGIN"),
    credentials: true,
  });

  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("UGE API")
    .setDescription("API de l'ERP + Copilote IA pour PME africaines")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  const port = configService.get<number>("PORT") ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(
    `API démarrée sur http://localhost:${port}/api (docs: /api/docs)`,
  );
}

bootstrap();
