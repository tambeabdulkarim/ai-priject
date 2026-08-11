---
name: environment-validation
description: Detect and classify infrastructure, environment, Docker, WSL2, cloud-service, credential and operating-system issues before classifying any failure as an application bug.
---

# Environment Validation

## Purpose
Before diagnosing any failure, determine whether it originates from:
- Application Code
- Infrastructure
- Local Environment
- External Service
- Operating System
- Developer Machine

Never classify an infrastructure problem as an application bug.

---

## Classification
Every failure must belong to exactly one category.

A. Application Bug
B. Infrastructure
C. Local Environment
D. External Service
E. User Configuration

Never mix categories.

---

## Infrastructure Rules
Always verify before reporting a backend bug:
- Docker running
- WSL status
- Network connectivity
- Storage provider
- Database availability
- Redis availability
- Object Storage
- Environment variables
- Secrets

---

## Environment Rules
Missing credentials
Missing Docker
Missing WSL
Missing cloud service
Missing bucket
Missing certificate
Missing DNS
Missing firewall permission

are NOT application bugs.
They are Environment Issues.

---

## Recommendation Policy
Never stop project progress because of environment limitations if:
- architecture is validated
- implementation is complete
- only deployment infrastructure is missing

Instead recommend:
Continue development.
Return later for infrastructure validation.

---

## Technical Authority
Always distinguish:
Engineering Complete
Infrastructure Pending

Those are different project states.
