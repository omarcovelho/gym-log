import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutSessionService } from './workout-session.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('WorkoutSessionService', () => {
  let service: WorkoutSessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutSessionService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<WorkoutSessionService>(WorkoutSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
