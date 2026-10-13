import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ErrorResponseDto } from '../../shared/http';
import {
  CoachNextDto,
  CoachReplyDto,
  CoachSessionDto,
  UpdateModelingIntentDto,
} from './coach.dto';
import { CoachService } from './coach.service';

@ApiTags('coach')
@Controller('projects/:projectId/coach')
export class CoachController {
  constructor(private readonly coach: CoachService) {}

  @Get()
  @ApiOperation({ operationId: 'getCoachSession' })
  @ZodResponse({ type: CoachSessionDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  get(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.coach.get(projectId);
  }

  @Put('intent')
  @ApiOperation({ operationId: 'updateModelingIntent' })
  @ZodResponse({ type: CoachSessionDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  setIntent(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() body: UpdateModelingIntentDto,
  ) {
    return this.coach.setIntent(projectId, body.modelingIntent);
  }

  @Post('next')
  @ApiOperation({ operationId: 'requestCoachResponse' })
  @ZodResponse({ status: HttpStatus.OK, type: CoachSessionDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  @ApiServiceUnavailableResponse({ type: ErrorResponseDto })
  next(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() body: CoachNextDto,
  ) {
    return this.coach.next(projectId, body);
  }

  @Post('reply')
  @ApiOperation({ operationId: 'replyToCoach' })
  @ZodResponse({ status: HttpStatus.OK, type: CoachSessionDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  reply(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() body: CoachReplyDto,
  ) {
    return this.coach.reply(projectId, body);
  }

  @Post('reset')
  @ApiOperation({ operationId: 'resetCoachSession' })
  @ZodResponse({ status: HttpStatus.OK, type: CoachSessionDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  reset(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.coach.reset(projectId);
  }
}
