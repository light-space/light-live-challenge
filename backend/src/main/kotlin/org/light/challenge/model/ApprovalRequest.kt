package org.light.challenge.model

import java.time.Instant
import java.util.UUID

enum class ApprovalStatus {
    PENDING,
    APPROVED,
    REJECTED
}

data class ApprovalRequest(
    val id: String = UUID.randomUUID().toString(),
    val paymentId: String,
    val approverEmail: String,
    val approverName: String,
    var status: ApprovalStatus = ApprovalStatus.PENDING,
    val createdAt: Instant = Instant.now(),
    var decidedAt: Instant? = null,
    var comment: String? = null
)

data class ApprovalDecisionRequest(
    val decision: ApprovalStatus,
    val comment: String? = null
)
