package org.light.challenge.llm

interface LlmClient {
    /**
     * @param temperature 0.0 (default) for deterministic, repeatable output.
     * @param responseFormat optional OpenAI-style response_format (e.g. a json_schema)
     *        to constrain the model's output. Null leaves the response unconstrained.
     */
    fun complete(
        systemPrompt: String,
        userMessage: String,
        temperature: Double = 0.0,
        responseFormat: Map<String, Any>? = null
    ): String
}
