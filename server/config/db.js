const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DB_FILE = process.env.VERCEL ? "/tmp/database.json" : path.join(__dirname, "..", "database.json");

// Default tests copy from root deployment
const defaultTests = [
  {
    _id: "test-1",
    title: "آزمون تعیین سطح جامع انگلیسی",
    description: "این آزمون مهارت‌های گرامر، دایره واژگان و درک مطلب پیشرفته شما را سنجیده و سطح نهایی شما را بر اساس استاندارد بین‌المللی CEFR از A1 تا C2 مشخص می‌کند.",
    duration: 45,
    isActive: true,
    questions: [
      {
        questionText: "I _____ to the grocery store yesterday morning.",
        options: ["go", "went", "gone", "going"],
        correctAnswerIndex: 1
      },
      {
        questionText: "We have lived in London _____ over ten years now.",
        options: ["since", "for", "during", "at"],
        correctAnswerIndex: 1
      },
      {
        questionText: "If he _____ more carefully, he wouldn't have crashed the car.",
        options: ["drove", "drives", "had driven", "was driving"],
        correctAnswerIndex: 2
      },
      {
        questionText: "The project was completed on time _____ the tight budget and resources.",
        options: ["although", "despite", "even though", "because"],
        correctAnswerIndex: 1
      },
      {
        questionText: "By the time the manager arrived, the employees _____ the presentation.",
        options: ["finished", "were finishing", "had finished", "finish"],
        correctAnswerIndex: 2
      },
      {
        questionText: "She suggested _____ a short break before starting the next session.",
        options: ["taking", "to take", "take", "took"],
        correctAnswerIndex: 0
      },
      {
        questionText: "Hardly _____ entered the meeting room when the power went out.",
        options: ["I had", "had I", "did I", "was I"],
        correctAnswerIndex: 1
      },
      {
        questionText: "You can borrow my car as long as you promise _____ responsibly.",
        options: ["to drive", "driving", "drive", "drove"],
        correctAnswerIndex: 0
      },
      {
        questionText: "The company decided to __________ the new employee feedback system next month.",
        options: ["implement", "implementing", "implementation", "implemented"],
        correctAnswerIndex: 0
      },
      {
        questionText: "They have three daughters, all of _____ are currently studying abroad.",
        options: ["who", "which", "whom", "whose"],
        correctAnswerIndex: 2
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    _id: "test-2",
    title: "آزمون مهارت شنیداری و درک مطلب عمومی (B2)",
    description: "این آزمون برای ارزیابی مهارت درک مطلب و گرامر در سطح متوسط به بالا (B2) طراحی شده است و به شما کمک می‌کند آمادگی خود را بسنجید.",
    duration: 20,
    isActive: true,
    questions: [
      {
        questionText: "I don't mind _____ overtime as long as I get paid accordingly.",
        options: ["to work", "working", "work", "worked"],
        correctAnswerIndex: 1
      },
      {
        questionText: "I wish I _____ harder when I was at university; it would help my career.",
        options: ["studied", "have studied", "had studied", "might study"],
        correctAnswerIndex: 2
      },
      {
        questionText: "The lecture _____ by the time we reached the main auditorium.",
        options: ["already started", "had already started", "has already started", "was starting"],
        correctAnswerIndex: 1
      },
      {
        questionText: "This is the hospital _____ my father worked for over thirty years.",
        options: ["which", "who", "where", "that"],
        correctAnswerIndex: 2
      },
      {
        questionText: "Unless it _____ raining soon, we will have to cancel the outdoor ceremony.",
        options: ["stops", "stopped", "will stop", "is stopping"],
        correctAnswerIndex: 0
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    _id: "test-3",
    title: "آزمون گرامر پیشرفته (C1/C2)",
    description: "یک آزمون سریع و فشرده برای سنجش گرامرهای ساختاری و نوشتاری پیشرفته زبان انگلیسی مناسب اساتید و زبان‌آموزان فوق حرفه‌ای.",
    duration: 15,
    isActive: true,
    questions: [
      {
        questionText: "Were it not _____ your timely advice, we would have lost the contract.",
        options: ["for", "with", "by", "of"],
        correctAnswerIndex: 0
      },
      {
        questionText: "She would rather _____ to the conference instead of staying at the office.",
        options: ["have gone", "to go", "going", "go"],
        correctAnswerIndex: 0
      },
      {
        questionText: "No sooner had he left the office __________ the phone started ringing continuously.",
        options: ["when", "than", "then", "until"],
        correctAnswerIndex: 1
      },
      {
        questionText: "He spoke with such authority that everyone believed him, _____ of his actual expertise.",
        options: ["regardless", "in spite", "despite", "although"],
        correctAnswerIndex: 0
      },
      {
        questionText: "I would appreciate _____ if you could keep this matter strictly confidential.",
        options: ["it", "you", "that", "this"],
        correctAnswerIndex: 0
      }
    ],
    createdAt: new Date().toISOString()
  }
];

// Helper to seed the database
function getInitialDB() {
  const adminPasswordHash = bcrypt.hashSync("admin123", 10);
  const userPasswordHash = bcrypt.hashSync("user123", 10);
  return {
    users: [
      {
        _id: "user-admin",
        fullName: "مدیر ارشد سیستم",
        username: "admin",
        password: adminPasswordHash,
        role: "admin",
        isVerified: true,
        level: "نامشخص",
        createdAt: new Date().toISOString()
      },
      {
        _id: "user-normal",
        fullName: "علی محمدی",
        username: "ali",
        password: userPasswordHash,
        role: "user",
        isVerified: true,
        level: "B2",
        createdAt: new Date().toISOString()
      },
      {
        _id: "user-sara",
        fullName: "سارا احمدی",
        username: "sara",
        password: userPasswordHash,
        role: "user",
        isVerified: false,
        level: "A1",
        createdAt: new Date().toISOString()
      }
    ],
    tests: defaultTests,
    attempts: [
      {
        _id: "attempt-1",
        userId: "user-normal",
        testId: "test-1",
        answers: [1, 1, 2, 1, 2, 0, 1, 0, 0, 1],
        correctAnswers: 9,
        totalQuestions: 10,
        score: 90,
        level: "C1",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 5).toISOString()
      },
      {
        _id: "attempt-2",
        userId: "user-normal",
        testId: "test-2",
        answers: [1, 2, 1, 2, 0],
        correctAnswers: 5,
        totalQuestions: 5,
        score: 100,
        level: "B2",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2).toISOString()
      }
    ]
  };
}

// Read File DB
function readDB() {
  // On Vercel, if DB_FILE is in /tmp and doesn't exist, try to copy it from the bundled server directory template
  if (process.env.VERCEL && DB_FILE === "/tmp/database.json") {
    if (!fs.existsSync(DB_FILE)) {
      const templatePath = path.join(__dirname, "..", "database.json");
      if (fs.existsSync(templatePath)) {
        try {
          fs.copyFileSync(templatePath, DB_FILE);
        } catch (copyErr) {
          console.error("Failed to copy database template to /tmp, will write standard database instead:", copyErr);
          try {
            fs.writeFileSync(DB_FILE, JSON.stringify(getInitialDB(), null, 2), "utf-8");
          } catch (writeErr) {
            console.error("Failed to write to /tmp/database.json directly:", writeErr);
          }
        }
      } else {
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(getInitialDB(), null, 2), "utf-8");
        } catch (writeErr) {
          console.error("Failed to write initial DB fallback to /tmp/database.json:", writeErr);
        }
      }
    }
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialDB = getInitialDB();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), "utf-8");
    } catch (err) {
      console.error("Warning: DB_FILE is not writable (will return initial DB objects in-memory):", err.message);
    }
    return initialDB;
  }

  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to parse database.json, resetting to default", err);
    return { users: [], tests: [], attempts: [] };
  }
}

