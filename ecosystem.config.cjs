module.exports = {
  apps: [
    {
      name: "qicas",
      script: "dist/index.js",
      interpreter: "bun",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "/var/log/qicas/error.log",
      out_file: "/var/log/qicas/out.log",
    },
  ],
}
