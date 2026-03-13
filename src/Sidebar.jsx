import React from "react";
import styled from "styled-components";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// Styled Components
const SidebarWrapper = styled.div`
  position: fixed;
  top: 0;
  right: ${({ open }) => (open ? "0" : "-100%")};
  width: 300px;
  height: 100vh;
  background-color: white;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.5);
  transition: right 0.3s ease;
  padding: 20px;
  z-index: 1000;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  position: absolute;
  top: 20px;
  right: 20px;
  cursor: pointer;
`;

const CartItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
`;

const CartImage = styled.img`
  width: 50px;
  height: 50px;
  object-fit: contain;
`;

const CartSummary = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  text-align: center;
`;

const ContinueShoppingButton = styled.button`
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px;
`;

const CheckoutButton = styled.button`
  padding: 10px 20px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
  width: 100%;
  font-size: 1.1rem;
`;

const DebugButton = styled.button`
  padding: 10px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 5px;
  margin-top: 20px;
  cursor: pointer;
  font-size: 0.9rem;
`;

const EmptyCartMessage = styled.p`
  text-align: center;
  color: #7f8c8d;
  font-size: 1.2rem;
`;

// Sidebar Component
const Sidebar = ({ cart, totalItems, totalPrice, isOpen, closeSidebar }) => {
  const navigate = useNavigate();

  const handleProceedToCheckout = () => {
    navigate("/checkout", {
      state: { cart, totalPrice }, // Pass cart and totalPrice as state
    });
  };

  const handleDebug = () => {
    console.log("Stripe Secret Key:", process.env.REACT_APP_STRIPE_SECRET_KEY);
    console.log("Backend URL:", process.env.REACT_APP_BACKEND_URL);
    console.log("Return URL:", process.env.REACT_APP_STRIPE_RETURN_URL);
  };

  return (
    <SidebarWrapper open={isOpen}>
      <CloseButton onClick={closeSidebar}>
        <FaTimes />
      </CloseButton>
      <h2>Your Cart</h2>
      {cart.length === 0 ? (
        <EmptyCartMessage>Your cart is empty</EmptyCartMessage>
      ) : (
        cart.map((item) => (
          <CartItem key={item.id}>
            <CartImage src={item.image} alt={item.title} />
            <div>
              <p>{item.title}</p>
              <p>
                ${item.price.toFixed(2)} x {item.quantity}
              </p>
            </div>
          </CartItem>
        ))
      )}
      {cart.length > 0 && (
        <CartSummary>
          <p>Total Items: {totalItems}</p>
          <p>Total Price: ${totalPrice.toFixed(2)}</p>
          <ContinueShoppingButton onClick={closeSidebar}>
            Continue Shopping
          </ContinueShoppingButton>
          <CheckoutButton onClick={handleProceedToCheckout}>
            Proceed to Checkout
          </CheckoutButton>
        </CartSummary>
      )}
      {/* Debugging Button */}
      <DebugButton onClick={handleDebug}>Log .env Variables</DebugButton>
    </SidebarWrapper>
  );
};

export default Sidebar;
