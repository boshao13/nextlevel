// import React, { useEffect, useState } from "react";
// import { useLocation } from "react-router-dom";
// import { Elements } from "@stripe/react-stripe-js";
// import { loadStripe } from "@stripe/stripe-js";
// import CheckoutForm from "./CheckoutForm";
// import axios from "axios";
// import styled from "styled-components";

// const stripePromise = loadStripe("pk_test_51Qe4Fk2cMtbQBdvbRCD8PXiS5puB7iu9u2FjQaUidRAodFFT7z5rGlWaRLmqcvY38KK89mXTob8LPfVR3VvEPlNG00AA5SCd8Z");

// // Styled Components
// const CheckoutContainer = styled.div`
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     justify-content: center;
//     padding: 20px;
//     max-width: 800px;
//     margin: 60px auto 20px;
//     background: #f9f9f9;
//     border-radius: 8px;
//     box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
// `;

// const Header = styled.h1`
//     font-size: 2rem;
//     color: #333;
//     margin-bottom: 20px;
//     text-align: center;
// `;

// const CartSummary = styled.div`
//     width: 100%;
//     background: #fff;
//     padding: 20px;
//     border-radius: 8px;
//     margin-bottom: 20px;
//     box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
// `;

// const CartItem = styled.div`
//     display: flex;
//     align-items: center;
//     padding: 10px 0;
//     border-bottom: 1px solid #e0e0e0;
//     &:last-child {
//         border-bottom: none;
//     }
// `;

// const ProductImage = styled.img`
//     width: 80px;
//     height: 80px;
//     object-fit: contain;
//     margin-right: 15px;
//     border-radius: 8px;
//     box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
// `;

// const ProductInfo = styled.div`
//     flex: 1;
// `;

// const ProductTitle = styled.h3`
//     font-size: 1.2rem;
//     color: #333;
//     margin: 0 0 5px 0;
// `;

// const ProductDescription = styled.p`
//     font-size: 0.9rem;
//     color: #555;
//     margin: 0;
// `;

// const Total = styled.p`
//     font-size: 1.2rem;
//     font-weight: bold;
//     text-align: right;
//     margin-top: 10px;
// `;

// const ElementsContainer = styled.div`
//     width: 100%;
// `;

// const Checkout = () => {
//     const { state } = useLocation();
//     const { cart, totalPrice } = state || { cart: [], totalPrice: 0 };
//     const [clientSecret, setClientSecret] = useState("");

//     useEffect(() => {
//         const fetchClientSecret = async () => {
//             try {
//                 const { data } = await axios.post("http://localhost:4242/create-payment-intent", {
//                     amount: Math.round(totalPrice * 100), // Stripe expects cents
//                     currency: "usd",
//                 });
//                 setClientSecret(data.clientSecret);
//             } catch (error) {
//                 console.error("Error fetching client secret:", error);
//             }
//         };

//         if (totalPrice > 0) fetchClientSecret();
//     }, [totalPrice]);

//     return (
//         <CheckoutContainer>
//             <Header>Checkout</Header>
//             <CartSummary>
//                 {cart.map((item) => (
//                     <CartItem key={item.id}>
//                         <ProductImage src={item.image} alt={item.title} />
//                         <ProductInfo>
//                             <ProductTitle>{item.title}</ProductTitle>
//                             <ProductDescription>{item.description}</ProductDescription>
//                             <p>
//                                 {item.quantity} x ${item.price.toFixed(2)}
//                             </p>
//                         </ProductInfo>
//                     </CartItem>
//                 ))}
//                 <Total>Total: ${totalPrice.toFixed(2)}</Total>
//             </CartSummary>
//             {clientSecret && (
//                 <ElementsContainer>
//                     <Elements
//                         stripe={stripePromise}
//                         options={{
//                             clientSecret,
//                             appearance: { theme: "stripe" }, // Optional: Customize the appearance
//                         }}
//                     >
//                         <CheckoutForm />
//                     </Elements>
//                 </ElementsContainer>
//             )}
//         </CheckoutContainer>
//     );
// };

// export default Checkout;
