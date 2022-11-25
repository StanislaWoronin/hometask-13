import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Put,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from '../application/comments.service';
import { QueryInputModel } from '../../users/api/dto/queryInput.model';
import { AuthBearerGuard } from '../../guard/auth.bearer.guard';
import { CommentInputModel } from './dto/commentInput.model';
import { UserDBModel } from '../../users/infrastructure/entity/userDB.model';

@Controller('comments')
export class CommentsController {
  constructor(protected commentsService: CommentsService) {}

  @Get(':id')
  getCommentById(@Param('id') commentId: string) {
    return this.commentsService.getCommentById(commentId);
  }

  @Put(':id')
  @HttpCode(204)
  @UseGuards(AuthBearerGuard)
  async updateCommentById(
    @Body('content') content: CommentInputModel,
    @Param('id') commentId: string,
    @Req() user: UserDBModel,
  ) {
    const comment = await this.commentsService.getCommentById(commentId);

    if (!comment) {
      throw new NotFoundException();
    }

    if (comment.userId !== user.id) {
      throw new ForbiddenException(); //	If try edit the comment that is not your own
    }

    const isUpdate = await this.commentsService.updateComment(
      commentId,
      content.toString(),
    );

    if (!isUpdate) {
      throw new NotFoundException();
    }

    return await this.commentsService.getCommentById(commentId);
  }

  @Put(':id/like-status')
  @HttpCode(204)
  @UseGuards(AuthBearerGuard)
  async updateLikeStatus(
    @Body('likeStatus') likeStatus: string,
    @Param('id') commentId: string,
    @Req() user: UserDBModel,
  ) {
    const comment = await this.commentsService.getCommentById(commentId);

    if (!comment) {
      throw new NotFoundException();
    }

    const result = await this.commentsService.updateLikesInfo(
      user!.id,
      commentId,
      likeStatus,
    );

    if (!result) {
      throw new ServiceUnavailableException();
    }

    return;
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AuthBearerGuard)
  async deleteCommentById(
    @Param('id') commentId: string,
    @Req() user: UserDBModel,
  ) {
    const comment = await this.commentsService.getCommentById(commentId);

    if (!comment) {
      throw new NotFoundException();
    }

    if (comment.userId !== user.id) {
      throw new ForbiddenException(); //	If try edit the comment that is not your own
    }

    const isDeleted = await this.commentsService.deleteCommentById(commentId);

    if (!isDeleted) {
      throw new NotFoundException();
    }

    return;
  }
}
