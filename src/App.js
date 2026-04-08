import "./App.css";
import { useState, useEffect } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import {
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "firebase/auth";

import { auth, provider, db } from "./firebase";

import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  deleteDoc
} from "firebase/firestore";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

function App() {
  const ADMIN_EMAIL = "admin@gmail.com";
  const resetPassword = async () => {
  if (!email) return alert("Enter your email first");

  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset email sent! Check your inbox.");
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      alert("No user found with this email");
    } else {
      alert(err.message);
    }
  }
};
  const [user, setUser] = useState(null);
  const [isAdminView, setIsAdminView] = useState(false);

  const [subject, setSubject] = useState("");
  const [sessions, setSessions] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [task, setTask] = useState("");
  const [date, setDate] = useState("");
  const [tasks, setTasks] = useState([]);

  const [time, setTime] = useState(new Date());
  const [seconds, setSeconds] = useState(1500);
  const [isActive, setIsActive] = useState(false);

  // 🔐 AUTH PERSISTENCE
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  // LOGIN GOOGLE
  const login = async () => {
    const result = await signInWithPopup(auth, provider);
    setUser(result.user);
  };

  // LOGIN EMAIL
const emailLogin = async () => {
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    setUser(res.user);
  } catch (err) {

    if (err.code === "auth/user-not-found") {
      alert("User not found. Please register first.");
    } 
    else if (err.code === "auth/wrong-password") {
      alert("Wrong password. Try again.");
    } 
    else if (err.code === "auth/invalid-email") {
      alert("Invalid email format.");
    } 
    else if (err.code === "auth/invalid-credential") {
      alert("Invalid credentials. Register first if you don't have an account.");
    } 
    else {
      alert(err.message);
    }

  }
};

  // REGISTER
  const register = async () => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      setUser(res.user);
    } catch (err) {
      alert(err.message);
    }
  };

  // LOGOUT
  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // ADD TASK
  const addTask = async () => {
    if (!task || !date) return alert("Enter task & date");

    await addDoc(collection(db, "tasks"), {
      userId: user.uid,
      task,
      date
    });

    setTask("");
    setDate("");
  };

  // CLOCK
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // TIMER
  useEffect(() => {
    let interval = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const startTimer = () => setIsActive(true);
  const pauseTimer = () => setIsActive(false);
  const resetTimer = () => {
    setIsActive(false);
    setSeconds(1500);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // FETCH SESSIONS
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "sessions"), (snapshot) => {
      setSessions(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // FETCH TASKS
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(collection(db, "tasks"), (snapshot) => {
      const all = snapshot.docs.map((doc) => doc.data());
      setTasks(all.filter((t) => t.userId === user.uid));
    });

    return () => unsub();
  }, [user]);

  // LOCATION
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserLocation({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      });
    });
  }, []);

  // CREATE SESSION
  const createSession = async () => {
    if (!subject) return alert("Enter subject");

    navigator.geolocation.getCurrentPosition(async (pos) => {
      await addDoc(collection(db, "sessions"), {
        subject,
        createdAt: Date.now(),
        duration: 60,
        participants: [],
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      });
      setSubject("");
    });
  };

  // JOIN SESSION (FIXED)
  const joinSession = async (id) => {
    await updateDoc(doc(db, "sessions", id), {
      participants: arrayUnion({
  name: user.displayName || user.email,
  email: user.email
})
    });
  };

  // DELETE SESSION
  const deleteSession = async (id) => {
    await deleteDoc(doc(db, "sessions", id));
  };

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="login-container">
        <div className="login-left">
          <img
            src="https://cdni.iconscout.com/illustration/premium/thumb/login-3305943-2757111.png"
            alt="login"
          />
        </div>

        <div className="login-right">
          <h1 className="app-logo">SnapStudy</h1>
          <h2 className="login-title">Sign in</h2>

          <input
            className="login-input"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="login-btn" onClick={emailLogin}>
            LOGIN
          </button>

          <button className="login-btn" onClick={login}>
            LOGIN WITH GOOGLE
          </button>
          <p 
  style={{ cursor: "pointer", fontSize: "14px", marginTop: "5px" }}
  onClick={resetPassword}
>
  Forgot Password?
</p>

          <p className="login-footer">
            Don’t have an account?{" "}
            <span onClick={register}>Register</span>
          </p>
        </div>
      </div>
    );
  }

  // ADMIN PANEL
  if (user.email === ADMIN_EMAIL && isAdminView) {
    return (
      <div className="container">
        <h1 className="title">👑 Admin Panel</h1>

        <button className="button" onClick={() => setIsAdminView(false)}>
          Back
        </button>

        {sessions.map((s) => (
          <div key={s.id} className="card">
            <p><b>{s.subject}</b></p>
            <p>👥 {s.participants?.length || 0} joined</p>

<div style={{ fontSize: "14px", marginTop: "5px" }}>
  { s.participants?.map((p, i) => (
  <div key={i}>
    • {typeof p === "string" ? p : p.name}
  </div>
))}
</div>

            <button className="join-btn" onClick={() => deleteSession(s.id)}>
              ❌ Delete
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="title">📚 One-Tap Study Group</h1>
      <p>👋 Welcome, {user.displayName || user.email}</p>

      <div style={{ display: "flex", gap: "10px" }}>
        {user.email === ADMIN_EMAIL && (
          <button className="button" onClick={() => setIsAdminView(true)}>
            👑 Admin Panel
          </button>
        )}

        <button className="button" onClick={logout}>
          Logout
        </button>
      </div>

      {/* CREATE SESSION */}
      <div>
        <input
          className="input"
          placeholder="Enter subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <button className="button" onClick={createSession}>
          Start
        </button>
      </div>

      {/* CALENDAR */}
      <h2 style={{ marginTop: 20 }}>📅 My Study Planner</h2>

      <div>
        <input
          className="input"
          placeholder="Task"
          value={task}
          onChange={(e) => setTask(e.target.value)}
        />

        <input
          type="date"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <button className="button" onClick={addTask}>
          Add
        </button>
      </div>

      {tasks.map((t, i) => (
        <div key={i} className="card">
          <p><b>{t.task}</b></p>
          <p>📅 {t.date}</p>
        </div>
      ))}

      {/* TIMER */}
      <h2 style={{ marginTop: 20 }}>⏱ Study Timer</h2>

      <div className="card">
        <p>🕒 {time.toLocaleTimeString()}</p>
        <h3>{formatTime(seconds)}</h3>

        <button className="button" onClick={startTimer}>Start</button>
        <button className="button" onClick={pauseTimer}>Pause</button>
        <button className="button" onClick={resetTimer}>Reset</button>
      </div>

      <h2 style={{ marginTop: 20 }}>Nearby Sessions</h2>

      {/* MAP */}
      <MapContainer
        center={userLocation ? [userLocation.lat, userLocation.lon] : [20, 78]}
        zoom={13}
        style={{ height: "300px", width: "100%", marginTop: "20px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {sessions.map((s) => (
          <Marker key={s.id} position={[s.latitude, s.longitude]}>
            <Popup>{s.subject}</Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* SESSION LIST */}
      {sessions.map((s) => (
        <div key={s.id} className="card">
          <p><b>{s.subject}</b></p>
          <p>👥 {s.participants?.length || 0} joined</p>

<div style={{ fontSize: "14px", marginTop: "5px" }}>
  {s.participants?.map((p, i) => (
    <div key={i}>
      • {typeof p === "string" ? p : p.name}
    </div>
  ))}
</div>

<button className="join-btn" onClick={() => joinSession(s.id)}>
  Join
</button>
        </div>
      ))}
    </div>
  );
}

export default App;
