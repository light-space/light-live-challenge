package org.light.challenge.model

import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

enum class PaymentStatus {
    PENDING_APPROVAL,
    APPROVED,
    REJECTED
}

enum class Department {
    ENGINEERING,
    MARKETING,
    FINANCE,
    OPERATIONS,
    SALES,
    CUSTOMER_SUCCESS,
    HR
}

data class Payment(
    val id: String = UUID.randomUUID().toString(),
    val amount: BigDecimal,
    val currency: String = "USD",
    val department: Department,
    val vendor: String,
    val description: String,
    val submittedBy: String,
    var status: PaymentStatus = PaymentStatus.PENDING_APPROVAL,
    val createdAt: Instant = Instant.now()
)

data class CreatePaymentRequest(
    val amount: BigDecimal,
    val currency: String = "USD",
    val department: Department,
    val vendor: String,
    val description: String,
    val submittedBy: String
)
