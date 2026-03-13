// import React from "react";
// import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
// import { useNavigate } from "react-router-dom";
// import styled from "styled-components";

// // Styled Components
// const FormWrapper = styled.div`
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   padding: 20px;
//   background: #fff;
//   border-radius: 8px;
//   box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
//   margin-top: 50px; /* Add some margin to prevent overlapping with the header */
// `;

// const StyledForm = styled.form`
//   width: 100%;
//   max-width: 400px;
// `;

// const SubmitButton = styled.button`
//   width: 100%;
//   padding: 12px 20px;
//   margin-top: 20px;
//   background-color: #3498db;
//   color: white;
//   border: none;
//   border-radius: 8px;
//   font-size: 1.1rem;
//   cursor: pointer;
//   transition: background-color 0.3s ease;

//   &:hover {
//     background-color: #2980b9;
//   }

//   &:disabled {
//     background-color: #ccc;
//     cursor: not-allowed;
//   }
// `;

// const ErrorText = styled.p`
//   color: red;
//   font-size: 0.9rem;
//   margin-top: 10px;
// `;

// const SuccessText = styled.p`
//   color: green;
//   font-size: 1rem;
//   margin-top: 20px;
//   text-align: center;
// `;

// const CheckoutForm = () => {
//   const stripe = useStripe();
//   const elements = useElements();
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!stripe || !elements) {
//       alert("Stripe.js has not yet loaded. Please try again later.");
//       return;
//     }

//     try {
//       const { error } = await stripe.confirmPayment({
//         elements,
//         confirmParams: {
//           return_url: `${window.location.origin}/confirmation`,
//         },
//       });

//       if (error) {
//         console.error("Payment failed:", error.message);
//         alert(`Payment failed: ${error.message}`);
//       } else {
//         // Fallback in case Stripe doesn't redirect properly
//         navigate("/confirmation");
//       }
//     } catch (err) {
//       console.error("An unexpected error occurred:", err.message);
//       alert("An unexpected error occurred. Please try again.");
//     }
//   };

//   return (
//     <FormWrapper>
//       <h2>Complete Your Payment</h2>
//       <p>Enter your payment details below to complete your purchase.</p>
//       <StyledForm onSubmit={handleSubmit}>
//         <PaymentElement
//           options={{
//             layout: "tabs", // Layout option
//             fields: {
//               billingDetails: "auto", // Automatically include billing details fields
//             },
//           }}
//         />
//         <SubmitButton type="submit" disabled={!stripe || !elements}>
//           Pay Now
//         </SubmitButton>
//       </StyledForm>
//       <SuccessText>Your payment is being processed securely.</SuccessText>
//     </FormWrapper>
//   );
// };

// export default CheckoutForm;
