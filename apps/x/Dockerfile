FROM node:18.13.0-bullseye-slim

WORKDIR /apps/x/
COPY package*.json ./
RUN npm install
COPY . .

CMD [ "npm", "run", "start"]