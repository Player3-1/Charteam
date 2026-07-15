import { useState } from "react";
import React from 'react';
import { db } from "@/firebase";
import { UserData } from "@/types";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface AuthModalProps {
  onLogin: (user: UserData) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!sanitizedUsername) {
      alert("Invalid username.");
      return;
    }

    try {
      if (isLogin) {
        const accountRef = doc(db, "accounts", sanitizedUsername);
        const accountSnap = await getDoc(accountRef);
        
        if (!accountSnap.exists()) {
          alert('User not found.');
          return;
        }

        if (accountSnap.data().password !== password) {
          alert('Incorrect password.');
          return;
        }

        const userSnap = await getDoc(doc(db, "users", sanitizedUsername));
        onLogin(userSnap.data() as UserData);
      } else {
        const accountRef = doc(db, "accounts", sanitizedUsername);
        const accountSnap = await getDoc(accountRef);
        
        if (accountSnap.exists()) {
          alert('Username is already taken.');
          return;
        }

        await setDoc(accountRef, { password });
        
        const initialData: UserData = {
          username: sanitizedUsername, 
          deck: ["mizrakli", "kilicli", "okcu", "dev"],
          collection: { "mizrakli": 1, "kilicli": 1, "okcu": 1, "dev": 1 },
          trophies: 0,
          wins: 0,
          losses: 0,
          gold: 100,
        };
        await setDoc(doc(db, "users", sanitizedUsername), initialData);
        
        onLogin(initialData);
      }
    } catch (error: any) {
      console.error(error);
      alert('An error occurred: ' + error.message);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm rounded-lg bg-slate-900 p-6 shadow-xl">
        <h2 className="mb-4 text-center text-xl font-bold text-white">
          {isLogin ? "Log In" : "Sign Up"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded border border-slate-700 bg-slate-800 p-2 text-white"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-slate-700 bg-slate-800 p-2 text-white"
          />
          <button type="submit" className="rounded bg-indigo-600 p-2 font-bold text-white">
            {isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-4 w-full text-sm text-slate-400"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
};
