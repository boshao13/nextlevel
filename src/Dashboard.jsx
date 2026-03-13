// import React, { useState, useEffect } from "react";
// import styled from "styled-components";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";

// // Styled Components
// const DashboardContainer = styled.div`
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: flex-start;
//   min-height: 80vh; /* Adjusted for better spacing */
//   padding: 40px 20px; /* Increased padding to ensure title visibility */
//   background-color: #f9f9f9;
//   margin-top: 100px; /* Prevents overlap with the header */
// `;

// const Title = styled.h1`
//   margin: 20px 0; /* Provide space around the title */
//   color: #333;
//   font-size: 2rem; /* Increased font size for better visibility */
//   text-align: center;
// `;

// const SearchFilterContainer = styled.div`
//   display: flex;
//   flex-wrap: wrap; /* Allow wrapping for small screens */
//   justify-content: space-between;
//   align-items: center;
//   width: 100%;
//   max-width: 800px;
//   margin-bottom: 20px;
// `;

// const SearchInput = styled.input`
//   padding: 10px;
//   font-size: 1rem;
//   width: 100%;
//   max-width: 300px;
//   border: 1px solid #ccc;
//   border-radius: 5px;
//   margin-bottom: 10px;

//   @media (min-width: 600px) {
//     margin-bottom: 0;
//   }
// `;

// const FilterSelect = styled.select`
//   padding: 10px;
//   font-size: 1rem;
//   border: 1px solid #ccc;
//   border-radius: 5px;
// `;

// const OrdersTable = styled.table`
//   width: 100%;
//   max-width: 800px;
//   border-collapse: collapse;
//   margin-top: 20px;
//   background: white;
//   box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
//   border-radius: 8px;
//   overflow: hidden;
// `;

// const TableHead = styled.thead`
//   background-color: #007bff;
//   color: white;
// `;

// const TableRow = styled.tr`
//   &:nth-child(even) {
//     background-color: #f2f2f2;
//   }

//   &:hover {
//     background-color: #e9ecef;
//     cursor: pointer;
//   }
// `;

// const TableCell = styled.td`
//   padding: 12px;
//   text-align: left;
//   border: 1px solid #ddd;
// `;

// const ErrorMessage = styled.p`
//   color: red;
//   font-size: 0.9rem;
//   margin-top: 10px;
// `;

// const PaginationContainer = styled.div`
//   display: flex;
//   justify-content: center;
//   margin-top: 20px;
// `;

// const PaginationButton = styled.button`
//   background-color: #007bff;
//   color: white;
//   border: none;
//   border-radius: 5px;
//   margin: 0 5px;
//   padding: 8px 12px;
//   cursor: pointer;

//   &:hover {
//     background-color: #0056b3;
//   }

//   &:disabled {
//     background-color: #ccc;
//     cursor: not-allowed;
//   }
// `;

// const NoOrdersMessage = styled.p`
//   margin-top: 20px;
//   font-size: 1.2rem;
//   color: #555;
// `;

// const Dashboard = () => {
//   const [orders, setOrders] = useState([]);
//   const [filteredOrders, setFilteredOrders] = useState([]);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const ordersPerPage = 5;
//   const autoLogoutDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
//   const navigate = useNavigate();

//   useEffect(() => {
//     const token = localStorage.getItem("token");

//     if (!token) {
//       navigate("/login"); // Redirect if no token
//     } else {
//       // Set auto-logout timer
//       const logoutTimer = setTimeout(() => {
//         localStorage.removeItem("token");
//         navigate("/login");
//       }, autoLogoutDuration);

//       const fetchOrders = async () => {
//         try {
//           const response = await axios.get("http://localhost:4242/admin/orders", {
//             headers: { Authorization: `Bearer ${token}` },
//           });

//           setOrders(response.data);
//           setFilteredOrders(response.data); // Initialize filtered orders
//         } catch (err) {
//           setError(err.response?.data?.error || "Failed to fetch orders.");
//         }
//       };

//       fetchOrders();

//       // Cleanup timeout on component unmount
//       return () => clearTimeout(logoutTimer);
//     }
//   }, [navigate]);

//   useEffect(() => {
//     // Apply search and filter
//     const filterOrders = orders.filter(
//       (order) =>
//         order.status.includes(statusFilter) &&
//         (order.id.toString().includes(search) ||
//           order.session_id.toLowerCase().includes(search.toLowerCase()))
//     );
//     setFilteredOrders(filterOrders);
//   }, [search, statusFilter, orders]);

//   // Pagination logic
//   const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
//   const paginatedOrders = filteredOrders.slice(
//     (currentPage - 1) * ordersPerPage,
//     currentPage * ordersPerPage
//   );

//   const handleSearchChange = (e) => setSearch(e.target.value);
//   const handleFilterChange = (e) => setStatusFilter(e.target.value);
//   const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
//   const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

//   return (
//     <DashboardContainer>
//       <Title>Admin Dashboard</Title>
//       {error && <ErrorMessage>{error}</ErrorMessage>}

//       {/* Search and Filter */}
//       <SearchFilterContainer>
//         <SearchInput
//           type="text"
//           placeholder="Search by Order ID or Session ID"
//           value={search}
//           onChange={handleSearchChange}
//         />
//         <FilterSelect value={statusFilter} onChange={handleFilterChange}>
//           <option value="">All Statuses</option>
//           <option value="pending">Pending</option>
//           <option value="succeeded">Succeeded</option>
//           <option value="failed">Failed</option>
//         </FilterSelect>
//       </SearchFilterContainer>

//       {/* Orders Table */}
//       {paginatedOrders.length > 0 ? (
//         <>
//           <OrdersTable>
//             <TableHead>
//               <TableRow>
//                 <TableCell>Order ID</TableCell>
//                 <TableCell>Session ID</TableCell>
//                 <TableCell>Total Price</TableCell>
//                 <TableCell>Status</TableCell>
//                 <TableCell>Created At</TableCell>
//               </TableRow>
//             </TableHead>
//             <tbody>
//               {paginatedOrders.map((order) => (
//                 <TableRow key={order.id}>
//                   <TableCell>{order.id}</TableCell>
//                   <TableCell>{order.session_id}</TableCell>
//                   <TableCell>${order.total_price.toFixed(2)}</TableCell>
//                   <TableCell>{order.status}</TableCell>
//                   <TableCell>{new Date(order.created_at).toLocaleString()}</TableCell>
//                 </TableRow>
//               ))}
//             </tbody>
//           </OrdersTable>

//           {/* Pagination */}
//           <PaginationContainer>
//             <PaginationButton onClick={goToPreviousPage} disabled={currentPage === 1}>
//               Previous
//             </PaginationButton>
//             <PaginationButton onClick={goToNextPage} disabled={currentPage === totalPages}>
//               Next
//             </PaginationButton>
//           </PaginationContainer>
//         </>
//       ) : (
//         !error && <NoOrdersMessage>No orders available.</NoOrdersMessage>
//       )}
//     </DashboardContainer>
//   );
// };

// export default Dashboard;
