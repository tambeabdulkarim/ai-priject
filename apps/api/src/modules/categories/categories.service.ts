import { Injectable, NotFoundException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { CategoriesRepository } from './categories.repository';

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async findById(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found.');
    }
    return category;
  }

  /** docs/16-API-CONTRACT.md GET /marketplace/categories — category tree. */
  async getTree(): Promise<CategoryTreeNode[]> {
    const all = await this.categoriesRepository.findAll();
    const byId = new Map<string, CategoryTreeNode>(
      all.map((category) => [category.id, { ...category, children: [] }]),
    );
    const roots: CategoryTreeNode[] = [];

    for (const category of byId.values()) {
      if (category.parentCategoryId) {
        byId.get(category.parentCategoryId)?.children.push(category);
      } else {
        roots.push(category);
      }
    }
    return roots;
  }
}
