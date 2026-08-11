// Phase 31 — Educational Content Production: DevOps Foundations.
//
// Completes the course to production-ready status, per
// docs/content-library/courses.md's approved 5-module breakdown. Modules
// 1 (CI/CD Fundamentals, Phase 25) and 2 (Containers/Docker, Phase 27)
// already exist and are NOT touched or duplicated — this file only adds
// Module 3 (Container Orchestration/Kubernetes), Module 4 (Infrastructure
// as Code & Configuration Management), and Module 5 (Monitoring,
// Observability & SRE Basics), plus the 3 remaining standalone Projects
// the blueprint calls for (course total: 5), created directly via the
// Phase 26 Project model, not a Lesson-workaround.
//
// Same application-level idempotency pattern as seed-phase25/27/30:
// findFirst by parent+title before create.
//
// Resources: reuses the already-verified Kubernetes documentation
// (docs/content-library/resource-verification-report.md, VERIFIED Phase
// 25). Three new resources were live-fetched and confirmed this phase:
//   - https://developer.hashicorp.com/terraform/docs — official
//     HashiCorp Terraform documentation, confirmed live via WebFetch,
//     2026-08-09.
//   - https://prometheus.io/docs/introduction/overview/ — official
//     Prometheus documentation (CNCF), confirmed live via WebFetch,
//     2026-08-09.
//   - https://sre.google/sre-book/table-of-contents/ — the official
//     Google "Site Reliability Engineering" book, free online (O'Reilly
//     Media, CC BY-NC-ND 4.0), confirmed live via WebFetch, 2026-08-09.
// No ISBN, video URL, author, or documentation link is invented anywhere
// in this file.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type QuizQuestionSeed = {
  prompt: string;
  questionType: 'single' | 'multiple' | 'text';
  options?: string[];
  correctAnswer: string[] | string;
};

type LessonSeed = {
  title: string;
  position: number;
  contentType: 'text' | 'quiz';
  body: string;
  durationSeconds: number;
  isPreview?: boolean;
  quiz?: {
    title: string;
    passingScorePercent: number;
    maxAttempts: number;
    questions: QuizQuestionSeed[];
  };
};

type ModuleSeed = {
  courseSlug: string;
  title: string;
  position: number;
  description: string;
  lessons: LessonSeed[];
};

type ProjectSeed = {
  courseSlug: string;
  title: string;
  description: string;
  instructions: string;
  position: number;
};

