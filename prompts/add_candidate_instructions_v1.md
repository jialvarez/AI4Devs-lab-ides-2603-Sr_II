# User Story: Add Candidate to System

**As a** recruiter,  
**I want** to have the ability to add candidates to the ATS system,  
**So that** I can manage their data and selection processes efficiently.

## Acceptance Criteria

1.  **Function Accessibility:** There must be a clearly visible button or link to add a new candidate from the recruiter's main dashboard page.
2.  **Data Entry Form:** Upon selecting the option to add a candidate, a form must be presented that includes the necessary fields to capture candidate information such as first name, last name, email, phone number, address, education, and work experience.
3.  **Data Validation:** The form must validate the entered data to ensure it is complete and correct. For example, the email must have a valid format and mandatory fields must not be empty.
4.  **Document Upload:** The recruiter must have the option to upload the candidate's CV in PDF or DOCX format.
5.  **Addition Confirmation:** Once the form is completed and the information is submitted, a confirmation message must appear indicating that the candidate has been successfully added to the system.
6.  **Errors and Exception Handling:** In case of an error (e.g., server connection failure), the system must show an appropriate message to the user to inform them of the problem.
7.  **Accessibility and Compatibility:** The functionality must be accessible and compatible with different devices and web browsers.

---

## Technical Specifications & Constraints

### 1. Validation
* **Client-side:** Real-time validation for required fields, email format (Regex), and phone number patterns.
* **Server-side:** Schema validation (e.g., using Joi or Zod) to ensure data integrity before database insertion.
* **Education/Experience:** Implement autocomplete logic based on existing system records to improve UX.

### 2. Error Handling
* Provide descriptive feedback for 4xx (Client) and 5xx (Server) errors.
* Implement a "Retry" mechanism for network-related failures.
* **Graceful degradation:** If the autocomplete service fails, allow manual entry without blocking the form.

### 3. Security
* **Data Privacy:** All candidate data must be encrypted at rest and transmitted via HTTPS.
* **Sanitization:** Sanitize all text inputs to prevent XSS (Cross-Site Scripting) and SQL Injection.
* **Access Control:** Ensure only authenticated recruiters with valid session tokens can access the "Add Candidate" endpoint.

### 4. File Upload (Local Storage Implementation)
* **Storage Strategy:** Files will be saved to a dedicated local directory (e.g., `/uploads/cvs/`).
* **Allowed Formats:** Strictly limited to `.pdf` and `.docx`.
* **File Size:** Maximum limit of 5MB per file.
* **Security:** * Rename files using a UUID or timestamp to prevent filename collisions and directory traversal attacks.
    * Store only the file path in the database, not the binary data.

---

## Notes
* The interface must be intuitive and easy to use to minimize the training time required for new recruiters.
* The system should handle file path resolution dynamically to ensure compatibility across different development environments (Windows/Mac/Linux).

## Technical Tasks
* Implement the user interface for the "Add Candidate" form.
* Develop the backend API to process and store candidate text data.
* **Local File Integration:** Setup the filesystem logic to move uploaded files from the temporary buffer to the local `/uploads` directory.
* Ensure the security and privacy of the candidate's data throughout the lifecycle.
