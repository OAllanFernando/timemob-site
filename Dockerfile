FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci \
 && npm cache clean --force \
 && rm -rf /root/.npm

COPY . .

# NEXT_PUBLIC_* values are inlined at build time, so they must be present before `npm run build`.
# This site is white-label per tenant: NEXT_PUBLIC_TENANT_SLUG/ID bind the image to one tenant.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME

ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

ARG NEXT_PUBLIC_TENANT_SLUG
ENV NEXT_PUBLIC_TENANT_SLUG=$NEXT_PUBLIC_TENANT_SLUG

ARG NEXT_PUBLIC_TENANT_ID
ENV NEXT_PUBLIC_TENANT_ID=$NEXT_PUBLIC_TENANT_ID

RUN npm run build

# `npm start` runs `next start -p 3001` (see package.json).
EXPOSE 3001

CMD ["npm", "start"]