// Write File DB
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Warning: DB_FILE is not writable:", err.message);
  }
}

// Simple filter helper for Mongoose-like matching
function filterCollection(collection, query) {
  if (!query || Object.keys(query).length === 0) return collection;
  return collection.filter(item => {
    for (const key in query) {
      let val = query[key];
      let itemVal = item[key];
      
      // Match ID representations
      if (key === "_id" && itemVal && itemVal.toString) itemVal = itemVal.toString();
      if (key === "_id" && val && val.toString) val = val.toString();
      
      if (key === "username" && itemVal) itemVal = itemVal.toString().toLowerCase();
      if (key === "username" && val) val = val.toString().toLowerCase();

      // For dynamic reference matching (like testId)
      if (itemVal && itemVal._id) itemVal = itemVal._id.toString();
      if (val && val._id) val = val._id.toString();

      if (itemVal !== val) return false;
    }
    return true;
  });
}

// Mock query chaining
class MockQuery {
  constructor(promise) {
    this.promise = promise;
  }
  populate(field) {
    // Basic mock populate for 'testId' inside Attempts or others
    const populatePromise = this.promise.then(data => {
      if (!data) return data;
      const db = readDB();
      const tests = db.tests || [];
      const users = db.users || [];

      const populateObj = (obj) => {
        if (!obj) return obj;
        
        // Populate testId
        if (field === "testId" || field === "testId") {
          let tId = obj.testId;
          if (tId && tId._id) tId = tId._id;
          const foundTest = tests.find(t => t._id === tId);
          if (foundTest) obj.testId = foundTest;
        }

        // Populate userId
        if (field === "userId") {
          let uId = obj.userId;
          if (uId && uId._id) uId = uId._id;
          const foundUser = users.find(u => u._id === uId);
          if (foundUser) {
            obj.userId = {
              _id: foundUser._id,
              fullName: foundUser.fullName,
              username: foundUser.username,
              role: foundUser.role,
              level: foundUser.level
            };
          }
        }
        return obj;
      };

      if (Array.isArray(data)) {
        return data.map(item => populateObj({ ...item }));
      } else {
        return populateObj({ ...data });
      }
    });
    return new MockQuery(populatePromise);
  }
  select() { return this; }
  sort(criteria) { 
    const sortedPromise = this.promise.then(data => {
      if (!Array.isArray(data)) return data;
      // Sort by createdAt descending by default or match any sort logic
      return data.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    });
    return new MockQuery(sortedPromise); 
  }
  skip() { return this; }
  limit() { return this; }
  exec() { return this.promise; }
  then(onResolve, onReject) {
    return this.promise.then(onResolve, onReject);
  }
}

