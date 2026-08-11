// Phase 39 — Cloud Engineer Learning Path Production.
//
// Per docs/content-library/phase35-learning-path-master-blueprint.md
// Section 7 (Cloud Engineer Blueprint): this path needs 4 courses total,
// "2 new + 2 reused." Direct inspection before writing this file
// confirmed one of the "2 new" courses (Programming Foundations) was
// already built in Phase 36, for the Frontend Engineer path. That
// leaves exactly ONE genuinely new course for Phase 39: "Cloud
// Computing Foundations: AWS, Azure & GCP" (per docs/content-library/
// courses.md entry #4).
//
// Duplication check performed before writing this course (not assumed):
// DevOps Foundations Module 4 ("Infrastructure as Code & Configuration
// Management," Phase 31) already teaches general IaC principles and
// Terraform syntax in depth. This course's own Module 4 ("Infrastructure
// as Code & Cost Management") does NOT re-teach Terraform basics — it
// assumes that skill already exists and focuses specifically on
// cloud-provider-specific resource modeling/state/drift and cost
// management, exactly as docs/content-library/phase35-learning-path-
// master-blueprint.md's own "Real, checked overlap note" (Section 7)
// requires of whichever phase eventually authored this course.
//
// This file:
//   1. Creates "Cloud Computing Foundations: AWS, Azure & GCP" (5
//      modules, provider-agnostic-first structure per courses.md).
//   2. Creates the new "Cloud Engineer" LearningPath — no existing path
//      is a real fit (confirmed by direct query: none of the 5 existing
//      paths contain this exact 4-course combination), linking
//      Programming Foundations -> Computer Networking Foundations ->
//      Cloud Computing Foundations -> DevOps Foundations, per the
//      blueprint's own specified sequence.
//
// Idempotency: same application-level pattern as Phases 36-38 —
// findFirst by parent+title before create for module/lesson/quiz/
// project; findUnique by slug for the new course; findUnique by slug
// for the new LearningPath; whole-path membership guard (new path, zero
// pre-existing memberships), matching Phase 37/38's pattern.

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
  title: string;
  position: number;
  description: string;
  lessons: LessonSeed[];
};

type ProjectSeed = {
  title: string;
  description: string;
  instructions: string;
  position: number;
};

const COURSE_SLUG = 'cloud-computing-foundations-aws-azure-gcp';
const COURSE_TITLE = 'Cloud Computing Foundations: AWS, Azure & GCP';
const INSTRUCTOR_EMAIL = 'e2e.instructor@phoenix.test';

