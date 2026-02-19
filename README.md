# Groovo Web

## Start-up instructions

This project uses Docker to run the application. To start the application, follow these steps. Make sure you have Docker installed on your machine.
1. Clone the repository and navigate to the project directory.
2. Run the following command to build and start the application:
```bash
docker compose up -d --build
```

## Deployment pipeline

The deployment pipeline is set up using GitHub Actions. Whenever changes are pushed to the main branch, the pipeline will automatically build and deploy the application to the production environment.

Following script is executed inside the machine:
```bash
cd /home/github_deploy/groovo
git fetch --all
git reset --hard origin/main

docker --version
docker compose --version

docker compose up -d --build
echo "Deployment completed successfully."
```


## ENV variables

```env
# Docker configuration
PORT=5011
NODE_ENV=production

# Application configuration
NEXT_PUBLIC_API_BASE=https://groovo.venderes.com/server #(Your API endpoint that responds to API calls)
NEXT_PUBLIC_CONTENT_BASE=https://groovo.venderes.com/server #(Your content endpoint that serves content)
```


## Technologies Used
- Node.js as the server for the web page
- Next.js as the framework for UI 
- Docker for containerization
- GitHub Actions for CI/CD