package org.light.challenge.repository

import org.light.challenge.model.*
import java.math.BigDecimal
import java.time.Instant

class PaymentRepository {
    private val payments = mutableMapOf<String, Payment>()

    init {
        val seed = listOf(
            Payment(
                id = "pay-001",
                amount = BigDecimal("450.00"),
                currency = "USD",
                department = Department.OPERATIONS,
                vendor = "Office Depot",
                description = "Q1 office supplies",
                submittedBy = "alice@light.inc",
                status = PaymentStatus.APPROVED,
                createdAt = Instant.parse("2026-03-15T10:00:00Z")
            ),
            Payment(
                id = "pay-002",
                amount = BigDecimal("8500.00"),
                currency = "USD",
                department = Department.ENGINEERING,
                vendor = "Amazon Web Services",
                description = "March AWS infrastructure",
                submittedBy = "bob@light.inc",
                status = PaymentStatus.APPROVED,
                createdAt = Instant.parse("2026-03-20T14:30:00Z")
            ),
            Payment(
                id = "pay-003",
                amount = BigDecimal("15000.00"),
                currency = "USD",
                department = Department.MARKETING,
                vendor = "TechCrunch",
                description = "Conference sponsorship - Disrupt 2026",
                submittedBy = "carol@light.inc",
                status = PaymentStatus.PENDING_APPROVAL,
                createdAt = Instant.parse("2026-04-01T09:00:00Z")
            ),
            Payment(
                id = "pay-004",
                amount = BigDecimal("12000.00"),
                currency = "USD",
                department = Department.ENGINEERING,
                vendor = "Apple Inc",
                description = "New developer laptops (3x MacBook Pro)",
                submittedBy = "bob@light.inc",
                status = PaymentStatus.PENDING_APPROVAL,
                createdAt = Instant.parse("2026-04-02T11:00:00Z")
            ),
            Payment(
                id = "pay-005",
                amount = BigDecimal("25000.00"),
                currency = "USD",
                department = Department.FINANCE,
                vendor = "Baker & McKenzie",
                description = "Legal retainer - Q2",
                submittedBy = "dave@light.inc",
                status = PaymentStatus.APPROVED,
                createdAt = Instant.parse("2026-03-28T16:00:00Z")
            ),
            Payment(
                id = "pay-006",
                amount = BigDecimal("1500.00"),
                currency = "USD",
                department = Department.ENGINEERING,
                vendor = "JetBrains",
                description = "IntelliJ IDEA team licenses",
                submittedBy = "bob@light.inc",
                status = PaymentStatus.PENDING_APPROVAL,
                createdAt = Instant.parse("2026-04-05T08:30:00Z")
            ),
            Payment(
                id = "pay-007",
                amount = BigDecimal("3200.00"),
                currency = "USD",
                department = Department.MARKETING,
                vendor = "Google Ads",
                description = "April ad campaign budget",
                submittedBy = "carol@light.inc",
                status = PaymentStatus.REJECTED,
                createdAt = Instant.parse("2026-03-25T13:00:00Z")
            )
        )
        seed.forEach { payments[it.id] = it }
    }

    fun findAll(): List<Payment> = payments.values.toList().sortedByDescending { it.createdAt }

    fun findById(id: String): Payment? = payments[id]

    fun save(payment: Payment): Payment {
        payments[payment.id] = payment
        return payment
    }

    fun findByStatus(status: PaymentStatus): List<Payment> =
        payments.values.filter { it.status == status }.sortedByDescending { it.createdAt }
}
