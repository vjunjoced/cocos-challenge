import type { INestApplication } from '@nestjs/common';
import compression from 'compression';
import helmet from 'helmet';

export function setupApp(app: INestApplication): void {
  app.use(helmet());
  app.use(compression());
  app.enableShutdownHooks();
}
