# Deployment — CS436 E-Commerce

## TL;DR

`git push origin main` automatically builds and deploys **both** tiers. ~10–12 min, zero downtime.

## What a push triggers

A push to `main` starts the **`cs436-ecommerce-deploy`** pipeline (AWS CodePipeline, V2, eu-west-1):

1. **Source** — CodeConnections (GitHub App) pulls the commit from `resid-saglam/CS436-dev`.
2. **Build** — CodeBuild project `cs436-ecommerce-build` runs the root `buildspec.yml`:
   - **Backend**: `docker build` → push to ECR `ecommerce-backend` (tagged with the commit SHA + `latest`); emits `imagedefinitions.json`.
   - **Frontend**: `npm ci` → `VITE_API_URL=/api npm run build` → `aws s3 sync dist/ s3://cs436-ecommerce-spa-185472107290 --delete` → `cloudfront create-invalidation --paths "/*"`.
3. **Deploy** — Amazon ECS (rolling) registers a new task-definition revision (clones the running one, swaps the image) and updates service `cs436-ecommerce-api-service-svtxhhei` on cluster `cs436-ecommerce`. Auto-rollback on failure is ON.

## Watch a deploy

- Console: CodePipeline → `cs436-ecommerce-deploy`.
- CLI:
  ```bash
  aws codepipeline get-pipeline-state --region eu-west-1 --name cs436-ecommerce-deploy \
    --query 'stageStates[].[stageName,latestExecution.status]' --output table
  ```

## ⚠️ Push ONCE per change

The cluster runs **2 tasks on 2 t2.micro hosts (one task per host, memory-bound)**. Two concurrent pipeline runs each start an ECS deploy → 3+ tasks contend for 2 hosts → the deploy stalls on "insufficient memory" until it self-clears. **One commit, one push, let it finish** before pushing again.

## Expected during a deploy

The rolling deploy briefly drops to 1 healthy host while swapping tasks, which trips the `cs436-ecs-task-failure` CloudWatch alarm (and sends an alert email). It **self-clears to OK** once both tasks are healthy on the new revision. This is normal.

## Rollback

ECS → cluster `cs436-ecommerce` → service `cs436-ecommerce-api-service-svtxhhei` → **Update service** → pick the previous task-definition revision → force new deployment. Or:

```bash
aws ecs update-service --region eu-west-1 --cluster cs436-ecommerce \
  --service cs436-ecommerce-api-service-svtxhhei \
  --task-definition cs436-ecommerce-api:<PREVIOUS_REVISION> --force-new-deployment
```

## Deploy-safety settings (already configured, don't change)

- Service `minimumHealthyPercent=50`, `maximumPercent=200`.
- Target group `cs436-ecommerce-tg` `deregistration_delay.timeout_seconds=30`.
  These let the one-task-per-host cluster roll without deadlocking.
