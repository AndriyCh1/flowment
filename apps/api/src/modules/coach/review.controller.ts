import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
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
import { ReviewDto, ReviewListDto } from './review.dto';
import { ReviewService } from './review.service';

@ApiTags('coach')
@Controller('projects/:projectId/reviews')
export class ReviewController {
  constructor(private readonly reviews: ReviewService) {}

  @Get()
  @ApiOperation({ operationId: 'listReviews' })
  @ZodResponse({ type: ReviewListDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  listReviews(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.reviews.listReviews(projectId);
  }

  @Post()
  @ApiOperation({ operationId: 'submitForReview' })
  @ZodResponse({ status: HttpStatus.OK, type: ReviewDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  @ApiServiceUnavailableResponse({ type: ErrorResponseDto })
  submitForReview(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.reviews.submitForReview(projectId);
  }
}
