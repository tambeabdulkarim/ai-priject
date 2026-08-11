// Phase 40 — Cyber Security Analyst Learning Path Production.
//
// Per docs/content-library/phase35-learning-path-master-blueprint.md
// Section 8 (Cyber Security Analyst Blueprint): this path needs 3
// mandatory courses ("1 new mandatory + 2 reused mandatory") + 1
// non-mandatory elective. Direct inspection before writing this file
// confirmed one of the reused courses (Programming Foundations) was
// already built in Phase 36. That leaves exactly ONE genuinely new
// course for Phase 40: "Cyber Security Fundamentals: Defending Modern
// Systems" (per docs/content-library/courses.md entry #3).
//
// Duplication check performed before writing this course (not assumed):
// Full-Stack Web Development with Next.js already teaches the OWASP Top
// Ten (Phase 32, Module 6, "Common Web Security Vulnerabilities &
// Mitigations") — confirmed by direct query (body length 3344 chars,
// read in full before writing this course's own Module 3). That lesson
// is written for a developer building secure applications; this
// course's Module 3 is written for an analyst assessing/defending
// applications they didn't build — same named vulnerability list, a
// genuinely different target skill and depth (hands-on defender/
// assessor lens vs. applied-developer awareness), exactly as
// docs/content-library/courses.md's own Section 15 duplication-
// prevention rule requires and as Phase 35's blueprint explicitly
// pre-validated for whichever phase eventually built this course.
//
// This file:
//   1. Creates "Cyber Security Fundamentals: Defending Modern Systems"
//      (5 modules, defender-first structure per courses.md).
//   2. Creates the new "Cyber Security Analyst" LearningPath — no
//      existing path is a real fit (confirmed by direct query: none of
//      the 6 existing paths contain this exact 3-course combination),
//      linking Programming Foundations -> Computer Networking
//      Foundations -> Cyber Security Fundamentals, per the blueprint's
//      own specified sequence (the Cloud Computing Foundations elective
//      module is explicitly NOT mandatory per the blueprint and is not
//      linked as a required path course).
//
// Idempotency: same application-level pattern as Phases 36-39 —
// findFirst by parent+title before create for module/lesson/quiz/
// project; findUnique by slug for the new course; findUnique by slug
// for the new LearningPath; whole-path membership guard (new path, zero
// pre-existing memberships), matching Phase 37/38/39's pattern.

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

const COURSE_SLUG = 'cyber-security-fundamentals-defending-modern-systems';
const COURSE_TITLE = 'Cyber Security Fundamentals: Defending Modern Systems';
const INSTRUCTOR_EMAIL = 'e2e.instructor@phoenix.test';

