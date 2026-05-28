HAQMS: Full-Stack Technical Engineering Audit & Resolution Report
Executive Summary
The Hospital Appointment and Queue Management System (HAQMS) codebase was subjected to a comprehensive architecture, performance, and security audit. The initial repository contained several critical system vulnerabilities, data handling inefficiencies, client-side vulnerabilities, and concurrency race conditions.

Using advanced diagnostic modeling and structural refactoring, the codebase has been stabilized to a production-ready standard. All structural table migrations have been securely synced to the Supabase PostgreSQL cloud database, and the decoupled Next.js frontend has been configured with environmental boundaries to communicate seamlessly with the Express application layer.

1. Backend Security & Authentication
1.1 Insecure User Registration and Login Logic
Issue: The authentication API was logging raw incoming request bodies containing plain-text passwords directly to the server console and improperly returning the hashed password string back to the client upon successful registration. Furthermore, the JWT verification process unsafely utilized an ignoreExpiration bypass, keeping sessions active indefinitely.

Resolution: Removed all sensitive console logs from the authentication routes, stripped password hashes from all outbound API payload response objects, and enforced strict JWT token expiration validation to protect user session boundaries.

1.2 Missing Authorization on Sensitive Endpoints
Issue: Critical system actions, such as booking new appointments, updating live queue statuses, and deleting patient records, completely lacked role-based authorization checks, allowing any authenticated token holder to perform administrative or clinical actions.

Resolution: Implemented a robust role-based authorization middleware layer (authorize) to restrict sensitive endpoint routes exclusively to Receptionists, Admins, and Doctors where appropriate, and repaired a bypassed authorizeAdminOnlyLegacy middleware checkpoint.

1.3 SQL Injection Vulnerability in Data Queries
Issue: The doctor directory search endpoint was highly vulnerable to SQL Injection (SQLi) due to the unsafe direct concatenation of raw, unsanitized user search input strings straight into a Prisma $queryRawUnsafe database execution layer.

Resolution: Completely refactored the query controller to utilize Prisma's native, parameterized .findMany() object-relational mapping methods, neutralizing the injection vector by treating all user input strictly as literal data rather than executable SQL commands.

2. Database Inefficiencies & Performance Optimization
2.1 "N+1" Database Query Loops
Issue: The GET /api/appointments endpoint suffered from a severe N+1 query performance bottleneck, as it iterated over an array of fetched appointments and executed separate, sequential database requests to retrieve the associated Doctor and Patient records for every single record in the loop.

Resolution: Refactored the core data-fetching mechanism to leverage Prisma's relation include feature, allowing the backend to retrieve all base appointments and their corresponding relationship tables in a single, highly optimized SQL statement.

2.2 Missing Pagination and Heavy List Payloads
Issue: The GET /api/patients list endpoint lacked proper database-level pagination, instead pulling the entire global patient table directly into server RAM memory before using JavaScript array slicing, creating severe memory overhead that scales poorly under large datasets.

Resolution: Pushed pagination constraints and search filters down into the Prisma engine layer using take, skip, and where operators, ensuring the database only transmits the specific slice of data requested by the client frontend.

2.3 Blocked Asynchronous Code (Sequential Awaits)
Issue: Analytics and operational reporting dashboards in doctors.js and reports.js were executing multiple independent database aggregation queries sequentially using blocking await statements inside loops, artificially inflating API response times and underutilizing database resources.

Resolution: Restructured analytical aggregation endpoints to utilize Promise.all to fire all independent data lookups concurrently, eliminating artificial processing queues and reducing API response latency down to the speed of the single slowest query.

3. Concurrency Problems & Race Conditions
3.1 Appointment Double-Booking Race Condition
Issue: The POST /api/appointments endpoint suffered from a classic "read-modify-write" race condition. Two concurrent booking requests for the exact same doctor and time slot could simultaneously check the database, read that the slot was available, and successfully book both patients into the same slot.

Resolution: Encapsulated both the availability check query and the creation mutation block inside an interactive Prisma $transaction set to a Serializable isolation level, ensuring concurrent bookings are safely queued and evaluated atomically.

3.2 Queue Token Assignment Collision
Issue: The POST /api/queue/checkin endpoint featured an asynchronous delay between querying the current maximum token number and instantiating the next chronological token, creating a race condition window where multiple rapid check-ins would generate identical token values for different patients.

Resolution: Removed the structural network timeouts and enclosed the total token aggregation and creation queries within an atomic interactive Prisma $transaction operating with serializable isolation to guarantee collision-free, thread-safe token distribution.

4. Frontend Configuration & Client Stability
4.1 Hardcoded Environment Configurations
Issue: The React frontend hardcoded the backend API base URL string (http://localhost:5000) directly into global providers like AuthContext and individual Queue pages, coupling the source code to a local ecosystem and preventing environmental fluidity.

Resolution: Extracted all API configuration roots into a dynamic process.env.NEXT_PUBLIC_API_URL runtime environment variable mapping, abstracting connection targets away from the core UI application layer.

4.2 Client-Side Error Handling
Issue: Key frontend data hooks and operations (such as loading doctor schedules or running physician lookups) lacked exception safety nets, resulting in silent application failures, stuck states, or unhandled UI rendering crashes if the backend server became unreachable.

Resolution: Wrapped all asynchronous client network fetch handlers inside standardized try/catch execution blocks linked to local error states, displaying dismissible UI warning banners to communicate issues gracefully to the user.

4.3 State Management & Interface Responsiveness
Issue: Several performance-heavy user panels, including the live queue lists and medical worklists, lacked background loading indicators, causing the interface to freeze and appear broken to operators while awaiting server synchronization.

Resolution: Integrated designated UI boolean loading indicators (worklistLoading and physiciansLoading) that dynamically render animated CSS loading spinners during fetch states, providing clear, real-time interactive feedback to the end-user.