package com.inventory.repository;

import com.inventory.model.Category;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.List;
import com.inventory.dto.CategoryBreakdownDto;
import java.util.Optional;

@Repository
public class CategoryRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<Category> rowMapper = (rs, rowNum) -> {
        Category c = new Category();
        c.setId(rs.getLong("id"));
        c.setName(rs.getString("name"));
        c.setDescription(rs.getString("description"));
        Timestamp ts = rs.getTimestamp("created_at");
        if (ts != null) c.setCreatedAt(ts.toLocalDateTime());
        try {
            c.setProductCount(rs.getInt("product_count"));
        } catch (Exception ignored) {}
        return c;
    };

    public CategoryRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Category> findAll() {
        String sql = """
            SELECT c.id, c.name, c.description, c.created_at, COUNT(p.id) AS product_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            GROUP BY c.id, c.name, c.description, c.created_at
            ORDER BY c.name ASC
            """;
        return jdbcTemplate.query(sql, rowMapper);
    }

    public Optional<Category> findById(Long id) {
        String sql = """
            SELECT c.id, c.name, c.description, c.created_at, COUNT(p.id) AS product_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            WHERE c.id = ?
            GROUP BY c.id, c.name, c.description, c.created_at
            """;
        List<Category> results = jdbcTemplate.query(sql, rowMapper, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Optional<Category> findByName(String name) {
        String sql = "SELECT *, 0 AS product_count FROM categories WHERE LOWER(name) = LOWER(?)";
        List<Category> results = jdbcTemplate.query(sql, rowMapper, name);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Category save(Category category) {
        String sql = "INSERT INTO categories (name, description) VALUES (?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, category.getName());
            ps.setString(2, category.getDescription());
            return ps;
        }, keyHolder);

        var keys = keyHolder.getKeys();
        if (keys != null && keys.containsKey("id")) {
            category.setId(((Number) keys.get("id")).longValue());
        }
        return category;
    }

    public int update(Category category) {
        String sql = "UPDATE categories SET name = ?, description = ? WHERE id = ?";
        return jdbcTemplate.update(sql, category.getName(), category.getDescription(), category.getId());
    }

    public int deleteById(Long id) {
        String sql = "DELETE FROM categories WHERE id = ?";
        return jdbcTemplate.update(sql, id);
    }

    public boolean hasProducts(Long categoryId) {
        String sql = "SELECT COUNT(*) FROM products WHERE category_id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, categoryId);
        return count != null && count > 0;
    }

    public List<CategoryBreakdownDto> getCategoryBreakdown() {
        String sql = """
            SELECT c.id AS category_id, c.name AS category_name, COALESCE(SUM(p.current_stock), 0) AS total_stock
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            GROUP BY c.id, c.name
            ORDER BY total_stock DESC, c.name ASC
            """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new CategoryBreakdownDto(
            rs.getLong("category_id"),
            rs.getString("category_name"),
            rs.getLong("total_stock")
        ));
    }
}
