import { NestFactory } from '@nestjs/core';
import { runDB } from './db';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ErrorExceptionFilter, HttpExceptionFilter } from './exception.filter';
import cookieParser from 'cookie-parser';

const port = process.env.PORT || 5000;

async function bootstrap() {
  await runDB();
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.useGlobalFilters(new ErrorExceptionFilter());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,

      exceptionFactory: (errorsMessages) => {
        const errorsForResponse = [];

        errorsMessages.forEach((e) => {
          const keys = Object.keys(e.constraints);
          keys.forEach((k) => {
            errorsForResponse.push({
              message: e.constraints[k],
              field: e.property,
            });
          });
        });

        throw new BadRequestException(
          errorsForResponse,
          //errorsMessages.map((e) => e.constraints),
        );
      },
    }),
  );

  await app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
}

bootstrap();
