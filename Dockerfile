# Build stage
FROM node:21-alpine AS build

WORKDIR /home/app

COPY ./angular.json /home/app
COPY ./package*.json /home/app
COPY ./tsconfig*.json /home/app
COPY ./tailwind.config.js /home/app
RUN npm install

COPY ./src /home/app/src
RUN npm run build

EXPOSE 4200
CMD ["npm", "start"]
