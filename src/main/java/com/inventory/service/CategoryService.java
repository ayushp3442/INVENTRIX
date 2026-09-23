package com.inventory.service;

import com.inventory.exception.BadRequestException;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.model.Category;
import com.inventory.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));
    }

    public Category createCategory(Category category) {
        if (category.getName() == null || category.getName().trim().isEmpty()) {
            throw new BadRequestException("Category name cannot be empty");
        }
        categoryRepository.findByName(category.getName().trim()).ifPresent(c -> {
            throw new BadRequestException("Category with name '" + category.getName() + "' already exists");
        });
        category.setName(category.getName().trim());
        return categoryRepository.save(category);
    }

    public Category updateCategory(Long id, Category categoryDetails) {
        Category existing = getCategoryById(id);
        if (categoryDetails.getName() != null && !categoryDetails.getName().trim().isEmpty()) {
            String newName = categoryDetails.getName().trim();
            if (!newName.equalsIgnoreCase(existing.getName())) {
                categoryRepository.findByName(newName).ifPresent(c -> {
                    throw new BadRequestException("Category with name '" + newName + "' already exists");
                });
            }
            existing.setName(newName);
        }
        if (categoryDetails.getDescription() != null) {
            existing.setDescription(categoryDetails.getDescription());
        }
        categoryRepository.update(existing);
        return existing;
    }

    public void deleteCategory(Long id) {
        Category category = getCategoryById(id);
        categoryRepository.deleteById(category.getId());
    }
}
