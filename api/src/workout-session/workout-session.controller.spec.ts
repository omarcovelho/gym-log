import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutSessionController } from './workout-session.controller';
import { WorkoutSessionService } from './workout-session.service';

describe('WorkoutSessionController', () => {
  let controller: WorkoutSessionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkoutSessionController],
      providers: [WorkoutSessionService],
    }).compile();

    controller = module.get<WorkoutSessionController>(WorkoutSessionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
