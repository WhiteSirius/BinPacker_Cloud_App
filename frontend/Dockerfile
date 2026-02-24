FROM node:16-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
# Inject API base URL at build time for CRA
ARG REACT_APP_API_BASE_URL=
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

