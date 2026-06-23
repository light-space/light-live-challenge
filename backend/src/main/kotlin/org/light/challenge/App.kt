package org.light.challenge

import com.codahale.metrics.health.HealthCheck
import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import io.dropwizard.Application
import io.dropwizard.Configuration
import io.dropwizard.setup.Bootstrap
import io.dropwizard.setup.Environment
import org.light.challenge.repository.ApprovalRequestRepository
import org.light.challenge.repository.ApprovalRuleRepository
import org.light.challenge.repository.PaymentRepository
import org.light.challenge.llm.OllamaClient
import org.light.challenge.rest.ApprovalResource
import org.light.challenge.rest.CategorizationResource
import org.light.challenge.rest.PaymentResource
import org.light.challenge.service.ApprovalService
import org.light.challenge.service.CategorizationService
import org.light.challenge.service.NotificationService

class Config : Configuration()

class App : Application<Config>() {
    override fun run(configuration: Config, environment: Environment) {
        val paymentRepository = PaymentRepository()
        val approvalRuleRepository = ApprovalRuleRepository()
        val approvalRequestRepository = ApprovalRequestRepository()
        val notificationService = NotificationService()

        val approvalService = ApprovalService(
            paymentRepository,
            approvalRuleRepository,
            approvalRequestRepository,
            notificationService
        )

        val ollamaClient = OllamaClient(objectMapper = environment.objectMapper)
        val categorizationService = CategorizationService(ollamaClient, environment.objectMapper)

        environment.jersey().register(PaymentResource(approvalService))
        environment.jersey().register(ApprovalResource(approvalService))
        environment.jersey().register(CategorizationResource(categorizationService))

        environment.healthChecks().register("APIHealthCheck", object : HealthCheck() {
            override fun check(): Result {
                return Result.healthy()
            }
        })
    }

    override fun initialize(bootstrap: Bootstrap<Config>) {
        bootstrap.objectMapper.registerModules(
            KotlinModule.Builder().build(),
            JavaTimeModule()
        )
        bootstrap.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
        bootstrap.objectMapper.enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
    }
}

fun main(args: Array<String>) {
    App().run(*args)
}