// ---------------------------------------------------------------------
// DevOps Foundations — Module 3: Container Orchestration (Kubernetes)
// ---------------------------------------------------------------------
const devopsModule3: ModuleSeed = {
  courseSlug: 'devops-foundations-cicd-containers',
  title: 'Container Orchestration (Kubernetes)',
  position: 3,
  description:
    'Moves from a single containerized app (Module 2) to running and scaling that app reliably across multiple machines — the real problem Kubernetes exists to solve.',
  lessons: [
    {
      title: 'Kubernetes Core Concepts: Pods, Deployments & Services',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      isPreview: true,
      body: `**Objective:** Explain what problem Kubernetes solves and correctly use its 3 most foundational objects: Pod, Deployment, Service.

**Prerequisites:** Module 2 (Containers/Docker) — specifically "What a Container Actually Is."

**Instructional content:**
A single container running on one machine (Module 2) doesn't survive that machine failing, doesn't scale beyond that machine's capacity, and gives you no automated way to roll out a new version safely. Kubernetes exists to solve exactly these 3 problems across a cluster of machines.

Three objects do most of the real work:
1. **Pod.** The smallest deployable unit — one or more tightly-coupled containers sharing network/storage. In practice, most Pods run exactly one container; a Pod is not itself resilient (a Pod that dies is simply gone) which is precisely why Pods are almost never created directly.
2. **Deployment.** Declares "I want N replicas of this Pod spec running, always" — Kubernetes continuously reconciles the real cluster state toward this declared desired state, restarting failed Pods and enabling safe rolling updates when the Pod spec changes. This is the real, direct fix for "a container that dies doesn't come back."
3. **Service.** Gives a stable network identity to a set of Pods, whose individual IP addresses change constantly as Pods are created/destroyed — without a Service, nothing else in the cluster would have a reliable way to reach a Deployment's Pods.

**Common mistakes:** creating bare Pods directly instead of a Deployment (loses the automatic-restart/scaling benefit entirely — a real, common beginner error); assuming a Pod's IP address is stable enough to hardcode anywhere (it isn't — this is exactly what a Service exists to abstract away).

**Practical example:** A Deployment declaring 3 replicas of a web app Pod: if one Pod's node crashes, Kubernetes creates a replacement Pod on a healthy node automatically, with zero manual intervention — the single-container Module 2 setup has no equivalent to this at all.

**Exercise:** Take your Module 2 Dockerfile/image. Write (on paper or in a real YAML file) a Deployment spec declaring 3 replicas of it, and a Service exposing it — you do not need a real cluster to do this exercise correctly.

**Expected outcome:** Given a running application, you can state which Kubernetes objects it needs (at minimum Deployment + Service) and why a bare Pod alone would be insufficient.

**Reading:** Kubernetes Documentation — https://kubernetes.io/docs (already verified Phase 25).

**Homework:** Keep your Deployment/Service spec — direct input to this module's project.`,
    },
    {
      title: 'Configuring Deployments: Resources, Health Checks & Scaling',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Configure a Deployment with real resource limits, health checks, and a scaling policy — not just a bare replica count.

**Prerequisites:** "Kubernetes Core Concepts: Pods, Deployments & Services."

**Instructional content:**
A Deployment with only a replica count is a minimal, fragile configuration. Three settings turn it into something production-usable:

1. **Resource requests/limits.** Declaring how much CPU/memory a Pod needs (request) and its hard ceiling (limit) lets Kubernetes schedule Pods sensibly across nodes and prevents one misbehaving Pod from starving its neighbors of resources on the same node — omitting this is a real, common cause of one runaway process taking down unrelated workloads.
2. **Health checks (liveness/readiness probes).** A **liveness probe** tells Kubernetes when to restart a Pod that's alive but stuck/deadlocked; a **readiness probe** tells Kubernetes when a Pod is ready to receive real traffic (distinct from "the process has started" — a Pod can be running but still warming up a cache, for example). Without a readiness probe, a Service may route real traffic to a Pod that isn't actually ready to serve it yet.
3. **Horizontal scaling policy.** A fixed replica count doesn't respond to real load changes — a Horizontal Pod Autoscaler (HPA) adjusts replica count based on observed CPU/memory usage (or custom metrics), within a defined min/max range you set.

**Common mistakes:** setting no resource limits at all ("it worked in testing" is not evidence it's safe under real, shared-cluster load); confusing liveness and readiness probes, or setting only one when both serve genuinely different purposes; setting an HPA's minimum too low, causing cold-start latency spikes under sudden real traffic.

**Practical example:** A Pod running a web server that occasionally deadlocks under load, with no liveness probe configured, simply stays "Running" (from Kubernetes' perspective) while actually serving zero requests — a liveness probe hitting a real health endpoint would catch and restart it automatically instead of requiring a human to notice.

**Exercise:** Extend your Lesson 1 Deployment spec with a resource request/limit, a liveness probe, a readiness probe, and an HPA policy with a stated min/max replica range and your reasoning for those bounds.

**Expected outcome:** You can explain, for any Deployment, what each of these 4 settings protects against specifically — not just that "they're best practice."

**Homework:** None — feeds into this module's project.`,
    },
    {
      title: 'Networking & Service Discovery in Kubernetes',
      position: 3,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Explain how Pods discover and reach each other inside a cluster, and how external traffic reaches a cluster from outside.

**Prerequisites:** "Kubernetes Core Concepts: Pods, Deployments & Services."

**Instructional content:**
Two distinct networking questions, each with a distinct answer:

1. **How do Pods reach each other inside the cluster?** Kubernetes' built-in DNS gives every Service a stable internal hostname — a Pod reaches another Deployment's Pods through that Service's name, not through any Pod's individual (constantly-changing) IP address. This is the direct, practical payoff of the Service object from Lesson 1.
2. **How does external traffic reach the cluster?** A plain Service (type "ClusterIP", the default) is only reachable from inside the cluster. Exposing something to the outside world needs either a "LoadBalancer"-type Service (provisions a real external load balancer, one per Service — costly at scale) or an **Ingress** (a single entry point routing external HTTP(S) traffic to multiple internal Services based on hostname/path, avoiding a separate load balancer per service).

**Common mistakes:** hardcoding a Pod's IP address anywhere in application config (Pod IPs are not stable — this will break the first time that Pod is recreated); using a "LoadBalancer"-type Service per application instead of a single shared Ingress, when multiple services need external HTTP routing — this multiplies cost and operational surface for no real benefit over a single Ingress.

**Practical example:** An application with 3 internal microservices and one public-facing API: the 3 internal services communicate via their Service DNS names ("billing-service", "inventory-service", etc.) entirely inside the cluster, while a single Ingress routes external traffic (e.g. "/api/*") to the public-facing service — only one thing is actually exposed to the internet.

**Exercise:** For a hypothetical 3-service application (one public-facing, two internal), sketch which services need a "ClusterIP" Service only, and which need external exposure via Ingress — and justify each choice.

**Expected outcome:** Given an application's real internal/external traffic needs, you can choose the correct Kubernetes networking object for each — not default to exposing everything externally out of uncertainty.

**Homework:** Bring your networking sketch into this module's project.`,
    },
    {
      title: 'Kubernetes in Practice: Debugging a Failing Deployment',
      position: 4,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Apply a systematic debugging sequence to a Kubernetes Deployment that isn't working, rather than guessing.

**Prerequisites:** All 3 prior lessons in this module.

**Instructional content:**
A Deployment can fail in a specific, checkable sequence — most real problems are found by working through it in order rather than guessing at the first plausible cause:

1. **Are the Pods even scheduled?** A Pod stuck in "Pending" means the cluster cannot place it — commonly, requested resources (from Lesson 2) exceed what any node has available.
2. **Are the Pods running but crashing?** A Pod in "CrashLoopBackOff" means the container starts and then exits repeatedly — the container's own logs (not the Kubernetes event log) usually show the real application-level error.
3. **Is the Pod running but not receiving traffic?** If Pods show "Running" but the application seems unreachable, check whether the readiness probe (Lesson 2) is passing — a Pod that's "Running" but failing its readiness check is deliberately excluded from receiving Service traffic, which is correct behavior, not a bug, once you understand why.
4. **Is the Service/networking layer correct?** Only after confirming the Pods themselves are healthy and ready does a networking misconfiguration (wrong Service selector, wrong port) become the likely remaining cause.

**Common mistakes:** jumping straight to "it's a networking problem" (step 4) without first confirming the Pods are actually healthy (steps 1-3) — this wastes real debugging time chasing the wrong layer; not reading the failing container's own application logs, which usually state the real error directly.

**Practical example:** A Deployment showing 0/3 Pods ready, all in "Running" state, is very likely a failing readiness probe (step 3) — not a networking issue (step 4) — because the Pods are demonstrably running; jumping straight to inspecting the Service configuration here would be debugging the wrong layer entirely.

**Exercise:** For each of the 4 failure symptoms above, write the one specific command/check (conceptually — exact CLI syntax is not required for this exercise) that would confirm or rule it out.

**Expected outcome:** Given any failing Deployment's symptom, you can name which of the 4 stages to check first, and why — a real, transferable debugging discipline, not memorized command syntax.

**Homework:** Keep your 4-stage debugging checklist — it's the diagnostic tool for this module's project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 5,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 3 (Container Orchestration/Kubernetes). Review lessons 1–4 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 3 Final Assessment — Container Orchestration (Kubernetes)',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'Why is a bare Pod (created directly, not via a Deployment) a real problem for production use?',
            questionType: 'single',
            options: [
              'Bare Pods are actually the recommended production approach',
              'A Pod that dies is simply gone — a Deployment is what continuously reconciles the desired replica count and restarts failed Pods',
              'Bare Pods cannot run any container image',
              'Bare Pods are only a security risk, not an availability risk',
            ],
            correctAnswer: [
              'A Pod that dies is simply gone — a Deployment is what continuously reconciles the desired replica count and restarts failed Pods',
            ],
          },
          {
            prompt: 'Which of the following are real, distinct purposes of the settings covered in this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'A readiness probe controls whether a Pod receives real traffic, distinct from whether it is merely running',
              'Resource limits prevent one misbehaving Pod from starving neighbors on the same node',
              'A liveness probe and a readiness probe are the same thing and always configured identically',
              'A Service gives a stable network identity despite individual Pod IPs constantly changing',
            ],
            correctAnswer: [
              'A readiness probe controls whether a Pod receives real traffic, distinct from whether it is merely running',
              'Resource limits prevent one misbehaving Pod from starving neighbors on the same node',
              'A Service gives a stable network identity despite individual Pod IPs constantly changing',
            ],
          },
          {
            prompt: 'True or False: an Ingress is generally preferred over one LoadBalancer-type Service per application when multiple services need external HTTP routing.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['True'],
          },
          {
            prompt: 'Scenario: a Deployment shows 0 of 3 Pods ready, but all 3 are in the "Running" state. Per this module\'s debugging sequence, what should you check first?',
            questionType: 'single',
            options: [
              'Immediately reconfigure the Service — this is always a networking problem',
              'Whether the readiness probe is passing — Pods can be Running but deliberately excluded from traffic if not yet ready',
              'Delete and recreate the entire cluster',
              'This scenario cannot actually occur',
            ],
            correctAnswer: [
              'Whether the readiness probe is passing — Pods can be Running but deliberately excluded from traffic if not yet ready',
            ],
          },
          {
            prompt: 'Practical question: why should application config generally avoid hardcoding a Pod\'s individual IP address?',
            questionType: 'text',
            correctAnswer:
              'Pod IP addresses are not stable and change whenever a Pod is recreated (e.g. after a crash or a rolling update) — a Service provides the stable network identity that should be used instead, resolved via the cluster\'s built-in DNS.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// DevOps Foundations — Module 4: Infrastructure as Code & Configuration
// Management
// ---------------------------------------------------------------------
const devopsModule4: ModuleSeed = {
  courseSlug: 'devops-foundations-cicd-containers',
  title: 'Infrastructure as Code & Configuration Management',
  position: 4,
  description:
    'Moves from manually-configured infrastructure to infrastructure defined, versioned, and reproducible as code — closing the "works on my machine" gap this course started with, at the infrastructure layer.',
  lessons: [
    {
      title: 'Infrastructure as Code: Principles & Idempotency',
      position: 1,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Explain why infrastructure as code (IaC) matters and correctly identify whether a given operation is idempotent.

**Prerequisites:** Module 3 (Container Orchestration) — IaC is commonly used to provision the cluster/infrastructure Module 3's workloads run on.

**Instructional content:**
**Infrastructure as Code** means infrastructure (servers, networks, databases, clusters) is defined in version-controlled configuration files and provisioned by running a tool against that definition — not created by hand through a cloud provider's UI. This gives infrastructure the same real benefits code already has: a reviewable history of changes, reproducibility (recreate the exact same environment from the same files), and the ability to catch a bad change in review before it's applied.

The property that makes this safe to run repeatedly is **idempotency**: applying the same configuration twice produces the same end state as applying it once, with no unintended side effect from the repeat run. An IaC tool that isn't idempotent would make every re-run of an existing configuration risky — you couldn't tell whether re-running would recreate resources that already exist correctly.

**Common mistakes:** manually changing infrastructure that's meant to be managed by IaC (a real, common source of "drift" — the code no longer matches reality, and the next IaC run may silently revert or conflict with the manual change); assuming a script is idempotent just because it "usually works" without actually verifying that running it twice produces the same result both times.

**Practical example:** A shell script that runs "create-server" unconditionally is not idempotent — running it twice creates 2 servers. A real IaC tool instead declares "this server should exist with these properties" and only takes action if the real state doesn't already match — running it twice when nothing changed does nothing the second time, which is exactly the idempotent behavior this lesson is about.

**Exercise:** For 3 hypothetical operations (creating a server, appending a line to a config file, setting a specific environment variable's value), state whether each is naturally idempotent as described, and if not, how you'd make it idempotent.

**Expected outcome:** Given any infrastructure-provisioning operation, you can correctly judge whether it's idempotent and explain why that property matters for safe repeated automation.

**Reading:** HashiCorp Terraform Documentation — https://developer.hashicorp.com/terraform/docs (live-verified this phase).

**Homework:** Keep your idempotency analysis — direct input to Lesson 2.`,
    },
    {
      title: 'Writing and Structuring Terraform Configurations',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Structure a basic Terraform configuration using resources, variables, and state correctly.

**Prerequisites:** "Infrastructure as Code: Principles & Idempotency."

**Instructional content:**
Terraform (a widely-used, real IaC tool) organizes a configuration around 3 core concepts:

1. **Resources.** Each declares one real infrastructure object (a server, a network, a database instance) and its desired properties — this is the direct, declarative expression of "this should exist with these properties" from Lesson 1.
2. **Variables.** Parameterize a configuration so the same resource definitions can be reused across environments (e.g. staging vs. production) by supplying different variable values, rather than duplicating the whole configuration per environment.
3. **State.** Terraform tracks what it believes currently exists in a state file, comparing it against your configuration to determine what to create/change/destroy on each run — this state file is itself a critical, sensitive artifact (it can contain resource details) and must be stored securely and consistently accessible to anyone running Terraform against that infrastructure, not left on one person's laptop.

**Common mistakes:** duplicating an entire configuration file per environment instead of parameterizing with variables (any real change then has to be made in multiple places, and they drift); treating the state file as disposable or storing it insecurely (losing it means Terraform no longer knows what it manages, and a mismanaged/leaked state file is a real security exposure since it can contain sensitive resource attributes).

**Practical example:** A staging and production environment that need the same server type but different instance counts should share one resource definition parameterized by an "instance_count" variable, with each environment supplying its own value — not two nearly-identical copies of the same configuration file that will inevitably drift apart over time.

**Exercise:** Sketch (in real or pseudo-Terraform syntax) a resource definition for a server, parameterized by at least one variable (e.g. instance count or size), usable for both a staging and production environment with different variable values.

**Expected outcome:** You can explain what resources, variables, and state each do in a real IaC tool, and why conflating "different environment" with "different configuration file" is a design mistake.

**Reading:** HashiCorp Terraform Documentation — https://developer.hashicorp.com/terraform/docs (same resource as the previous lesson).

**Homework:** None — feeds into this module's project.`,
    },
    {
      title: 'Configuration Management vs. Provisioning',
      position: 3,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Correctly distinguish provisioning infrastructure from configuring what runs on it, and identify which tool category solves which problem.

**Prerequisites:** "Writing and Structuring Terraform Configurations."

**Instructional content:**
Two related but genuinely distinct problems, often confused by newcomers:

1. **Provisioning** — creating the infrastructure itself (a server, a network, a managed database) from nothing. This is what Terraform (Lesson 2) and similar IaC tools do.
2. **Configuration management** — once infrastructure exists, ensuring the right software is installed and correctly configured on it (packages, config files, running services) and keeping it that way over time, including on infrastructure that already existed before the configuration-management tool was introduced.

These are complementary, not competing — a real pipeline commonly provisions a server with an IaC tool, then hands off to a configuration-management tool to install and configure what runs on it. Using a provisioning tool for ongoing configuration management (or vice versa) is possible but usually awkward — each category's tools are specifically designed around its own problem's shape.

**Common mistakes:** treating "provisioning" and "configuration management" as interchangeable terms for "infrastructure automation" (they solve genuinely different problems, and conflating them makes it harder to reason about which tool a given task actually needs); manually configuring a server after Terraform provisions it, defeating the reproducibility Module 4 exists to establish — this is the same "drift" mistake from Lesson 1, recurring at the software-configuration layer instead of the infrastructure layer.

**Practical example:** Terraform provisions a new virtual machine (provisioning); a configuration-management tool then installs the required runtime, deploys the application's configuration files, and ensures a specific service is running and enabled (configuration management) — treating both steps as "just Terraform's job" or "just the configuration tool's job" misunderstands what each is actually designed to do well.

**Exercise:** For a hypothetical new server that needs to run this course's Module 2 containerized app, list which steps are provisioning and which are configuration management, in order.

**Expected outcome:** Given any infrastructure-automation task, you can correctly classify it as provisioning, configuration management, or both — and explain why the distinction matters for tool choice.

**Homework:** Bring your provisioning/configuration-management breakdown into this module's project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 4 (Infrastructure as Code & Configuration Management). Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 4 Final Assessment — Infrastructure as Code & Configuration Management',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'What does it mean for an infrastructure-provisioning operation to be idempotent, per this module?',
            questionType: 'single',
            options: [
              'It runs faster on the second execution',
              'Applying the same configuration twice produces the same end state as applying it once, with no unintended side effect from the repeat run',
              'It can only be run exactly once, ever',
              'It requires no configuration file at all',
            ],
            correctAnswer: [
              'Applying the same configuration twice produces the same end state as applying it once, with no unintended side effect from the repeat run',
            ],
          },
          {
            prompt: 'Which of the following are real roles that Terraform variables and state each play, per this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'Variables let the same resource definitions be reused across environments with different values',
              'State tracks what Terraform believes currently exists, to determine what to create/change/destroy',
              'The state file is a disposable, non-sensitive artifact safe to discard at any time',
              'Resources declare the desired properties of one real infrastructure object',
            ],
            correctAnswer: [
              'Variables let the same resource definitions be reused across environments with different values',
              'State tracks what Terraform believes currently exists, to determine what to create/change/destroy',
              'Resources declare the desired properties of one real infrastructure object',
            ],
          },
          {
            prompt: 'True or False: provisioning and configuration management solve the same problem and are fully interchangeable terms.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Scenario: a team manually edits a config file directly on a server that is also managed by an IaC tool. What real problem does this module say this causes?',
            questionType: 'single',
            options: [
              'No problem — manual edits are always safe',
              'It causes "drift" — the code no longer matches reality, and the next automated run may silently revert or conflict with the manual change',
              'It only matters if the server is in production',
              'IaC tools automatically detect and merge manual changes correctly in all cases',
            ],
            correctAnswer: [
              'It causes "drift" — the code no longer matches reality, and the next automated run may silently revert or conflict with the manual change',
            ],
          },
          {
            prompt: 'Practical question: why should a staging and production environment generally share one parameterized resource definition rather than two separate configuration files?',
            questionType: 'text',
            correctAnswer:
              'Two nearly-identical configuration files inevitably drift apart over time as changes are made in one but not the other, whereas a single definition parameterized by environment-specific variables keeps both environments consistent by construction.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// DevOps Foundations — Module 5: Monitoring, Observability & SRE Basics
// ---------------------------------------------------------------------
const devopsModule5: ModuleSeed = {
  courseSlug: 'devops-foundations-cicd-containers',
  title: 'Monitoring, Observability & SRE Basics',
  position: 5,
  description:
    'Closes the course by making sure the pipeline, containers, and infrastructure built in Modules 1–4 can actually be observed and reliably operated, not just deployed.',
  lessons: [
    {
      title: 'The Three Pillars of Observability: Metrics, Logs & Traces',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Correctly choose between metrics, logs, and traces for a given real observability question.

**Prerequisites:** Module 3 (Container Orchestration) — the deployed service this module observes is the same kind of service Module 3 deployed.

**Instructional content:**
**Observability** means being able to answer real questions about a running system's behavior — not just "is it up," but "why is it slow for this specific user right now." Three complementary data types each answer a different kind of question:

1. **Metrics.** Numeric measurements over time (request rate, error rate, CPU usage) — cheap to store and query, ideal for dashboards and alerting on aggregate system health, but they answer "what" and "how much," not "why for this specific request."
2. **Logs.** Discrete, timestamped event records — good for answering "what exactly happened" for a specific event, but expensive to store at high volume and slow to search across a large time range without good structure/indexing.
3. **Traces.** Follow one specific request's path through multiple services, showing where time was actually spent across service boundaries — the direct answer to "why was this one request slow," which metrics and logs alone typically cannot answer for a multi-service system.

**Common mistakes:** relying on logs alone for system health monitoring (technically possible but expensive and slow compared to metrics, which exist specifically for this purpose); having no tracing at all in a multi-service system and then being unable to answer "which of these 4 services is actually the slow one" for a specific slow request, resorting to guesswork instead.

**Practical example:** "Is the API's error rate elevated right now" is a metrics question (a dashboard answers it instantly). "What exactly happened at 14:32:07 to user 4821's specific request" is a logs question. "Why did this one specific checkout request take 4 seconds, and which of the 5 services it touched was responsible" is a tracing question — none of the 3 data types substitutes for the other two.

**Exercise:** For 4 example questions (system-wide error rate trend, one specific failed request's full detail, which of several microservices is the bottleneck for a slow request, overall CPU usage trend), state which of the 3 pillars answers each.

**Expected outcome:** Given a real operational question, you can identify which of the 3 observability pillars actually answers it, rather than defaulting to whichever one you happen to have configured.

**Reading:** Prometheus Documentation — https://prometheus.io/docs/introduction/overview/ (live-verified this phase; a real, widely-used metrics system).

**Homework:** Keep your 4-question mapping — direct input to this module's project.`,
    },
    {
      title: 'Alerting That Doesn\'t Cry Wolf',
      position: 2,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Design an alert that fires on a real, actionable problem — not one that trains its on-call recipients to ignore it.

**Prerequisites:** "The Three Pillars of Observability: Metrics, Logs & Traces."

**Instructional content:**
An alert exists to interrupt a real human because something needs their attention now. Two properties determine whether an alerting setup is actually useful over time:

1. **Alert on symptoms, not every possible cause.** "Error rate exceeded 5% for 5 minutes" is a real, user-facing symptom worth an interruption. "CPU usage briefly spiked to 80%" is a possible cause of a future problem, not evidence one is currently occurring — alerting on every plausible cause rather than actual symptoms produces far more alerts than genuine incidents.
2. **Every alert needs a clear, specific action.** An alert that fires but has no defined next step (or one that the recipient has learned, from experience, doesn't actually indicate a real problem) trains people to ignore alerts generally — a real, well-documented failure mode called **alert fatigue**, where the danger isn't any single false alarm but that real alerts eventually get ignored too, indistinguishable from the noise.

**Common mistakes:** alerting on every metric that *could* theoretically indicate a problem, rather than the smaller set that reliably does; setting alert thresholds so sensitively that transient, self-resolving blips fire pages regularly, which is the single most common direct cause of alert fatigue.

**Practical example:** Paging someone at 3am because CPU briefly touched 85% for 30 seconds and then returned to normal on its own trains that person to distrust future 3am pages — a genuinely useful alert threshold (e.g. sustained elevated error rate for 5+ minutes) would not have fired for this transient, self-resolved blip at all.

**Exercise:** Take 3 hypothetical metrics (CPU usage, error rate, request latency). For each, write a specific alerting condition (metric + threshold + duration) that would avoid firing on a brief, self-resolving blip while still catching a real, sustained problem.

**Expected outcome:** Given a metric, you can design an alert condition that targets real, actionable problems rather than every statistically-possible anomaly.

**Homework:** None — feeds into Lesson 3.`,
    },
    {
      title: 'SRE Fundamentals: SLIs, SLOs & Error Budgets',
      position: 3,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Define a real SLI/SLO pair and explain how an error budget resolves the tension between reliability and shipping new changes.

**Prerequisites:** "Alerting That Doesn't Cry Wolf."

**Instructional content:**
Site Reliability Engineering (SRE) formalizes "how reliable is reliable enough" with 3 connected concepts:

1. **SLI (Service Level Indicator).** A specific, measured metric of user-facing behavior — e.g. "percentage of requests served in under 300ms," or "percentage of requests returning a successful response." An SLI must be something you can actually measure from real traffic, not an aspiration.
2. **SLO (Service Level Objective).** A target value for an SLI over a defined window — e.g. "99.9% of requests succeed, measured over a rolling 30 days." Crucially, an SLO is deliberately set below 100% — 100% reliability is not just expensive but, per widely-cited SRE practice, actively the wrong target, since it leaves zero room for the deployment risk any real change carries.
3. **Error budget.** The inverse of the SLO — if the SLO is 99.9%, the error budget is the remaining 0.1% of allowed failure over that window. This budget is a genuinely useful decision tool, not just a number: while budget remains, the team can ship changes at normal velocity; once the budget is exhausted, the team's priority shifts to reliability work until it recovers.

**Common mistakes:** targeting 100% reliability as if it were the ideal goal, when per SRE practice it eliminates any room for the deployment risk inherent in shipping real changes; treating the error budget as a target to explicitly spend down for its own sake, rather than a constraint that exists to make the reliability-vs-velocity tradeoff explicit and measurable rather than an unstated argument.

**Practical example:** A team with an exhausted error budget (this month's incidents already used up the full 0.1% allowance) should, per this framework, pause new feature launches and prioritize reliability fixes until the budget recovers — shipping another risky change on top of an already-exhausted budget directly contradicts what the error budget is for.

**Exercise:** Define one real SLI (a specific, measurable behavior) and a corresponding SLO (a target percentage and time window) for a hypothetical API. State what the resulting error budget is and one concrete decision it should influence.

**Expected outcome:** You can define a real SLI/SLO pair (not a vague reliability aspiration) and explain, in your own words, what decision the resulting error budget is actually for.

**Reading:** Google, "Site Reliability Engineering" (the SRE Book), free official edition — https://sre.google/sre-book/table-of-contents/ (live-verified this phase; O'Reilly Media, CC BY-NC-ND 4.0).

**Homework:** Bring your SLI/SLO/error-budget definition into this module's project — the closing deliverable of this course.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 5 (Monitoring, Observability & SRE Basics) — the final module of DevOps Foundations. Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 5 Final Assessment — Monitoring, Observability & SRE Basics',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'Which observability pillar most directly answers "why was this one specific request slow, and which of several services was responsible"?',
            questionType: 'single',
            options: [
              'Metrics',
              'Tracing',
              'Logs alone, always',
              'None of the three can answer this',
            ],
            correctAnswer: ['Tracing'],
          },
          {
            prompt: 'Which of the following are real causes of alert fatigue, per this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'Alerting on every plausible cause rather than actual user-facing symptoms',
              'Setting thresholds so sensitively that brief, self-resolving blips regularly trigger pages',
              'Having too few alerts configured',
              'Alerts with no clear, defined next action',
            ],
            correctAnswer: [
              'Alerting on every plausible cause rather than actual user-facing symptoms',
              'Setting thresholds so sensitively that brief, self-resolving blips regularly trigger pages',
              'Alerts with no clear, defined next action',
            ],
          },
          {
            prompt: 'True or False: per SRE practice, targeting 100% reliability is actively the wrong target for most services.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['True'],
          },
          {
            prompt: 'Scenario: a team\'s error budget for this month is already fully exhausted. What does this module say should happen next?',
            questionType: 'single',
            options: [
              'Nothing changes — error budgets are purely informational',
              'The team should shift priority to reliability work until the budget recovers, rather than shipping more risky changes',
              'The SLO should immediately be lowered to 0%',
              'The team should ship changes faster to compensate',
            ],
            correctAnswer: [
              'The team should shift priority to reliability work until the budget recovers, rather than shipping more risky changes',
            ],
          },
          {
            prompt: 'Practical question: why must an SLI be something you can actually measure from real traffic, rather than an aspiration?',
            questionType: 'text',
            correctAnswer:
              'An SLO and its resulting error budget are only meaningful if the underlying SLI reflects real, measured user-facing behavior — an aspirational or unmeasurable SLI cannot be tracked against a target or used to make the reliability-versus-velocity tradeoff decisions the error budget exists for.',
          },
        ],
      },
    },
  ],
};

const MODULES: ModuleSeed[] = [devopsModule3, devopsModule4, devopsModule5];

// ---------------------------------------------------------------------
// DevOps Foundations — 3 new standalone Projects (Phase 26 architecture,
// real instructions, no sourceLessonId), bringing the course to its
// blueprint total of 5 projects.
// ---------------------------------------------------------------------
const PROJECTS: ProjectSeed[] = [
  {
    courseSlug: 'devops-foundations-cicd-containers',
    title: 'Deploy and Scale a Service on Kubernetes',
    description:
      'Intermediate tier — deploy your Module 2 containerized app to Kubernetes with real resource limits, health checks, and a scaling policy.',
    instructions: `**Objective:** Take the containerized application from Module 2 and deploy it to Kubernetes as a properly-configured Deployment and Service, applying Module 3's real reliability settings — not just a bare replica count.

**Requirements:**
- A Deployment spec for your Module 2 container image, with a stated, justified replica count.
- Resource requests and limits set for the container (per Module 3, Lesson 2), with your reasoning for the chosen values.
- Both a liveness probe and a readiness probe configured, each targeting a real health-check behavior of your application (not the same trivial check for both, unless you can justify why that's actually correct for your app).
- A Service exposing the Deployment, with a stated choice of type (ClusterIP/LoadBalancer/Ingress) justified by whether the service needs external access.
- A written walkthrough of your Module 3, Lesson 4 debugging checklist applied to at least one real or simulated failure you introduced deliberately (e.g. a broken readiness probe) and resolved.

**Expected result:** Your Deployment/Service configuration (real YAML, or a clearly-specified pseudo-config if a real cluster isn't available) plus a written explanation of your resource/probe/networking choices and the debugging walkthrough.

**Difficulty:** Intermediate.

**Skills tested:** translating a container into a real Kubernetes deployment, configuring meaningful reliability settings (not defaults), applying a systematic debugging process to a real or simulated failure.

**Suggested implementation steps:**
1. Start from your actual Module 2 image — don't build a new one for this project.
2. Write the Deployment spec with resource limits and both probes before worrying about networking.
3. Choose and justify your Service type based on whether this specific app needs external access.
4. Deliberately break one thing (e.g. misconfigure the readiness probe), then walk through your Module 3 debugging checklist to find and fix it — document the process, not just the fix.

**Evaluation criteria:** resource/probe settings are genuinely justified for this specific application, not copy-pasted defaults; the networking choice matches the app's real external-access needs; the debugging walkthrough demonstrates the systematic sequence from Module 3, not just a lucky guess.`,
    position: 3,
  },
  {
    courseSlug: 'devops-foundations-cicd-containers',
    title: 'Provision Infrastructure as Code',
    description:
      'Advanced tier — define real infrastructure (even if only planned/simulated) as idempotent, parameterized code, reusable across at least two environments.',
    instructions: `**Objective:** Define infrastructure for the application built across this course as code — idempotent, version-controllable, and reusable across at least a staging and a production environment via parameterization, not duplication.

**Requirements:**
- A resource definition (real Terraform, or clearly-specified pseudo-IaC if a real cloud account isn't available) for the infrastructure your Module 3 Kubernetes deployment would need to run on.
- At least one variable parameterizing a value that differs between environments (e.g. instance size, replica count) — used by both a staging and a production configuration, not duplicated files.
- A written idempotency analysis: for each resource you define, explain what happens if the configuration is applied twice in a row with no changes — and confirm it is genuinely idempotent, not just assumed to be.
- A short written explanation distinguishing which parts of your setup are provisioning versus configuration management (per Module 4, Lesson 3), and which tool/approach handles each.

**Expected result:** Your parameterized infrastructure definition (real or clearly-specified pseudo-code) plus the written idempotency analysis and provisioning/configuration-management breakdown.

**Difficulty:** Advanced.

**Skills tested:** structuring a real IaC configuration with resources/variables, reasoning rigorously about idempotency rather than assuming it, correctly distinguishing provisioning from configuration management.

**Suggested implementation steps:**
1. Identify the actual infrastructure your Module 3 deployment needs (cluster, network, any managed services).
2. Write one parameterized resource definition, not separate per-environment files.
3. For each resource, explicitly reason through the "applied twice" idempotency question — don't just assert it.
4. Write the provisioning-vs-configuration-management breakdown last, once your actual setup is defined.

**Evaluation criteria:** genuine parameterization (not disguised duplication), a real, specific idempotency analysis per resource (not a generic statement that "Terraform is idempotent"), and a correct provisioning/configuration-management distinction grounded in your own actual setup.`,
    position: 4,
  },
  {
    courseSlug: 'devops-foundations-cicd-containers',
    title: 'Observability Stack for a Real Service',
    description:
      'Professional Capstone — define a real SLI/SLO, meaningful alerts, and the metrics/logs/tracing coverage needed to operate the service this course has built, end to end.',
    instructions: `**Objective:** Design a real observability setup — metrics, alerting, and an SLI/SLO/error-budget definition — for the service built across this course, closing the loop from Module 1's CI/CD pipeline through to Module 5's operational reliability practices.

**Requirements:**
- At least one real SLI (a specific, measurable user-facing behavior) and a corresponding SLO (target percentage + time window), per Module 5, Lesson 3 — not a vague reliability aspiration.
- The resulting error budget, stated explicitly, and one concrete decision it should influence (e.g. "if exhausted, pause the next planned feature release").
- At least 2 alert definitions (metric + threshold + duration), each justified against the alert-fatigue principles from Module 5, Lesson 2 — explain specifically why each would NOT fire on a brief, self-resolving blip.
- A mapping of at least 4 real operational questions about your service to which of the 3 observability pillars (metrics/logs/traces) answers each, per Module 5, Lesson 1.
- A short written reflection connecting this project back to the full course: how would this observability setup have helped diagnose a failure at each of Modules 1–4's stages (pipeline, container, orchestration, infrastructure)?

**Expected result:** A written observability design document covering all 5 requirements above, for the application/service used throughout this course (or a clearly-stated hypothetical if a fully real service isn't available).

**Difficulty:** Professional Capstone.

**Skills tested:** defining meaningful, measurable reliability targets; designing alerts that avoid alert fatigue; correctly matching observability tooling to the question being asked; synthesizing the full course's pipeline-to-production arc into one coherent operational picture.

**Suggested implementation steps:**
1. Define your SLI/SLO/error budget first — everything else in this project should support making that target achievable and visible.
2. Design your 2+ alerts against real, specific symptoms tied to your SLI, not generic infrastructure metrics.
3. Build the 4-question observability-pillar mapping using real questions you'd actually need answered for this service.
4. Write the closing reflection last, once the rest of the design is concrete.

**Evaluation criteria:** the SLI/SLO pair is genuinely measurable and specific; alerts are justified against real alert-fatigue reasoning, not just plausible-sounding thresholds; the pillar mapping correctly matches question type to data type; the closing reflection demonstrates real synthesis across the whole course, not a generic summary.`,
    position: 5,
  },
];

async function main(): Promise<void> {
  let modulesCreated = 0;
  let lessonsCreated = 0;
  let quizzesCreated = 0;
  let questionsCreated = 0;
  let projectsCreated = 0;
  let projectsSkipped = 0;

  for (const moduleSeed of MODULES) {
    const course = await prisma.course.findUnique({ where: { slug: moduleSeed.courseSlug } });
    if (!course) {
      console.warn(`WARNING: course "${moduleSeed.courseSlug}" not found — skipping module "${moduleSeed.title}".`);
      continue;
    }

    let module_ = await prisma.module.findFirst({
      where: { courseId: course.id, title: moduleSeed.title },
    });
    if (!module_) {
      module_ = await prisma.module.create({
        data: {
          courseId: course.id,
          title: moduleSeed.title,
          position: moduleSeed.position,
          description: moduleSeed.description,
        },
      });
      modulesCreated += 1;
      console.log(`  Created module: ${module_.title} (course: ${course.title})`);
    } else {
      console.log(`  Module already exists, skipping create: ${module_.title}`);
    }

    for (const lessonSeed of moduleSeed.lessons) {
      let lesson = await prisma.lesson.findFirst({
        where: { moduleId: module_.id, title: lessonSeed.title },
      });
      if (!lesson) {
        lesson = await prisma.lesson.create({
          data: {
            moduleId: module_.id,
            title: lessonSeed.title,
            position: lessonSeed.position,
            contentType: lessonSeed.contentType,
            body: lessonSeed.body,
            durationSeconds: lessonSeed.durationSeconds,
            isPreview: lessonSeed.isPreview ?? false,
          },
        });
        lessonsCreated += 1;
        console.log(`    Created lesson: ${lesson.title}`);
      }

      if (lessonSeed.quiz) {
        let quiz = await prisma.quiz.findFirst({
          where: { lessonId: lesson.id, title: lessonSeed.quiz.title },
        });
        if (!quiz) {
          quiz = await prisma.quiz.create({
            data: {
              lessonId: lesson.id,
              title: lessonSeed.quiz.title,
              passingScorePercent: lessonSeed.quiz.passingScorePercent,
              maxAttempts: lessonSeed.quiz.maxAttempts,
            },
          });
          quizzesCreated += 1;
          console.log(`      Created quiz: ${quiz.title}`);

          let position = 1;
          for (const q of lessonSeed.quiz.questions) {
            await prisma.quizQuestion.create({
              data: {
                quizId: quiz.id,
                prompt: q.prompt,
                questionType: q.questionType,
                options: q.options ?? undefined,
                correctAnswer: q.correctAnswer as unknown as object,
                position: position++,
              },
            });
            questionsCreated += 1;
          }
        }
      }
    }
  }

  for (const projectSeed of PROJECTS) {
    const course = await prisma.course.findUnique({ where: { slug: projectSeed.courseSlug } });
    if (!course) {
      console.warn(`WARNING: course "${projectSeed.courseSlug}" not found — skipping project "${projectSeed.title}".`);
      continue;
    }

    const existing = await prisma.project.findFirst({
      where: { courseId: course.id, title: projectSeed.title },
    });
    if (existing) {
      projectsSkipped += 1;
      console.log(`  Project already exists, skipping create: ${existing.title}`);
      continue;
    }

    const project = await prisma.project.create({
      data: {
        courseId: course.id,
        title: projectSeed.title,
        description: projectSeed.description,
        instructions: projectSeed.instructions,
        status: 'published',
        position: projectSeed.position,
        // sourceLessonId deliberately omitted — real, standalone Project
        // rows via the Phase 26 architecture, matching Phase 27/30's
        // precedent for this course.
      },
    });
    projectsCreated += 1;
    console.log(`  Created standalone project (Phase 26 architecture, not lesson-based): ${project.title}`);
  }

  console.log(
    `\nPhase 31 content seed complete: ${modulesCreated} modules created, ${lessonsCreated} lessons created, ${quizzesCreated} quizzes created, ${questionsCreated} quiz questions created, ${projectsCreated} projects created (${projectsSkipped} already existed).`,
  );
}

main()
  .catch((error) => {
    console.error('Phase 31 seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
