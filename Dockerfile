FROM public.ecr.aws/lambda/nodejs:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD [ "dist/handler.handler" ]