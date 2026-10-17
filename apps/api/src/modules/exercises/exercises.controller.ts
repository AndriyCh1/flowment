import { Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ErrorResponseDto } from '../../shared/http';
import { ProjectDto } from '../projects';
import { ExerciseDto, ExerciseListDto } from './exercises.dto';
import { ExercisesService } from './exercises.service';

@ApiTags('exercises')
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercises: ExercisesService) {}

  @Get()
  @ApiOperation({ operationId: 'listExercises' })
  @ZodResponse({ type: ExerciseListDto })
  listExercises() {
    return this.exercises.listExercises();
  }

  @Get(':exerciseId')
  @ApiOperation({ operationId: 'getExercise' })
  @ZodResponse({ type: ExerciseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  getExercise(@Param('exerciseId') exerciseId: string) {
    return this.exercises.getExercise(exerciseId);
  }

  @Post(':exerciseId/start')
  @ApiOperation({ operationId: 'startExercise' })
  @ZodResponse({ status: HttpStatus.CREATED, type: ProjectDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  startExercise(@Param('exerciseId') exerciseId: string) {
    return this.exercises.startExercise(exerciseId);
  }
}
