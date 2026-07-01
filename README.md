# NodeJS ExpressJS 

# Important command

npm init <br />
npm i --save express express-session body-parser ejs mongodb  <br />
npm i --save-dev nodemon <br />
nodemon app.js <br />


# Ejs Template Engine 

<%= %> <br />

# Env DB Connection
# replicaSet=rs0 is mandatory for Prisma ORM

# Add below code in Fly-Env Config
# replication:
#  replSetName: rs0
# DATABASE_URL="mongodb://127.0.0.1:27017/ecommerce?replicaSet=rs0"



MongoDBStep01:
cd "C:\Program Files\FlyEnv-Data\app\mongodb-8.2.7\bin"
mongod --dbpath C:\data\db

MongoDBStep02:
cd "C:\Users\prase\Downloads\mongosh-2.9.1-win32-x64\bin"
mongosh --version
mongosh
rs.status()
rs.initiate()
rs.status()
