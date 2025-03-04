FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

# Exécute les migrations et lance l'application
CMD npm run db:migrate && npm run seed:admin && npm run start:prod