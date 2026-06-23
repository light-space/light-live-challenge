package org.light.challenge.model

import java.math.BigDecimal

data class ApprovalRule(
    val id: String,
    val name: String,
    val department: Department?,  // null means applies to all departments
    val minAmount: BigDecimal,
    val maxAmount: BigDecimal?,   // null means no upper limit
    val approverEmail: String,
    val approverName: String
)