// ---------------------------------------------------------------------
// Module 1: Cloud Fundamentals & Shared Responsibility
// ---------------------------------------------------------------------
const module1: ModuleSeed = {
  title: 'Cloud Fundamentals & Shared Responsibility',
  position: 1,
  description:
    'Starts provider-agnostic: what cloud computing actually is, the three service models, and the one security concept every cloud incident post-mortem eventually comes back to — who is responsible for what.',
  lessons: [
    {
      title: 'What Is Cloud Computing? IaaS, PaaS, and SaaS, and the Shared Responsibility Model',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      isPreview: true,
      body: `**What is this lesson about, in one sentence?** What "the cloud" actually means in concrete, technical terms, and the one security idea (shared responsibility) that determines what you are personally on the hook for once you use it.

**Prerequisites:** Computer Networking Foundations — cloud services are, underneath, real servers reachable over the same real internet that course covered.

**The concept, explained simply:**
**Cloud computing** means renting computing resources (servers, storage, databases, networking) from a provider over the internet, on demand, instead of buying and operating your own physical hardware. The official NIST definition describes it as "on-demand network access to a shared pool of configurable computing resources" — the key words being *on-demand* (you provision it in minutes, not months) and *shared pool* (the provider's infrastructure serves many customers, not just you).

**Why do we need this?** Before cloud computing, running a real application meant buying physical servers, racking them in a data center, and provisioning far more capacity than you needed on day one just in case you grew — a slow, expensive, and risky way to start. Cloud computing lets you start small and scale exactly as real demand grows, paying only for what you actually use.

**How does it actually work?** Cloud services come in 3 real, standard service models: **IaaS** (Infrastructure as a Service — you rent raw virtual machines and networking, and manage the operating system and everything above it yourself, e.g. a plain virtual server), **PaaS** (Platform as a Service — the provider also manages the operating system and runtime, you just deploy your code, e.g. a managed web-app hosting service), and **SaaS** (Software as a Service — you use a complete, already-built application over the internet, e.g. an email service). Each model gives you less control but less operational responsibility than the one before it.

**The shared responsibility model:** in every one of these 3 models, security responsibility is genuinely split between you and the provider, not owned entirely by either side. The provider is always responsible for the security *of* the cloud (the physical data centers, the underlying hardware, the virtualization layer). You are always responsible for security *in* the cloud — and exactly how much of "in the cloud" is yours depends on the service model: with IaaS, you're responsible for almost everything above the hypervisor (OS patching, network configuration, application security); with SaaS, you're mostly only responsible for your own data and who you grant access to.

**A simple everyday example:** Renting an apartment (IaaS-like: you're responsible for what happens inside your unit — locking your own door, not leaving valuables out) versus staying in a hotel (SaaS-like: the hotel handles almost everything, you're mainly responsible for your own belongings and not propping the door open for a stranger).

**A technical example:** If you rent a raw virtual machine (IaaS) and never apply security patches to its operating system, and it gets compromised through a known, unpatched vulnerability, that is genuinely your responsibility, not the cloud provider's — the provider secured the physical hardware your VM runs on, but never touched your VM's own operating system.

**Common mistakes:** assuming "the cloud is secure" means everything is automatically the provider's problem — a real, common, and genuinely dangerous misunderstanding, since misconfigured storage, weak identity permissions, and unpatched software are consistently the actual root cause of real cloud security incidents, not a failure of the provider's underlying infrastructure; confusing IaaS/PaaS/SaaS as a strict quality ranking rather than a genuine tradeoff between control and operational responsibility.

**When do we use which model?** IaaS when you need real control over the operating system and runtime; PaaS when you want to focus on your application code and let the provider handle the OS/runtime; SaaS when an existing, complete application already does exactly what you need.

**How do we know we understood this?** Given a real scenario, you can correctly identify which service model it represents, and state specifically which parts of security responsibility are yours versus the provider's.

**Mini exercise:** For a team that wants to run a custom backend API with full control over its operating system's installed packages, which service model fits, and what specific security responsibilities would be theirs (not the provider's)?

**Reading:** NIST SP 800-145, "The NIST Definition of Cloud Computing" — https://csrc.nist.gov/pubs/sp/800/145/final (live-verified this phase; the official U.S. government standard defining these exact service models).`,
    },
    {
      title: 'Choosing a Cloud Provider: AWS, Azure, and GCP Side by Side',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** Why this course teaches concepts provider-agnostically first, and how the 3 major providers' terminology maps onto the same real underlying ideas.

**Prerequisites:** "What Is Cloud Computing? IaaS, PaaS, and SaaS, and the Shared Responsibility Model."

**The concept, explained simply:**
The 3 major cloud providers — **AWS** (Amazon Web Services), **Azure** (Microsoft), and **GCP** (Google Cloud Platform) — all offer the same real underlying categories of service (compute, storage, networking, identity), but under different product names. Learning the *concept* first (e.g. "a managed relational database service") makes learning any specific provider's version of it (AWS RDS, Azure SQL Database, GCP Cloud SQL) a matter of vocabulary, not new understanding.

**Why do we need this?** A real, common, and genuinely risky mistake is learning one provider's specific product names as if they *were* the underlying concept — this leaves you unable to transfer your knowledge if a job, project, or company uses a different provider, even though the real skill (knowing what a managed database service is *for*) is identical everywhere.

**How does it actually work?** Every module in this course after this one teaches the real underlying concept first (e.g. "object storage," "virtual private networking," "identity and access management"), then names each of the 3 providers' real product for it, so you can recognize the same idea regardless of which provider a real job or project happens to use.

**A simple everyday example:** Learning "how a car's engine, brakes, and steering work" transfers to driving any specific car brand; memorizing only "how to drive a 2024 Toyota Corolla specifically" does not transfer nearly as well to a different car.

**A technical example:** "A managed, horizontally-scalable NoSQL document database" is the real concept; AWS calls its version DynamoDB, Azure calls its version Cosmos DB, GCP calls its version Firestore — same real underlying idea, 3 different product names.

**Common mistakes:** treating "I know AWS" and "I know cloud computing" as the same claim — a real, common overstatement; picking a provider to specialize in before understanding the shared underlying concepts, which makes that specialization more fragile and harder to transfer later.

**When do we pick one specific provider to specialize in?** After understanding the shared concepts this course teaches — at that point, specializing in whichever provider a real job or project actually uses becomes a fast, low-risk process of learning that provider's specific product names and console/CLI.

**How do we know we understood this?** Given a described cloud service in plain language (e.g. "a place to store files that any application can read over the internet"), you can name the real underlying category it belongs to, without needing to know any single provider's specific product name for it yet.

**Mini exercise:** Without looking anything up, guess what real underlying category of service each of these product names probably belongs to, based on the pattern this lesson describes: AWS Lambda, Azure Functions, GCP Cloud Functions.

**Reading:** official AWS, Azure, and GCP documentation (all live-verified this phase, cited fully in later modules as each concept is introduced).

**Homework:** Keep your Module 2's real service comparisons — this lesson sets up the provider-agnostic-first approach the rest of the course follows.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 3,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 1 (Cloud Fundamentals & Shared Responsibility). Review lessons 1–2 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 1 Final Assessment — Cloud Fundamentals & Shared Responsibility',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'Which service model gives you the most control over the operating system, but also the most operational responsibility?',
            questionType: 'single',
            options: ['SaaS', 'PaaS', 'IaaS', 'They all give equal control'],
            correctAnswer: ['IaaS'],
          },
          {
            prompt: 'Scenario: a team rents a raw virtual machine (IaaS) and never applies security patches to its operating system, and it is later compromised through a known, unpatched vulnerability. Per the shared responsibility model, whose responsibility was this?',
            questionType: 'single',
            options: [
              'The cloud provider\'s, since the VM runs on their infrastructure',
              'The team\'s, since OS patching on a rented IaaS virtual machine is their responsibility, not the provider\'s',
              'Nobody\'s — this cannot be prevented',
              'It depends on which provider was used',
            ],
            correctAnswer: [
              'The team\'s, since OS patching on a rented IaaS virtual machine is their responsibility, not the provider\'s',
            ],
          },
          {
            prompt: 'Which of the following are true about this course\'s provider-agnostic-first approach, per this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'AWS, Azure, and GCP offer the same real underlying categories of service under different product names',
              'Learning the underlying concept first makes learning any specific provider\'s version mostly a matter of vocabulary',
              'Knowing one provider\'s specific product names is the same as understanding cloud computing generally',
              'The real skill of knowing what a managed database service is for is identical across providers',
            ],
            correctAnswer: [
              'AWS, Azure, and GCP offer the same real underlying categories of service under different product names',
              'Learning the underlying concept first makes learning any specific provider\'s version mostly a matter of vocabulary',
              'The real skill of knowing what a managed database service is for is identical across providers',
            ],
          },
          {
            prompt: 'True or False: "the cloud is secure" means the cloud provider is automatically responsible for all security issues.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Practical question: why does the shared responsibility model\'s split between "you" and "the provider" change depending on whether you\'re using IaaS versus SaaS?',
            questionType: 'text',
            correctAnswer:
              'Because the service model determines how much of the stack the provider manages for you — with IaaS you manage almost everything above the hypervisor (OS, runtime, application security) so more responsibility is yours; with SaaS the provider manages nearly the whole stack, so your responsibility narrows mostly to your own data and access control.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 2: Compute & Storage Services
// ---------------------------------------------------------------------
const module2: ModuleSeed = {
  title: 'Compute & Storage Services',
  position: 2,
  description:
    'Moves from what cloud computing is to the two service categories nearly every real workload needs first: somewhere to run code, and somewhere to keep data.',
  lessons: [
    {
      title: 'Virtual Machines and Managed Compute Across Providers',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** The real spectrum of "somewhere to run your code" options cloud providers offer, from full control to none at all.

**Prerequisites:** Module 1 (Cloud Fundamentals & Shared Responsibility).

**The concept, explained simply:**
**Compute** is the real category covering anywhere your code actually runs. At one end: a **virtual machine** (a full, IaaS-style virtual server you configure yourself — AWS EC2, Azure Virtual Machines, GCP Compute Engine). At the other end: **serverless functions**, where you upload just your code and the provider runs it on demand, scaling automatically and charging only for actual execution time, with no server to manage at all (AWS Lambda, Azure Functions, GCP Cloud Functions — the exact pattern the previous lesson's mini exercise pointed to). In between: managed **container-hosting services** that run your already-built container images without you managing the underlying VMs yourself.

**Why do we need this?** Different real workloads have genuinely different needs — a workload with constant, predictable traffic and specific OS-level requirements is often a poor fit for serverless (cold-start latency, execution-time limits); a small, event-driven task that runs rarely is often a poor fit for a constantly-running VM (you'd be paying for idle time). Understanding the real tradeoff lets you choose deliberately instead of defaulting to whatever's most familiar.

**How does it actually work?** Virtual machines require you to choose an instance size (CPU/memory), an operating system image, and to manage patching/scaling yourself (or via infrastructure-as-code, Module 4) — full control, full responsibility. Managed container-hosting services (e.g. AWS ECS/Fargate, Azure Container Apps, GCP Cloud Run) take your already-built container image (from DevOps Foundations Module 2) and run it without you managing a VM directly. Serverless functions go furthest — no server concept at all, you provide code, the platform handles everything else, and you're billed per invocation/execution time rather than per hour of a running server.

**A simple everyday example:** Owning a car (a VM — full control and full maintenance responsibility) versus a car-sharing service you book by the hour (managed containers — someone else maintains the vehicle, you still choose when and how to use it) versus a taxi you call only when you need one trip (serverless — you pay only for the actual trip, no ownership or maintenance at all).

**A technical example:** A constantly-running API with steady traffic and specific runtime dependencies is often well-suited to a VM or managed container service; a function that resizes an uploaded image once, triggered only when a file is uploaded, is a strong real fit for serverless — it would sit idle (and cost money) most of the time on a constantly-running VM.

**Common mistakes:** defaulting to a virtual machine for every workload out of familiarity, even when a managed or serverless option would genuinely reduce operational burden without a real tradeoff cost; assuming serverless is always cheaper — for workloads with constant, high, predictable traffic, a properly-sized VM or reserved-capacity option can genuinely be more cost-effective than paying per-invocation at scale.

**When do we use which compute option?** VMs when you need real OS-level control or have specific runtime requirements; managed container services when you have an already-built container image and want less operational overhead than a raw VM; serverless functions for event-driven, intermittent, or highly variable workloads.

**How do we know we understood this?** Given a real workload description, you can propose the most appropriate compute option and justify it against the real tradeoffs (control, cost pattern, operational burden) this lesson describes.

**Mini exercise:** A team needs to process a file exactly once, every time a user uploads one — traffic is unpredictable, sometimes zero uploads for hours, sometimes bursts of 50. Which compute option fits best, and why?

**Reading:** AWS Overview whitepaper — https://docs.aws.amazon.com/whitepapers/latest/aws-overview/introduction.html (live-verified this phase); Azure documentation — https://learn.microsoft.com/en-us/azure/ (live-verified this phase); Google Cloud documentation — https://docs.cloud.google.com/docs (live-verified this phase; note the official URL is docs.cloud.google.com, cloud.google.com/docs redirects here).`,
    },
    {
      title: 'Object Storage vs. Block Storage vs. File Storage',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** The 3 real, distinct shapes cloud storage comes in, and why picking the wrong one for a given use case causes real, unnecessary pain.

**Prerequisites:** "Virtual Machines and Managed Compute Across Providers."

**The concept, explained simply:**
**Object storage** stores files (called objects) in a flat structure, accessed over HTTP by a unique key — ideal for large amounts of unstructured data like images, videos, backups, or static website files (AWS S3, Azure Blob Storage, GCP Cloud Storage). **Block storage** provides raw, low-level storage volumes attached directly to a virtual machine, behaving like a real physical hard drive — used for a VM's own operating system disk or a database's data files, where the application needs direct, fast, file-system-level access (AWS EBS, Azure Managed Disks, GCP Persistent Disk). **File storage** provides a shared, traditional file-system interface multiple servers can mount and access simultaneously — used when several VMs need to read/write the same files at once (AWS EFS, Azure Files, GCP Filestore).

**Why do we need this?** Each shape has real, different performance characteristics and access patterns. Object storage is not directly mountable as a file system a running application can write to like a local disk; block storage is normally attached to exactly one VM at a time, not naturally shared across many; using the wrong one for a real workload causes either a real technical mismatch (trying to run a database directly on object storage) or real unnecessary cost/complexity (using expensive block storage for millions of static images better suited to cheap object storage).

**How does it actually work?** A real website's static assets (images, CSS, downloadable files) are a strong fit for object storage — served directly over HTTP, cheap at scale, and don't need file-system semantics. A database's actual data files need block storage, since the database engine expects real, fast, low-level disk access. A shared configuration directory that multiple application servers all need to read simultaneously is a real fit for file storage.

**A simple everyday example:** A public storage warehouse where you retrieve a specific labeled box by its ID (object storage) versus a personal filing cabinet attached to your own desk (block storage, one user/VM at a time) versus a shared office filing room multiple coworkers can access and update together (file storage).

**A technical example:** Hosting a static website's images and downloadable PDFs in AWS S3/Azure Blob/GCP Cloud Storage (object storage, cheap and directly HTTP-accessible) while that same application's actual database runs on a VM with EBS/Managed Disks/Persistent Disk (block storage, since the database needs real low-level disk performance) is a common, correct real-world combination — using the right shape for each real need, not one storage type for everything.

**Common mistakes:** trying to run a database's data files directly on object storage, which doesn't provide the low-level disk access a database engine requires; provisioning expensive block storage for large volumes of static, rarely-changing files (like a media library) that would be both cheaper and more appropriate as object storage.

**When do we use which storage shape?** Object storage for unstructured files accessed over HTTP at scale; block storage for a VM's own disk or a database's data files; file storage when multiple servers genuinely need shared, simultaneous file-system access.

**How do we know we understood this?** Given a real application's storage needs (e.g. user-uploaded photos, a database, a shared log directory read by multiple servers), you can correctly assign each need to the right storage shape and justify why.

**Mini exercise:** An application needs to store user-uploaded profile pictures (potentially millions of them, rarely modified after upload) and a relational database's data files. Which storage shape fits each, and why?

**Reading:** AWS, Azure, and GCP documentation (all live-verified this phase, cited in the previous lesson).

**Homework:** Bring your storage-shape decisions into this module's project.`,
    },
    {
      title: 'Choosing the Right Compute and Storage Service for a Real Workload',
      position: 3,
      contentType: 'text',
      durationSeconds: 900,
      body: `**What is this lesson about, in one sentence?** Putting Lessons 1–2's real tradeoffs together into one deliberate decision process for a real, described workload.

**Prerequisites:** "Virtual Machines and Managed Compute Across Providers," "Object Storage vs. Block Storage vs. File Storage."

**The concept, explained simply:**
Real compute and storage decisions are almost never made in isolation — a workload's real compute choice (VM, managed container, serverless) and its real storage choice (object, block, file) depend on each other and on the workload's actual traffic pattern, state requirements, and cost sensitivity. This lesson is a real, structured process for making both decisions together, rather than picking each independently.

**Why do we need this?** A workload's compute and storage choices interact — e.g. a serverless function is stateless between invocations by design, so it cannot rely on local block storage persisting between calls the way a constantly-running VM can; choosing serverless compute without accounting for this is a real, common design mistake that only surfaces once the function unexpectedly loses data between invocations.

**How does it actually work?** A real, structured process: (1) characterize the workload's traffic pattern (constant vs. intermittent/event-driven) — this drives the compute choice; (2) characterize the workload's data needs (large unstructured files vs. a database's low-level disk needs vs. shared file access) — this drives the storage choice; (3) check the two choices are actually compatible (e.g. a serverless function needing to persist data between invocations must write to object storage or a database, not local disk, since local disk doesn't survive between invocations).

**A simple everyday example:** Choosing both a vehicle and a place to store cargo together, not separately — a delivery service choosing a small, fast vehicle (serverless-like) must also choose cargo storage that doesn't require the vehicle itself to carry everything permanently (like a central warehouse/object storage), while a moving company's own truck (VM-like) can reasonably carry its own cargo directly (like attached block storage).

**A technical example:** An image-processing serverless function (per this module's earlier mini exercise) must write its processed output to object storage (or a database), not to local disk — because the serverless platform does not guarantee local disk state persists between separate invocations, even for the same function.

**Common mistakes:** choosing compute and storage independently, without checking real compatibility between them — a common, real bug source once a workload actually runs at scale; assuming a technically-working combination is automatically the *right* one, without weighing the real cost and operational-burden tradeoffs this module's earlier lessons introduced.

**When do we use this structured process?** For any real workload, before provisioning anything — treating compute and storage as one joint decision, not two separate, unrelated ones.

**How do we know we understood this?** Given a real workload description, you can walk through this lesson's 3-step process and arrive at a compatible, justified compute+storage combination — not just a technically-plausible one.

**Mini exercise:** A team is building a service that receives webhook events intermittently (sometimes none for hours, sometimes bursts) and must permanently store each event's data for later analysis. Walk through the 3-step process and propose a real compute+storage combination.

**Homework:** Bring your workload's real compute+storage decision into this module's project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 2 (Compute & Storage Services). Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 2 Final Assessment — Compute & Storage Services',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'A function that processes a file only when a user uploads one, with unpredictable, intermittent traffic, is generally the strongest real fit for which compute option, per this module?',
            questionType: 'single',
            options: ['A constantly-running virtual machine', 'Serverless functions', 'Block storage', 'File storage'],
            correctAnswer: ['Serverless functions'],
          },
          {
            prompt: 'Why is trying to run a database\'s actual data files directly on object storage a real mismatch, per this module?',
            questionType: 'single',
            options: [
              'Object storage is always more expensive than block storage',
              'Object storage doesn\'t provide the low-level, fast disk access a database engine requires',
              'Databases cannot be hosted in the cloud at all',
              'There is no real mismatch, either works equally well',
            ],
            correctAnswer: [
              'Object storage doesn\'t provide the low-level, fast disk access a database engine requires',
            ],
          },
          {
            prompt: 'Which of the following are real storage shapes covered in this module? (Select all that apply.)',
            questionType: 'multiple',
            options: ['Object storage', 'Block storage', 'File storage', 'Serverless storage'],
            correctAnswer: ['Object storage', 'Block storage', 'File storage'],
          },
          {
            prompt: 'True or False: a serverless function can safely rely on data written to its own local disk persisting reliably between separate invocations.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Practical question: why does this module insist compute and storage should be decided together, not independently?',
            questionType: 'text',
            correctAnswer:
              'Because the two choices can be incompatible if made separately — for example, a serverless function that needs to persist data between invocations cannot rely on local disk (which does not survive between calls), so its storage choice must account for its compute choice\'s real constraints, and vice versa.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 3: Cloud Networking & IAM
// ---------------------------------------------------------------------
const module3: ModuleSeed = {
  title: 'Cloud Networking & IAM',
  position: 3,
  description:
    'Covers the two things that determine whether a cloud deployment is actually secure: who can reach it over the network, and who is allowed to do what to it.',
  lessons: [
    {
      title: 'Virtual Networks: VPCs, Subnets, and Security Groups',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How cloud providers let you build your own private, isolated network inside their shared infrastructure, and control exactly what can reach what.

**Prerequisites:** Computer Networking Foundations (subnetting, IP addressing, firewalls/NAT — this lesson applies those same real concepts inside a cloud provider specifically).

**The concept, explained simply:**
A **virtual private network** (AWS VPC, Azure Virtual Network, GCP VPC — same real concept, provider-specific names, exactly per this course's Module 1 framing) is your own logically isolated slice of a cloud provider's network, where you define your own IP address ranges and control what traffic can enter or leave — even though it physically runs on shared infrastructure with other customers. Inside it, you divide address space into **subnets** — smaller network segments, often separated into "public" (reachable from the internet) and "private" (not directly reachable, only accessible from inside the network) exactly as Computer Networking Foundations' subnetting lesson taught, now applied to real cloud resource placement.

**Why do we need this?** Not every resource in a real application should be directly reachable from the internet — a database, for instance, should almost never be. Virtual networks and subnets let you place resources deliberately: a public-facing web server in a public subnet, and a database in a private subnet that's only reachable from the web server, not from the open internet at all.

**How does it actually work?** A **security group** (AWS's term; Azure calls it a Network Security Group, GCP calls it a firewall rule) is a real, stateful firewall attached directly to a specific resource (not just the network boundary), controlling exactly what traffic is allowed in and out of that specific resource — e.g. "allow inbound traffic on port 443 from anywhere, but allow the database port only from the web server's own security group, not from the internet at all." This is the same real firewall/NAT concept from Computer Networking Foundations, applied at a much finer, per-resource grain than a traditional network perimeter firewall.

**A simple everyday example:** A gated community (the VPC) with a public lobby area visitors can enter (public subnet) and private residential units only reachable from inside the community, never directly from the street (private subnet) — plus each individual unit has its own lock that only certain specific keys open (security groups), not just the community gate.

**A technical example:** A real 3-tier application: a load balancer and web servers in a public subnet (security group allows inbound HTTPS from anywhere), an application server tier in a private subnet (security group allows inbound traffic only from the web server tier's security group), and a database in an even more restricted private subnet (security group allows inbound traffic only from the application tier, on only the database's specific port).

**Common mistakes:** placing a database directly in a public subnet with an overly permissive security group (e.g. "allow all inbound traffic from anywhere") — a real, common, and genuinely serious misconfiguration behind many real cloud data breaches; treating a security group as a network-wide firewall rather than understanding it's attached to and scoped around specific resources.

**When do we design network segmentation this way?** For any real application handling data that shouldn't be directly internet-reachable — which describes the large majority of real backend and database tiers.

**How do we know we understood this?** Given a real application's tiers (web, application, database), you can correctly assign each to a public or private subnet and describe the minimal security-group rules each needs.

**Mini exercise:** For a real API server that should be reachable from the internet on port 443, and a database that should only be reachable from that API server, describe the subnet placement and security-group rules for both.

**Reading:** AWS, Azure, and GCP documentation (live-verified this phase, cited in Module 2).`,
    },
    {
      title: 'Identity and Access Management: Least Privilege in the Cloud',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How cloud providers control exactly who — human or automated — can do exactly what to your resources, and the one real principle that should guide every permission you ever grant.

**Prerequisites:** "Virtual Networks: VPCs, Subnets, and Security Groups."

**The concept, explained simply:**
**Identity and Access Management (IAM)** controls who (a real person, or an automated system like an application or a CI/CD pipeline) can perform which specific actions on which specific cloud resources (AWS IAM, Azure's Role-Based Access Control/Entra ID, GCP IAM — same real concept, provider-specific names again). The one real, guiding principle: **least privilege** — grant only the specific permissions a person or system genuinely needs to do its real job, and nothing more.

**Why do we need this?** A cloud account with overly broad permissions is a real, serious risk — if a single set of credentials is ever compromised (a leaked key, a phished password), the damage an attacker can do is limited by exactly what permissions those specific credentials had. An account or automated role with "administrator over everything" permissions turns any single compromise into a total compromise; a narrowly-scoped role limits the blast radius of that same compromise significantly.

**How does it actually work?** IAM systems let you define **policies** (a real, specific list of allowed actions on allowed resources) and attach them to **users** (real people) or **roles** (an identity that can be assumed by a person or, critically, by an automated system like a running application or a CI/CD pipeline — this is how the DevOps Foundations CI/CD pipeline you built earlier would authenticate to deploy real infrastructure, without embedding a permanent human's credentials in the pipeline itself). A least-privilege policy for a web application's automated role, for example, would grant exactly the specific storage and database actions that application genuinely performs — not full administrative access to the entire cloud account.

**A simple everyday example:** Giving a new employee a keycard that opens exactly the doors their job requires (the supply closet, their own office) rather than a master key that opens every door in the building "just in case" — the master key isn't more convenient in any way that matters, it's purely more risk if that one keycard is ever lost or stolen.

**A technical example:** An automated deployment pipeline (from DevOps Foundations) that only ever needs to update a specific storage bucket and a specific compute service should be granted an IAM role with exactly those 2 permissions — not a role with full administrative access to the entire cloud account, even though the broader role would also "work" for the pipeline's actual task.

**Common mistakes:** granting broad, "just in case" permissions out of convenience during initial setup, and never narrowing them later — a real, extremely common source of unnecessary risk in real cloud accounts; reusing one single broad role across many different systems instead of giving each system its own narrowly-scoped role matched to its own specific real needs.

**When do we apply least privilege?** From the very first permission granted — narrowing an overly broad permission set later is real, additional work that's easy to keep deferring; starting narrow and adding specific permissions only as a genuine, real need arises is significantly safer and just as fast in practice.

**How do we know we understood this?** Given a described system's real, specific job (e.g. "this automated pipeline only ever writes files to one specific storage location"), you can propose the minimal, correctly-scoped IAM policy for it, and explain what real risk a broader policy would introduce without any real benefit.

**Mini exercise:** An automated backup script only ever needs to read from a database and write backup files to one specific storage bucket. Propose the minimal IAM permissions it should have, and state one real thing that could go wrong if it were instead granted full administrative access.

**Reading:** AWS, Azure, and GCP documentation (live-verified this phase, cited in Module 2).

**Homework:** Bring your least-privilege IAM design into this module's project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 3,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 3 (Cloud Networking & IAM). Review lessons 1–2 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 3 Final Assessment — Cloud Networking & IAM',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'Per this module, where should a real application\'s database typically be placed?',
            questionType: 'single',
            options: [
              'In a public subnet, so it\'s easy to reach for debugging',
              'In a private subnet, reachable only from the application tier that genuinely needs it',
              'It doesn\'t matter where a database is placed',
              'Databases cannot be placed in subnets',
            ],
            correctAnswer: [
              'In a private subnet, reachable only from the application tier that genuinely needs it',
            ],
          },
          {
            prompt: 'What is the real, guiding principle behind IAM policy design in this module?',
            questionType: 'single',
            options: [
              'Grant the broadest permissions possible for convenience',
              'Least privilege — grant only the specific permissions a person or system genuinely needs, and nothing more',
              'Every system should share one single administrative role',
              'IAM policies are optional if the network is already secure',
            ],
            correctAnswer: [
              'Least privilege — grant only the specific permissions a person or system genuinely needs, and nothing more',
            ],
          },
          {
            prompt: 'Which of the following are real, described risks of granting overly broad IAM permissions, per this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'A compromised credential with broad permissions causes significantly more damage than one with narrow permissions',
              'A single leaked key with administrator-level access can lead to a total account compromise',
              'Broad permissions make an automated pipeline run measurably faster',
              'Reusing one broad role across many unrelated systems increases real risk without a real benefit',
            ],
            correctAnswer: [
              'A compromised credential with broad permissions causes significantly more damage than one with narrow permissions',
              'A single leaked key with administrator-level access can lead to a total account compromise',
              'Reusing one broad role across many unrelated systems increases real risk without a real benefit',
            ],
          },
          {
            prompt: 'True or False: a security group in the cloud is attached to and scoped around specific resources, not just the overall network boundary.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['True'],
          },
          {
            prompt: 'Practical question: why should an automated CI/CD pipeline authenticate to cloud infrastructure using a scoped IAM role rather than a permanent human user\'s credentials embedded in the pipeline?',
            questionType: 'text',
            correctAnswer:
              'A scoped role limits the pipeline to exactly the specific permissions it genuinely needs (least privilege), and if it were compromised the damage is bounded by that narrow scope; embedding a human\'s permanent credentials in a pipeline is both a real credential-management risk and typically grants far broader access than the automated pipeline actually needs.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 4: Infrastructure as Code & Cost Management
// ---------------------------------------------------------------------
const module4: ModuleSeed = {
  title: 'Infrastructure as Code & Cost Management',
  position: 4,
  description:
    'Assumes the real Infrastructure as Code and Terraform fundamentals DevOps Foundations already taught, and applies that skill specifically to real cloud resources — plus the real, ongoing discipline of not getting an unpleasant cost surprise.',
  lessons: [
    {
      title: 'Applying Infrastructure as Code to Real Cloud Resources',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How the general Infrastructure as Code principles and Terraform syntax DevOps Foundations already taught apply specifically to real cloud provider resources — this lesson does not re-teach Terraform itself.

**Prerequisites:** DevOps Foundations Module 4 (Infrastructure as Code & Configuration Management) — this lesson directly assumes you already understand IaC's core principles and can write basic Terraform configuration; if that's not familiar yet, that module is the correct place to learn it first.

**The concept, explained simply:**
DevOps Foundations already taught you *how* to write Infrastructure as Code and *why* it matters (real, tracked, repeatable infrastructure changes instead of untracked manual clicking). This lesson is specifically about applying that same real skill to actual cloud provider resources — each provider has its own real set of Terraform "resource types" (e.g. an AWS virtual machine resource, an Azure storage account resource, a GCP Cloud Storage bucket resource) that map directly onto the compute/storage/networking/IAM concepts this course's earlier modules already taught.

**Why do we need this?** Manually clicking through a cloud console to create the network, compute, storage, and IAM resources a real application needs is exactly the same real, untracked-change risk DevOps Foundations' IaC lesson described for application infrastructure generally — except now applied specifically to cloud resources, which often have real, ongoing costs attached to every resource created this way, making an untracked, forgotten resource a real, ongoing cost risk too (this lesson's own next topic).

**How does it actually work?** A real Terraform configuration for a cloud resource declares the resource type, its provider-specific settings (e.g. instance size, storage class, IAM policy), and its relationships to other resources (e.g. "this virtual machine belongs in this specific subnet, with this specific security group attached") — the exact same declarative, idempotent approach DevOps Foundations taught, just describing real cloud resources instead of, say, a Kubernetes deployment. Terraform tracks a real **state** file recording what it believes currently exists, and can detect **drift** — a real, meaningful difference between what your configuration declares and what actually exists in the cloud account (e.g. someone manually changed a setting through the console, bypassing the tracked configuration entirely).

**A simple everyday example:** A tracked, shared shopping list for restocking a shared kitchen (the IaC configuration) versus someone just buying random extra items on their own whenever they feel like it (manual console changes) — the second approach works in the short term but nobody has a reliable, shared picture of what's actually been bought or why, exactly like configuration drift.

**A technical example:** A Terraform configuration declaring a specific storage bucket, a specific virtual machine in a specific subnet, and a specific IAM role attached to that VM — applied once, tracked in version control, and reapplied identically to a staging environment and a production environment, rather than manually recreating the same real resources by hand twice and risking the two environments quietly diverging.

**Common mistakes:** manually changing a cloud resource through the provider's console "just this once" for a tracked, IaC-managed resource — this creates real configuration drift, and the next automated apply may either silently revert your manual change or, worse, produce an unexpected result because the tracked state no longer matches reality; treating cloud IaC as fundamentally different from the general IaC principles already learned, rather than the same real skill applied to a new, specific set of resource types.

**When do we use IaC for cloud resources?** For any real cloud resource meant to persist and be reproducible — which describes nearly every real resource in a genuine, ongoing project, as opposed to a truly temporary, throwaway experiment.

**How do we know we understood this?** You can explain what configuration drift is, why it's a real, meaningful problem, and why a manual console change to an IaC-managed resource is a common, real source of it.

**Mini exercise:** A team's Terraform configuration declares a specific storage bucket with public access disabled, but someone later manually enables public access through the console to quickly test something, and forgets to revert it. Explain, in your own words, what configuration drift now exists, and the real risk this creates.

**Reading:** AWS, Azure, and GCP documentation (live-verified this phase, cited in Module 2); DevOps Foundations Module 4 (already-verified reading, reused).`,
    },
    {
      title: 'Cloud Cost Management: Tagging, Budgets, and Avoiding Surprise Bills',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** The real, ongoing operational discipline of knowing what your cloud resources actually cost, and catching a cost problem before it becomes a real, expensive surprise.

**Prerequisites:** "Applying Infrastructure as Code to Real Cloud Resources."

**The concept, explained simply:**
Cloud billing is **usage-based** — you're charged for what you actually provision and use, continuously, not a one-time purchase. This is a genuine real benefit (Module 1 already covered this), but it also means a forgotten, oversized, or unnecessarily-provisioned resource keeps costing real money every single day until someone notices and removes it — unlike a one-time purchase mistake, which stops costing more once it's made.

**Why do we need this?** A real, common, and entirely avoidable problem: a test resource spun up for a quick experiment and never torn down, quietly accumulating real cost for weeks or months before anyone notices. Real cost-management discipline catches this quickly, rather than discovering it as an unpleasant surprise on a monthly bill.

**How does it actually work?** **Tagging** — attaching real, structured metadata (e.g. "team: backend," "environment: staging," "project: checkout-redesign") to every cloud resource at creation time — lets you later break down real spend by team, environment, or project, rather than facing one large, undifferentiated bill with no way to trace which resource is responsible for what. **Budgets and billing alerts** — configuring a real, specific spending threshold that triggers a notification when actual or forecasted spend crosses it — catch a cost problem while it's still small and easy to fix, instead of only discovering it once a full billing cycle has already passed. A real, disciplined practice of tearing down genuinely temporary resources (like a short-lived test environment) as soon as they're no longer needed, rather than leaving them running indefinitely "just in case," is the single most common, real cost-saving habit.

**A simple everyday example:** Leaving a rental car running in a parking lot because you forgot to return it — the meter keeps running every single hour it sits there unused, exactly like an untagged, forgotten cloud resource nobody remembers to check on.

**A technical example:** A team tags every resource with its owning team and environment, sets a billing alert to trigger at 80% of the monthly budget, and reviews untagged resources weekly (since an untagged resource is often exactly the kind that gets forgotten) — this combination catches both a genuine cost spike and an accumulating pile of forgotten, untagged resources before either becomes a real, expensive surprise.

**Common mistakes:** never tagging resources, which makes a real cost problem nearly impossible to trace back to its actual cause once the bill arrives; setting no budget alerts at all and only discovering a cost problem once a full billing cycle has already completed, when the unnecessary spend has already happened and can't be recovered.

**When do we apply this discipline?** From the very first resource created in a real cloud account — treating tagging and budget alerts as "something to add later, once we're bigger" is a real, common mistake, since the habit of tagging every resource is far easier to maintain from day one than to retrofit onto hundreds of already-untagged resources later.

**How do we know we understood this?** You can explain why cloud cost problems tend to be gradual and easy to miss rather than sudden, and describe at least 2 real, concrete practices (from this lesson) that catch them early.

**Mini exercise:** A team notices their monthly cloud bill is unexpectedly 40% higher than usual, but has no resource tags and no billing alerts configured. Propose the first 2 real, concrete steps they should take, based on this lesson.

**Homework:** Bring your tagging and budget-alert plan into this course's closing project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 3,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 4 (Infrastructure as Code & Cost Management). Review lessons 1–2 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 4 Final Assessment — Infrastructure as Code & Cost Management',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'What is "configuration drift," per this module?',
            questionType: 'single',
            options: [
              'A billing error made by the cloud provider',
              'A real, meaningful difference between what an IaC configuration declares and what actually exists in the cloud account, often caused by a manual console change',
              'A normal, expected part of using Terraform with no real consequence',
              'A type of virtual network configuration',
            ],
            correctAnswer: [
              'A real, meaningful difference between what an IaC configuration declares and what actually exists in the cloud account, often caused by a manual console change',
            ],
          },
          {
            prompt: 'Why is cloud cost management described as needing "ongoing" discipline in this module, rather than a one-time setup?',
            questionType: 'single',
            options: [
              'Cloud billing is a one-time purchase, so this isn\'t really necessary',
              'Cloud billing is usage-based and continuous — a forgotten or oversized resource keeps costing money every day until someone notices and removes it',
              'Cost management only matters for very large companies',
              'Tags and budgets only need to be set up once and never checked again',
            ],
            correctAnswer: [
              'Cloud billing is usage-based and continuous — a forgotten or oversized resource keeps costing money every day until someone notices and removes it',
            ],
          },
          {
            prompt: 'Which of the following are real, described cost-management practices in this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'Tagging every resource with structured metadata like team/environment/project',
              'Setting budget alerts that trigger before a full billing cycle completes',
              'Tearing down genuinely temporary resources once they\'re no longer needed',
              'Avoiding cloud cost review until the annual budget planning meeting',
            ],
            correctAnswer: [
              'Tagging every resource with structured metadata like team/environment/project',
              'Setting budget alerts that trigger before a full billing cycle completes',
              'Tearing down genuinely temporary resources once they\'re no longer needed',
            ],
          },
          {
            prompt: 'True or False: this module re-teaches Terraform syntax and general Infrastructure as Code principles from scratch.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Practical question: why does a manual console change to an IaC-managed resource create a real risk, per this module?',
            questionType: 'text',
            correctAnswer:
              'It creates configuration drift — the tracked configuration no longer matches what actually exists — and the next automated apply may either silently revert the manual change or produce an unexpected result because the tracked state no longer reflects reality, both of which are real, avoidable risks.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 5: Multi-Cloud & Cloud-Native Architecture
// ---------------------------------------------------------------------
const module5: ModuleSeed = {
  title: 'Multi-Cloud & Cloud-Native Architecture',
  position: 5,
  description:
    'Closes this course by moving from individual cloud services to real architectural reasoning — reliability, scaling, and a genuine, well-established framework for weighing these tradeoffs together.',
  lessons: [
    {
      title: 'Designing for Reliability: High Availability, Scaling, and Disaster Recovery',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How to design a real cloud deployment that keeps working when individual pieces of it fail, and recovers if something genuinely catastrophic happens.

**Prerequisites:** Module 3 (Cloud Networking & IAM) — reliability design builds directly on the network segmentation and resource-placement concepts already covered.

**The concept, explained simply:**
**High availability** means designing a system so that the failure of any single component doesn't take the whole system down — achieved primarily through **redundancy** (running more than one instance of a critical resource) spread across genuinely independent failure domains (e.g. multiple **availability zones** — physically separate data centers within the same region, connected by low-latency links, so a single data center's power or hardware failure doesn't take everything down). **Scaling** means adjusting real capacity to match real demand — **vertical scaling** (making a single resource bigger — more CPU/memory on one VM) has a real ceiling and a single point of failure; **horizontal scaling** (running more instances of a resource behind a load balancer) avoids both, and is what most real, modern cloud architectures prefer for this reason.

**Why do we need this?** Individual hardware and software components genuinely fail — this is a real, permanent fact of running any system at scale, not a hypothetical edge case. A design that assumes nothing ever fails will eventually experience a real, avoidable outage; a design that assumes failure is normal and plans for it keeps working through it.

**How does it actually work?** A real, resilient design: multiple instances of a web/application tier spread across at least 2 availability zones, behind a load balancer that automatically stops routing traffic to any instance that stops responding; a database configured with real, automated backups and, for genuinely critical systems, a standby replica in a separate availability zone that can take over if the primary fails. **Disaster recovery** goes one level further — a real, tested plan for recovering an entire application if an entire region (not just one availability zone) becomes unavailable, which typically requires real backups (and sometimes a standby deployment) in a genuinely separate geographic region.

**A simple everyday example:** A restaurant with only one chef (a single point of failure — the whole kitchen stops if that one person is unavailable) versus a kitchen with several trained chefs who can each cover for one another (redundancy across a real "failure domain," i.e. individual people) — and a fire-evacuation plan the whole restaurant has actually practiced (disaster recovery), not just a plan that exists on paper and has never been tested.

**A technical example:** A real 3-tier application (per Module 3) with web/application instances spread across 2 availability zones behind a load balancer, a database with automated daily backups and a standby replica in a second availability zone, and a documented, periodically-tested process for restoring the entire application from backups into a different region if the primary region were to become unavailable.

**Common mistakes:** running a single instance of a critical resource with no redundancy at all, treating "the cloud provider handles reliability" as if it means your own application architecture doesn't also need to account for failure — the provider's infrastructure being reliable doesn't make a single-instance deployment on top of it reliable; having backups that have genuinely never been tested for restoration (the same real gap Database Design & SQL Mastery's own backup lesson warned about, now at the level of an entire application's infrastructure).

**When do we design for high availability and disaster recovery?** From the beginning of any real, production-intended deployment — retrofitting redundancy onto an already-running single-instance system later is real, avoidable extra work, and the gap is often only discovered during an actual outage, the worst possible time to discover it.

**How do we know we understood this?** You can explain the real difference between vertical and horizontal scaling and why horizontal is generally preferred for reliability, and can describe what a genuinely tested (not just theoretical) disaster recovery plan actually requires.

**Mini exercise:** A team's application currently runs as a single VM instance in a single availability zone, with a database that has automated backups but no standby replica. Identify the real single points of failure in this design, and propose specific improvements.

**Reading:** AWS Well-Architected Framework — https://aws.amazon.com/architecture/well-architected/ (live-verified this phase; its Reliability pillar directly covers this lesson's real content).`,
    },
    {
      title: 'Cloud-Native Architecture Patterns and the AWS Well-Architected Framework',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** A real, well-established, provider-published framework for weighing every architectural tradeoff this course has covered — reliability, security, cost, performance — together, systematically, instead of one at a time.

**Prerequisites:** "Designing for Reliability: High Availability, Scaling, and Disaster Recovery" — this lesson's framework directly organizes that lesson's content alongside this course's other real tradeoffs.

**The concept, explained simply:**
**Cloud-native architecture** means designing systems specifically to take advantage of what cloud platforms are good at — horizontal scaling, managed services instead of self-hosted equivalents, resilience to individual component failure — rather than simply moving an unchanged, traditionally-designed system onto cloud infrastructure and calling it "cloud" (a real, common, and genuinely limiting pattern known as a "lift and shift," which gains cloud costs without gaining most of cloud's real architectural benefits). The **AWS Well-Architected Framework** is a real, official, publicly-published framework (with equivalent published frameworks from Azure and GCP) organizing architectural decision-making around 6 real pillars: **operational excellence** (running and improving systems), **security** (protecting data and systems — this course's Module 3), **reliability** (recovering from failure — this lesson's previous section), **performance efficiency** (using resources appropriately for actual needs), **cost optimization** (avoiding unnecessary spend — this course's Module 4), and **sustainability** (minimizing environmental impact).

**Why do we need this?** Every real architectural decision this course has covered (compute choice, storage choice, network design, IAM scope, IaC discipline, cost management, reliability design) genuinely trades off against the others — e.g. maximum reliability (many redundant instances across multiple regions) costs more than a minimal single-instance deployment; a framework like this gives you a real, structured way to reason about these tradeoffs together for a specific real system, rather than optimizing one pillar in isolation and accidentally damaging another.

**How does it actually work?** Given a real system, you walk through each of the 6 pillars and ask real, specific questions: does this design have single points of failure (reliability)? Are permissions scoped to least privilege (security)? Is compute/storage sized to actual real need, not guessed (performance efficiency and cost optimization)? Is the design being deliberately reviewed and improved over time, not just built once and left alone (operational excellence)? This isn't a one-time checklist — it's a genuinely repeatable way to evaluate a real system's architecture at any point in its life, including this course's own closing capstone project.

**A simple everyday example:** Designing a real building by consciously weighing structural safety, cost, energy efficiency, and maintainability together as one connected decision, rather than maximizing structural safety alone with no regard for cost, or minimizing cost alone with no regard for safety.

**A technical example:** A cost-optimization pass that shrinks a database to the smallest possible instance size without checking actual real performance requirements first is optimizing one pillar (cost) at the expense of another (performance efficiency) — the Well-Architected Framework's real value is forcing a check across all 6 pillars together, not just the one currently being worked on.

**Common mistakes:** treating "cloud-native" as simply "hosted on a cloud provider" rather than a real, deliberate architectural approach that takes advantage of cloud-specific capabilities (horizontal scaling, managed services); optimizing a single pillar (most often cost) in isolation, without checking the real, unintended effect on the other 5 pillars.

**When do we apply this framework?** When designing a new real system's architecture, and periodically when reviewing an existing one — not as a one-time exercise, but as a genuinely repeatable practice.

**How do we know we understood this?** Given a real, described system, you can walk through all 6 pillars and identify at least one real, specific strength or gap in each — this is exactly what this course's closing capstone project requires.

**Mini exercise:** For the single-VM, single-availability-zone system from the previous lesson's mini exercise, walk through at least 3 of the 6 Well-Architected pillars and identify a real gap in each.

**Homework:** This lesson's 6-pillar framework is the direct organizing structure for this course's closing capstone project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 3,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 5 (Multi-Cloud & Cloud-Native Architecture) — the final module of Cloud Computing Foundations. Review lessons 1–2 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 5 Final Assessment — Multi-Cloud & Cloud-Native Architecture',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'Why is horizontal scaling generally preferred over vertical scaling for reliability, per this module?',
            questionType: 'single',
            options: [
              'Horizontal scaling is always cheaper',
              'Vertical scaling has a real ceiling and remains a single point of failure; horizontal scaling avoids both by running multiple instances behind a load balancer',
              'Vertical scaling is not a real cloud concept',
              'There is no real difference between them',
            ],
            correctAnswer: [
              'Vertical scaling has a real ceiling and remains a single point of failure; horizontal scaling avoids both by running multiple instances behind a load balancer',
            ],
          },
          {
            prompt: 'What is a "lift and shift," per this module, and why is it described as a limited pattern?',
            questionType: 'single',
            options: [
              'A cloud-native redesign that fully leverages managed services and horizontal scaling',
              'Moving an unchanged, traditionally-designed system onto cloud infrastructure without redesigning it, which gains cloud costs without gaining most of cloud\'s real architectural benefits',
              'A type of disaster recovery drill',
              'A billing optimization technique',
            ],
            correctAnswer: [
              'Moving an unchanged, traditionally-designed system onto cloud infrastructure without redesigning it, which gains cloud costs without gaining most of cloud\'s real architectural benefits',
            ],
          },
          {
            prompt: 'Which of the following are real pillars of the AWS Well-Architected Framework, per this module? (Select all that apply.)',
            questionType: 'multiple',
            options: ['Reliability', 'Security', 'Cost Optimization', 'Marketing Efficiency'],
            correctAnswer: ['Reliability', 'Security', 'Cost Optimization'],
          },
          {
            prompt: 'True or False: optimizing a system for cost alone, without checking the other Well-Architected pillars, is a real, common mistake this module warns against.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['True'],
          },
          {
            prompt: 'Practical question: why does this module say a disaster recovery plan needs to be genuinely tested, not just theoretical?',
            questionType: 'text',
            correctAnswer:
              'A disaster recovery plan that has never actually been exercised is an unverified claim, not a confirmed capability — the same real gap Database Design & SQL Mastery\'s backup lesson warned about, applied at the level of an entire application; the only way to know a recovery process actually works is to have genuinely run it, not assumed it would work.',
          },
        ],
      },
    },
  ],
};

const MODULES: ModuleSeed[] = [module1, module2, module3, module4, module5];

// ---------------------------------------------------------------------
// 2 standalone Projects (Phase 26 architecture), matching this session's
// established "quality over quantity" precedent rather than the
// blueprint's literal "4 projects" figure. Both require real
// architectural reasoning (compute/network/IAM/IaC/monitoring/
// scaling/cost/backup), not just copying commands, per this phase's
// explicit verification requirement.
// ---------------------------------------------------------------------
const PROJECTS: ProjectSeed[] = [
  {
    title: 'Static Site on Cloud Storage with a CDN',
    description:
      'Beginner tier — design a real static website deployment using object storage and a content delivery network, including the storage-shape and IAM decisions this course\'s early modules taught.',
    instructions: `**Objective:** Design a real, production-reasonable deployment of a static website (HTML/CSS/JS, no backend) using cloud object storage and a content delivery network (CDN), applying Module 1-3's real service-model, storage-shape, and least-privilege decisions.

**Requirements:**
- State which of the 3 major providers (AWS, Azure, or GCP) you're designing for, and name the specific real object storage service and CDN service you'd use (per Module 1, Lesson 2's provider-agnostic-then-specific approach).
- Justify, in writing, why object storage (not block or file storage) is the correct storage shape for this use case (per Module 2, Lesson 2).
- Design the real IAM policy for how the website's files get uploaded (e.g. a CI/CD pipeline's role, per Module 3, Lesson 2) — state the specific, minimal permissions that role needs, and explicitly state what it should NOT be able to do.
- Describe how the CDN and object storage relate (the CDN caches and serves content originating from the storage bucket) and one real reason a CDN improves on serving directly from storage alone (e.g. latency for geographically distant users).
- Apply at least 2 real cost-management practices from Module 4, Lesson 2 (tagging, a budget alert) to this specific deployment.

**Expected result:** Your provider and service choices with justification, your IAM policy design, your CDN/storage relationship explanation, and your cost-management plan.

**Difficulty:** Beginner.

**Skills tested:** choosing the correct real cloud service for a specific need, applying least-privilege IAM reasoning for real, connecting a CDN's real purpose to the underlying storage service, applying real cost-management practices from day one.

**Suggested implementation steps:**
1. Pick your provider and name its real object storage and CDN services.
2. Justify the storage-shape choice before designing anything else.
3. Design the least-privilege IAM role for the upload pipeline.
4. Add your CDN reasoning and cost-management plan last, once the core design is set.

**Evaluation criteria:** the storage-shape justification is genuine and specific, not generic; the IAM role is real, scoped, and explicitly states what it should not be able to do; the CDN reasoning shows real understanding of why it improves on direct storage serving; the cost-management practices are specific to this deployment, not boilerplate.`,
    position: 2,
  },
  {
    title: 'Secure, Monitored Multi-Tier Cloud Architecture',
    description:
      'Capstone tier — design a complete, real 3-tier cloud architecture (web, application, database) applying every module of this course together: compute/storage choice, network segmentation, least-privilege IAM, Infrastructure as Code, reliability, and the Well-Architected Framework\'s 6 pillars.',
    instructions: `**Objective:** Design a complete, real, production-reasonable 3-tier cloud architecture for a described application, applying every module of this course together, and explicitly evaluate your own design against the AWS Well-Architected Framework's 6 pillars (Module 5, Lesson 2).

**The scenario:** A real web application with a public-facing frontend, a backend API, and a relational database, expected to handle variable, sometimes-bursty traffic, and storing data that must not be lost.

**Requirements:**
- **Compute choice** (Module 2, Lesson 1): choose and justify the compute option for each of the 3 tiers, accounting for the described variable traffic pattern.
- **Storage choice** (Module 2, Lesson 2): identify what storage shape(s) this architecture genuinely needs and why.
- **Network design** (Module 3, Lesson 1): design the VPC/subnet placement for all 3 tiers, stating which tier(s) are public vs. private and why, plus the real security-group rules between them.
- **IAM design** (Module 3, Lesson 2): design least-privilege roles for at least 2 real automated systems in this architecture (e.g. the application tier's role, a CI/CD deployment role).
- **Infrastructure as Code** (Module 4, Lesson 1): state how this architecture would be represented as real, tracked IaC, and describe one real way you'd detect configuration drift.
- **Reliability** (Module 5, Lesson 1): identify and eliminate at least 2 real single points of failure in a naive, single-instance version of this architecture.
- **Cost management** (Module 4, Lesson 2): apply real tagging and budget-alert practices to this specific architecture.
- **Well-Architected self-evaluation** (Module 5, Lesson 2): walk through all 6 pillars against your own design and identify at least one real strength and one real, honest gap or tradeoff in each pillar.

**Expected result:** A complete written architecture covering every requirement above, plus your honest 6-pillar self-evaluation.

**Difficulty:** Capstone (closes this course).

**Skills tested:** synthesizing every real skill this course taught into one coherent, real architecture; applying the Well-Architected Framework as a genuine evaluation tool, not a checkbox exercise; honest self-assessment of real tradeoffs rather than only listing strengths.

**Suggested implementation steps:**
1. Design the 3-tier compute, storage, and network architecture first — this is the foundation everything else builds on.
2. Add IAM, IaC, and reliability design against that concrete architecture.
3. Add cost-management practices specific to this design.
4. Do the 6-pillar self-evaluation last, once the full design exists to honestly evaluate.

**Evaluation criteria:** every requirement is addressed with real, specific reasoning tied to the described scenario, not generic cloud advice; the network and IAM designs correctly apply least-privilege and public/private segmentation; the reliability section identifies genuine, real single points of failure and fixes them; the 6-pillar self-evaluation is honest, including at least one real gap or tradeoff per pillar, not only strengths.`,
    position: 3,
  },
];

// ---------------------------------------------------------------------
// The new Cloud Engineer LearningPath — confirmed via direct query
// (not assumed) that no existing path is a real fit: none of the 5
// existing paths contain this exact 4-course combination.
// ---------------------------------------------------------------------
const CLOUD_ENGINEER_PATH_SLUG = 'cloud-engineer';
const CLOUD_ENGINEER_COURSE_SLUGS = [
  'programming-foundations-python-javascript', // Phase 36, reused
  'computer-networking-foundations', // Phase 34, reused
  COURSE_SLUG, // this phase's new course
  'devops-foundations-cicd-containers', // Phase 31, reused
];

async function main(): Promise<void> {
  const instructor = await prisma.user.findFirst({ where: { email: INSTRUCTOR_EMAIL } });
  if (!instructor) {
    throw new Error(
      'Phase 39 seed requires the existing e2e.instructor@phoenix.test fixture user to exist — not found. Run the standard E2E fixture setup first.',
    );
  }

  const category = await prisma.category.upsert({
    where: { slug: 'cloud' },
    update: {},
    create: { slug: 'cloud', name: 'Cloud Computing', domain: 'courses' },
  });

  let courseCreated = false;
  let modulesCreated = 0;
  let lessonsCreated = 0;
  let quizzesCreated = 0;
  let questionsCreated = 0;
  let projectsCreated = 0;
  let projectsSkipped = 0;

  let course = await prisma.course.findUnique({ where: { slug: COURSE_SLUG } });
  if (!course) {
    course = await prisma.course.create({
      data: {
        instructorId: instructor.id,
        categoryId: category.id,
        slug: COURSE_SLUG,
        title: COURSE_TITLE,
        description:
          'Provider-agnostic cloud fundamentals first (IaaS/PaaS/SaaS, shared responsibility), then real compute, storage, networking, IAM, Infrastructure as Code, cost management, and architecture reasoning across AWS, Azure, and GCP. Built Phase 39 to close the one remaining real gap Phase 35\'s analysis found for the Cloud Engineer learning path.',
        priceCents: 0,
        status: 'published',
        publishedAt: new Date(),
      },
    });
    courseCreated = true;
    console.log(`Created course: ${course.title} (${course.slug})`);
  } else {
    console.log(`Course already exists, skipping create: ${course.title}`);
  }

  for (const moduleSeed of MODULES) {
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
      console.log(`  Created module: ${module_.title}`);
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
      },
    });
    projectsCreated += 1;
    console.log(`  Created standalone project (Phase 26 architecture, not lesson-based): ${project.title}`);
  }

  // Create the new Cloud Engineer LearningPath, following Phase 37/38's
  // whole-path-membership guard pattern (this is a brand-new path, so
  // its own "any memberships exist" guard is correct and safe here).
  let pathsCreated = 0;
  let membershipsCreated = 0;
  let path = await prisma.learningPath.findUnique({ where: { slug: CLOUD_ENGINEER_PATH_SLUG } });
  if (!path) {
    path = await prisma.learningPath.create({
      data: {
        slug: CLOUD_ENGINEER_PATH_SLUG,
        title: 'Cloud Engineer',
        description:
          'Designs, provisions, and operates real cloud infrastructure as code. See docs/content-library/learning-paths.md and docs/content-library/phase35-learning-path-master-blueprint.md Section 7 for the full staged course table and skill-gap analysis.',
        status: 'published',
      },
    });
    pathsCreated += 1;
    console.log(`Created learning path: ${path.title} (${path.slug})`);
  } else {
    console.log(`Learning path already exists, skipping create: ${path.title} (${path.slug})`);
  }

  const existingMemberships = await prisma.learningPathCourse.findMany({ where: { learningPathId: path.id } });
  if (existingMemberships.length === 0) {
    const courses = await prisma.course.findMany({ where: { slug: { in: CLOUD_ENGINEER_COURSE_SLUGS } } });
    const bySlug = new Map(courses.map((c) => [c.slug, c]));
    let position = 1;
    for (const slug of CLOUD_ENGINEER_COURSE_SLUGS) {
      const c = bySlug.get(slug);
      if (!c) {
        console.warn(`  WARNING: course "${slug}" not found — skipping membership.`);
        continue;
      }
      await prisma.learningPathCourse.create({ data: { learningPathId: path.id, courseId: c.id, position: position++ } });
      membershipsCreated += 1;
      console.log(`  Added course to path: ${c.title} (position ${position - 1})`);
    }
  } else {
    console.log(`  Course memberships already exist (${existingMemberships.length}), skipping.`);
  }

  console.log(
    `\nPhase 39 content seed complete: course ${courseCreated ? 'created' : 'already existed'}, ${modulesCreated} modules created, ${lessonsCreated} lessons created, ${quizzesCreated} quizzes created, ${questionsCreated} quiz questions created, ${projectsCreated} projects created (${projectsSkipped} already existed), ${pathsCreated} learning path created, ${membershipsCreated} path memberships created.`,
  );
}

main()
  .catch((error) => {
    console.error('Phase 39 seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
