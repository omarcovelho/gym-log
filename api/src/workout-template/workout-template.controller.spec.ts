import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutTemplateController } from './workout-template.controller';
import { WorkoutTemplateService } from './workout-template.service';

describe('WorkoutTemplateController', () => {
  let controller: WorkoutTemplateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkoutTemplateController],
      providers: [WorkoutTemplateService],
    }).compile();

    controller = module.get<WorkoutTemplateController>(WorkoutTemplateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
