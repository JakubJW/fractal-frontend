FROM node:21.4.0

WORKDIR /app

COPY . /app

ENV NODE_ENV=production

RUN npm install serve -g

RUN npm install --include=dev

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]