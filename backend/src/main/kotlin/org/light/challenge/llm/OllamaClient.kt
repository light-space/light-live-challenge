package org.light.challenge.llm

import com.fasterxml.jackson.databind.ObjectMapper
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

class OllamaClient(
    private val baseUrl: String = "http://localhost:11434",
    private val model: String = "qwen2.5:3b",
    private val objectMapper: ObjectMapper
) : LlmClient {

    companion object {
        // The local model can be slow on modest hardware. Bound each call so a stuck
        // request fails cleanly instead of hanging until the caller's connection drops.
        private val CONNECT_TIMEOUT = Duration.ofSeconds(5)
        private val REQUEST_TIMEOUT = Duration.ofSeconds(30)
    }

    private val httpClient = HttpClient.newBuilder()
        .connectTimeout(CONNECT_TIMEOUT)
        .build()

    override fun complete(
        systemPrompt: String,
        userMessage: String,
        temperature: Double,
        responseFormat: Map<String, Any>?
    ): String {
        val requestBody = mutableMapOf<String, Any>(
            "model" to model,
            "messages" to listOf(
                mapOf("role" to "system", "content" to systemPrompt),
                mapOf("role" to "user", "content" to userMessage)
            ),
            "stream" to false,
            // temperature 0 + a fixed seed make categorization deterministic:
            // the same description always yields the same suggestion.
            "temperature" to temperature,
            "seed" to 42
        )
        if (responseFormat != null) {
            requestBody["response_format"] = responseFormat
        }

        val request = HttpRequest.newBuilder()
            .uri(URI.create("$baseUrl/v1/chat/completions"))
            .header("Content-Type", "application/json")
            .timeout(REQUEST_TIMEOUT)
            .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
            .build()

        val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())

        val responseBody = objectMapper.readTree(response.body())
        return responseBody.at("/choices/0/message/content").asText()
    }
}
