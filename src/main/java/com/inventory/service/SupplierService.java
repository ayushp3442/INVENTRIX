package com.inventory.service;

import com.inventory.exception.BadRequestException;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.model.Supplier;
import com.inventory.repository.SupplierRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with ID: " + id));
    }

    public Supplier createSupplier(Supplier supplier) {
        if (supplier.getName() == null || supplier.getName().trim().isEmpty()) {
            throw new BadRequestException("Supplier name cannot be empty");
        }
        return supplierRepository.save(supplier);
    }

    public Supplier updateSupplier(Long id, Supplier details) {
        Supplier existing = getSupplierById(id);
        if (details.getName() != null) existing.setName(details.getName().trim());
        if (details.getContactPerson() != null) existing.setContactPerson(details.getContactPerson().trim());
        if (details.getPhone() != null) existing.setPhone(details.getPhone().trim());
        if (details.getEmail() != null) existing.setEmail(details.getEmail().trim());
        if (details.getAddress() != null) existing.setAddress(details.getAddress().trim());

        supplierRepository.update(existing);
        return existing;
    }

    public void deleteSupplier(Long id) {
        Supplier supplier = getSupplierById(id);
        supplierRepository.deleteById(supplier.getId());
    }
}
