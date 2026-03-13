// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import styled from "styled-components";
// import axios from "axios";

// const LoginPage = styled.div`
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   min-height: 70vh; /* Ensures the content fills the available space */
//   padding: 20px;
//   background-color: #f9f9f9;
// `;

// const LoginContainer = styled.div`
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   background: white;
//   padding: 30px;
//   border-radius: 8px;
//   box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
//   max-width: 400px;
//   width: 100%;
// `;

// const Title = styled.h2`
//   margin-bottom: 20px;
//   color: #333;
// `;

// const LoginForm = styled.form`
//   display: flex;
//   flex-direction: column;
//   width: 100%;
// `;

// const Input = styled.input`
//   margin-bottom: 15px;
//   padding: 12px;
//   font-size: 1rem;
//   border: 1px solid #ccc;
//   border-radius: 5px;
//   width: 100%;
// `;

// const Button = styled.button`
//   padding: 12px;
//   font-size: 1rem;
//   background-color: #007bff;
//   color: white;
//   border: none;
//   border-radius: 5px;
//   cursor: pointer;
//   width: 100%;

//   &:hover {
//     background-color: #0056b3;
//   }
// `;

// const ErrorMessage = styled.p`
//   color: red;
//   font-size: 0.9rem;
//   margin-top: 10px;
// `;

// const Login = () => {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const navigate = useNavigate(); // React Router hook for navigation

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(""); // Reset error message

//     try {
//       const response = await axios.post("http://localhost:4242/admin/login", {
//         username,
//         password,
//       });
//       const token = response.data.token;

//       // Log success to the console
//       console.log(`Login successful for user: ${username}`);

//       // Save token in localStorage and navigate to Dashboard
//       localStorage.setItem("token", token);
//       navigate("/dashboard");
//     } catch (err) {
//       // Set a friendly error message
//       const errorMessage =
//         err.response?.status === 401
//           ? "Invalid username or password. Please try again."
//           : "An error occurred. Please try again later.";

//       setError(errorMessage);

//       // Log error details for debugging
//       console.error("Login error:", err.response?.data || err.message);
//     }
//   };

//   return (
//     <LoginPage>
//       <LoginContainer>
//         <Title>Admin Login</Title>
//         <LoginForm onSubmit={handleSubmit}>
//           <Input
//             type="text"
//             placeholder="Username"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             required
//           />
//           <Input
//             type="password"
//             placeholder="Password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//           />
//           <Button type="submit">Login</Button>
//           {error && <ErrorMessage>{error}</ErrorMessage>}
//         </LoginForm>
//       </LoginContainer>
//     </LoginPage>
//   );
// };

// export default Login;
