import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutTagController } from './workout-tag.controller';
import { WorkoutTagService } from './workout-tag.service';

describe('WorkoutTagController', () => {
  let controller: WorkoutTagController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkoutTagController],
      providers: [
        {
          provide: WorkoutTagService,
          useValue: {
            findAllForUser: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WorkoutTagController>(WorkoutTagController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
