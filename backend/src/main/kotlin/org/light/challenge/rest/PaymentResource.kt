package org.light.challenge.rest

import org.light.challenge.model.CreatePaymentRequest
import org.light.challenge.model.PaymentStatus
import org.light.challenge.service.ApprovalService
import javax.ws.rs.*
import javax.ws.rs.core.MediaType
import javax.ws.rs.core.Response

@Path("/payments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class PaymentResource(private val approvalService: ApprovalService) {

    @GET
    fun listPayments(@QueryParam("status") status: String?): Response {
        val payments = if (status != null) {
            try {
                val paymentStatus = PaymentStatus.valueOf(status.uppercase())
                approvalService.getPaymentsByStatus(paymentStatus)
            } catch (e: IllegalArgumentException) {
                return Response.status(400).entity(mapOf("error" to "Invalid status: $status")).build()
            }
        } else {
            approvalService.getAllPayments()
        }
        return Response.ok(payments).build()
    }

    @GET
    @Path("/{id}")
    fun getPayment(@PathParam("id") id: String): Response {
        val payment = approvalService.getPayment(id)
            ?: return Response.status(404).entity(mapOf("error" to "Payment not found")).build()

        val approvals = approvalService.getApprovalsForPayment(id)
        return Response.ok(mapOf("payment" to payment, "approvals" to approvals)).build()
    }

    @POST
    fun createPayment(request: CreatePaymentRequest): Response {
        val payment = approvalService.submitPayment(request)
        val approvals = approvalService.getApprovalsForPayment(payment.id)
        return Response.status(201).entity(mapOf("payment" to payment, "approvals" to approvals)).build()
    }
}
