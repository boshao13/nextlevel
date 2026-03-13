// import React, { useEffect, useState } from "react";
// import { useSearchParams } from "react-router-dom";
// import axios from "axios";
// import styled from "styled-components";

// // Styled Components
// const ConfirmationContainer = styled.div`
//   max-width: 800px;
//   margin: 50px auto;
//   padding: 20px;
//   background: #f9f9f9;
//   border-radius: 8px;
//   box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
//   text-align: center;
// `;

// const Header = styled.h1`
//   font-size: 2rem;
//   color: #333;
//   margin-bottom: 20px;
// `;

// const OrderSummary = styled.div`
//   padding: 20px;
//   background: #fff;
//   border-radius: 8px;
//   box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
//   margin-top: 20px;
// `;

// const ErrorMessage = styled.p`
//   color: red;
// `;

// const Confirmation = () => {
//   const [searchParams] = useSearchParams();
//   const paymentIntentId = searchParams.get("payment_intent");
//   const [paymentDetails, setPaymentDetails] = useState(null);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchPaymentDetails = async () => {
//       console.log("Fetching payment details for PaymentIntent ID:", paymentIntentId);

//       try {
//         const { data } = await axios.get(`http://localhost:4242/payment-details`, {
//           params: { paymentIntentId },
//         });

//         console.log("Payment details received from server:", data);
//         setPaymentDetails(data);
//       } catch (err) {
//         console.error("Error fetching payment details:", err.message);
//         setError("Error fetching payment details. Please contact support.");
//       }
//     };

//     if (paymentIntentId) {
//       fetchPaymentDetails();
//     } else {
//       console.error("No PaymentIntent ID provided in the URL.");
//       setError("Missing PaymentIntent ID. Please contact support.");
//     }
//   }, [paymentIntentId]);

//   if (error) {
//     return (
//       <ConfirmationContainer>
//         <Header>Payment Failed</Header>
//         <ErrorMessage>{error}</ErrorMessage>
//       </ConfirmationContainer>
//     );
//   }

//   if (!paymentDetails) {
//     return (
//       <ConfirmationContainer>
//         <Header>Loading...</Header>
//       </ConfirmationContainer>
//     );
//   }

//   return (
//     <ConfirmationContainer>
//       <Header>Thank You for Your Purchase!</Header>
//       <p>Your payment was successful. Here are your order details:</p>
//       <OrderSummary>
//         <p>
//           <strong>Order ID:</strong> {paymentDetails.id}
//         </p>
//         <p>
//           <strong>Status:</strong> {paymentDetails.status}
//         </p>
//         <p>
//           <strong>Amount:</strong> $
//           {(paymentDetails.amount / 100).toFixed(2)}{" "}
//           {paymentDetails.currency.toUpperCase()}
//         </p>
//         <p>
//           <strong>Email:</strong> {paymentDetails.receipt_email || "N/A"}
//         </p>
//       </OrderSummary>
//     </ConfirmationContainer>
//   );
// };

// export default Confirmation;
