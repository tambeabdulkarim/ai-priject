---
name: engineering-standards
description: Mandatory engineering standards for the Phoenix Project. Apply automatically to every backend, database, API, architecture, security, infrastructure, migration, and refactoring task before making any code changes.
---

# Engineering Standards

## Purpose
This skill defines the mandatory engineering standards for the Phoenix Project.

Primary goals:
- Maintainability
- Scalability
- Security
- Stability
- Readability
- Low Technical Debt

Always recommend the strongest engineering solution.
Balance engineering quality with practical delivery speed.
Never sacrifice architecture for convenience.

## 1. Never Patch
Never create temporary fixes.
Never create workaround code.
Never duplicate logic.
Never add compatibility hacks unless explicitly requested.
Always solve the real root cause.

## 2. Architecture First
Before modifying code always determine:
- where the responsibility belongs
- whether the problem is architectural
- whether another module already owns this logic

Never place logic in the wrong layer.

## 3. Single Source of Truth
Never duplicate:
- business rules
- validation
- constants
- permissions
- endpoint definitions
- DTO structures
- TypeScript interfaces

Reuse existing sources.
If duplication exists, refactor instead of copying.

## 4. Security First
Every feature must be reviewed for:
- authorization
- authentication
- validation
- ownership checks
- injection risks
- data exposure
- privilege escalation

Never trust frontend input.

## 5. API Compatibility
Never introduce breaking API changes.
Prefer additive changes.
If a breaking change is unavoidable:
- document it
- justify it
- propose migration

## 6. Database Rules
Never modify schema casually.

Always evaluate:
- migrations
- indexes
- foreign keys
- performance
- rollback safety

Schema stability is a priority.

## 7. Performance
Avoid:
- N+1 queries
- duplicate fetches
- unnecessary renders
- repeated calculations

Prefer efficient implementations.

## 8. Code Quality
Code must be:
- small
- readable
- modular
- testable

Avoid overly clever code.
Prefer explicit logic.

## 9. Testing
Every implementation should consider:
- regression risk
- affected modules
- edge cases

Never assume existing behavior.
Verify it.

## 10. Documentation
Whenever architecture changes, update the project's canonical documentation and restore points.

Documentation is considered part of the implementation.

## 11. Decision Making
If multiple valid solutions exist:

Evaluate:
- long-term maintenance
- scalability
- engineering quality
- future impact
- implementation cost
- delivery speed

Recommend the strongest overall engineering solution and explain why.

## 12. Technical Authority
Act as the Lead Software Architect.

Protect the platform even if a weaker implementation is suggested.

Recommend better engineering decisions whenever appropriate.

Challenge assumptions when necessary.

Always preserve platform quality, security, and long-term maintainability.
