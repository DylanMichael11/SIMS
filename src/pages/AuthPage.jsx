import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    
    console.log("=== AUTH ATTEMPT ===");
    console.log("Email:", email);
    console.log("Mode:", isCreatingAccount ? "CREATE" : "SIGN IN");
    
    try {
      let result;
      
      if (isCreatingAccount) {
        console.log("Creating new account...");
        result = await createUserWithEmailAndPassword(auth, email.trim(), pw);
        alert("✅ Account created successfully! Redirecting to dashboard...");
      } else {
        console.log("Signing in...");
        result = await signInWithEmailAndPassword(auth, email.trim(), pw);
        alert("✅ Signed in successfully! Redirecting to dashboard...");
      }
      
      console.log("Success:", result.user.email);
      
      // Redirect to home page after successful auth
      navigate("/");
      
    } catch (e) {
      console.error("=== AUTH ERROR ===");
      console.error("Error code:", e.code);
      console.error("Error message:", e.message);
      
      // User-friendly error messages
      let errorMessage = e.message;
      if (e.code === "auth/user-not-found") {
        errorMessage = "No account found with this email. Try creating an account instead.";
      } else if (e.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (e.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists. Try signing in instead.";
      } else if (e.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters long.";
      } else if (e.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      }
      
      alert("❌ " + errorMessage);
    }
  }

  return (
    <div style={{
      maxWidth: "400px",
      margin: "4rem auto",
      padding: "2rem",
      backgroundColor: "#1a1a1a",
      borderRadius: "8px",
      color: "white"
    }}>
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>
        {isCreatingAccount ? "Create Account" : "Sign In"}
      </h1>
      
      <form onSubmit={handleSubmit}>
        <input 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          type="email"
          required
          style={{
            width: "100%",
            padding: "12px",
            margin: "8px 0",
            border: "1px solid #555",
            borderRadius: "4px",
            backgroundColor: "#2a2a2a",
            color: "white",
            fontSize: "16px"
          }}
        />
        
        <input 
          placeholder="Password" 
          value={pw} 
          onChange={(e) => setPw(e.target.value)} 
          type="password"
          required
          style={{
            width: "100%",
            padding: "12px",
            margin: "8px 0",
            border: "1px solid #555",
            borderRadius: "4px",
            backgroundColor: "#2a2a2a",
            color: "white",
            fontSize: "16px"
          }}
        />
        
        <button 
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            margin: "16px 0",
            backgroundColor: isCreatingAccount ? "#28a745" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold"
          }}
        >
          {isCreatingAccount ? "Create Account" : "Sign In"}
        </button>
      </form>
      
      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        {isCreatingAccount ? (
          <p>
            Already have an account?{" "}
            <button 
              onClick={() => setIsCreatingAccount(false)}
              style={{
                background: "none",
                border: "none",
                color: "#007bff",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "16px"
              }}
            >
              Sign in
            </button>
          </p>
        ) : (
          <p>
            New here?{" "}
            <button 
              onClick={() => setIsCreatingAccount(true)}
              style={{
                background: "none",
                border: "none",
                color: "#28a745",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "16px"
              }}
            >
              Create account
            </button>
          </p>
        )}
      </div>
    </div>
  );
}