package com.inventory.repository;

import com.inventory.model.Product;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class ProductRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<Product> rowMapper = (rs, rowNum) -> {
        Product p = new Product();
        p.setId(rs.getLong("id"));
        p.setSku(rs.getString("sku"));
        p.setName(rs.getString("name"));
        p.setDescription(rs.getString("description"));

        long catId = rs.getLong("category_id");
        p.setCategoryId(rs.wasNull() ? null : catId);

        long supId = rs.getLong("supplier_id");
        p.setSupplierId(rs.wasNull() ? null : supId);

        p.setPurchasePrice(rs.getBigDecimal("purchase_price"));
        p.setSellingPrice(rs.getBigDecimal("selling_price"));
        p.setCurrentStock(rs.getInt("current_stock"));
        p.setMinimumStockLevel(rs.getInt("minimum_stock_level"));
        p.setUnit(rs.getString("unit"));

        Timestamp createdAt = rs.getTimestamp("created_at");
        if (createdAt != null) p.setCreatedAt(createdAt.toLocalDateTime());

        Timestamp updatedAt = rs.getTimestamp("updated_at");
        if (updatedAt != null) p.setUpdatedAt(updatedAt.toLocalDateTime());

        try {
            p.setCategoryName(rs.getString("category_name"));
        } catch (Exception ignored) {}

        try {
            p.setSupplierName(rs.getString("supplier_name"));
        } catch (Exception ignored) {}

        return p;
    };

    public ProductRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Product> findAll(String search, Long categoryId, Long supplierId, Boolean lowStock) {
        StringBuilder sql = new StringBuilder("""
            SELECT p.*, c.name AS category_name, s.name AS supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE 1=1
            """);

        List<Object> params = new ArrayList<>();

        if (search != null && !search.trim().isEmpty()) {
            sql.append(" AND (LOWER(p.name) LIKE LOWER(?) OR LOWER(p.sku) LIKE LOWER(?))");
            String query = "%" + search.trim() + "%";
            params.add(query);
            params.add(query);
        }

        if (categoryId != null) {
            sql.append(" AND p.category_id = ?");
            params.add(categoryId);
        }

        if (supplierId != null) {
            sql.append(" AND p.supplier_id = ?");
            params.add(supplierId);
        }

        if (Boolean.TRUE.equals(lowStock)) {
            sql.append(" AND p.current_stock <= p.minimum_stock_level");
        }

        sql.append(" ORDER BY p.name ASC");

        return jdbcTemplate.query(sql.toString(), rowMapper, params.toArray());
    }

    public Optional<Product> findById(Long id) {
        String sql = """
            SELECT p.*, c.name AS category_name, s.name AS supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.id = ?
            """;
        List<Product> results = jdbcTemplate.query(sql, rowMapper, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    /**
     * Acquires a row-level lock on the product row using PostgreSQL SELECT ... FOR UPDATE OF p.
     * Guarantees concurrency safety and prevents lost updates during stock mutations.
     */
    public Optional<Product> findByIdForUpdate(Long id) {
        String sql = """
            SELECT p.*, c.name AS category_name, s.name AS supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.id = ?
            FOR UPDATE OF p
            """;
        List<Product> results = jdbcTemplate.query(sql, rowMapper, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Optional<Product> findBySku(String sku) {
        String sql = """
            SELECT p.*, c.name AS category_name, s.name AS supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE LOWER(p.sku) = LOWER(?)
            """;
        List<Product> results = jdbcTemplate.query(sql, rowMapper, sku);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Product save(Product product) {
        String sql = """
            INSERT INTO products 
            (sku, name, description, category_id, supplier_id, purchase_price, selling_price, current_stock, minimum_stock_level, unit) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, product.getSku());
            ps.setString(2, product.getName());
            ps.setString(3, product.getDescription());

            if (product.getCategoryId() != null) ps.setLong(4, product.getCategoryId());
            else ps.setNull(4, Types.BIGINT);

            if (product.getSupplierId() != null) ps.setLong(5, product.getSupplierId());
            else ps.setNull(5, Types.BIGINT);

            ps.setBigDecimal(6, product.getPurchasePrice() != null ? product.getPurchasePrice() : BigDecimal.ZERO);
            ps.setBigDecimal(7, product.getSellingPrice());
            ps.setInt(8, product.getCurrentStock() != null ? product.getCurrentStock() : 0);
            ps.setInt(9, product.getMinimumStockLevel() != null ? product.getMinimumStockLevel() : 5);
            ps.setString(10, product.getUnit() != null ? product.getUnit() : "pcs");
            return ps;
        }, keyHolder);

        var keys = keyHolder.getKeys();
        if (keys != null && keys.containsKey("id")) {
            product.setId(((Number) keys.get("id")).longValue());
        }
        return product;
    }

    /**
     * Updates product metadata only.
     * Explicitly updates updated_at = CURRENT_TIMESTAMP.
     */
    public int update(Product product) {
        String sql = """
            UPDATE products 
            SET sku = ?, name = ?, description = ?, category_id = ?, supplier_id = ?, 
                purchase_price = ?, selling_price = ?, minimum_stock_level = ?, unit = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
            """;
        return jdbcTemplate.update(sql,
                product.getSku(),
                product.getName(),
                product.getDescription(),
                product.getCategoryId(),
                product.getSupplierId(),
                product.getPurchasePrice(),
                product.getSellingPrice(),
                product.getMinimumStockLevel(),
                product.getUnit(),
                product.getId());
    }

    /**
     * Atomic stock update used strictly by InventoryService within a locked transaction.
     * Explicitly updates updated_at = CURRENT_TIMESTAMP.
     */
    public int updateStock(Long productId, int newStock) {
        String sql = "UPDATE products SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        return jdbcTemplate.update(sql, newStock, productId);
    }

    public int deleteById(Long id) {
        String sql = "DELETE FROM products WHERE id = ?";
        return jdbcTemplate.update(sql, id);
    }

    public List<Product> findLowStockProducts() {
        String sql = """
            SELECT p.*, c.name AS category_name, s.name AS supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.current_stock <= p.minimum_stock_level
            ORDER BY p.current_stock ASC
            """;
        return jdbcTemplate.query(sql, rowMapper);
    }

    public long count() {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM products", Long.class);
        return count != null ? count : 0;
    }

    public long countLowStock() {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM products WHERE current_stock <= minimum_stock_level AND current_stock > 0", Long.class);
        return count != null ? count : 0;
    }

    public long countOutOfStock() {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM products WHERE current_stock = 0", Long.class);
        return count != null ? count : 0;
    }

    public long getTotalStockUnits() {
        Long count = jdbcTemplate.queryForObject("SELECT COALESCE(SUM(current_stock), 0) FROM products", Long.class);
        return count != null ? count : 0;
    }

    /**
     * Inventory Valuation computed strictly on cost basis: purchase_price * current_stock
     */
    public BigDecimal getTotalValuation() {
        BigDecimal valuation = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(purchase_price * current_stock), 0) FROM products", BigDecimal.class);
        return valuation != null ? valuation : BigDecimal.ZERO;
    }
}
