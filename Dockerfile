# Build stage
FROM node:21-alpine AS build

WORKDIR /home/app

# Set build arguments
ARG API_URL
ARG API_SUNAT_TOKEN

# Set environment variables for the build process
ENV API_URL: $API_URL
ENV API_SUNAT_TOKEN: $API_SUNAT_TOKEN

# Copy the package.json and package-lock.json files to the container
COPY ./angular.json /home/app
COPY ./package*.json /home/app
COPY ./tsconfig*.json /home/app
COPY ./tailwind.config.js /home/app
RUN npm install

# Replace environment placeholders
RUN sed -i "s#process.env['API_URL']#'$API_URL'#g" src/environments/environment.ts
RUN sed -i "s#process.env['API_SUNAT_TOKEN']#'$API_SUNAT_TOKEN'#g" src/environments/environment.ts

# Copy the source code to the container
COPY ./src /home/app/src
RUN npm run build --omit=dev

# Serve app with nginx server
# Use official nginx image as the base image
FROM nginx:latest

# Copy the custom nginx configuration file to the container in the default location
COPY ./nginx.conf /etc/nginx/nginx.conf
# Copy the build output to replace the default nginx contents.
COPY --from=build /home/app/dist/smart-shell /usr/share/nginx/html

# Expose port 80
EXPOSE 80
