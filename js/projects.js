// ==================== PROJECTS DATA ====================

export const projectsData = [
    {
        id: 'reactive-microservices',
        title: 'Reactive Microservices Prototype',
        tagline: 'Non-blocking backend with async messaging',
        description: 'Designed a non-blocking backend service using Spring WebFlux and Project Reactor to handle high-concurrency event streams with minimal resource overhead. Implemented asynchronous inter-service communication via RabbitMQ and utilized MongoDB for flexible, high-velocity data storage.',
        stack: ['Java', 'Spring WebFlux', 'RabbitMQ', 'MongoDB'],
        links: [
            { label: 'GitHub', url: 'https://github.com/Mahammadali12' }
        ],
        trophies: [
            { label: 'Architecture', value: 'Reactive' },
            { label: 'Messaging', value: 'Async' },
            { label: 'Data Store', value: 'MongoDB' },
            { label: 'Framework', value: 'WebFlux' }
        ],
        artifactType: 'apiNodes',
        accentColor: 0x00bfff
    },
    {
        id: 'distributed-enterprise',
        title: 'Distributed Enterprise System',
        tagline: 'Multithreaded Java with Redis caching',
        description: 'Architected a multithreaded Java system implementing strict OOP design patterns to manage concurrent resource allocation and data persistence. Integrated Redis for distributed caching and implemented comprehensive testing with JUnit and Mockito.',
        stack: ['Java', 'PostgreSQL', 'Redis', 'Maven'],
        links: [
            { label: 'GitHub', url: 'https://github.com/Mahammadali12' }
        ],
        trophies: [
            { label: 'Caching', value: 'Redis' },
            { label: 'Testing', value: 'Zero-Reg' },
            { label: 'Patterns', value: 'OOP' },
            { label: 'Concurrency', value: 'Multi-T' }
        ],
        artifactType: 'databaseCore',
        accentColor: 0xff6600
    },
    {
        id: 'http-server',
        title: 'High-Concurrency HTTP Server',
        tagline: 'Systems-level C server with custom thread-pooling',
        description: 'Architected a multithreaded HTTP/1.1 server in C to master Non-blocking I/O and the TCP/IP stack, providing the foundation for understanding Reactive Java Frameworks. Implemented custom thread-pooling to manage 1,000+ simultaneous connections.',
        stack: ['C', 'POSIX Sockets', 'Multithreading'],
        links: [
            { label: 'GitHub', url: 'https://github.com/Mahammadali12' }
        ],
        trophies: [
            { label: 'Concurrent Connections', value: '1,000+' },
            { label: 'I/O Model', value: 'Non-Block' },
            { label: 'Protocol', value: 'HTTP/1.1' },
            { label: 'Thread Pool', value: 'Custom' }
        ],
        artifactType: 'serverRack',
        accentColor: 0x00ff88
    }
];