// Is Mongoose actually connected to MongoDB
const isMongoConnected = () => mongoose.connection.readyState === 1;

// Override Mongoose model compilation to return our smart Proxy model!
const originalModel = mongoose.model;
mongoose.model = function (modelName, schema) {
  const realModel = originalModel.call(mongoose, modelName, schema);

  class ModelProxy {
    constructor(data) {
      if (isMongoConnected()) {
        return new realModel(data);
      } else {
        Object.assign(this, data);
        if (!this._id) this._id = "mock-" + Math.random().toString(36).substr(2, 9);
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
      }
    }

    async save() {
      if (isMongoConnected()) {
        return realModel.prototype.save.call(this);
      } else {
        const db = readDB();
        const collectionName = modelName.toLowerCase() + "s";
        if (!db[collectionName]) db[collectionName] = [];

        // Encrypt password if unhashed user registration / update
        if (modelName === "User" && this.password && !this.password.startsWith("$2a$")) {
          this.password = bcrypt.hashSync(this.password, 10);
        }

        const idx = db[collectionName].findIndex(item => item._id === this._id);
        if (idx >= 0) {
          db[collectionName][idx] = { ...db[collectionName][idx], ...this, updatedAt: new Date().toISOString() };
        } else {
          db[collectionName].push(this);
        }
        writeDB(db);
        return this;
      }
    }

    async matchPassword(enteredPassword) {
      // bcrypt is used for password verification in both environments
      const passwordHash = this.password;
      return bcrypt.compareSync(enteredPassword, passwordHash);
    }

    // Static Query methods:
    static find(query) {
      if (isMongoConnected()) {
        return realModel.find(query);
      }
      const promise = (async () => {
        const db = readDB();
        const collection = db[modelName.toLowerCase() + "s"] || [];
        return filterCollection(collection, query).map(item => {
          const instance = new ModelProxy(item);
          return instance;
        });
      })();
      return new MockQuery(promise);
    }

    static findOne(query) {
      if (isMongoConnected()) {
        return realModel.findOne(query);
      }
      const promise = (async () => {
        const db = readDB();
        const collection = db[modelName.toLowerCase() + "s"] || [];
        const results = filterCollection(collection, query);
        if (results.length > 0) {
          return new ModelProxy(results[0]);
        }
        return null;
      })();
      return new MockQuery(promise);
    }

    static findById(id) {
      if (isMongoConnected()) {
        return realModel.findById(id);
      }
      const promise = (async () => {
        const db = readDB();
        const collection = db[modelName.toLowerCase() + "s"] || [];
        const matchId = id && id.toString ? id.toString() : id;
        const found = collection.find(item => item._id === matchId);
        if (found) {
          return new ModelProxy(found);
        }
        return null;
      })();
      return new MockQuery(promise);
    }

    static create(data) {
      if (isMongoConnected()) {
        return realModel.create(data);
      }
      return (async () => {
        const item = new ModelProxy(data);
        await item.save();
        return item;
      })();
    }

    static findByIdAndUpdate(id, update, options) {
      if (isMongoConnected()) {
        return realModel.findByIdAndUpdate(id, update, options);
      }
      const promise = (async () => {
        const db = readDB();
        const collectionName = modelName.toLowerCase() + "s";
        const collection = db[collectionName] || [];
        const matchId = id && id.toString ? id.toString() : id;
        const idx = collection.findIndex(item => item._id === matchId);
        if (idx >= 0) {
          // If password is updated, hash it
          if (update.password && !update.password.startsWith("$2a$")) {
            update.password = bcrypt.hashSync(update.password, 10);
          }
          const updatedItem = { ...collection[idx], ...update, updatedAt: new Date().toISOString() };
          db[collectionName][idx] = updatedItem;
          writeDB(db);
          return new ModelProxy(updatedItem);
        }
        return null;
      })();
      return new MockQuery(promise);
    }

    static findByIdAndDelete(id) {
      return this.findByIdAndRemove(id);
    }

    static findByIdAndRemove(id) {
      if (isMongoConnected()) {
        return realModel.findByIdAndDelete(id);
      }
      const promise = (async () => {
        const db = readDB();
        const collectionName = modelName.toLowerCase() + "s";
        const collection = db[collectionName] || [];
        const matchId = id && id.toString ? id.toString() : id;
        const idx = collection.findIndex(item => item._id === matchId);
        if (idx >= 0) {
          const removed = collection[idx];
          collection.splice(idx, 1);
          writeDB(db);
          return new ModelProxy(removed);
        }
        return null;
      })();
      return new MockQuery(promise);
    }

    static deleteOne(query) {
      if (isMongoConnected()) {
        return realModel.deleteOne(query);
      }
      const promise = (async () => {
        const db = readDB();
        const collectionName = modelName.toLowerCase() + "s";
        const collection = db[collectionName] || [];
        const results = filterCollection(collection, query);
        if (results.length > 0) {
          const targetId = results[0]._id;
          db[collectionName] = collection.filter(item => item._id !== targetId);
          writeDB(db);
          return { deletedCount: 1 };
        }
        return { deletedCount: 0 };
      })();
      return new MockQuery(promise);
    }

    static countDocuments(query) {
      if (isMongoConnected()) {
        return realModel.countDocuments(query);
      }
      const promise = (async () => {
        const db = readDB();
        const collection = db[modelName.toLowerCase() + "s"] || [];
        return filterCollection(collection, query).length;
      })();
      return new MockQuery(promise);
    }
  }

  return ModelProxy;
};

const connectDB = async () => {
  // Prime the JSON file DB synchronously
  readDB();

  try {
    // Short timeout parameters to prevent blocking AI Studio
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/english-pro", {
      serverSelectionTimeoutMS: 1500,
      connectTimeoutMS: 1500,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("⚠️  MongoDB connection failed/offline. Activating sandbox JSON database engine...");
  }
};

module.exports = connectDB;
