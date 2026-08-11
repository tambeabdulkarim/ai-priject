// Phase 34 — Educational Content Production: Computer Networking
// Foundations.
//
// Completes the course to production-ready status, per
// docs/content-library/courses.md's approved 3-module breakdown. Module 1
// (OSI/TCP-IP Models & IP Addressing, Phase 25) already exists and is NOT
// touched or duplicated — this file adds Module 2 (Routing, Switching &
// DNS) and Module 3 (HTTP/HTTPS, VPNs & Troubleshooting), plus the
// course's 2 planned Projects (currently 0), created directly via the
// Phase 26 Project model.
//
// Explanation style follows this phase's explicit instruction: plain
// language, every technical term named, explained simply, and given an
// everyday example before a technical one — matching (not replacing) the
// lesson template already established in
// seed-phase25/27/30/31/32/33-content.ts.
//
// Same application-level idempotency pattern as prior phases: findFirst
// by parent+title before create.
//
// Resources: reuses already-verified MDN Web Docs (VERIFIED Phase 25).
// The pre-existing "Computer Networking: A Top-Down Approach" (Kurose &
// Ross) book citation remains NEEDS_VERIFICATION, unchanged — not
// silently upgraded. Two new resources were live-fetched and confirmed
// this phase (the official Cloudflare Learning Center could not be
// verified — it returned HTTP 403 on every fetch attempt, bot-blocked,
// inconclusive not negative — so it is NOT cited here):
//   - https://www.rfc-editor.org/rfc/rfc1035 — the official IETF RFC
//     1035 ("Domain names - implementation and specification"),
//     confirmed live via WebFetch, 2026-08-10.
//   - https://www.rfc-editor.org/rfc/rfc9110 — the official IETF RFC
//     9110 ("HTTP Semantics"), confirmed live via WebFetch, 2026-08-10.
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
// Module 2: Routing, Switching & DNS
// ---------------------------------------------------------------------
const netModule2: ModuleSeed = {
  courseSlug: 'computer-networking-foundations',
  title: 'Routing, Switching & DNS',
  position: 2,
  description:
    'Builds on Module 1\'s IP addressing — this module is about the real devices and processes that actually move data between addresses: switches, routers, and DNS.',
  lessons: [
    {
      title: 'Switching Basics: How Devices Talk on the Same Network',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      isPreview: true,
      body: `**What is this lesson about, in one sentence?** How devices on the *same* local network (like all the computers in one office) actually find and talk to each other.

**Prerequisites:** Module 1's IP addressing lessons — this lesson assumes you already know what an IP address is.

**What is a switch? Simple explanation first:**
Think of a switch like a smart mail sorter inside one building. If 20 people work in the same office building and someone sends an internal memo to "Room 204," the mail sorter doesn't deliver a copy to every room — it looks up exactly which room that is and delivers it only there. A **switch** does the same thing for devices connected to the same local network: it learns which device is physically connected to which port, and delivers data only to the right one, not to everyone.

**Why do we need this?** Without a switch's "smart delivery," every message sent by any device would have to be broadcast to *every* other device on the network, whether it was meant for them or not — wasteful, slow, and a real privacy/security concern (other devices could see traffic never meant for them).

**How does it actually work?** Every network device has a unique hardware identifier called a **MAC address** (built into the device's network hardware, different from an IP address, which is more like a location the device can be assigned). A switch builds a table mapping "this MAC address is reachable through this specific port" by watching the traffic that passes through it, then uses that table to deliver each message only out the correct port.

**A simple everyday example:** A office mail sorter that learns, over time, "mail addressed to this name always goes to Room 204" and stops needing to ask around — after seeing a device's traffic once, a switch "remembers" where that device is.

**A technical example:** Two laptops plugged into the same switch send data directly to each other through the switch, without that data ever needing to leave the building (the local network) or involve a router at all — this local-only communication is exactly what switching handles.

**Common mistakes:** confusing a MAC address (a hardware identifier, tied to the physical device) with an IP address (an assigned network address, which is Module 1's topic, and can change) — they solve different problems and operate at different points in the process; assuming a switch understands IP addresses at all — a basic switch only needs MAC addresses to do its job, it doesn't need to know anything about IP.

**When do we use a switch?** Any time multiple devices need to communicate directly within the same local network (a home, an office, a single building) — this is genuinely different from Lesson 2's routing, which is about crossing *between* different networks.

**How do we know we understood this?** You can explain, to someone who has never heard of networking, the difference between "a switch delivers mail within one building" and why that's different from what happens when mail needs to leave the building entirely.

**Mini exercise:** Two laptops and a printer are all plugged into the same switch in a small office. Explain, in your own words, how the switch knows to deliver a print job specifically to the printer's port and not to the other laptop.

**Reading:** MDN Web Docs — https://developer.mozilla.org (already verified Phase 25; general web/networking terminology reference).`,
    },
    {
      title: 'Routing Basics: How Data Crosses Between Networks',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How data gets from your home network all the way to a server somewhere else in the world, crossing many different networks along the way.

**Prerequisites:** "Switching Basics: How Devices Talk on the Same Network" — routing is the next step once data needs to leave the local network switching handles.

**What is a router? Simple explanation first:**
If a switch is like mail delivery *within* one building, a **router** is like the postal service that moves mail *between* different buildings, cities, or even countries. A router's job is to look at where a piece of data is ultimately headed (its destination IP address) and decide which direction to send it next, one step closer to its destination — it usually doesn't know the *entire* path in advance, just the best next step.

**Why do we need this?** Module 1 established that different networks have different address ranges (e.g. 192.168.1.x vs. 192.168.2.x). Switching alone can't get data from one such network to another — that's specifically what routing exists to solve.

**How does it actually work?** A router keeps a **routing table** — a list of "to reach this range of addresses, send data out this direction." When data arrives, the router checks its destination against this table and forwards it accordingly. In a real, large network (like the internet), no single router knows the full path to every possible destination — instead, each router along the way makes its own "best next step" decision, and the data hops from router to router until it arrives.

**A simple everyday example:** Mailing a letter from a small town to a different country: your local post office doesn't personally know the exact route to the destination street — it forwards the letter to a regional hub, which forwards it further, each step getting closer, until it reaches a post office that knows the final local delivery.

**A technical example:** A **traceroute** tool (mentioned again in Module 3) reveals this hop-by-hop process directly — running it against a real website typically shows the data passing through several different routers (each one a "hop") before reaching the destination, which is direct, observable proof that routing is a multi-step relay, not one single jump.

**Common mistakes:** assuming there's one single router that "knows the whole path" to any destination on the internet (there isn't — it's a genuinely distributed, hop-by-hop process, no single router has the complete picture); confusing routing (moving data *between* different networks) with switching (moving data *within* one network) — they solve genuinely different problems, at different layers of the process.

**When do we use routing?** Any time data needs to travel from one network to a different network — including the very common case of a home network reaching anything on the wider internet, since a home network is itself just one small network among many.

**How do we know we understood this?** You can explain why a router needs a destination-based routing table (unlike a switch's MAC-address table), and why no single router typically knows a message's entire path to a distant destination in advance.

**Mini exercise:** Explain, in your own words, why sending data from your home network to a website hosted on the other side of the world requires routing (crossing between many networks), not just switching (staying within one).

**Homework:** None — feeds into this module's project.`,
    },
    {
      title: 'DNS in Depth: Records, Resolution, and What Happens When It Fails',
      position: 3,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How a human-friendly name like "example.com" actually gets turned into the real IP address a computer needs, in more depth than Module 1's brief mention.

**Prerequisites:** Module 1's "Tracing a Real Request" lesson, which first introduced DNS resolution briefly — this lesson goes deeper into how it actually works and what happens when it breaks.

**What is DNS? Simple explanation first (recap):**
DNS (the Domain Name System) is like a phone book for the internet — it looks up a name ("example.com") and returns the real address (an IP address) a computer actually needs to connect to. Module 1 introduced this briefly; this lesson goes into how that lookup actually happens and what its building blocks are.

**Why do we need this depth?** DNS problems are one of the most common real causes of "the internet is broken" — understanding its actual structure (not just "it's a phone book") is what lets you diagnose a real DNS problem instead of guessing.

**How does it actually work? DNS records:**
A domain's DNS information is stored as a set of **records**, each with a specific job:
1. **A record.** Maps a domain name directly to an IPv4 address — the most basic, common record type.
2. **CNAME record.** Maps a domain name to *another* domain name (an alias), rather than directly to an address — useful when multiple names should all resolve the way one "real" name does, without duplicating the actual address record.
3. **MX record.** Specifies which mail servers handle email for a domain — a completely separate concern from "what web server hosts this domain's website," which is a common point of confusion.

**How does it actually work? The resolution hierarchy:**
DNS lookups happen through a hierarchy, not a single flat lookup: a request typically goes to a **recursive resolver** (often run by your internet provider, or a public one you've configured), which — if it doesn't already have the answer cached — asks a **root server**, which points to the right **top-level domain (TLD) server** (e.g. for ".com"), which points to the specific domain's **authoritative server**, which finally has the real, correct answer.

**What happens when DNS fails?** If any step in this chain fails or times out, the whole lookup fails — and critically, this looks to a user exactly like "the website is down," even though the actual website server might be perfectly healthy. This is a real, common, and genuinely confusing troubleshooting trap: a DNS failure and a real server outage can look identical from a user's perspective, but require completely different fixes.

**A simple everyday example:** Looking up a business's phone number in a directory that's several steps removed from the business itself (a general directory pointing you to a regional directory, pointing you to the specific listing) — if any directory in that chain is unavailable, you can't get the number, even though the business itself is open and operating fine.

**A technical example:** A domain's DNS records get misconfigured (e.g. pointing to an old, retired server's IP address) — visitors get connection errors or the wrong site entirely, while the *actual* current server is running perfectly — the problem is entirely in the DNS layer, not the server itself.

**Common mistakes:** assuming "the site won't load" always means the destination server is down, when a DNS failure produces the exact same visible symptom; confusing an MX record (email routing) with an A record (website hosting) — a domain can have working email and a broken website, or vice versa, because these are genuinely separate records with separate purposes.

**When do we check DNS specifically?** Whenever something "isn't loading" and you want to rule out whether the problem is name resolution (DNS) versus the actual destination server or network path — this becomes a concrete tool in Module 3's troubleshooting lesson.

**How do we know we understood this?** You can name at least 2 different DNS record types and what each is actually for, and explain why "the site is down" and "DNS is broken" can look identical to a user but require different fixes.

**Reading:** IETF RFC 1035, "Domain names - implementation and specification" — https://www.rfc-editor.org/rfc/rfc1035 (live-verified this phase; the original official specification defining how DNS actually works).

**Homework:** Keep your DNS-failure-vs-server-outage understanding — direct input to Module 3's troubleshooting lesson and this module's project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 2 (Routing, Switching & DNS). Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 2 Final Assessment — Routing, Switching & DNS',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'What does a switch use to decide which port to deliver data out of, per this module?',
            questionType: 'single',
            options: [
              'The device\'s IP address only',
              'The device\'s MAC address, learned from traffic passing through the switch',
              'A random guess each time',
              'The device\'s domain name',
            ],
            correctAnswer: [
              'The device\'s MAC address, learned from traffic passing through the switch',
            ],
          },
          {
            prompt: 'Scenario: data needs to travel from a home network to a website hosted on a different network far away. Per this module, what is directly responsible for getting it there?',
            questionType: 'single',
            options: [
              'Switching alone, since switches can reach any destination',
              'Routing — forwarding the data through a series of routers, each making a "next step" decision',
              'DNS alone handles this without any routers involved',
              'This is not possible without a direct physical cable to the destination',
            ],
            correctAnswer: [
              'Routing — forwarding the data through a series of routers, each making a "next step" decision',
            ],
          },
          {
            prompt: 'Which of the following are real, distinct DNS record types and their purposes, per this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'An A record maps a domain name to an IPv4 address',
              'An MX record specifies which mail servers handle a domain\'s email',
              'A CNAME record maps a domain name to another domain name',
              'All DNS record types do exactly the same thing',
            ],
            correctAnswer: [
              'An A record maps a domain name to an IPv4 address',
              'An MX record specifies which mail servers handle a domain\'s email',
              'A CNAME record maps a domain name to another domain name',
            ],
          },
          {
            prompt: 'True or False: a DNS failure and an actual destination-server outage can look identical to a user, even though they require completely different fixes.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['True'],
          },
          {
            prompt: 'Practical question: why doesn\'t a single router typically know the entire path to a distant destination on the internet in advance, per this module?',
            questionType: 'text',
            correctAnswer:
              'Routing is a distributed, hop-by-hop process — each router only decides the best next step toward the destination based on its own routing table, and the data is relayed router to router, with no single router holding the complete end-to-end path.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 3: HTTP/HTTPS, VPNs & Troubleshooting
// ---------------------------------------------------------------------
const netModule3: ModuleSeed = {
  courseSlug: 'computer-networking-foundations',
  title: 'HTTP/HTTPS, VPNs & Troubleshooting',
  position: 3,
  description:
    'Closes the course by covering the protocol most learners actually interact with daily (HTTP/HTTPS), how a VPN changes the network path, and the practical tools used to diagnose real network problems.',
  lessons: [
    {
      title: 'HTTP and HTTPS: Requests, Responses, and Why Encryption Matters',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      isPreview: true,
      body: `**What is this lesson about, in one sentence?** How a web browser actually asks a server for a page, and why the "S" in HTTPS is a genuinely important difference, not just a minor detail.

**Prerequisites:** Module 1's "Tracing a Real Request" lesson, which already introduced the basic idea of an HTTP request/response.

**What is HTTP? Simple explanation first (recap and depth):**
HTTP (HyperText Transfer Protocol) is the "language" a browser and a web server use to talk: the browser sends a **request** ("please give me this specific page"), and the server sends back a **response** (the page's content, plus a status code saying whether it worked). A **status code** is a short, standardized number telling the browser what happened — e.g. 200 means success, 404 means "that page doesn't exist," 500 means "the server itself had an error."

**Why do we need HTTPS specifically?** Plain HTTP sends this request/response conversation in a form anyone who can see the network traffic (e.g. on shared public WiFi) could read directly — including passwords, personal data, anything in the page content. **HTTPS** adds encryption (via TLS, a security layer) on top of the same HTTP conversation, so the *content* is scrambled to anyone intercepting it in transit, even though the conversation's basic shape (a request, then a response) is the same.

**How does it actually work?** Before any real HTTP data is exchanged over HTTPS, the browser and server perform a **TLS handshake** — a brief negotiation where they agree on an encryption method and exchange the cryptographic information needed to encrypt everything that follows. This happens automatically and quickly, but it is a real, distinct extra step compared to plain HTTP.

**A simple everyday example:** Sending a postcard (HTTP) versus sending a sealed, locked envelope (HTTPS) — anyone handling a postcard along its route can read it; a locked envelope's contents stay private even though it passes through the same postal system.

**A technical example:** Logging into a real website over plain HTTP would send your password across the network in a form a nearby attacker on the same public WiFi could directly read; the same login over HTTPS sends the same password, but encrypted, so an attacker seeing the same network traffic sees only unreadable scrambled data.

**Common mistakes:** assuming HTTPS makes a website's *content* secret from the destination server itself (it doesn't — the server you're actually talking to can obviously see the real data; HTTPS protects the data *in transit*, from anyone else who might be watching the network path); assuming any status code starting with a different digit than 2 automatically means "the website is broken" — a 404 (page not found) is a normal, correctly-functioning response telling you a specific page doesn't exist, which is a different situation than a 500 (the server itself is malfunctioning).

**When do we use HTTPS instead of HTTP?** Essentially always for any real website today — especially anything involving login credentials, personal data, or payment information, where the "postcard vs. locked envelope" difference has real, direct consequences.

**How do we know we understood this?** You can explain, in your own words, what HTTPS actually protects against (data being readable in transit) versus what it does *not* protect against (the destination server itself seeing your real data) — and you can distinguish a 404 from a 500 and explain why they mean genuinely different things.

**Mini exercise:** A user reports "the login page shows an error." List 2 different status codes that could produce this symptom, and explain what each would actually mean about where the problem is.

**Reading:** IETF RFC 9110, "HTTP Semantics" — https://www.rfc-editor.org/rfc/rfc9110 (live-verified this phase; the official specification defining HTTP's request/response/status-code behavior). MDN Web Docs — https://developer.mozilla.org (already verified Phase 25; practical HTTP reference).`,
    },
    {
      title: 'Ports, NAT, and Firewalls: Controlling What Gets In and Out',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How a single device can run many different network services at once without them interfering with each other, how a whole home network shares one public address, and how unwanted traffic gets blocked.

**Prerequisites:** Module 1's IP addressing lessons; "HTTP and HTTPS: Requests, Responses, and Why Encryption Matters."

**What is a port? Simple explanation first:**
If an IP address is like a building's street address, a **port** is like a specific apartment number within that building — it lets multiple different services on the same device (or same address) be reached separately. A web server typically listens on port 443 (HTTPS) or port 80 (HTTP); an email server listens on a different port entirely — this is what lets one machine run a website and an email server at the same time without confusion about which request is for which service.

**What is NAT? Simple explanation first:**
Most homes have many devices (phones, laptops, a smart TV) but typically only *one* public IP address assigned by the internet provider. **NAT (Network Address Translation)** is what lets all of those devices share that one public address — your home router keeps track of which internal device made which outgoing request, so when a response comes back, it knows exactly which device to deliver it to internally, even though from the outside, all the traffic appeared to come from one single address.

**What is a firewall? Simple explanation first:**
A **firewall** is a checkpoint that decides which network traffic is allowed in or out, based on a set of rules — like a building's security desk checking a list of who's allowed in, rather than letting anyone walk through. A firewall can block traffic based on things like which port it's trying to reach, or where it's coming from.

**Why do we need all three of these?** Ports let one device run multiple services; NAT lets a whole household or office share one public address (a real, practical necessity given how few public addresses exist relative to how many devices exist); firewalls add a real, deliberate control point over what's allowed to communicate at all — none of the three would substitute for either of the other two.

**A simple everyday example:** A large office building (one street address, like an IP address) has many numbered offices inside (like ports) — mail addressed to "Suite 204" reaches a specific business within the building, not just anywhere inside it. The building's shared mailroom, which knows which outgoing package request corresponds to which internal recipient, works like NAT. The building's front-desk security checking IDs before letting anyone in works like a firewall.

**A technical example:** A home router performing NAT lets 5 different family devices all browse the internet using the household's single public IP address simultaneously — each device's individual requests and responses are correctly tracked and delivered internally, invisible to anyone outside as a single shared address; a firewall rule blocking incoming traffic on a specific port prevents an unwanted external connection attempt to that specific port from ever reaching any internal device.

**Common mistakes:** assuming NAT is itself a security feature (it has a real *side effect* of hiding internal device addresses from the outside, but it isn't designed as a security control — a firewall is the actual, deliberate access-control mechanism); confusing "blocking a port" with "blocking a specific device" — a firewall rule based on port number affects that type of traffic regardless of which internal device is involved, a different, more specific kind of rule than blocking by device address.

**When do we use each?** Ports whenever multiple services need to be reachable at the same address; NAT whenever multiple devices need to share one limited public address; firewalls whenever you need deliberate, explicit control over what traffic is allowed at all — these needs are all extremely common and typically present together in any real home or office network.

**How do we know we understood this?** You can explain the specific job of ports, NAT, and firewalls separately, and give one concrete example of a problem each one specifically solves that the other two don't.

**Mini exercise:** A home network has 3 devices sharing one public IP address, all browsing different websites at the same time. Explain how NAT ensures each device correctly receives only its own responses, not another device's.

**Homework:** Bring your ports/NAT/firewall understanding into this module's next lesson and the course's project.`,
    },
    {
      title: 'VPNs and Real Network Troubleshooting Tools',
      position: 3,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How a VPN changes your network path, and the practical, real tools used to diagnose what's actually wrong when "the network isn't working."

**Prerequisites:** All prior lessons in this course — this lesson deliberately ties together IP addressing, routing, DNS, and HTTP/HTTPS into practical diagnostic use.

**What is a VPN? Simple explanation first:**
A **VPN (Virtual Private Network)** creates an encrypted "tunnel" from your device to a VPN server, and routes your internet traffic through that tunnel first before it continues to its real destination. Two direct, real effects: (1) anyone watching your local network traffic (e.g. on public WiFi) sees only encrypted tunnel traffic, not your actual destination or content — similar in spirit to Lesson 1's HTTPS encryption, but applied to your *entire* connection, not just one website's traffic; (2) to the rest of the internet, your traffic now appears to originate from the VPN server's location and IP address, not your real one.

**Why do we need this?** On an untrusted network (public WiFi being the classic case), a VPN protects traffic that might not otherwise be encrypted, and it changes what your apparent network location/address is — both real, direct, practical effects, not abstract ones.

**Real troubleshooting tools — connecting everything in this course:**
When a network problem occurs, 3 practical tools let you check different parts of what you've learned:
1. **ping.** Sends a small test message to a destination and measures whether (and how quickly) it responds — a basic check of "can I even reach this address at all," directly testing the routing (Module 2) this course covered.
2. **traceroute.** Shows the actual hop-by-hop path data takes to a destination (Module 2's routing lesson mentioned this) — genuinely useful for spotting exactly *where* along the path a connection is failing or slowing down, not just *that* it's failing.
3. **DNS lookup tools** (e.g. checking what IP address a domain currently resolves to). Directly tests whether Module 2's DNS resolution chain is working correctly for a given domain, separate from whether the destination server itself is reachable.

**A practical troubleshooting sequence, using this course's own concepts:** if a website "isn't working," a systematic check (mirroring the systematic debugging discipline other Phoenix courses have taught for different domains) is: first, does DNS resolve the domain to an address at all (a DNS lookup)? If yes, can you reach that address at all (ping)? If yes but slow/inconsistent, where along the path is the problem (traceroute)? Only after confirming the network path itself is fine does it make sense to suspect the actual destination server or application.

**Common mistakes:** assuming a VPN makes you completely anonymous online (it changes your apparent network origin and encrypts your local traffic, but the VPN provider itself can typically see your real traffic — a VPN shifts *who* can see your data, it doesn't eliminate all visibility); troubleshooting network problems by guessing randomly instead of following a systematic sequence (DNS, then reachability, then path) — the same "diagnose in order, don't jump to conclusions" discipline this platform has applied to debugging in other courses.

**When do we use a VPN?** Particularly on untrusted networks (public WiFi) or when you specifically need your traffic's apparent origin to be the VPN server's location rather than your own.

**How do we know we understood this?** Given a network problem, you can propose a systematic diagnostic sequence (which of the 3 tools to use, in what order) rather than guessing, and you can explain what a VPN does and does not actually protect against.

**Mini exercise:** A coworker says "the company website won't load for me." List, in order, the first 3 checks you'd perform using this lesson's tools, and what each check would tell you.

**Homework:** Bring your troubleshooting-sequence design into this course's project — the closing deliverable of this course.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 3 (HTTP/HTTPS, VPNs & Troubleshooting) — the final module of Computer Networking Foundations. Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 3 Final Assessment — HTTP/HTTPS, VPNs & Troubleshooting',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'What does HTTPS actually protect, per this module?',
            questionType: 'single',
            options: [
              'It makes the destination server unable to see your real data',
              'It encrypts the data in transit, so anyone intercepting the network traffic between you and the server cannot read it',
              'It prevents any website from ever returning an error status code',
              'It has no real security benefit over plain HTTP',
            ],
            correctAnswer: [
              'It encrypts the data in transit, so anyone intercepting the network traffic between you and the server cannot read it',
            ],
          },
          {
            prompt: 'Scenario: a home network has 3 devices sharing one public IP address, all browsing different websites at once. What ensures each device correctly receives only its own responses?',
            questionType: 'single',
            options: [
              'DNS',
              'NAT, tracking which internal device made which outgoing request',
              'HTTPS encryption',
              'This is not actually possible with one shared public address',
            ],
            correctAnswer: [
              'NAT, tracking which internal device made which outgoing request',
            ],
          },
          {
            prompt: 'Which of the following are real, distinct troubleshooting tools/checks covered in this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'ping, to check basic reachability of a destination',
              'traceroute, to see the hop-by-hop path and where it fails',
              'A DNS lookup, to check whether a domain resolves correctly',
              'These are all the exact same tool with different names',
            ],
            correctAnswer: [
              'ping, to check basic reachability of a destination',
              'traceroute, to see the hop-by-hop path and where it fails',
              'A DNS lookup, to check whether a domain resolves correctly',
            ],
          },
          {
            prompt: 'True or False: a VPN makes a user\'s internet traffic completely invisible to everyone, including the VPN provider itself.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Practical question: per this module\'s systematic troubleshooting sequence, why should you check DNS resolution before assuming the destination server itself is broken?',
            questionType: 'text',
            correctAnswer:
              'A DNS failure and an actual server outage can look identical to a user (the site simply does not load), so checking DNS resolution first rules out that specific, common cause before concluding the destination server or application itself is the problem.',
          },
        ],
      },
    },
  ],
};

const MODULES: ModuleSeed[] = [netModule2, netModule3];

// ---------------------------------------------------------------------
// Computer Networking Foundations — 2 new standalone Projects (Phase 26
// architecture, real instructions, no sourceLessonId), bringing the
// course to its blueprint total of 2.
// ---------------------------------------------------------------------
const PROJECTS: ProjectSeed[] = [
  {
    courseSlug: 'computer-networking-foundations',
    title: 'Diagnose a Network Connectivity Problem',
    description:
      'Intermediate tier — apply this course\'s systematic troubleshooting sequence (DNS, reachability, path) to a real or realistic network problem scenario.',
    instructions: `**Objective:** Apply the systematic troubleshooting sequence from Module 3 (DNS check, then reachability, then path) to diagnose a real or realistic "the network isn't working" scenario, rather than guessing at the cause.

**Requirements:**
- A stated scenario: a specific symptom (e.g. "a website won't load," "an internal server is unreachable from one office but not another") — either a real problem you have access to, or a realistic, clearly-specified hypothetical.
- A written diagnostic walkthrough following Module 3's sequence: what a DNS lookup would show and what it would tell you; what a ping/reachability check would show and what it would tell you; what a traceroute would show and what it would tell you.
- A specific conclusion: based on your walkthrough, what layer the problem is most likely in (DNS, routing/path, or the destination server/application itself) and why.
- A written note distinguishing this specific problem from at least one different symptom that could look similar but have a different root cause (e.g. distinguishing a DNS failure from a real server outage, per Module 2, Lesson 3).

**Expected result:** Your scenario description, the diagnostic walkthrough (all 3 tools/checks, in order, with what each would show), and your specific conclusion with reasoning.

**Difficulty:** Intermediate.

**Skills tested:** applying a systematic diagnostic sequence rather than guessing, correctly distinguishing DNS/routing/server-level problems, reasoning from symptoms to a specific likely cause.

**Suggested implementation steps:**
1. Choose a specific, concrete scenario — not a vague "something is broken" description.
2. Walk through the 3 checks in the correct order, explaining what each would realistically show for your scenario.
3. State your specific conclusion, grounded in the walkthrough, not asserted separately from it.
4. Write the similar-but-different-cause comparison last, once your main conclusion is clear.

**Evaluation criteria:** the scenario is concrete and specific; the diagnostic walkthrough follows the correct order and reasoning from this course; the conclusion is specific (names a likely layer/cause) and justified by the walkthrough, not just asserted.`,
    position: 2,
  },
  {
    courseSlug: 'computer-networking-foundations',
    title: 'Design a Small Office Network',
    description:
      'Advanced/Capstone tier — design a coherent small-office network applying IP addressing, switching/routing, DNS, and security controls together, closing the course\'s full arc.',
    instructions: `**Objective:** Design a real, coherent network for a small hypothetical office (e.g. 15 employees, one internet connection, a few shared internal resources like a printer and a file server), applying this course's concepts together rather than in isolation.

**Requirements:**
- An IP addressing plan (per Module 1): a chosen private address range and subnet size appropriate for the office's device count, with your reasoning.
- A description of what's handled by switching versus routing in your design (per Module 2, Lessons 1-2): which devices communicate locally via switching, and where routing is needed (e.g. to reach the internet).
- A DNS plan (per Module 2, Lesson 3): how internal devices resolve external domain names, and whether any internal-only names are needed.
- A ports/NAT/firewall plan (per Module 3, Lesson 2): how the office's devices share the single public IP address via NAT, and at least 2 specific firewall rules you'd apply and why (e.g. blocking unsolicited inbound connections on specific ports).
- A written note on whether/when a VPN would be relevant for this office (per Module 3, Lesson 3), and why.

**Expected result:** A written network design document covering all 5 requirements above, for your specific hypothetical office (or a real one if you have access to design one).

**Difficulty:** Advanced/Capstone.

**Skills tested:** integrating IP addressing, switching/routing, DNS, and security controls into one coherent real design, not disconnected topic answers.

**Suggested implementation steps:**
1. Define the office's real requirements (device count, shared resources) before designing anything.
2. Choose your IP addressing scheme first — everything else in the design references it.
3. Work through switching/routing, then DNS, then NAT/firewall, referencing your actual addressing plan throughout.
4. Write the VPN relevance note last, once the rest of the network design is concrete.

**Evaluation criteria:** the IP addressing plan is appropriately sized and justified; switching versus routing is correctly distinguished for this specific design; the firewall rules are specific and justified, not generic; the whole design is coherent and internally consistent, not 5 disconnected answers.`,
    position: 3,
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
        // rows via the Phase 26 architecture, matching Phase 27/30/31/32/
        // 33's precedent for this course.
      },
    });
    projectsCreated += 1;
    console.log(`  Created standalone project (Phase 26 architecture, not lesson-based): ${project.title}`);
  }

  console.log(
    `\nPhase 34 content seed complete: ${modulesCreated} modules created, ${lessonsCreated} lessons created, ${quizzesCreated} quizzes created, ${questionsCreated} quiz questions created, ${projectsCreated} projects created (${projectsSkipped} already existed).`,
  );
}

main()
  .catch((error) => {
    console.error('Phase 34 seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
