import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyArr5VtbRb1Fn2d6MB9cV-ThidIHIhFsjc',
  authDomain: 'tusk01.firebaseapp.com',
  databaseURL: 'https://tusk01-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'tusk01',
  storageBucket: 'tusk01.firebasestorage.app',
  messagingSenderId: '949030908578',
  appId: '1:949030908578:web:e1764c25d2d42261b11dfb'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
export const db = getDatabase(app)

export default app
