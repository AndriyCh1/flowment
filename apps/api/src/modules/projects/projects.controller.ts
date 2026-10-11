import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ErrorResponseDto } from '../../shared/http';
import {
  CreateProjectDto,
  ListProjectsQueryDto,
  ProjectDto,
  ProjectListDto,
  UpdateProjectDto,
} from './projects.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  @ApiOperation({ operationId: 'createProject' })
  @ZodResponse({ status: HttpStatus.CREATED, type: ProjectDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  create(@Body() body: CreateProjectDto) {
    return this.projects.create(body);
  }

  @Get()
  @ApiOperation({ operationId: 'listProjects' })
  @ZodResponse({ type: ProjectListDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  list(@Query() query: ListProjectsQueryDto) {
    return this.projects.list(query);
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getProject' })
  @ZodResponse({ type: ProjectDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.projects.get(id);
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'updateProject' })
  @ZodResponse({ type: ProjectDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateProjectDto,
  ) {
    return this.projects.update(id, body);
  }
}
