import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD2E-132qkC6sAmuPEAgnOr3QUg2nO7UuM",
  authDomain: "ionic-499116.firebaseapp.com",
  projectId: "ionic-499116",
  storageBucket: "ionic-499116.firebasestorage.app",
  messagingSenderId: "304025860925",
  appId: "1:304025860925:web:df7414f6389281097f2354"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
