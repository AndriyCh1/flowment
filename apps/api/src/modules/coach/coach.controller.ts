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
  CoachHintRequestDto,
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
  getCoachSession(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.coach.getSession(projectId);
  }

  @Put('intent')
  @ApiOperation({ operationId: 'updateModelingIntent' })
  @ZodResponse({ type: CoachSessionDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  updateModelingIntent(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() body: UpdateModelingIntentDto,
  ) {
    return this.coach.updateModelingIntent(projectId, body.modelingIntent);
  }

  @Post('next')
  @ApiOperation({ operationId: 'requestCoachResponse' })
  @ZodResponse({ status: HttpStatus.OK, type: CoachSessionDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  @ApiServiceUnavailableResponse({ type: ErrorResponseDto })
  requestCoachResponse(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() body: CoachNextDto,
  ) {
    return this.coach.requestCoachResponse(projectId, body);
  }

  @Post('hint')
  @ApiOperation({ operationId: 'requestCoachHint' })
  @ZodResponse({ status: HttpStatus.OK, type: CoachSessionDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  @ApiServiceUnavailableResponse({ type: ErrorResponseDto })
  requestCoachHint(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() body: CoachHintRequestDto,
  ) {
    return this.coach.requestHint(projectId, body);
  }

  @Post('reply')
  @ApiOperation({ operationId: 'replyToCoach' })
  @ZodResponse({ status: HttpStatus.OK, type: CoachSessionDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  replyToCoach(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() body: CoachReplyDto,
  ) {
    return this.coach.replyToQuestion(projectId, body);
  }

  @Post('reset')
  @ApiOperation({ operationId: 'resetCoachSession' })
  @ZodResponse({ status: HttpStatus.OK, type: CoachSessionDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  resetCoachSession(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.coach.resetConversation(projectId);
  }
}
