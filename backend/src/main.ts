import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: '*' });
  app.useStaticAssets(join(process.cwd(), 'public'), { prefix: '/' });
  await app.listen(process.env.PORT ?? 3001);
  console.log(`GovMind backend running on port ${process.env.PORT ?? 3001}`);
}
bootstrap();
