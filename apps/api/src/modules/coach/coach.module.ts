import { Module } from '@nestjs/common';
import { ExercisesModule } from '../exercises';
import { ProjectsModule } from '../projects';
import { COACH_AI_PROVIDER } from './coach-ai-provider';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';
import { PromptCoachAiProvider } from './prompt-coach-ai-provider';

@Module({
  imports: [ProjectsModule, ExercisesModule],
  controllers: [CoachController],
  providers: [
    CoachService,
    { provide: COACH_AI_PROVIDER, useClass: PromptCoachAiProvider },
  ],
})
export class CoachModule {}
