import { Injectable } from '@nestjs/common';
import { QueryInputModel } from '../../users/api/dto/queryInput.model';
import { ContentPageModel } from '../../globalTypes/contentPage.type';
import { paginationContentPage } from '../../helper.functions';
import { PostViewModel } from '../api/dto/postsView.model';
import { PostDBModel } from '../infrastructure/entity/postDB.model';
import { postOutputBeforeCreate } from '../../dataMapper/postViewModelBeforeCreate';
import { PostInputModel } from '../api/dto/postInputModel';
import { v4 as uuidv4 } from 'uuid';
import { PostsRepository } from '../infrastructure/posts.repository';
import { BlogsRepository } from '../../blogs/infrastructure/blogs.repository';
import { LikesService } from '../../likes/application/likes.service';
import { JwtService } from '../../jwt/application/jwt.service';
import { LikesRepository } from '../../likes/infrastructure/likes.repository';

@Injectable()
export class PostsService {
  constructor(
    protected jwtService: JwtService,
    protected likesService: LikesService,
    protected likesRepository: LikesRepository,
    protected blogsRepository: BlogsRepository,
    protected postsRepository: PostsRepository,
  ) {}

  async getPosts(
    query: QueryInputModel,
    blogId: string,
    token?: string,
  ): Promise<ContentPageModel> {
    const postsDB = await this.postsRepository.getPosts(query, blogId);
    const totalCount = await this.postsRepository.getTotalCount(blogId);
    const userId = await this.jwtService.getUserIdViaToken(token);
    const posts = await Promise.all(
      postsDB.map(async (p) => await this.addLikesInfoForPost(p, userId)),
    );

    return paginationContentPage(
      query.pageNumber,
      query.pageSize,
      posts,
      totalCount,
    );
  }

  async getPostById(
    postId: string,
    token?: string,
  ): Promise</*PostViewModel*/ PostDBModel | null> {
    const post = await this.postsRepository.getPostById(postId);

    if (!post) {
      return null;
    }

    //const userId = await this.jwtService.getUserIdViaToken(token);
    return post //await this.addLikesInfoForPost(post, userId);
  }

  async createPost(
    inputModel: PostInputModel,
    blogId?: string,
  ): Promise</*PostViewModel*/PostDBModel | null> {
    let id = inputModel.blogId;
    if (blogId) {
      id = blogId;
    }

    const newPost = new PostDBModel(
      uuidv4(),
      inputModel.title,
      inputModel.shortDescription,
      inputModel.content,
      id,
      await this.getBlogName(id),
      new Date().toISOString(),
    );

    const createdPost = await this.postsRepository.createPost(newPost);

    if (!createdPost) {
      return null;
    }

    return postOutputBeforeCreate(createdPost);
  }

  async getBlogName(blogId: string): Promise<string> {
    const blog = await this.blogsRepository.getBlogById(blogId);

    if (!blog) {
      return '';
    }

    return blog.name;
  }

  async updatePost(
    postId: string,
    inputModel: PostInputModel,
  ): Promise<boolean> {
    return await this.postsRepository.updatePost(postId, inputModel);
  }

  async deletePostById(postId: string): Promise<boolean> {
    return await this.postsRepository.deletePostById(postId);
  }

  private async addLikesInfoForPost(
    post: PostDBModel,
    userId: string | null,
  ): Promise<PostViewModel> {
    const result = await this.likesService.getReactionAndReactionCount(
      post.id,
      userId!,
    );
    const newestLikes = await this.likesRepository.getNewestLikes(post.id);

    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        myStatus: result.reaction,
        likesCount: result.likesCount,
        dislikesCount: result.dislikesCount,
        newestLikes: newestLikes!,
      },
    };
  }
}
