FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && node src/server.js"]
