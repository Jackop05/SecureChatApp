FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# CMD is overridden in docker-compose to run "npm run build"
CMD ["npm", "run", "build"]