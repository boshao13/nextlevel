// PM2 config for the Next.js web server on EC2.
// Deployed to /home/ubuntu/nextlevel-crm/ecosystem.config.js by deploy.sh;
// paths below are EC2 paths, not laptop paths.
//
// nextlevel-api (Express on :4242) predates this file and remains an ad-hoc
// PM2 process (created 2026-04 via `pm2 start server/index.js --name nextlevel-api`).
// deploy.sh restarts it by name; its max_memory_restart is set once via CLI
// in the EC2-prep task. Do NOT add it here without migrating its saved state.
module.exports = {
  apps: [
    {
      name: 'nextlevel-web',
      cwd: '/home/ubuntu/nextlevel-crm/web',
      script: 'server.js', // .next/standalone entrypoint (rsync'd to web/server.js)
      env: {
        PORT: 3000,
        HOSTNAME: '127.0.0.1', // loopback only — nginx is the public face
        NODE_ENV: 'production',
      },
      max_memory_restart: '350M', // 954MB box shared with MySQL + Express
    },
  ],
};
