Here are the most important **MongoDB keywords** (useful for interviews and quick revision):
mongod --dbpath C:\data\db
### 🔹 Basic Concepts

* **Database** – container of collections
* **Collection** – group of documents (like table)
* **Document** – JSON-like data (BSON format)
* **Field** – key-value pair inside document
* **_id** – unique identifier (primary key)

### 🔹 CRUD Operations

* **insertOne() / insertMany()** – add data
* **find() / findOne()** – read data
* **updateOne() / updateMany()** – modify data
* **deleteOne() / deleteMany()** – remove data

### 🔹 Query Operators

* **$eq, $ne** – equal / not equal
* **$gt, $lt, $gte, $lte** – comparison
* **$in, $nin** – match in array
* **$and, $or, $not** – logical operations
* **$exists** – field existence

### 🔹 Projection & Sorting

* **projection** – select fields (`{name:1}`)
* **sort()** – order results
* **limit() / skip()** – pagination

### 🔹 Indexing

* **createIndex()** – improve query performance
* **compound index** – multiple fields
* **unique index** – no duplicates

### 🔹 Aggregation Pipeline

* **$match** – filter
* **$group** – group data
* **$project** – reshape fields
* **$sort** – order
* **$lookup** – join collections
* **$unwind** – deconstruct array

### 🔹 Other Important Terms

* **Replication** – data backup (Replica Set)
* **Sharding** – horizontal scaling
* **Atlas** – cloud MongoDB service
* **BSON** – binary JSON format
* **Schema-less** – flexible structure

If you want, I can give you **MongoDB keywords with real query examples (interview-ready)** or a **1-page cheat sheet PDF**.

















---

# 📘 MongoDB Keywords Cheat Sheet

## 🟢 1. Database Commands

* `use dbName` → switch/create database
* `show dbs` → list databases
* `db.dropDatabase()` → delete database

---

## 🟡 2. Collection Commands

* `db.createCollection()`
* `show collections`
* `db.collection.drop()`

---

## 🔵 3. CRUD Operations

### ➤ Insert

* `insertOne()`
* `insertMany()`

### ➤ Read

* `find()`
* `findOne()`
* `pretty()`
* `limit()`
* `skip()`
* `sort()`

### ➤ Update

* `updateOne()`
* `updateMany()`
* `replaceOne()`

### ➤ Delete

* `deleteOne()`
* `deleteMany()`

---

## 🟣 4. Query Operators

### 🔹 Comparison

* `$eq` → equal
* `$ne` → not equal
* `$gt` → greater than
* `$gte` → greater or equal
* `$lt` → less than
* `$lte` → less or equal
* `$in`
* `$nin`

---

### 🔹 Logical

* `$and`
* `$or`
* `$not`
* `$nor`

---

### 🔹 Element

* `$exists`
* `$type`

---

### 🔹 Evaluation

* `$regex`
* `$expr`
* `$mod`

---

## 🟠 5. Update Operators

* `$set`
* `$unset`
* `$inc`
* `$mul`
* `$rename`
* `$min`
* `$max`

---

## 🟤 6. Array Operators

* `$push`
* `$pop`
* `$pull`
* `$addToSet`
* `$each`
* `$slice`

---

## 🔴 7. Aggregation Framework

### ➤ Pipeline Stages

* `$match`
* `$group`
* `$project`
* `$sort`
* `$limit`
* `$skip`
* `$lookup` (JOIN)
* `$unwind`
* `$count`

---

### ➤ Aggregation Operators

* `$sum`
* `$avg`
* `$min`
* `$max`
* `$first`
* `$last`

---

## ⚫ 8. Indexing

* `createIndex()`
* `dropIndex()`
* `getIndexes()`

---

## ⚪ 9. Text Search

* `$text`
* `$search`

---

## 🟩 10. Projection

* `{ field: 1 }` → include
* `{ field: 0 }` → exclude

---

## 🟦 11. Cursor Methods

* `.count()`
* `.forEach()`
* `.toArray()`

---

## 🟪 12. Data Types (Important)

* `String`
* `Number`
* `Boolean`
* `Array`
* `Object`
* `ObjectId`
* `Date`
* `Null`

---

## 🧠 13. Important Concepts (Interview 🔥)

* **Document**
* **Collection**
* **Replica Set**
* **Sharding**
* **Indexing**
* **Aggregation Pipeline**
* **Embedded vs Referenced Data**
* **Schema Design**

---

## 🚀 14. Example (Quick)

```js
db.users.find(
  { age: { $gt: 25 } },
  { name: 1, age: 1 }
).sort({ age: -1 }).limit(5)
```

---

## 🎯 Pro Tip

For **1–2 years experience interviews**, focus on:

* CRUD + Query operators
* Aggregation (`$match`, `$group`, `$lookup`)
* Indexing basics
* Schema design

