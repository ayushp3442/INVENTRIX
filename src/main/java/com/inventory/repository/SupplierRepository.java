package com.inventory.repository;

import com.inventory.model.Supplier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public class SupplierRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<Supplier> rowMapper = (rs, rowNum) -> {
        Supplier s = new Supplier();
        s.setId(rs.getLong("id"));
        s.setName(rs.getString("name"));
        s.setContactPerson(rs.getString("contact_person"));
        s.setPhone(rs.getString("phone"));
        s.setEmail(rs.getString("email"));
        s.setAddress(rs.getString("address"));
        Timestamp ts = rs.getTimestamp("created_at");
        if (ts != null) s.setCreatedAt(ts.toLocalDateTime());
        try {
            s.setProductCount(rs.getInt("product_count"));
        } catch (Exception ignored) {}
        return s;
    };

    public SupplierRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Supplier> findAll() {
        String sql = """
            SELECT s.id, s.name, s.contact_person, s.phone, s.email, s.address, s.created_at, COUNT(p.id) AS product_count
            FROM suppliers s
            LEFT JOIN products p ON s.id = p.supplier_id
            GROUP BY s.id, s.name, s.contact_person, s.phone, s.email, s.address, s.created_at
            ORDER BY s.name ASC
            """;
        return jdbcTemplate.query(sql, rowMapper);
    }

    public Optional<Supplier> findById(Long id) {
        String sql = """
            SELECT s.id, s.name, s.contact_person, s.phone, s.email, s.address, s.created_at, COUNT(p.id) AS product_count
            FROM suppliers s
            LEFT JOIN products p ON s.id = p.supplier_id
            WHERE s.id = ?
            GROUP BY s.id, s.name, s.contact_person, s.phone, s.email, s.address, s.created_at
            """;
        List<Supplier> results = jdbcTemplate.query(sql, rowMapper, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Supplier save(Supplier supplier) {
        String sql = "INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, supplier.getName());
            ps.setString(2, supplier.getContactPerson());
            ps.setString(3, supplier.getPhone());
            ps.setString(4, supplier.getEmail());
            ps.setString(5, supplier.getAddress());
            return ps;
        }, keyHolder);

        var keys = keyHolder.getKeys();
        if (keys != null && keys.containsKey("id")) {
            supplier.setId(((Number) keys.get("id")).longValue());
        }
        return supplier;
    }

    public int update(Supplier supplier) {
        String sql = "UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ? WHERE id = ?";
        return jdbcTemplate.update(sql,
                supplier.getName(),
                supplier.getContactPerson(),
                supplier.getPhone(),
                supplier.getEmail(),
                supplier.getAddress(),
                supplier.getId());
    }

    public int deleteById(Long id) {
        String sql = "DELETE FROM suppliers WHERE id = ?";
        return jdbcTemplate.update(sql, id);
    }
}
