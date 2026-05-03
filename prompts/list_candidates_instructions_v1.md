# User Story: List Candidates and CVs

**As a** recruiter,  
**I want** to see a list of all candidates who have submitted their CVs,  
**So that** I can review their profiles and download their documents for the selection process.

## Acceptance Criteria

1.  **Candidate Table:** A central view must exist displaying a list of all candidates currently in the system.
2.  **Key Information Display:** The list must show essential details at a glance: Full Name, Email, and Date Added.
3.  **CV Access:** Each entry in the list must have a clearly identifiable link or icon to view/download the CV stored in local storage.
4.  **Empty State:** If no candidates have been added yet, the system should display a friendly message indicating the list is empty and providing a shortcut to "Add Candidate".
5.  **Responsiveness:** The list must be readable and functional on desktop and tablet screens.

---

## Technical Specifications & Constraints

### 1. Validation & Data Integrity
* **Server-side:** Ensure the system checks for the existence of the file in local storage before rendering the download link to avoid broken links.
* **Consistency:** The data displayed must match exactly with the records stored in the database.

### 2. Error Handling
* **Missing Files:** If a CV file is missing from the local `/uploads/cvs/` directory but exists in the database, show a specific error message (e.g., "File not found") instead of a system crash.
* **Fetch Failures:** Implement a loading state and an error message if the backend fails to retrieve the candidate list.

### 3. Security
* **Access Control:** This list must be restricted to authenticated recruiters only. Unauthorized users should be redirected to the login page.
* **Path Traversal Protection:** When serving the CV files from local storage, ensure the implementation does not allow users to request files outside the designated `/uploads/cvs/` directory.
* **Data Privacy:** Ensure that candidate list data is sent over HTTPS and that the API endpoint is protected against scraping.

### 4. File Retrieval (Local Storage Implementation)
* **Secure Serving:** Implement a backend route that serves the file as a stream or static download rather than exposing the absolute server file path to the client.
* **MIME Types:** Ensure the server sends the correct headers (`application/pdf` or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`) so the browser handles the download correctly.

---

## Notes
* The design should follow the same intuitive UI/UX principles used in the "Add Candidate" form to maintain system consistency.
* Consider adding basic sorting (e.g., by date added) to help recruiters manage larger lists.

## Technical Tasks
* Create the frontend component for the Candidate List table.
* Develop the backend API endpoint to retrieve all candidate records from the database.
* Implement the secure file-serving logic to fetch CVs from the local `/uploads/cvs/` directory.
* Apply the same authentication and security middleware used in the previous story.
