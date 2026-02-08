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
                <p>Bachelor of Science in Computer Science</p>
                <p><strong>Baku, Azerbaijan</strong> | Sep. 2022 – May 2027</p>
            </div>
            <div class="project-item">
                <h4>Transport and Telecommunication Institute</h4>
                <p>B.S. in Computer Science (Exchange Program)</p>
                <p><strong>Riga, Latvia</strong> | Feb. 2025 – June 2025</p>
            </div>
        `
    },
    
    experience: {
        content: `
            <h3 class="section-title">Work Experience</h3>
            <div class="project-item">
                <h4>Software Engineer Intern (Performance & Distributed Systems)</h4>
                <p><strong>AzSimX Azersilah</strong> | Baku, Azerbaijan</p>
                <p><strong>July 2025 – Dec. 2025</strong></p>
                <p>• Engineered high-performance logic in C#, optimizing rendering loops to achieve a 35% reduction in latency (14ms to 9ms), a methodology directly applicable to Java server-side optimization.</p>
                <p>• Designed asynchronous synchronization modules between hardware and software, ensuring 100% data integrity in a distributed systems architecture.</p>
                <p>• Utilized profiling tools to identify and eliminate memory leaks and processing bottlenecks in safety-critical simulation modules.</p>
            </div>
        `
    },
    
    projects: {
        content: `
            <h3 class="section-title">Technical Projects</h3>
            <div class="project-item">
                <h4>Reactive Microservices Prototype | Java, Spring WebFlux, RabbitMQ, MongoDB</h4>
                <p>• Designed a non-blocking backend service using Spring WebFlux and Project Reactor to handle high-concurrency event streams with minimal resource overhead.</p>
                <p>• Implemented asynchronous communication between services using RabbitMQ as a message broker, ensuring decoupled and scalable microservices architecture.</p>
                <p>• Utilized MongoDB for flexible data storage of semi-structured event logs, achieving faster write speeds compared to traditional relational databases for high-velocity data.</p>
            </div>
            <div class="project-item">
                <h4>Distributed Enterprise System | Java, PostgreSQL, Redis, Maven</h4>
                <p>• Architected a multithreaded Java system implementing strict OOP design patterns to manage concurrent resource allocation and data persistence.</p>
                <p>• Integrated Redis for distributed caching, reducing database load and improving application response times for frequently accessed data clusters.</p>
                <p>• Utilized JUnit and Mockito to implement comprehensive unit testing, ensuring zero-regression during the implementation of new service features.</p>
            </div>
            <div class="project-item">
                <h4>High-Concurrency HTTP Server | C, POSIX Sockets, Multithreading</h4>
                <p>• Architected a multithreaded HTTP/1.1 server in C to master Non-blocking I/O and the TCP/IP stack, providing the foundation for understanding Reactive Java Frameworks.</p>
                <p>• Implemented custom thread-pooling to manage 1,000+ simultaneous connections, mirroring the concurrency models used in modern high-performance Java backends.</p>
            </div>
        `
    },
    
    skills: {
        content: `
            <h3 class="section-title">Technical Skills</h3>
            <div class="skill-category">
                <h4>Languages</h4>
                <div class="skill-list">
                    <span class="skill-tag">Java (Core/OOP)</span>
                    <span class="skill-tag">C (Systems)</span>
                    <span class="skill-tag">SQL (PostgreSQL)</span>
                    <span class="skill-tag">C# (Performance)</span>
                    <span class="skill-tag">MongoDB</span>
                </div>
            </div>
            <div class="skill-category">
                <h4>Back-End</h4>
                <div class="skill-list">
                    <span class="skill-tag">Spring WebFlux</span>
                    <span class="skill-tag">Microservices</span>
                    <span class="skill-tag">RabbitMQ</span>
                    <span class="skill-tag">Redis</span>
                    <span class="skill-tag">REST APIs</span>
                    <span class="skill-tag">JUnit</span>
                    <span class="skill-tag">Mockito</span>
                </div>
            </div>
            <div class="skill-category">
                <h4>Tools & Concepts</h4>
                <div class="skill-list">
                    <span class="skill-tag">Git (Collaborative Workflow)</span>
                    <span class="skill-tag">Docker</span>
                    <span class="skill-tag">Maven</span>
                    <span class="skill-tag">Linux (Bash)</span>
                    <span class="skill-tag">Reactive Programming</span>
                </div>
            </div>
            <div class="skill-category">
                <h4>Competencies</h4>
                <div class="skill-list">
                    <span class="skill-tag">High-Performance Computing</span>
                    <span class="skill-tag">Distributed Systems</span>
                    <span class="skill-tag">Asynchronous Messaging</span>
                </div>
            </div>
        `
    }
};