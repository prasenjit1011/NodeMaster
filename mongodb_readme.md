
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

---

If you want, I can give:
👉 **MongoDB interview questions (with answers)**
👉 **Real coding problems (like DSA using MongoDB)**
👉 **Node.js + MongoDB examples (important for MERN)**
