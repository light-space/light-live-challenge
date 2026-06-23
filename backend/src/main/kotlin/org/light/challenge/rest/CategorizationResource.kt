package org.light.challenge.rest

import mu.KotlinLogging
import org.light.challenge.service.CategorizationService
import javax.ws.rs.*
import javax.ws.rs.core.MediaType
import javax.ws.rs.core.Response

private val logger = KotlinLogging.logger {}

data class CategorizationRequest(val description: String = "")

@Path("/categorize")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class CategorizationResource(private val categorizationService: CategorizationService) {

    @POST
    fun categorize(request: CategorizationRequest): Response {
        if (request.description.isBlank()) {
            return Response.status(400).entity(mapOf("error" to "Description is required")).build()
        }

        return try {
            val result = categorizationService.categorize(request.description)
            Response.ok(result).build()
        } catch (e: Exception) {
            // The local LLM timed out or is unavailable. Fail cleanly so the UI can prompt
            // the user to fill the fields in manually rather than hang.
            logger.warn(e) { "Categorization failed for: ${request.description}" }
            Response.status(503)
                .entity(mapOf("error" to "Categorization service is unavailable or took too long. Please fill in the fields manually."))
                .build()
        }
    }
}
