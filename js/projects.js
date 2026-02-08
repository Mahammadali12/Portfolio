// ==================== PROJECTS DATA ====================

export const projectsData = [
    {
        id: 'http-server',
        title: 'HTTP Web Server',
        tagline: 'High-performance multithreaded server from scratch',
        description: 'Architected a multithreaded HTTP server in C handling 1,000+ concurrent connections with average response times under 50ms. Implemented custom thread-pool, request parser, and HTTP/1.1 persistent connections.',
        stack: ['C', 'POSIX', 'Socket Programming', 'Multithreading'],
        links: [
            { label: 'GitHub', url: 'https://github.com/Mahammadali12' }
        ],
        trophies: [
            { label: 'Concurrent Connections', value: '1,000+' },
            { label: 'Avg Response Time', value: '<50ms' },
            { label: 'Memory Overhead Reduced', value: '40%' },
            { label: 'TCP Handshake Reduction', value: '25%' }
        ],
        artifactType: 'serverRack',
        accentColor: 0x00ff88
    },
    {
        id: 'task-manager-api',
        title: 'Task Manager REST API',
        tagline: 'Concurrent REST API with hexagonal architecture',
        description: 'Developed a concurrent REST API in Go utilizing Goroutines and Channels to increase request throughput by 4x. Implemented Hexagonal Architecture for maintainability and eliminated race conditions across 500+ stress tests.',
        stack: ['Go', 'net/http', 'JSON', 'Goroutines', 'Channels'],
        links: [
            { label: 'GitHub', url: 'https://github.com/Mahammadali12' }
        ],
        trophies: [
            { label: 'Throughput Increase', value: '4x' },
            { label: 'Test Coverage Boost', value: '35%' },
            { label: 'Data Integrity', value: '100%' },
            { label: 'Stress Tests Passed', value: '500+' }
        ],
        artifactType: 'apiNodes',
        accentColor: 0x00bfff
    },
    {
        id: 'web-scraper',
        title: 'Web Scraper Application',
        tagline: 'Containerized data extraction pipeline',
        description: 'Built a containerized data extraction pipeline that increased collection speed by 60%, parsing 200+ structured records per minute to PostgreSQL. Orchestrated full stack with Docker Compose.',
        stack: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker', 'Jsony'],
        links: [
            { label: 'GitHub', url: 'https://github.com/Mahammadali12' }
        ],
        trophies: [
            { label: 'Collection Speed Increase', value: '60%' },
            { label: 'Records Per Minute', value: '200+' },
            { label: 'Integration Time Reduced', value: '50%' },
            { label: 'Deploy Config Reduced', value: '80%' }
        ],
        artifactType: 'scraperBot',
        accentColor: 0xff6600
    },
    {
        id: 'portfolio',
        title: '3D Portfolio Website',
        tagline: 'Interactive Three.js portfolio with car physics',
        description: 'This very website! Built with Three.js featuring momentum-based car physics, drift mechanics, camera shake effects, and interactive section exploration. Desktop + mobile support.',
        stack: ['JavaScript', 'Three.js', 'WebGL', 'CSS3'],
        links: [
            { label: 'GitHub', url: 'https://github.com/Mahammadali12' }
        ],
        trophies: [
            { label: 'Physics Engine', value: 'Custom' },
            { label: 'Mobile Support', value: 'Full' },
            { label: 'FPS Target', value: '60' },
            { label: 'Car Controls', value: 'Drift!' }
        ],
        artifactType: 'databaseCore',
        accentColor: 0xff7251
    }
];