// ---------------------------------------------------------------------
// Module 1: Security Fundamentals & the CIA Triad
// ---------------------------------------------------------------------
const module1: ModuleSeed = {
  title: 'Security Fundamentals & the CIA Triad',
  position: 1,
  description:
    'Starts with the one framework every other module in this course keeps coming back to: what "secure" actually means, broken into 3 real, distinct, sometimes-competing goals.',
  lessons: [
    {
      title: 'The CIA Triad: Confidentiality, Integrity, and Availability',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      isPreview: true,
      body: `**What is this lesson about, in one sentence?** The real, foundational framework security professionals use to describe exactly what "secure" means for a specific system — not a vague feeling, 3 distinct, checkable properties.

**Prerequisites:** Computer Networking Foundations, recommended alongside this module — real network security concepts (Module 2) build directly on it.

**The concept, explained simply:**
The **CIA triad** names the 3 real properties security work protects: **Confidentiality** (only authorized people/systems can read specific data — the opposite failure is a data leak), **Integrity** (data hasn't been improperly modified, whether by an attacker or an accident — the opposite failure is silent, undetected corruption or tampering), and **Availability** (authorized users can actually access the system and data when they need to — the opposite failure is an outage, whether from an attack like a denial-of-service or a genuine infrastructure failure).

**Why do we need this?** "Security" without a specific framework is too vague to act on. The CIA triad gives you a real, structured way to ask "secure against what, specifically?" for any given system — and, critically, to notice when 2 of the 3 properties genuinely trade off against each other, so a security decision doesn't quietly damage one goal while defending another.

**How does it actually work?** Given a real system, you evaluate each of the 3 properties separately: what would a confidentiality failure look like here (who shouldn't be able to read what)? An integrity failure (what data, if silently altered, would cause real harm)? An availability failure (what happens if this goes down, and for how long is that tolerable)? A real, specific security control usually targets one of the 3 most directly — encryption primarily protects confidentiality; cryptographic hashing (previewed here, covered in depth in Module 4) primarily protects integrity; redundancy and rate-limiting primarily protect availability.

**A simple everyday example:** A sealed, signed envelope handed directly to the recipient protects confidentiality (sealed, only they can read it) and integrity (a broken seal reveals tampering) — but if the mail carrier simply never delivers it, that's a real availability failure, a genuinely different kind of problem from the other two.

**A technical example:** A banking application needs strong confidentiality (account balances and transaction history must not leak), strong integrity (a transaction amount must never be silently altered in transit or storage), and strong availability (customers need reliable access, especially during high-traffic periods like the start of a month) — and a real design decision (e.g. adding extra confirmation steps for security) can genuinely trade off against availability/usability if taken too far, which is exactly the kind of tension this framework makes visible instead of hiding.

**Common mistakes:** treating "security" as one single, undifferentiated goal instead of 3 distinct properties that can each fail independently; assuming a control that protects one property (e.g. encryption for confidentiality) automatically protects the others too (encryption alone doesn't guarantee integrity or availability).

**When do we apply this framework?** At the very start of any real security assessment or design decision — asking "which of the 3 properties matters most here, and what would a specific failure of each actually look like" before deciding on any specific control.

**How do we know we understood this?** Given a real system, you can identify a specific, concrete failure scenario for each of the 3 properties, and correctly categorize a proposed security control by which property it primarily protects.

**Mini exercise:** For a real hospital patient-records system, describe one specific, realistic failure scenario for each of the 3 CIA triad properties.

**Reading:** NIST Cybersecurity Framework — https://www.nist.gov/cyberframework (live-verified this phase; the official U.S. government framework for managing cybersecurity risk, organizing much of what this course covers).`,
    },
    {
      title: 'Threat Modeling: Thinking Like an Attacker Before They Arrive',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** A real, structured process for identifying what could actually go wrong with a system's security, before an attacker finds it for you.

**Prerequisites:** "The CIA Triad: Confidentiality, Integrity, and Availability."

**The concept, explained simply:**
**Threat modeling** is the real, systematic process of asking, for a specific system: what are we protecting (assets), who might want to attack it and why (threat actors), how could they realistically attack it (attack vectors), and what would happen if they succeeded (impact, framed against the CIA triad from Lesson 1). This is done deliberately, on paper or in a real design review, *before* a system is built or deployed — not as an afterthought once something has already gone wrong.

**Why do we need this?** Security added as an afterthought is consistently more expensive, less complete, and more likely to miss a real, serious gap than security considered from the start. Threat modeling makes the real, specific risks visible early, when they're genuinely cheaper and easier to address.

**How does it actually work?** A real, practical threat-modeling process: (1) diagram the system's real components and data flows; (2) for each component and flow, ask "what could go wrong here" against each CIA triad property; (3) for each identified threat, assess realistic likelihood and impact; (4) decide, for each real threat, whether to mitigate it, accept it (a real, deliberate, documented decision — not silence), transfer it (e.g. via insurance), or avoid it (don't build the risky feature at all). A widely-used real structure for step 2 is **STRIDE** — Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege — 6 real threat categories that map cleanly onto and extend the CIA triad.

**A simple everyday example:** A building's security team walking through a new building's blueprints before construction, asking "where could someone get in who shouldn't, what could they access from there, and what's the real cost of a lock versus a camera versus both" — not waiting for an actual break-in to discover the building had an unlocked side door.

**A technical example:** Threat-modeling a real login feature: spoofing (could someone impersonate another user? — mitigated by strong authentication), tampering (could someone alter another user's data via a manipulated request? — mitigated by server-side authorization checks, not just client-side hiding), information disclosure (does a failed login reveal whether the *username* specifically was wrong, letting an attacker enumerate real accounts? — a real, common, easily-overlooked gap).

**Common mistakes:** skipping threat modeling for features that "seem simple" — some of the most serious real vulnerabilities appear in exactly the features nobody thought needed a security review; treating threat modeling as a one-time exercise rather than something revisited when a system's real design changes.

**When do we threat-model?** Before building any new real feature that handles meaningful data or access control, and again whenever that feature's design changes significantly — not only once, at the very beginning, and never again.

**How do we know we understood this?** Given a real feature description, you can walk through the STRIDE categories and identify at least one real, specific, plausible threat in several of them — not a generic, copy-pasted list.

**Mini exercise:** Threat-model a real "password reset" feature using STRIDE — identify at least 3 real, specific threats across different categories.

**Homework:** Bring your threat model into this course's first project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 3,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 1 (Security Fundamentals & the CIA Triad). Review lessons 1–2 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 1 Final Assessment — Security Fundamentals & the CIA Triad',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'A hospital patient-records system is briefly taken offline by a denial-of-service attack, but no data is read or altered during the outage. Which CIA triad property was primarily violated?',
            questionType: 'single',
            options: ['Confidentiality', 'Integrity', 'Availability', 'All three equally'],
            correctAnswer: ['Availability'],
          },
          {
            prompt: 'Why does this module recommend threat modeling before a system is built, rather than after?',
            questionType: 'single',
            options: [
              'It doesn\'t matter when threat modeling happens',
              'Security added as an afterthought is consistently more expensive, less complete, and more likely to miss serious gaps than security considered from the start',
              'Threat modeling is only useful for already-compromised systems',
              'Threat modeling replaces the need for any other security control',
            ],
            correctAnswer: [
              'Security added as an afterthought is consistently more expensive, less complete, and more likely to miss serious gaps than security considered from the start',
            ],
          },
          {
            prompt: 'Which of the following are real STRIDE threat categories, per this module? (Select all that apply.)',
            questionType: 'multiple',
            options: ['Spoofing', 'Tampering', 'Elevation of privilege', 'Optimization'],
            correctAnswer: ['Spoofing', 'Tampering', 'Elevation of privilege'],
          },
          {
            prompt: 'True or False: a failed-login error message that reveals whether the username specifically was wrong (versus the password) can be a real, exploitable information-disclosure threat.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['True'],
          },
          {
            prompt: 'Practical question: why does this module say encryption alone does not guarantee data integrity?',
            questionType: 'text',
            correctAnswer:
              'Encryption primarily protects confidentiality (keeping data unreadable to unauthorized parties) but does not by itself detect or prevent tampering with the data — integrity requires a separate real mechanism, like cryptographic hashing or signing, to verify data has not been improperly altered.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 2: Network Security
// ---------------------------------------------------------------------
const module2: ModuleSeed = {
  title: 'Network Security',
  position: 2,
  description:
    'Takes the real networking concepts Computer Networking Foundations already taught and looks at them from a genuinely different angle: not "how does this work," but "how does this get attacked, and how do we defend it."',
  lessons: [
    {
      title: 'From Networking to Network Security: Attacking and Defending the Same Concepts',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How the exact same real networking concepts this course assumes you already know (TCP/IP, DNS, HTTP) become the actual attack surface a real network defender has to think about.

**Prerequisites:** Computer Networking Foundations, specifically its OSI/TCP-IP, DNS, and HTTP/HTTPS lessons — this lesson directly assumes that foundation and does not re-teach it.

**The concept, explained simply:**
Every real networking concept has a real, corresponding attack angle: DNS resolution can be manipulated (**DNS spoofing/cache poisoning** — tricking a system into resolving a domain to an attacker-controlled address); unencrypted HTTP traffic can be intercepted and read or altered in transit (a real **man-in-the-middle** attack, exactly why HTTPS/TLS exists); an open, unnecessary network port is a real, additional attack surface an attacker can probe. Network security is the discipline of looking at your own real network the way an attacker would, and closing the gaps you find.

**Why do we need this?** Computer Networking Foundations taught you how these systems are *supposed* to work; this course teaches you how they actually fail under real, deliberate attack — a genuinely different, necessary lens for anyone defending a real network, not just operating one.

**How does it actually work?** A real network security review asks, for each layer: is DNS resolution using a validated, trusted resolver (mitigating spoofing)? Is all sensitive traffic actually encrypted end-to-end (mitigating interception)? Are only the specific, necessary ports actually open, with everything else explicitly closed (minimizing attack surface — the same real least-privilege principle Cloud Computing Foundations applies to IAM, applied here to network exposure)? Network **segmentation** (dividing a network into isolated zones, exactly like the public/private subnet design from Cloud Computing Foundations) limits how far an attacker can move if they do get a foothold in one segment — a real, critical defense called limiting **lateral movement**.

**A simple everyday example:** A building with a single unlocked door that leads directly to every room (a flat, unsegmented network) versus a building where reaching sensitive areas requires passing through several separately-locked checkpoints (segmentation) — a burglar who gets past the front door in the second building still can't reach everything.

**A technical example:** An internal database server that's technically reachable from the public internet because a firewall rule was never tightened after initial testing is a real, common, and genuinely serious network security gap — the same real mistake Cloud Computing Foundations' networking lesson warned against for cloud-specific resources, now framed from a defender actively looking for exactly this kind of exposure.

**Common mistakes:** assuming "it's on our internal network" means something is automatically safe from network-based attacks — internal networks are compromised in real incidents constantly, often via a single successfully-phished workstation, which is exactly why segmentation and least-exposure matter even internally; leaving unnecessary ports or services open "just in case" they're needed later, the same real risk pattern as Cloud Computing Foundations' IAM lesson warned about for permissions, applied here to network exposure.

**When do we apply network security review?** Continuously, not once — new services and configuration changes can silently reopen a previously-closed gap, so a real, periodic review (not just a one-time setup check) is necessary.

**How do we know we understood this?** Given a real network diagram, you can identify at least one real attack angle per major component, and propose a specific, real mitigation for each.

**Mini exercise:** A small office network has one flat network segment containing employee workstations, a file server, and a guest WiFi network all on the same segment. Identify the real risk this creates, and propose a segmentation-based fix.

**Reading:** NIST Cybersecurity Framework — https://www.nist.gov/cyberframework (live-verified this phase, reused from Module 1).`,
    },
    {
      title: 'Firewalls, Segmentation, and Defense in Depth',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** Why real network defenders never rely on just one single security control, and the specific tools that make up a real, layered defense.

**Prerequisites:** "From Networking to Network Security: Attacking and Defending the Same Concepts."

**The concept, explained simply:**
A **firewall** controls what network traffic is allowed to enter or leave a network or a specific system, based on real, defined rules (the same real concept as Cloud Computing Foundations' security groups, applied at a general network level rather than a specific cloud resource). **Defense in depth** is the real, guiding principle that no single control should be the only thing standing between an attacker and a real, serious compromise — multiple independent layers of defense mean a single failure doesn't immediately become a total breach.

**Why do we need this?** Any single security control can fail — a firewall rule can be misconfigured, a piece of software can have an undiscovered vulnerability. A real defense-in-depth design assumes any one layer might eventually fail, and asks "if this specific layer fails, what's the next layer that would still catch the problem?"

**How does it actually work?** A real, layered network defense: a perimeter firewall controlling what can reach the network at all; network segmentation (Lesson 1) limiting lateral movement if a single segment is breached; host-based controls (like the OS-level patching discipline this course assumes) on individual systems as a further layer; and monitoring/logging (feeding into Module 5's incident response process) to actually detect when a layer has been bypassed, rather than assuming silence means safety. Each layer is real and independently useful — removing any one doesn't eliminate the others' value.

**A simple everyday example:** A bank vault protected by a locked building, an alarm system, a safe with its own combination, and security cameras — not relying on the building's front door lock alone; if a burglar somehow gets past the door, the safe, alarm, and cameras are still real, independent layers that haven't failed.

**A technical example:** A real web application protected by a perimeter firewall (blocking traffic to ports that shouldn't be exposed), a segmented network (the database isn't directly reachable from the public internet, exactly per Cloud Computing Foundations' network design), input validation at the application layer (Module 3's OWASP content), and logging/monitoring that would flag an unusual pattern of failed login attempts — 4 independent real layers, not 1.

**Common mistakes:** treating a single strong control (like a firewall) as sufficient on its own, without additional independent layers — a real, common mistake that turns one single point of failure into a total compromise; configuring layers that all depend on the same underlying assumption (e.g. every layer trusting the same single set of credentials), which isn't genuinely independent defense in depth even though it looks like multiple layers on paper.

**When do we apply defense in depth?** For any real system handling meaningful data or access — designing multiple, genuinely independent layers rather than one strong layer plus several redundant, dependent ones.

**How do we know we understood this?** Given a real system's current single-layer defense, you can propose at least 2 additional, genuinely independent layers, and explain why each would still help if the existing layer failed.

**Mini exercise:** A real application currently relies only on a perimeter firewall for security. Propose 2 additional, genuinely independent defense-in-depth layers, and explain what each protects against that the firewall alone wouldn't.

**Homework:** Bring your defense-in-depth design into this course's first project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 3,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 2 (Network Security). Review lessons 1–2 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 2 Final Assessment — Network Security',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'What is "lateral movement," per this module, and what real defense specifically limits it?',
            questionType: 'single',
            options: [
              'An attacker moving physically between office locations; limited by locked doors',
              'An attacker moving from one compromised system to others on the same network; limited by network segmentation',
              'A type of DNS spoofing attack',
              'A firewall configuration technique unrelated to attacker movement',
            ],
            correctAnswer: [
              'An attacker moving from one compromised system to others on the same network; limited by network segmentation',
            ],
          },
          {
            prompt: 'Why does this module warn against assuming "it\'s on our internal network" means something is automatically safe?',
            questionType: 'single',
            options: [
              'Internal networks are always more dangerous than the public internet',
              'Internal networks are compromised in real incidents constantly, often via a single successfully-phished workstation, so internal exposure still carries real risk',
              'This assumption is actually correct and safe to rely on',
              'Internal networks do not use firewalls',
            ],
            correctAnswer: [
              'Internal networks are compromised in real incidents constantly, often via a single successfully-phished workstation, so internal exposure still carries real risk',
            ],
          },
          {
            prompt: 'Which of the following are real, described layers of defense in depth in this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'A perimeter firewall',
              'Network segmentation limiting lateral movement',
              'Monitoring and logging to detect a bypassed layer',
              'Relying on a single strong control with no additional layers',
            ],
            correctAnswer: [
              'A perimeter firewall',
              'Network segmentation limiting lateral movement',
              'Monitoring and logging to detect a bypassed layer',
            ],
          },
          {
            prompt: 'True or False: defense-in-depth layers that all depend on the same single underlying assumption (e.g. one shared set of credentials) count as genuinely independent layers.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Practical question: why is unencrypted HTTP traffic described as a real man-in-the-middle risk in this module?',
            questionType: 'text',
            correctAnswer:
              'Because unencrypted traffic can be intercepted and read or altered in transit by anyone positioned on the network path between the client and server, without either party necessarily knowing — HTTPS/TLS exists specifically to prevent this by encrypting the traffic so an interceptor cannot read or silently modify it.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 3: Application Security (OWASP Top 10)
// ---------------------------------------------------------------------
const module3: ModuleSeed = {
  title: 'Application Security (OWASP Top 10)',
  position: 3,
  description:
    'Covers the same real, industry-standard vulnerability list Full-Stack Web Development with Next.js already introduced from a developer\'s perspective — but this module teaches it from the assessor/defender\'s side: finding and confirming these gaps in a system you didn\'t build.',
  lessons: [
    {
      title: 'The OWASP Top 10 Through a Defender\'s Lens',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** The same real, industry-standard OWASP Top 10 vulnerability list, but from the perspective of someone assessing and defending a system they didn't build — a genuinely different skill from a developer writing secure code in the first place.

**Prerequisites:** Module 1 (Security Fundamentals & the CIA Triad) — every vulnerability class below maps onto a real CIA triad violation.

**The concept, explained simply:**
The **OWASP Top 10** is a real, regularly-updated, industry-standard list of the most critical web application security risks, published by the Open Web Application Security Project. Full-Stack Web Development with Next.js already introduced this list from a *developer's* perspective — how to write code that avoids introducing these vulnerabilities in the first place. This module covers the exact same real list from a genuinely different angle: how a security analyst *assesses* an already-built application (that they did not write) to determine whether these vulnerabilities are actually present, confirmable, and exploitable — a distinct, real skill from writing secure code, even though both use the same underlying vocabulary.

**Why do we need this?** A developer's job is to avoid introducing vulnerabilities while building; an analyst's job is to verify, on a real, already-existing system, whether those vulnerabilities exist regardless of who built it or how — these require genuinely different mental models: one is prevention-focused during construction, the other is detection-focused on something already deployed.

**How does it actually work?** For each real OWASP category, an analyst asks a genuinely different question than a developer would: not "am I writing this correctly," but "can I actually demonstrate this specific weakness exists here, safely and without causing real harm." For **Broken Access Control** (consistently the #1 real-world category): can a real, authenticated low-privilege user actually reach data or actions meant only for a higher-privilege user, by directly requesting a resource rather than only navigating through the UI? For **Injection**: does a real, crafted input to a form or API parameter produce behavior that reveals the underlying query or system is trusting unvalidated input? This module's hands-on labs (Lesson 2) practice exactly this kind of safe, controlled verification against an intentionally vulnerable sample application — never a real production system.

**A simple everyday example:** A building inspector checking whether a door that's *supposed* to be locked is *actually* locked, by trying the handle themselves — a genuinely different activity from the locksmith who installed the lock in the first place, even though both understand how locks work.

**A technical example:** A developer (per Full-Stack Web Dev's own lesson) writes parameterized database queries specifically to prevent injection; a security analyst assessing that same application doesn't just read the source code and trust it was done correctly — they actively attempt a real, controlled injection test against a running instance to confirm the protection actually holds in practice, not just in the code's apparent intent.

**Common mistakes:** treating "the developer said they followed OWASP guidance" as sufficient verification, without independently testing it — a real, common gap between claimed and actual security; confusing this module's defender/assessor skill with the fundamentally different, prevention-focused skill Full-Stack Web Dev's own OWASP lesson already taught — they're related, not identical, and this module explicitly builds the half that lesson didn't cover.

**When do we apply this defender's lens?** During a real security assessment or penetration test of an existing application — always against a system you have explicit authorization to test, exactly per this course's own "intentionally vulnerable sample application, never real production systems" framing.

**How do we know we understood this?** Given a real OWASP category, you can describe both how a developer would prevent it *and* how an analyst would independently verify it's actually prevented — recognizing these as 2 real, related, but distinct skills.

**Mini exercise:** For "Broken Access Control," describe one specific way a developer would prevent it, and one specific, safe way an analyst would independently verify that prevention actually works on a real, deployed application.

**Reading:** OWASP Top Ten — https://owasp.org/www-project-top-ten/ (reused, already live-verified Phase 32).`,
    },
    {
      title: 'Hands-On: Finding and Fixing Injection and Broken Access Control',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** A real, guided walkthrough of safely identifying and confirming the 2 most consistently critical OWASP categories against a controlled, intentionally vulnerable sample application.

**Prerequisites:** "The OWASP Top 10 Through a Defender's Lens."

**The concept, explained simply:**
This lesson walks through a real, structured, safe verification process for 2 specific OWASP categories: **Injection** (untrusted input is interpreted as part of a command or query rather than pure data) and **Broken Access Control** (a system fails to properly enforce what an authenticated user is actually allowed to do or see). Both are practiced only against an intentionally vulnerable sample application built specifically for safe, legal, educational testing — never a real production system, exactly per this course's stated scope.

**Why do we need this?** These 2 categories are consistently among the most common and highest-impact real vulnerabilities found in real assessments — Broken Access Control has topped the real OWASP Top 10 rankings in recent revisions, and Injection remains a persistent, serious real risk despite being well-understood for decades. Real hands-on practice, not just reading about them, is what builds the actual skill of recognizing and confirming them.

**How does it actually work?** A real, structured verification process for injection: identify an input field or API parameter that reaches a backend query or command; submit a crafted, controlled test input designed to reveal (not damage) whether that input is being trusted unsafely; observe the application's real response for evidence the input affected underlying behavior it shouldn't have. For broken access control: authenticate as a real, deliberately low-privilege test account; attempt to directly request a resource or action that should require higher privilege (not just checking whether the UI *hides* the option — a hidden button is not the same as an enforced restriction); confirm whether the request is actually rejected server-side or, concerningly, succeeds anyway.

**A simple everyday example:** Testing whether a "staff only" door is actually locked by trying the handle yourself, rather than trusting the sign — the sign (a hidden UI button) reflects intent, not enforcement; only the lock (a real, server-side check) reflects actual enforcement.

**A technical example:** On the intentionally vulnerable sample application, logging in as a low-privilege test user and then directly requesting "/api/admin/users" (an endpoint the UI never links to for this account) to check whether the server actually rejects the request (correct, enforced access control) or returns real data anyway (a genuine, confirmed broken-access-control finding) — exactly the kind of direct-request test a real analyst performs, not something inferred just from what the UI happens to display.

**Common mistakes:** testing only through the visible UI and concluding a system is secure because the UI doesn't expose a path to the vulnerability — real attackers (and real analysts) don't limit themselves to the UI, and neither should a genuine assessment; performing any of this against a system without explicit authorization — even with good intentions, this is both unethical and often illegal, which is exactly why this lesson's hands-on practice is scoped only to the intentionally vulnerable sample application.

**When do we perform this kind of hands-on verification?** Only against systems you have explicit, real authorization to test — a sample application built for this purpose, or a real system under a formal, authorized security assessment engagement, never anything else.

**How do we know we understood this?** You can describe the real, structured verification process for both injection and broken access control, and explain specifically why testing only through the visible UI is insufficient for either.

**Mini exercise:** For a real API endpoint "/api/orders/:id" that returns order details, describe the specific, safe test you'd run to check whether one authenticated user can access another user's order by simply changing the ID in the request.

**Homework:** Bring your access-control testing approach into this course's first project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 3,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 3 (Application Security — OWASP Top 10). Review lessons 1–2 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 3 Final Assessment — Application Security (OWASP Top 10)',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'What is the real, described difference between a developer\'s and an analyst\'s relationship to the OWASP Top 10, per this module?',
            questionType: 'single',
            options: [
              'There is no real difference, they do the same work',
              'A developer focuses on preventing vulnerabilities while building; an analyst focuses on independently verifying whether they actually exist in an already-built system',
              'Analysts only read source code and never test running applications',
              'Developers are responsible for finding vulnerabilities after deployment',
            ],
            correctAnswer: [
              'A developer focuses on preventing vulnerabilities while building; an analyst focuses on independently verifying whether they actually exist in an already-built system',
            ],
          },
          {
            prompt: 'Why is testing only through the visible UI insufficient for verifying broken access control, per this module?',
            questionType: 'single',
            options: [
              'UI testing is always sufficient and this module is incorrect',
              'A hidden UI button reflects intent, not enforcement — a real check requires directly requesting the restricted resource to confirm the server actually rejects it',
              'The UI cannot be tested for security issues at all',
              'Broken access control cannot be tested through an API',
            ],
            correctAnswer: [
              'A hidden UI button reflects intent, not enforcement — a real check requires directly requesting the restricted resource to confirm the server actually rejects it',
            ],
          },
          {
            prompt: 'Which of the following are true about this module\'s hands-on practice, per its own explicit scope? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'It is performed only against an intentionally vulnerable sample application',
              'It is never performed against real production systems',
              'Testing without explicit authorization is both unethical and often illegal',
              'Real production systems are acceptable targets as long as the intent is educational',
            ],
            correctAnswer: [
              'It is performed only against an intentionally vulnerable sample application',
              'It is never performed against real production systems',
              'Testing without explicit authorization is both unethical and often illegal',
            ],
          },
          {
            prompt: 'True or False: Broken Access Control has topped real OWASP Top 10 rankings in recent revisions, per this module.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['True'],
          },
          {
            prompt: 'Practical question: why does this module say Full-Stack Web Development with Next.js\'s existing OWASP lesson does not already satisfy this module\'s own learning goal, despite covering the same named vulnerability list?',
            questionType: 'text',
            correctAnswer:
              'That lesson is written for a developer building secure applications (a prevention-focused, construction-time skill); this module is written for an analyst assessing and defending applications they did not build (a detection-focused, verification skill) — same named vulnerability list, genuinely different target skill and depth, not a duplicate.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 4: Cryptography Basics & Identity/Access Management
// ---------------------------------------------------------------------
const module4: ModuleSeed = {
  title: 'Cryptography Basics & Identity/Access Management',
  position: 4,
  description:
    'Covers the 2 real technical foundations underneath nearly every other control this course has discussed: how we actually protect data mathematically, and how we actually verify who someone is.',
  lessons: [
    {
      title: 'Cryptography Fundamentals: Encryption, Hashing, and Signing',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** The 3 real, distinct cryptographic tools underneath most of the security controls this course has already discussed, and specifically what each one actually guarantees — and doesn't.

**Prerequisites:** Module 1 (Security Fundamentals & the CIA Triad) — each cryptographic tool below maps onto a specific CIA triad property.

**The concept, explained simply:**
**Encryption** transforms data so it's unreadable without a real, specific key — protecting **confidentiality** (Module 1's first property). **Encryption** comes in 2 real forms: **symmetric** (the same key encrypts and decrypts — fast, but the key itself must be shared safely) and **asymmetric** (a real key pair — a public key anyone can use to encrypt, and a private key only the holder can use to decrypt — solves the "how do we share the key safely" problem, at the cost of more computation). **Hashing** produces a fixed-size, one-way "fingerprint" of data — the same input always produces the same hash, but you genuinely cannot reverse a hash back into the original data — protecting **integrity** (a changed input produces a completely different hash, immediately revealing tampering). **Digital signing** combines hashing and asymmetric cryptography to prove both integrity *and* authenticity — that specific data hasn't been altered, *and* that it genuinely came from the claimed sender, since only their private key could have produced that specific signature.

**Why do we need this?** Confusing these 3 tools is a real, common, and consequential mistake — using encryption where you actually need a hash (or vice versa) doesn't just fail to help, it can create a false sense of security about a property the chosen tool never actually protected.

**How does it actually work?** Passwords are a real, concrete example where this distinction matters directly: a real system should never store a password encrypted (reversible, meaning a database breach could recover real passwords) — it should store a real, salted hash of the password (irreversible; even if the hash database leaks, the real passwords cannot be recovered from it directly, only guessed and checked against the hash). HTTPS (from Computer Networking Foundations) uses asymmetric cryptography to establish a connection, then switches to faster symmetric encryption for the actual session — a real, practical combination of both encryption types for their respective strengths.

**A simple everyday example:** A sealed envelope (encryption — reversible, the recipient can open and read it) versus a wax seal's unique impression pattern (a hash-like fingerprint — you can verify the seal wasn't tampered with, but the seal's pattern alone doesn't let you reconstruct the letter's contents) versus a notarized signature (digital signing — proves both that the document is unaltered and specifically who signed it).

**A technical example:** A real login system stores "bcrypt(password + salt)" (a real, salted hash), never the plaintext or an encrypted, reversible version — when a user logs in, the system hashes their submitted password the same way and compares hashes, never needing to "decrypt" a stored password, because there's nothing reversible to decrypt.

**Common mistakes:** storing passwords with reversible encryption instead of a real, salted hash — a serious, real, and still-common security failure; assuming hashing alone proves who sent something — a hash alone proves data wasn't altered, but proves nothing about who created it, which is exactly the gap digital signing (hashing + asymmetric crypto together) closes.

**When do we use which tool?** Encryption when data genuinely needs to be recovered later by an authorized party; hashing when you need to verify data hasn't changed (like passwords, where you never need the original back) or need file/message integrity checks; signing when you need to prove both integrity and authenticity together.

**How do we know we understood this?** Given a real scenario, you can correctly identify which of the 3 tools is appropriate, and explain what specifically it does and doesn't guarantee.

**Mini exercise:** A team wants to let users download a software update and verify it hasn't been tampered with in transit *and* genuinely came from the real vendor, not an attacker. Which cryptographic tool fits, and why not the other two?

**Reading:** NIST Cryptographic Standards and Guidelines — https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines (live-verified this phase).`,
    },
    {
      title: 'Identity and Access Management: Authentication, Authorization, and MFA',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** The real, distinct difference between proving who you are and being allowed to do something, and the one real practice that closes the gap a stolen password alone leaves open.

**Prerequisites:** "Cryptography Fundamentals: Encryption, Hashing, and Signing" — real authentication systems rely directly on the hashing concepts just covered.

**The concept, explained simply:**
**Authentication** answers "who are you" — verifying a claimed identity, typically via something you know (a password), something you have (a physical device or authenticator app), or something you are (biometrics). **Authorization** answers a genuinely different question: "given who you are, what are you actually allowed to do" — the same real least-privilege principle Cloud Computing Foundations' IAM lesson taught, applied to human users of any real system, not just automated cloud roles. **Multi-factor authentication (MFA)** requires 2 or more genuinely different factor types together — most commonly something you know plus something you have — so that a single compromised factor (like a leaked password) isn't sufficient on its own to authenticate as someone else.

**Why do we need this?** Passwords alone are a real, persistently weak authentication factor — they're reused across sites, phished, leaked in breaches of unrelated services, and guessed. MFA doesn't make passwords magically strong, but it means a single leaked password alone is no longer sufficient for an attacker to actually authenticate as that user, since the second, genuinely independent factor is still required.

**How does it actually work?** A real authentication flow verifies identity first (checking a submitted password's hash against the stored hash from Lesson 1, then, if MFA is enabled, prompting for and verifying the second factor); only after identity is established does a real system check authorization — does *this specific, now-verified* identity have permission for *this specific* requested action, checked on the server, every time, not just once at login and then trusted for the rest of the session without re-verification for sensitive actions.

**A simple everyday example:** A building checking your ID at the front door (authentication — confirming who you are) is a genuinely different step from a specific floor's keycard reader checking whether *your specific, now-confirmed* ID is actually permitted on that floor (authorization) — someone can be validly authenticated (a real employee) while still being correctly denied authorization to a restricted floor.

**A technical example:** A real API endpoint should check authentication (is there a valid, current session/token at all) *and* authorization (does this specific authenticated user have permission for this specific action on this specific resource) on every single sensitive request — checking only authentication and assuming authorization is implied is exactly the real Broken Access Control gap Module 3 covered.

**Common mistakes:** confusing authentication and authorization as the same check — a real, common, and consequential conflation, since a system can correctly authenticate someone while still needing to separately deny them authorization for a specific action; treating MFA as optional for accounts with real, elevated privileges (like administrators) — these are exactly the accounts where a single compromised password causes the most real damage, making MFA most valuable, not least necessary.

**When do we require MFA?** For any real account with access to sensitive data or elevated privileges — treating it as a baseline requirement for such accounts, not an optional convenience feature.

**How do we know we understood this?** Given a real system's access-control logic, you can identify whether it's checking authentication, authorization, both, or incorrectly conflating the two.

**Mini exercise:** A real system correctly verifies a valid login session on every request, but never separately checks whether that specific logged-in user owns the specific resource they're requesting. What real gap does this describe, and how does it connect to Module 3's Broken Access Control content?

**Homework:** Bring your authentication/authorization design reasoning into this course's first project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 3,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 4 (Cryptography Basics & Identity/Access Management). Review lessons 1–2 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 4 Final Assessment — Cryptography Basics & Identity/Access Management',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'Why should a real system store a salted hash of a password, rather than an encrypted (reversible) version of it?',
            questionType: 'single',
            options: [
              'Encryption is not a real cryptographic technique',
              'A hash is irreversible, so even if the hash database leaks, the real passwords cannot be directly recovered from it, unlike reversible encryption',
              'Hashing is faster than encryption, which is the only reason it is used',
              'There is no real difference between the two approaches',
            ],
            correctAnswer: [
              'A hash is irreversible, so even if the hash database leaks, the real passwords cannot be directly recovered from it, unlike reversible encryption',
            ],
          },
          {
            prompt: 'What is the real, described difference between authentication and authorization, per this module?',
            questionType: 'single',
            options: [
              'They are the same check performed twice for redundancy',
              'Authentication verifies who you are; authorization determines what that verified identity is actually allowed to do',
              'Authorization happens before authentication in every real system',
              'MFA replaces the need for authorization checks',
            ],
            correctAnswer: [
              'Authentication verifies who you are; authorization determines what that verified identity is actually allowed to do',
            ],
          },
          {
            prompt: 'Which of the following are real cryptographic tools covered in this module? (Select all that apply.)',
            questionType: 'multiple',
            options: ['Encryption', 'Hashing', 'Digital signing', 'Segmentation'],
            correctAnswer: ['Encryption', 'Hashing', 'Digital signing'],
          },
          {
            prompt: 'True or False: MFA should be treated as optional for accounts with elevated privileges, like administrators.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Practical question: why does digital signing require both hashing and asymmetric cryptography together, per this module?',
            questionType: 'text',
            correctAnswer:
              'Hashing alone proves data has not been altered but proves nothing about who created it; asymmetric cryptography (signing the hash with a private key) adds proof of authenticity, since only the holder of that specific private key could have produced a signature that verifies correctly against the corresponding public key — together they prove both integrity and authenticity, which neither tool proves alone.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 5: Incident Response & Ethical Hacking Fundamentals
// ---------------------------------------------------------------------
const module5: ModuleSeed = {
  title: 'Incident Response & Ethical Hacking Fundamentals',
  position: 5,
  description:
    'Closes this course with what happens when prevention fails: a real, structured process for responding to an actual incident, plus the ethical and methodological foundations of authorized security testing.',
  lessons: [
    {
      title: 'The Incident Response Lifecycle: Prepare, Detect, Contain, Eradicate, Recover',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** A real, structured, widely-used process for what to actually do once a security incident has happened — not prevention (every earlier module), but response.

**Prerequisites:** Module 1 (Security Fundamentals & the CIA Triad), Module 2 (Network Security) — a real incident is, in a real sense, exactly the threats those modules discussed, now actually occurring.

**The concept, explained simply:**
**Incident response** is the real, structured process an organization follows when a security incident is suspected or confirmed. A widely-used real framework has 5 real phases: **Preparation** (having real tools, documented procedures, and trained people ready *before* an incident happens — the same real principle as Module 1's threat modeling, applied to response readiness rather than prevention); **Detection & Analysis** (recognizing a real incident is actually happening, and understanding its real scope — what happened, how, and what's affected); **Containment** (real, immediate steps to stop the incident from spreading further, without prematurely destroying evidence needed for analysis); **Eradication** (removing the actual root cause — not just the symptom, e.g. removing malware AND closing the vulnerability that let it in); **Recovery** (safely restoring normal operations, with real verification the threat is genuinely gone, not just hidden or dormant); and a real, often-skipped final step, **Lessons Learned** (a genuine post-incident review feeding back into Preparation for next time).

**Why do we need this?** Without a real, structured process, incident response under real pressure tends to be chaotic — critical evidence gets destroyed, containment happens too late or too early, and the same real root cause goes unaddressed and recurs. A structured process, rehearsed *before* a real incident, performs dramatically better than an improvised one under real, live pressure.

**How does it actually work?** A concrete example: detecting unusual outbound network traffic from an internal server (Detection & Analysis) leads to isolating that specific server from the network (Containment — stopping the spread, without immediately wiping it, since it may hold real evidence); investigation reveals a specific unpatched vulnerability was exploited (Eradication — patching it, not just removing the immediate malware); the server is rebuilt from a known-clean state and reconnected only after verification (Recovery); a post-incident review documents specifically how the vulnerability went unpatched and what real process change prevents a recurrence (Lessons Learned, feeding into better Preparation).

**A simple everyday example:** A real fire response: you don't improvise procedures in the moment — you've already rehearsed evacuation routes (Preparation), someone specifically identifies the fire and its scope (Detection & Analysis), doors are closed to slow its spread without trapping anyone (Containment), the fire is actually extinguished (Eradication), the building is inspected and cleared before people return (Recovery), and afterward there's a real review of what started it and how to prevent a recurrence (Lessons Learned).

**Common mistakes:** skipping Preparation and only thinking about incident response once an incident is already happening — exactly the "afterthought security" problem Module 1's threat modeling lesson already warned against, now applied to response instead of prevention; treating Eradication as complete once the immediate symptom (like active malware) is removed, without addressing the real root cause that let it in, which leaves the system vulnerable to an immediate, predictable recurrence.

**When do we apply this lifecycle?** It should already exist, documented and at least minimally rehearsed, before any real incident occurs — an organization's very first real incident is the worst possible time to be designing this process from scratch.

**How do we know we understood this?** Given a real incident scenario, you can correctly sequence the real response actions across the 5 phases, and explain why performing them out of order (e.g. Eradication before real Containment) would be a genuine, serious mistake.

**Mini exercise:** A team discovers a compromised employee account is actively being used to access sensitive files. Walk through what a real, correctly-sequenced response would look like across at least 3 of the 5 phases.

**Reading:** NIST SP 800-61 Revision 3, "Incident Response Recommendations and Considerations for Cybersecurity Risk Management" — https://csrc.nist.gov/pubs/sp/800/61/r3/final (live-verified this phase; the current, official NIST incident response guidance, aligned to the NIST Cybersecurity Framework 2.0 already cited in Module 1).`,
    },
    {
      title: 'Ethical Hacking Fundamentals: Reconnaissance, Scanning, and Responsible Disclosure',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** The real, structured methodology and — just as importantly — the real ethical and legal boundaries that separate authorized security testing from a real crime.

**Prerequisites:** Module 3 (Application Security) — ethical hacking applies that module's verification mindset at a broader, whole-system scale.

**The concept, explained simply:**
**Ethical hacking** (also called authorized penetration testing) means actively attempting to find real security weaknesses in a system, using many of the same real techniques a malicious attacker would — but with **explicit, documented, prior authorization** from the system's real owner, within an agreed real scope, and with a genuine goal of improving security, not causing harm. The one real thing that makes this "ethical" rather than a crime is explicit authorization — the exact same technical action, performed without it, is illegal in most real jurisdictions, regardless of intent.

**Why do we need this?** Organizations need to know their real, actual weaknesses before a real malicious attacker finds them first — but discovering those weaknesses requires genuinely attempting to find them, which is indistinguishable, technically, from what an attacker does. Authorization is the entire real line between a valuable, legal security service and a real crime.

**How does it actually work?** A real, structured methodology: **Reconnaissance** (gathering real, publicly-available or authorized information about the target — what services are running, what technologies are in use — without yet actively probing for weaknesses); **Scanning** (actively but carefully probing the authorized target for specific, real vulnerabilities, using the same real hands-on approach Module 3 introduced); **Exploitation** (within the agreed scope, safely demonstrating a real vulnerability is genuinely exploitable, not just theoretically present — done carefully, to prove the risk without causing real damage); **Reporting** (a real, clear, actionable writeup of what was found, its real severity, and specific remediation steps — arguably the most valuable real deliverable, since a finding nobody can act on has little real value). **MITRE ATT&CK**, a real, widely-used knowledge base of real-world adversary tactics and techniques, is the standard reference many real analysts use to structure and describe findings using shared, industry-standard terminology.

**A simple everyday example:** A locksmith hired specifically to test whether a building's locks can actually be picked, with the owner's full knowledge and a written agreement — versus someone picking the same lock without permission, which is a real crime regardless of whether the person picking it had good intentions or genuinely meant no harm.

**A technical example:** A real, authorized penetration test against the intentionally vulnerable sample application (this course's consistent, safe practice target) follows this same real 4-phase structure — reconnaissance first, then careful scanning, then a scoped, safe demonstration of a real finding, then a clear report — exactly the same discipline a real, professional engagement follows, just against a deliberately safe target instead of a real client's production system.

**Common mistakes:** treating "I meant no harm" or "I was just curious" as a defense for testing a system without explicit authorization — it is not, in most real jurisdictions, a legal defense; performing scanning or exploitation activities beyond the specific, agreed real scope of an authorized engagement, which itself becomes unauthorized and potentially illegal even within an otherwise-legitimate real engagement.

**When do we perform ethical hacking?** Only under a real, explicit, documented authorization, within a clearly agreed real scope — never against any system, however well-intentioned the reason, without that authorization in hand first.

**How do we know we understood this?** You can explain, specifically, why authorization is the one real factor separating ethical hacking from a crime, and can correctly sequence the 4-phase methodology for a real, described authorized engagement.

**Mini exercise:** A friend asks you to "just check" whether their personal website has any security weaknesses, without any formal written agreement. Explain, based on this lesson, what real risk this specific scenario carries and what you'd need in place before proceeding.

**Reading:** MITRE ATT&CK — https://attack.mitre.org/ (live-verified this phase; the real, industry-standard knowledge base of adversary tactics and techniques).

**Homework:** This lesson's 4-phase methodology and its ethical/legal framing are the direct foundation for this course's closing capstone project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 3,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 5 (Incident Response & Ethical Hacking Fundamentals) — the final module of Cyber Security Fundamentals. Review lessons 1–2 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 5 Final Assessment — Incident Response & Ethical Hacking Fundamentals',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'What is the correct order of the 5 real incident response phases, per this module?',
            questionType: 'single',
            options: [
              'Detection, Preparation, Containment, Recovery, Eradication',
              'Preparation, Detection & Analysis, Containment, Eradication, Recovery',
              'Containment, Preparation, Eradication, Detection, Recovery',
              'Recovery, Eradication, Containment, Detection, Preparation',
            ],
            correctAnswer: ['Preparation, Detection & Analysis, Containment, Eradication, Recovery'],
          },
          {
            prompt: 'Why does this module warn against treating Eradication as complete once the immediate symptom (like active malware) is removed?',
            questionType: 'single',
            options: [
              'Eradication is not a real part of incident response',
              'Without addressing the real root cause that let the incident happen, the system remains vulnerable to an immediate, predictable recurrence',
              'Symptoms and root causes are always the same thing',
              'This is correct — removing the symptom is always sufficient',
            ],
            correctAnswer: [
              'Without addressing the real root cause that let the incident happen, the system remains vulnerable to an immediate, predictable recurrence',
            ],
          },
          {
            prompt: 'What is the one real factor that separates ethical hacking from a crime, per this module?',
            questionType: 'single',
            options: [
              'Having good intentions',
              'Explicit, documented, prior authorization from the system\'s real owner, within an agreed scope',
              'Using only publicly-known techniques',
              'Not causing any actual damage, regardless of authorization'
            ],
            correctAnswer: [
              'Explicit, documented, prior authorization from the system\'s real owner, within an agreed scope',
            ],
          },
          {
            prompt: 'Which of the following are real phases of the ethical hacking methodology described in this module? (Select all that apply.)',
            questionType: 'multiple',
            options: ['Reconnaissance', 'Scanning', 'Reporting', 'Retaliation'],
            correctAnswer: ['Reconnaissance', 'Scanning', 'Reporting'],
          },
          {
            prompt: 'Practical question: why does this module say "I meant no harm" is not a legal defense for testing a system without authorization?',
            questionType: 'text',
            correctAnswer:
              'In most real jurisdictions, unauthorized access or testing of a system is illegal regardless of the tester\'s intent — authorization, not intent, is the real legal and ethical line; good intentions do not retroactively make an unauthorized test lawful.',
          },
        ],
      },
    },
  ],
};

const MODULES: ModuleSeed[] = [module1, module2, module3, module4, module5];

// ---------------------------------------------------------------------
// 2 standalone Projects (Phase 26 architecture), matching this session's
// established "quality over quantity" precedent over the blueprint's
// literal "5 projects" planning figure. Both require genuine analytical
// reasoning, not command-copying, per this phase's explicit instruction.
// ---------------------------------------------------------------------
const PROJECTS: ProjectSeed[] = [
  {
    title: 'Threat Model and Harden a Small Web Application',
    description:
      'Beginner/Intermediate tier — apply the CIA triad, STRIDE threat modeling, defense-in-depth network design, and OWASP-aware access-control reasoning to a described small web application.',
    instructions: `**Objective:** Given a described small web application, produce a real threat model and a concrete hardening plan applying Modules 1-3's real frameworks.

**The scenario:** A small web application lets registered users submit and view reviews for local businesses. It has a public review-listing page, a login-protected review-submission form, and an admin panel for moderating flagged reviews.

**Requirements:**
- **CIA triad analysis** (Module 1, Lesson 1): identify one specific, realistic failure scenario for each of Confidentiality, Integrity, and Availability for this specific application.
- **STRIDE threat model** (Module 1, Lesson 2): identify at least 5 real, specific threats across at least 4 different STRIDE categories, specific to this application's real features (not generic, copy-pasted threats).
- **Network/defense-in-depth design** (Module 2): propose at least 3 genuinely independent defense layers for this application, and explain what each protects against.
- **Access control reasoning** (Module 3): specifically address how the admin panel's access should be enforced (not just hidden from the UI for non-admins), and describe one safe, specific way you'd verify that enforcement actually works.
- For each identified threat, state whether you'd mitigate, accept, transfer, or avoid it, and why (per Module 1, Lesson 2's real risk-decision framework).

**Expected result:** Your CIA triad analysis, your STRIDE threat model (at least 5 threats), your defense-in-depth design, your access-control reasoning for the admin panel, and your risk decisions.

**Difficulty:** Beginner/Intermediate.

**Skills tested:** applying the CIA triad and STRIDE to a real, specific system rather than generically; designing genuinely independent defense layers; distinguishing UI-hidden features from actually-enforced access control.

**Suggested implementation steps:**
1. Do the CIA triad analysis first — it grounds everything that follows.
2. Build the STRIDE threat model against the application's real, specific features.
3. Design defense-in-depth layers and access-control enforcement for the threats you found.
4. Make explicit risk decisions (mitigate/accept/transfer/avoid) last, once the real threats and options are clear.

**Evaluation criteria:** the CIA triad scenarios and STRIDE threats are specific to this application, not generic; the defense layers are genuinely independent, not redundant restatements of the same control; the access-control reasoning correctly distinguishes UI-hiding from real server-side enforcement; risk decisions are justified, not just labeled.`,
    position: 2,
  },
  {
    title: 'Incident Response Tabletop: Investigate and Contain a Simulated Breach',
    description:
      'Capstone tier — given a simulated incident scenario, walk through the real incident response lifecycle, reason about the attack using ethical-hacking methodology concepts, and produce real, actionable remediation recommendations.',
    instructions: `**Objective:** Given a simulated security incident scenario, produce a real, structured incident response walkthrough and remediation report applying Module 4 (cryptography/IAM) and Module 5 (incident response, ethical hacking methodology) together.

**The scenario:** A company's internal monitoring flags unusual activity: a customer-support employee's account made several failed login attempts from an unfamiliar location at 3 AM, followed by a successful login, followed by that account accessing and downloading a large export of customer records it has never accessed before. The company's user table stores passwords as plain, unsalted MD5 hashes (a real, described technical detail relevant to your cryptography analysis).

**Requirements:**
- **Detection & Analysis** (Module 5, Lesson 1): state what specifically about this activity should have triggered concern, and what additional information you'd want to confirm the scope of the incident.
- **Containment** (Module 5, Lesson 1): propose specific, immediate containment actions — and explain why you would NOT simply delete the compromised account immediately (per this module's real evidence-preservation principle).
- **Cryptography analysis** (Module 4, Lesson 1): explain specifically why storing passwords as plain, unsalted MD5 hashes is a real, serious weakness here, and what a properly designed system would do instead.
- **IAM analysis** (Module 4, Lesson 2): identify whether this incident involved an authentication failure, an authorization failure, or both, and explain your reasoning; state whether MFA, if it had been enabled on this account, would likely have prevented this specific incident, and why.
- **Eradication & Recovery** (Module 5, Lesson 1): propose the real root cause(s) that must be addressed (not just resetting the one compromised password), and what verification you'd want before considering the incident closed.
- **Lessons Learned** (Module 5, Lesson 1): propose at least 2 concrete, real process or technical changes that would reduce the likelihood or impact of a similar future incident.

**Expected result:** A structured, real report covering every requirement above, organized by incident response phase.

**Difficulty:** Capstone (closes this course).

**Skills tested:** applying the full incident response lifecycle to a real, specific scenario; connecting cryptography and IAM analysis to a concrete incident; distinguishing authentication from authorization failures; producing genuinely actionable, specific remediation recommendations rather than generic advice.

**Suggested implementation steps:**
1. Work through Detection & Analysis and Containment first, based only on what's known so far.
2. Do the cryptography and IAM analysis against the specific technical details given.
3. Propose Eradication/Recovery actions grounded in your own analysis.
4. Write Lessons Learned last, once the real root causes are clear.

**Evaluation criteria:** the containment reasoning correctly avoids destroying evidence; the cryptography analysis correctly identifies the real, specific weakness of unsalted MD5 (not just "weak encryption" in vague terms); the IAM analysis correctly distinguishes authentication from authorization and reasons concretely about MFA's real effect; recommendations are specific and actionable, not generic security advice that could apply to any incident.`,
    position: 3,
  },
];

// ---------------------------------------------------------------------
// The new Cyber Security Analyst LearningPath — confirmed via direct
// query (not assumed) that no existing path is a real fit: none of the
// 6 existing paths contain this exact 3-course combination. The Cloud
// Computing Foundations elective is explicitly NOT mandatory per the
// blueprint and is therefore not linked as a required path course.
// ---------------------------------------------------------------------
const CYBER_PATH_SLUG = 'cyber-security-analyst';
const CYBER_COURSE_SLUGS = [
  'programming-foundations-python-javascript', // Phase 36, reused
  'computer-networking-foundations', // Phase 34, reused
  COURSE_SLUG, // this phase's new course
];

async function main(): Promise<void> {
  const instructor = await prisma.user.findFirst({ where: { email: INSTRUCTOR_EMAIL } });
  if (!instructor) {
    throw new Error(
      'Phase 40 seed requires the existing e2e.instructor@phoenix.test fixture user to exist — not found. Run the standard E2E fixture setup first.',
    );
  }

  const category = await prisma.category.upsert({
    where: { slug: 'security' },
    update: {},
    create: { slug: 'security', name: 'Cyber Security', domain: 'courses' },
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
          'A defender-first introduction to security: the CIA triad, threat modeling, network security, application security (OWASP Top 10, from an analyst\'s verification lens), cryptography basics, identity and access management, and incident response and ethical hacking fundamentals — all hands-on labs against an intentionally vulnerable sample application, never real production systems. Built Phase 40 to close the one remaining real gap Phase 35\'s analysis found for the Cyber Security Analyst learning path.',
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

  // Create the new Cyber Security Analyst LearningPath, following
  // Phase 37/38/39's whole-path-membership guard pattern (this is a
  // brand-new path, so its own "any memberships exist" guard is correct
  // and safe here).
  let pathsCreated = 0;
  let membershipsCreated = 0;
  let path = await prisma.learningPath.findUnique({ where: { slug: CYBER_PATH_SLUG } });
  if (!path) {
    path = await prisma.learningPath.create({
      data: {
        slug: CYBER_PATH_SLUG,
        title: 'Cyber Security Analyst',
        description:
          'Defends systems, investigates incidents, and reduces organizational risk. See docs/content-library/learning-paths.md and docs/content-library/phase35-learning-path-master-blueprint.md Section 8 for the full staged course table and skill-gap analysis.',
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
    const courses = await prisma.course.findMany({ where: { slug: { in: CYBER_COURSE_SLUGS } } });
    const bySlug = new Map(courses.map((c) => [c.slug, c]));
    let position = 1;
    for (const slug of CYBER_COURSE_SLUGS) {
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
    `\nPhase 40 content seed complete: course ${courseCreated ? 'created' : 'already existed'}, ${modulesCreated} modules created, ${lessonsCreated} lessons created, ${quizzesCreated} quizzes created, ${questionsCreated} quiz questions created, ${projectsCreated} projects created (${projectsSkipped} already existed), ${pathsCreated} learning path created, ${membershipsCreated} path memberships created.`,
  );
}

main()
  .catch((error) => {
    console.error('Phase 40 seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
