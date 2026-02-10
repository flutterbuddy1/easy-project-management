module.exports = {
    apps: [
        {
            name: 'pm-tool-web',
            script: 'npm',
            args: 'start',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 8080
            }
        },
        {
            name: 'pm-tool-socket',
            script: 'npm',
            args: 'run socket',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
};
