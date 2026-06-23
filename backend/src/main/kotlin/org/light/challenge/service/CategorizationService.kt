package org.light.challenge.service

import com.fasterxml.jackson.databind.ObjectMapper
import mu.KotlinLogging
import org.light.challenge.llm.LlmClient
import org.light.challenge.model.Department

private val logger = KotlinLogging.logger {}

data class CategorizationResult(
    val department: Department?,
    val vendor: String?,
    val description: String?
)

/**
 * Categorizes a free-text payment description into a vendor and a department.
 *
 * This runs in two deterministic LLM stages rather than one combined call:
 *
 *   1. Vendor inference  - identify (or infer from a product/brand) the company being paid.
 *   2. Department classification - classify into one of the fixed departments, using the
 *      description AND the inferred vendor from stage 1 as context.
 *
 * Splitting the work lets each stage focus on a single task, and feeding the vendor into
 * stage 2 gives the classifier the context it needs for terse inputs (e.g. "macbook" alone
 * is ambiguous, but "macbook" paid to "Apple" is clearly ENGINEERING). Both stages run at
 * temperature 0 with a fixed seed, and the department is constrained to the valid enum, so
 * the same description always produces the same result.
 */
class CategorizationService(
    private val llmClient: LlmClient,
    private val objectMapper: ObjectMapper
) {

    companion object {
        private val VENDOR_SYSTEM_PROMPT = """
            You identify the vendor (the company or person being paid) from a payment description.

            - If a vendor is named in the description, use it.
            - If only a product or brand is mentioned, infer the company that sells it.
              Examples: "MacBook" or "iPhone" -> Apple, "Google Ads" -> Google,
              "Photoshop" -> Adobe, "AWS" -> Amazon Web Services, "Slack" -> Slack,
              "Figma" -> Figma, "Salesforce" -> Salesforce.

            Respond with ONLY the company name and nothing else.
            If you genuinely cannot tell who would be paid, respond with the single word NONE.
        """.trimIndent()

        private val DEPARTMENT_SYSTEM_PROMPT = """
            You categorize a company payment into exactly one department.

            Choose the single best fit from these departments:
            - ENGINEERING: software, hardware, laptops, dev tools, cloud infrastructure, IT equipment
            - MARKETING: advertising, events, sponsorships, PR, content, branding
            - FINANCE: legal, accounting, auditing, banking, insurance
            - OPERATIONS: office supplies, facilities, travel, general admin
            - SALES: client entertainment, CRM tools, sales conferences, commissions
            - CUSTOMER_SUCCESS: client onboarding, support tools, customer meetings, retention
            - HR: recruiting, training, benefits, payroll services, team events

            Use the vendor as a strong hint. Examples:
            - "macbook" (vendor: Apple) -> ENGINEERING
            - "aws" or "cloud hosting" (vendor: Amazon Web Services) -> ENGINEERING
            - "google ads" (vendor: Google) -> MARKETING
            - "office chairs" -> OPERATIONS
            - "recruiter fee" -> HR

            Note: cloud and SaaS bills (AWS, GCP, Azure) are ENGINEERING infrastructure,
            not FINANCE, even though they are invoices.

            Always pick the most likely department; do not refuse.
        """.trimIndent()

        private val DEPARTMENT_RESPONSE_FORMAT: Map<String, Any> = mapOf(
            "type" to "json_schema",
            "json_schema" to mapOf(
                "name" to "department_classification",
                "strict" to true,
                "schema" to mapOf(
                    "type" to "object",
                    "properties" to mapOf(
                        "department" to mapOf(
                            "type" to "string",
                            "enum" to Department.values().map { it.name }
                        )
                    ),
                    "required" to listOf("department"),
                    "additionalProperties" to false
                )
            )
        )
    }

    fun categorize(rawDescription: String): CategorizationResult {
        logger.info { "Categorizing payment: $rawDescription" }

        val vendor = inferVendor(rawDescription)
        val department = classifyDepartment(rawDescription, vendor)

        logger.info { "Categorized '$rawDescription' -> vendor=$vendor, department=$department" }
        return CategorizationResult(department = department, vendor = vendor, description = null)
    }

    private fun inferVendor(rawDescription: String): String? {
        val response = llmClient.complete(VENDOR_SYSTEM_PROMPT, rawDescription).trim().trim('"').trim()
        return response.takeIf {
            it.isNotBlank() &&
                !it.equals("none", ignoreCase = true) &&
                !it.equals("null", ignoreCase = true) &&
                !it.equals("unknown", ignoreCase = true)
        }
    }

    private fun classifyDepartment(rawDescription: String, vendor: String?): Department? {
        val userMessage = buildString {
            append("Payment description: ").append(rawDescription)
            if (vendor != null) append("\nVendor: ").append(vendor)
        }

        val response = llmClient.complete(
            DEPARTMENT_SYSTEM_PROMPT,
            userMessage,
            responseFormat = DEPARTMENT_RESPONSE_FORMAT
        )

        return try {
            val departmentStr = objectMapper.readTree(response).get("department")?.asText()
            departmentStr?.let { Department.valueOf(it.uppercase()) }
        } catch (e: Exception) {
            logger.error(e) { "Failed to parse department from LLM response: $response" }
            null
        }
    }
}
