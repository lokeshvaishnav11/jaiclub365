module.exports = {
  apps: [
    {
      name: "gaogames-app",
      script: "./src/server.js",   // Run your app in fork mode
      exec_mode: "fork",           // Changed from 'cluster' to 'fork'
      instances: 1,                // Run only one instance in fork mode
      node_args: '--require sticky-cluster', // If you want sticky-cluster in fork mode too
      autorestart: true,
      max_memory_restart: "500M",
      env_file: ".env",
      watch: false,
      // Use PM2's restart on failure or custom health check handling
      restart_delay: 5000,          // Restart delay in ms, adjust as necessary
    },
    {
      name: "health-check",          // This is for your health check service
      script: "./health-check.js",
      watch: false,
      // Restart if health check fails
      cron_restart: "*/1 * * * *",   // Check every minute
      autorestart: true,
      restart_delay: 1000,           // Restart delay for health check
    }
  ]
}


