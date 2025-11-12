import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ExerciseModule } from './exercise/exercise.module';
import { WorkoutTemplateModule } from './workout-template/workout-template.module';
import { WorkoutSessionModule } from './workout-session/workout-session.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
        isGlobal: true,
        envFilePath: ['.env.local', '.env'], // tenta .env.local primeiro, depois .env
    }),
    PrismaModule,
    AuthModule,
    ExerciseModule,
    WorkoutTemplateModule,
    WorkoutSessionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
