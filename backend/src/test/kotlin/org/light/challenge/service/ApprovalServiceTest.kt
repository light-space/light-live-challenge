package org.light.challenge.service

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.light.challenge.model.ApprovalDecisionRequest
import org.light.challenge.model.ApprovalStatus
import org.light.challenge.model.CreatePaymentRequest
import org.light.challenge.model.Department
import org.light.challenge.model.PaymentStatus
import org.light.challenge.repository.ApprovalRequestRepository
import org.light.challenge.repository.ApprovalRuleRepository
import org.light.challenge.repository.PaymentRepository
import java.math.BigDecimal

/**
 * Tests for how a submitted payment is routed to approvers.
 *
 * These double as documentation of the rule-matching behaviour: rules stack, so a single
 * payment can require several approvers, and it is only approved once they all sign off.
 */
class ApprovalServiceTest {

    private lateinit var service: ApprovalService

    @BeforeEach
    fun setUp() {
        service = ApprovalService(
            PaymentRepository(),
            ApprovalRuleRepository(),
            ApprovalRequestRepository(),
            NotificationService()
        )
    }

    private fun request(amount: String, department: Department) = CreatePaymentRequest(
        amount = BigDecimal(amount),
        currency = "USD",
        department = department,
        vendor = "Test Vendor",
        description = "Test payment",
        submittedBy = "tester@light.inc"
    )

    private fun approversFor(amount: String, department: Department): Set<String> {
        val payment = service.submitPayment(request(amount, department))
        return service.getApprovalsForPayment(payment.id).map { it.approverName }.toSet()
    }

    @Test
    fun `payments under 1000 are auto-approved with no approvers`() {
        val payment = service.submitPayment(request("500.00", Department.OPERATIONS))

        assertEquals(PaymentStatus.APPROVED, payment.status)
        assertTrue(service.getApprovalsForPayment(payment.id).isEmpty())
    }

    @Test
    fun `standard payments route to the team lead`() {
        assertEquals(setOf("Team Lead"), approversFor("5000.00", Department.FINANCE))
    }

    @Test
    fun `the 10000 boundary routes to the finance manager, not the team lead`() {
        // Standard is $1,000-$10,000 (upper bound exclusive); Large starts at $10,000.
        assertEquals(setOf("Finance Manager"), approversFor("10000.00", Department.OPERATIONS))
    }

    @Test
    fun `enterprise payments route to the CFO`() {
        assertEquals(setOf("CFO"), approversFor("75000.00", Department.OPERATIONS))
    }

    @Test
    fun `an engineering payment stacks the global and department rules`() {
        // $12,000 matches Large (Finance Manager) AND Engineering Vendor (Engineering Director).
        assertEquals(
            setOf("Finance Manager", "Engineering Director"),
            approversFor("12000.00", Department.ENGINEERING)
        )
    }

    @Test
    fun `a marketing payment stacks the large and campaign rules`() {
        assertEquals(
            setOf("Finance Manager", "CMO"),
            approversFor("20000.00", Department.MARKETING)
        )
    }

    @Test
    fun `the engineering rule does not apply above its range`() {
        // $60,000 is past the Engineering Vendor ceiling ($25,000), so only the CFO is required.
        assertEquals(setOf("CFO"), approversFor("60000.00", Department.ENGINEERING))
    }

    @Test
    fun `a payment with multiple approvers is approved only once all sign off`() {
        val payment = service.submitPayment(request("12000.00", Department.ENGINEERING))
        val approvals = service.getApprovalsForPayment(payment.id)
        assertEquals(2, approvals.size)

        service.processDecision(approvals[0].id, ApprovalDecisionRequest(ApprovalStatus.APPROVED))
        assertEquals(PaymentStatus.PENDING_APPROVAL, service.getPayment(payment.id)!!.status)

        service.processDecision(approvals[1].id, ApprovalDecisionRequest(ApprovalStatus.APPROVED))
        assertEquals(PaymentStatus.APPROVED, service.getPayment(payment.id)!!.status)
    }

    @Test
    fun `a single rejection rejects the whole payment`() {
        val payment = service.submitPayment(request("12000.00", Department.ENGINEERING))
        val approvals = service.getApprovalsForPayment(payment.id)

        service.processDecision(approvals[0].id, ApprovalDecisionRequest(ApprovalStatus.REJECTED, "Out of budget"))

        assertEquals(PaymentStatus.REJECTED, service.getPayment(payment.id)!!.status)
    }
}
