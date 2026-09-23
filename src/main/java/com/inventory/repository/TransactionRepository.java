package com.inventory.repository;

import com.inventory.model.InventoryTransaction;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class TransactionRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<InventoryTransaction> rowMapper = (rs, rowNum) -> {
        InventoryTransaction t = new InventoryTransaction();
        t.setId(rs.getLong("id"));
        t.setProductId(rs.getLong("product_id"));
        t.setTransactionType(rs.getString("transaction_type"));
        t.setQuantity(rs.getInt("quantity"));
        t.setUnitPrice(rs.getBigDecimal("unit_price"));
        t.setPreviousStock(rs.getInt("previous_stock"));
        t.setNewStock(rs.getInt("new_stock"));
        t.setReferenceNotes(rs.getString("reference_notes"));

        Timestamp ts = rs.getTimestamp("transaction_date");
        if (ts != null) t.setTransactionDate(ts.toLocalDateTime());

        try {
            t.setProductName(rs.getString("product_name"));
        } catch (Exception ignored) {}

        try {
            t.setProductSku(rs.getString("product_sku"));
        } catch (Exception ignored) {}

        return t;
    };

    public TransactionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public InventoryTransaction save(InventoryTransaction transaction) {
        String sql = """
            INSERT INTO inventory_transactions 
            (product_id, transaction_type, quantity, unit_price, previous_stock, new_stock, reference_notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """;
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, transaction.getProductId());
            ps.setString(2, transaction.getTransactionType());
            ps.setInt(3, transaction.getQuantity());
            ps.setBigDecimal(4, transaction.getUnitPrice() != null ? transaction.getUnitPrice() : BigDecimal.ZERO);
            ps.setInt(5, transaction.getPreviousStock());
            ps.setInt(6, transaction.getNewStock());
            ps.setString(7, transaction.getReferenceNotes());
            return ps;
        }, keyHolder);

        var keys = keyHolder.getKeys();
        if (keys != null && keys.containsKey("id")) {
            transaction.setId(((Number) keys.get("id")).longValue());
        }
        return transaction;
    }

    public List<InventoryTransaction> findAll(Long productId, String transactionType, Integer limit) {
        StringBuilder sql = new StringBuilder("""
            SELECT t.*, p.name AS product_name, p.sku AS product_sku
            FROM inventory_transactions t
            JOIN products p ON t.product_id = p.id
            WHERE 1=1
            """);

        List<Object> params = new ArrayList<>();

        if (productId != null) {
            sql.append(" AND t.product_id = ?");
            params.add(productId);
        }

        if (transactionType != null && !transactionType.trim().isEmpty()) {
            sql.append(" AND t.transaction_type = ?");
            params.add(transactionType.toUpperCase());
        }

        sql.append(" ORDER BY t.transaction_date DESC");

        if (limit != null && limit > 0) {
            sql.append(" LIMIT ?");
            params.add(limit);
        } else {
            sql.append(" LIMIT 100");
        }

        return jdbcTemplate.query(sql.toString(), rowMapper, params.toArray());
    }

    public Optional<InventoryTransaction> findById(Long id) {
        String sql = """
            SELECT t.*, p.name AS product_name, p.sku AS product_sku
            FROM inventory_transactions t
            JOIN products p ON t.product_id = p.id
            WHERE t.id = ?
            """;
        List<InventoryTransaction> results = jdbcTemplate.query(sql, rowMapper, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public List<InventoryTransaction> findRecent(int limit) {
        return findAll(null, null, limit);
    }

    public boolean hasTransactions(Long productId) {
        String sql = "SELECT COUNT(*) FROM inventory_transactions WHERE product_id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, productId);
        return count != null && count > 0;
    }
}
