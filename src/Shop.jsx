// import React, { useState, useEffect } from "react";
// import styled from "styled-components";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import Header from "./Header";
// import Footer from "./Footer";
// import Sidebar from "./Sidebar";
// import { FaShoppingCart } from "react-icons/fa";
// import { loadStripe } from "@stripe/stripe-js";
// import { Elements } from "@stripe/react-stripe-js";
// import EpoxyImage from "./images/epoxy.webp";
// import PolyasparticImage from "./images/polyaspartic.webp";
// import FloorScraperImage from "./images/floorscraper.webp";

// // Styled Components
// const ShopContainer = styled.div`
//   padding: 50px 20px;
//   background-color: #f0f0f0;
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   flex-direction: column;
//   min-height: 100vh;
// `;

// const Heading = styled.h1`
//   font-size: 2rem;
//   color: #2c3e50;
//   margin-bottom: 10px;
//   text-align: center;
// `;

// const SubHeading = styled.h3`
//   font-size: 1.2rem;
//   color: #7f8c8d;
//   margin-bottom: 30px;
//   text-align: center;
// `;

// const ProductGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
//   gap: 20px;
//   width: 100%;
//   max-width: 1200px;
//   margin: 0 auto;
// `;

// const ProductCard = styled.div`
//   background-color: white;
//   padding: 20px;
//   border-radius: 15px;
//   box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
//   text-align: center;
//   transition: transform 0.3s ease-in-out;
//   display: flex;
//   flex-direction: column;
//   justify-content: space-between;
//   &:hover {
//     transform: translateY(-10px);
//   }
// `;

// const ProductImage = styled.img`
//   max-width: 100%;
//   height: 200px;
//   object-fit: contain;
//   margin-bottom: 20px;
// `;

// const ProductTitle = styled.h2`
//   font-size: 1.5rem;
//   color: #333;
//   margin-bottom: 10px;
// `;

// const ProductDescription = styled.p`
//   font-size: 1rem;
//   color: #555;
//   margin-bottom: 15px;
// `;

// const ProductPrice = styled.p`
//   font-size: 1.5rem;
//   color: #27ae60;
//   margin-bottom: 20px;
// `;

// const QuantityControl = styled.div`
//   display: flex;
//   justify-content: center;
//   margin-bottom: 15px;
// `;

// const QuantityButton = styled.button`
//   padding: 5px 10px;
//   margin: 0 5px;
//   background-color: #3498db;
//   color: white;
//   border: none;
//   border-radius: 5px;
//   cursor: pointer;
//   font-size: 1.1rem;
// `;

// const AddToCartButton = styled.button`
//   padding: 10px 20px;
//   background-color: #3498db;
//   color: white;
//   border: none;
//   border-radius: 5px;
//   cursor: pointer;
//   font-size: 1.1rem;
//   transition: background-color 0.3s ease;
//   margin-top: auto;
//   &:hover {
//     background-color: #2980b9;
//   }
// `;

// const FloatingCartButton = styled.button`
//   position: fixed;
//   top: 100px;
//   right: 20px;
//   background-color: #3498db;
//   color: white;
//   border: none;
//   border-radius: 50%;
//   padding: 15px;
//   font-size: 1.5rem;
//   cursor: pointer;
//   display: ${({ $show }) => ($show ? "block" : "none")};
//   z-index: 1000;
// `;

// const products = [
//   {
//     id: 1,
//     title: "Epoxy Coating",
//     description: "Durable and glossy finish for your garage or basement floor.",
//     price: 120.0,
//     image: EpoxyImage,
//   },
//   {
//     id: 2,
//     title: "Polyaspartic Coating",
//     description: "Fast-drying, high-performance floor coatings for high-traffic areas.",
//     price: 150.0,
//     image: PolyasparticImage,
//   },
//   {
//     id: 3,
//     title: "Floor Scraper",
//     description: "Professional-grade floor scraper to prepare your floor for coating.",
//     price: 50.0,
//     image: FloorScraperImage,
//   },
// ];

// const Shop = () => {
//   const [cart, setCart] = useState([]);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [quantities, setQuantities] = useState({});
//   const [clientSecret, setClientSecret] = useState("");
//   const navigate = useNavigate();

//   useEffect(() => {
//     const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
//     if (savedCart.length > 0) {
//       setCart(savedCart);
//     }
//   }, []);

//   const updateQuantity = (productId, amount) => {
//     setQuantities((prevQuantities) => ({
//       ...prevQuantities,
//       [productId]: Math.max(1, (prevQuantities[productId] || 1) + amount),
//     }));
//   };

//   const addToCart = (product) => {
//     const quantityToAdd = quantities[product.id] || 1;
//     setCart((prevCart) => {
//       const existingProduct = prevCart.find((item) => item.id === product.id);
//       if (existingProduct) {
//         return prevCart.map((item) =>
//           item.id === product.id
//             ? { ...item, quantity: item.quantity + quantityToAdd }
//             : item
//         );
//       } else {
//         return [...prevCart, { ...product, quantity: quantityToAdd }];
//       }
//     });
//     setSidebarOpen(true);
//   };

//   const totalPrice = cart.reduce(
//     (total, item) => total + item.price * item.quantity,
//     0
//   );

//   const handleCheckout = async () => {
//     try {
//       const response = await axios.post("http://localhost:4242/create-payment-intent", {
//         amount: totalPrice * 100, // Stripe expects cents
//         currency: "usd",
//       });

//       setClientSecret(response.data.clientSecret);

//       // Navigate to checkout page with clientSecret and cart details
//       navigate("/checkout", {
//         state: { clientSecret: response.data.clientSecret, cart },
//       });
//     } catch (error) {
//       console.error("Error creating Payment Intent:", error);
//       alert("Failed to initiate checkout.");
//     }
//   };

//   return (
//     <>
//       <Header />
//       <ShopContainer>
//         <Heading>Premium Epoxy & Floor Coatings</Heading>
//         <SubHeading>
//           Free local delivery for orders over $500 to Albuquerque or shipping
//           nationwide. All orders come with live support!
//         </SubHeading>
//         <ProductGrid>
//           {products.map((product) => (
//             <ProductCard key={product.id}>
//               <ProductImage src={product.image} alt={product.title} />
//               <ProductTitle>{product.title}</ProductTitle>
//               <ProductDescription>{product.description}</ProductDescription>
//               <ProductPrice>${product.price.toFixed(2)}</ProductPrice>
//               <QuantityControl>
//                 <QuantityButton onClick={() => updateQuantity(product.id, -1)}>
//                   -
//                 </QuantityButton>
//                 <span>{quantities[product.id] || 1}</span>
//                 <QuantityButton onClick={() => updateQuantity(product.id, 1)}>
//                   +
//                 </QuantityButton>
//               </QuantityControl>
//               <AddToCartButton onClick={() => addToCart(product)}>
//                 Add to Cart
//               </AddToCartButton>
//             </ProductCard>
//           ))}
//         </ProductGrid>
//       </ShopContainer>
//       <FloatingCartButton
//         $show={cart.length > 0}
//         onClick={() => setSidebarOpen(true)}
//       >
//         <FaShoppingCart />
//       </FloatingCartButton>
//       <Sidebar
//         cart={cart}
//         totalItems={cart.reduce((total, item) => total + item.quantity, 0)}
//         totalPrice={totalPrice}
//         isOpen={sidebarOpen}
//         closeSidebar={() => setSidebarOpen(false)}
//         onCheckout={handleCheckout}
//       />

//     </>
//   );
// };

// export default Shop;
