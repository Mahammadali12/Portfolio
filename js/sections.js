// ==================== RESUME SECTIONS DATA ====================

export const sectionsData = {
    profile: {
        content: `
            <h3 class="section-title">Mahammadali Zamanli</h3>
            <img src="assets/profile.jpg" alt="Mahammadali Zamani" class="profile-photo" onerror="this.style.display='none'">
            <div class="project-item">
                <h4>Software Engineer</h4>
                <p>developer specializing in backend systems, physics simulations, and high-performance computing.</p>
            </div>
            <a href="assets/resume.pdf" download="Mahammadali_Zamani_Resume.pdf" class="download-resume-btn" role="button" aria-label="Download resume as PDF">
                📥 Download Resume
            </a>
            <div class="contact-info">
                <div class="contact-icon">📱</div>
                <div class="contact-detail">+994-55-397-75-00</div>
            </div>
            <div class="contact-info">
                <div class="contact-icon">📧</div>
                <div class="contact-detail"><a href="mailto:zamanli.mehemmedeli@gmail.com" style="color: #ffca7b; text-decoration: none; border-bottom: 1px dotted #ffca7b;">zamanli.mehemmedeli@gmail.com</a></div>
            </div>
            <div class="contact-info">
                <div class="contact-icon">🔗</div>
                <div class="contact-detail"><a href="https://www.linkedin.com/in/mahammadali-zamanli-64931a282/" target="_blank" style="color: #ffca7b; text-decoration: none; border-bottom: 1px dotted #ffca7b;">LinkedIn</a></div>
            </div>
            <div class="contact-info">
                <div class="contact-icon">💻</div>
                <div class="contact-detail"><a href="https://github.com/Mahammadali12" target="_blank" style="color: #ffca7b; text-decoration: none; border-bottom: 1px dotted #ffca7b;">GitHub</a></div>
            </div>
            <div class="contact-info">
                <div class="contact-icon">📍</div>
                <div class="contact-detail">Baku, Azerbaijan</div>
            </div>
            
        `
    },
    
    education: {
        content: `
            <h3 class="section-title">Education</h3>
            <div class="project-item">
                <h4>ADA University</h4>
                <p>Bachelor of Arts in Computer Science</p>
                <p><strong>Baku, Azerbaijan</strong> | Sep 2022 – May 2027</p>
            </div>
            <div class="project-item">
                <h4>Transport and Telecommunication Institute</h4>
                <p>Bachelor of Applied Science in Computer Science (Exchange Program)</p>
                <p><strong>Riga, Latvia</strong> | Feb 2025 – June 2025</p>
            </div>
            <div class="project-item">
                <h4>Relevant Coursework</h4>
                <p>Data Structures and Algorithms, Object-Oriented Programming (Java), Operating Systems, Computer Networks, Database Systems, Discrete Mathematics, Probability and Statistics, Software Engineering Principles</p>
            </div>
        `
    },
    
    experience: {
        content: `
            <h3 class="section-title">Work Experience</h3>
            <div class="project-item">
                <h4>Software Engineer Intern - AzSimX Azersilah</h4>
                <p><strong>Baku, Azerbaijan</strong> | July 2025 – Dec 2025</p>
                <p>• Engineered a high-fidelity physics simulation module in C# (Unity), increasing aerodynamic calculation accuracy by 15% and eliminating trajectory drift by 22% compared to engine defaults.</p>
                <p>• Optimized real-time rendering and calculation loops, maintaining a stable 90 FPS in VR and reducing average frame latency from 14ms to 9ms through profiling and bottleneck elimination.</p>
                <p>• Designed software interface for hardware integration, achieving sub-millisecond response times and improving hardware-to-software synchronization reliability by 30%.</p>
            </div>
        `
    },
    
    projects: {
        content: `
            <h3 class="section-title">Technical Projects</h3>
            <div class="project-item">
                <h4>HTTP Web Server | C, POSIX, Socket programming</h4>
                <p>• Architected a multithreaded HTTP server in C handling 1,000+ concurrent connections with average response times under 50ms.</p>
                <p>• Reduced memory overhead by 40% by implementing a custom thread-pool and request parser, ensuring stability under high-throughput conditions.</p>
                <p>• Implemented HTTP/1.1 persistent connections, resulting in a 25% reduction in TCP handshake overhead for multi-request sessions.</p>
            </div>
            <div class="project-item">
                <h4>Task Manager REST API | Go, net/http, JSON</h4>
                <p>• Developed a concurrent REST API in Go, utilizing Goroutines and Channels to increase request throughput by 4x compared to synchronous processing.</p>
                <p>• Improved maintainability and test coverage by 35% by implementing Hexagonal Architecture, decoupling domain logic for isolated unit testing.</p>
                <p>• Eliminated race conditions during high-concurrency tasks, ensuring 100% data integrity across 500+ automated stress tests.</p>
            </div>
            <div class="project-item">
                <h4>Web Scraper Application | Java, Jsony, Spring Boot, PostgreSQL, Docker</h4>
                <p>• Built a containerized data extraction pipeline that increased collection speed by 60%, parsing 200+ structured records per minute to PostgreSQL.</p>
                <p>• Designed an extensible API architecture for rapid onboarding of new scraping targets, reducing new model integration time by 50%.</p>
                <p>• Reduced deployment configuration time by 80% by orchestrating the full stack with Docker Compose for consistent environment parity.</p>
            </div>
        `
    },
    
    skills: {
        content: `
            <h3 class="section-title">Technical Skills</h3>
            <div class="skill-category">
                <h4>Programming Languages</h4>
                <div class="skill-list">
                    <span class="skill-tag">Java</span>
                    <span class="skill-tag">Go</span>
                    <span class="skill-tag">SQL (PostgreSQL)</span>
                    <span class="skill-tag">C#</span>
                    <span class="skill-tag">C</span>
                </div>
            </div>
            <div class="skill-category">
                <h4>Frameworks & Libraries</h4>
                <div class="skill-list">
                    <span class="skill-tag">Spring Boot</span>
                    <span class="skill-tag">Unity</span>
                    <span class="skill-tag">JUnit</span>
                    <span class="skill-tag">Jsony</span>
                    <span class="skill-tag">POSIX Sockets</span>
                </div>
            </div>
            <div class="skill-category">
                <h4>Tools & DevOps</h4>
                <div class="skill-list">
                    <span class="skill-tag">Git</span>
                    <span class="skill-tag">Docker</span>
                    <span class="skill-tag">Docker Compose</span>
                    <span class="skill-tag">Linux (Bash)</span>
                    <span class="skill-tag">Postman</span>
                    <span class="skill-tag">Maven</span>
                </div>
            </div>
            <div class="skill-category">
                <h4>Languages</h4>
                <div class="skill-list">
                    <span class="skill-tag">Azerbaijani (Native)</span>
                    <span class="skill-tag">English (Fluent)</span>
                    <span class="skill-tag">Russian (Working Proficiency)</span>
                </div>
            </div>
        `
    }
};