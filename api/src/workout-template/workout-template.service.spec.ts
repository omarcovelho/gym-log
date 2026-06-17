import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutTemplateService } from './workout-template.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('WorkoutTemplateService', () => {
  let service: WorkoutTemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutTemplateService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<WorkoutTemplateService>(WorkoutTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
