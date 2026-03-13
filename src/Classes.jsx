// import React, { useState } from 'react';
// import styled from 'styled-components';
// import classes1 from './images/classes1.webp'; // Import the image for the top of the page

// // Styled Components for the Classes Section
// const ClassesContainer = styled.section`
//   padding: 100px 20px;
//   background-color: #f9f9f9;
//   color: #0f4c81;
//   text-align: center;
// `;

// const ClassesHeading = styled.h2`
//   font-size: 2.8rem;
//   margin-bottom: 20px;
// `;

// const ClassesSubheading = styled.p`
//   font-size: 1.2rem;
//   margin-bottom: 40px;
//   max-width: 700px; /* Set a maximum width to narrow it down */
//   margin-left: auto;
//   margin-right: auto; /* Center the subheading */
//   line-height: 1.5; /* Improve readability */
//   text-align: center; /* Center the text */
// `;


// const ImageWrapper = styled.div`
//   width: 100%;
//   max-width: 800px;
//   margin: 0 auto 50px;
// `;

// const TopImage = styled.img`
//   width: 100%;
//   height: auto;
//   border-radius: 10px;
//   box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
// `;

// const Section = styled.div`
//   margin-bottom: 50px;
//   text-align: center;
// `;

// const SectionHeading = styled.h3`
//   font-size: 2rem;
//   margin-bottom: 20px;
//   color: #0f4c81;
// `;

// const SectionContent = styled.p`
//   font-size: 1.2rem;
//   margin-bottom: 20px;
//   line-height: 1.6;
//   color: #555;
//   max-width: 800px;
//   margin: 0 auto;
// `;

// const Disclaimer = styled.p`
//   font-size: 0.9rem;
//   color: #a94442;
//   margin-top: 20px;
//   font-style: italic;
//   max-width: 800px;
//   margin: 0 auto;
// `;

// const FormContainer = styled.div`
//   max-width: 600px;
//   margin: 0 auto;
//   margin-top: 50px;
// `;

// const Form = styled.form`
//   display: flex;
//   flex-direction: column;
//   gap: 20px;
//   background-color: white;
//   padding: 30px;
//   box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
//   border-radius: 10px;
// `;

// const Input = styled.input`
//   padding: 12px;
//   font-size: 1rem;
//   border: 1px solid #ccc;
//   border-radius: 5px;
//   width: 100%;
// `;

// const Textarea = styled.textarea`
//   padding: 12px;
//   font-size: 1rem;
//   border: 1px solid #ccc;
//   border-radius: 5px;
//   resize: vertical;
//   width: 100%;
// `;

// const Select = styled.select`
//   padding: 12px;
//   font-size: 1rem;
//   border: 1px solid #ccc;
//   border-radius: 5px;
//   width: 100%;
// `;

// const CheckboxWrapper = styled.div`
//   display: flex;
//   flex-direction: column;
//   align-items: flex-start;
//   gap: 10px;
// `;

// const Label = styled.label`
//   font-size: 1rem;
//   color: #333;
// `;

// const SubmitButton = styled.button`
//   padding: 12px 20px;
//   background-color: #0f4c81;
//   color: white;
//   border: none;
//   border-radius: 5px;
//   cursor: pointer;
//   font-size: 1rem;
//   transition: background-color 0.3s ease;

//   &:hover {
//     background-color: #0c3a65;
//   }
// `;

// const SuccessMessage = styled.p`
//   color: green;
// `;

// const ErrorMessage = styled.p`
//   color: red;
// `;

// const Classes = () => {
//   const [formState, setFormState] = useState({
//     name: '',
//     email: '',
//     phone: '',
//     experienceLevel: '',
//     preferredDate: '',
//     interests: [],
//     message: '',
//     referral: '',
//   });
//   const [submitted, setSubmitted] = useState(false);
//   const [error, setError] = useState(false);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormState({ ...formState, [name]: value });
//   };

//   const handleCheckboxChange = (e) => {
//     const { value, checked } = e.target;
//     if (checked) {
//       setFormState((prevState) => ({
//         ...prevState,
//         interests: [...prevState.interests, value],
//       }));
//     } else {
//       setFormState((prevState) => ({
//         ...prevState,
//         interests: prevState.interests.filter((interest) => interest !== value),
//       }));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(false);

//     try {
//       const response = await fetch("https://formspree.io/f/mnnqaygp", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(formState),
//       });

//       if (response.ok) {
//         setSubmitted(true);
//       } else {
//         setError(true);
//       }
//     } catch (err) {
//       setError(true);
//     }
//   };

//   return (
//     <ClassesContainer>
//       <ClassesHeading>Epoxy Classes</ClassesHeading>
//       <ClassesSubheading>
//         We offer comprehensive epoxy flooring classes each month, along with one-on-one business coaching designed to take you from beginner to profitable business owner. Complete the form below to receive more information.
//       </ClassesSubheading>

//       {/* Top Image Section */}
//       <ImageWrapper>
//         <TopImage src={classes1} alt="Epoxy Classes" />
//       </ImageWrapper>

//       {/* Experience Section */}
//       <Section>
//         <SectionHeading>Learn from Experienced Professionals</SectionHeading>
//         <SectionContent>
//           With years of experience in the epoxy flooring industry, our team will guide you through the entire process. From preparation to finishing, you'll learn the secrets to creating amazing epoxy floors.
//         </SectionContent>
//       </Section>

//       {/* Hands-On Work Section */}
//       <Section>
//         <SectionHeading>Hands-On Training: A-Z Process</SectionHeading>
//         <SectionContent>
//           Our classes are designed to give you real-world, hands-on experience. Over the course of two full days (Saturday and Sunday), you'll perform every step of the epoxy flooring process. We supply all the materials—you just show up ready to work!
//         </SectionContent>
//       </Section>

//       {/* Business Insights Section */}
//       <Section>
//         <SectionHeading>Business Operations & Pricing Strategies</SectionHeading>
//         <SectionContent>
//           Along with learning how to install epoxy floors, you'll also get insider knowledge on the business side. We'll teach you how to price jobs, source supplies, and efficiently manage your epoxy flooring business.
//         </SectionContent>
//       </Section>

//       {/* Certification Section */}
//       <Section>
//         <SectionHeading>Receive a Certification Upon Completion</SectionHeading>
//         <SectionContent>
//           At the end of the class, you'll receive a certificate of completion, showing that you have the skills and knowledge to successfully install epoxy floors. Use this to boost your career or start your own epoxy flooring business!
//         </SectionContent>
//       </Section>
//       {/* Private Coaching Section */}
//       <Section>
//         <SectionHeading>One-on-One Epoxy Business Coaching</SectionHeading>
//         <SectionContent>
//           Ready to turn your passion into a business? Our private coaching sessions provide a personalized, step-by-step guide to help you build a profitable epoxy business. Learn the A-Z of business strategy, client acquisition, pricing, and more with mentorship tailored specifically to your goals.
//         </SectionContent>
//       </Section>
//       {/* Class Schedule Section */}
//       <Section>
//         <SectionHeading>Monthly Classes - Weekend Format</SectionHeading>
//         <SectionContent>
//           Classes are held once a month, typically over a weekend. This two-day course is intense and covers everything you need to know about epoxy flooring.
//         </SectionContent>
//       </Section>

//       {/* Disclaimer Section */}
//       <Disclaimer>
//         Disclaimer: Epoxy is a messy process, so be sure to wear expendable shoes and clothes. A respirator is also necessary for safety. You can bring your own or purchase one before the class.
//       </Disclaimer>
//       <FormContainer>
//         {submitted ? (
//           <SuccessMessage>Thank you for submitting! We will contact you within 24 hours.</SuccessMessage>
//         ) : (
//           <Form onSubmit={handleSubmit}>
//             <Input
//               type="text"
//               name="name"
//               placeholder="Your Name"
//               value={formState.name}
//               onChange={handleInputChange}
//               required
//             />
//             <Input
//               type="email"
//               name="email"
//               placeholder="Your Email"
//               value={formState.email}
//               onChange={handleInputChange}
//               required
//             />
//             <Input
//               type="tel"
//               name="phone"
//               placeholder="Your Phone Number"
//               value={formState.phone}
//               onChange={handleInputChange}
//               required
//             />
//             <Select
//               name="experienceLevel"
//               value={formState.experienceLevel}
//               onChange={handleInputChange}
//               required
//             >
//               <option value="" disabled>Select Your Experience Level</option>
//               <option value="Beginner">Beginner</option>
//               <option value="Intermediate">Intermediate</option>
//               <option value="Advanced">Advanced</option>
//             </Select>
//             <Select
//               name="preferredDate"
//               value={formState.preferredDate}
//               onChange={handleInputChange}
//               required
//             >
//               <option value="" disabled>Select Preferred Class Date</option>
//               <option value="October">October</option>
//               <option value="November">November</option>
//               <option value="December">December</option>
//             </Select>

//             <CheckboxWrapper>
//               <Label>What are you most interested in learning? (Check all that apply)</Label>
//               <label>
//                 <input
//                   type="checkbox"
//                   value="Garage Flooring"
//                   onChange={handleCheckboxChange}
//                 />
//                 Garage Flooring
//               </label>
//               <label>
//                 <input
//                   type="checkbox"
//                   value="Commercial Epoxy"
//                   onChange={handleCheckboxChange}
//                 />
//                 Commercial Epoxy
//               </label>
//               <label>
//                 <input
//                   type="checkbox"
//                   value="Business Strategies"
//                   onChange={handleCheckboxChange}
//                 />
//                 Business Strategies
//               </label>
//             </CheckboxWrapper>

//             <Select
//               name="referral"
//               value={formState.referral}
//               onChange={handleInputChange}
//             >
//               <option value="" disabled>How did you hear about us?</option>
//               <option value="Google">Google</option>
//               <option value="Social Media">Social Media</option>
//               <option value="Referral">Referral</option>
//               <option value="Other">Other</option>
//             </Select>

//             <Textarea
//               name="message"
//               placeholder="Any specific questions or details?"
//               rows="5"
//               value={formState.message}
//               onChange={handleInputChange}
//             />
//             <SubmitButton type="submit">Submit</SubmitButton>
//             {error && <ErrorMessage>Something went wrong. Please try again.</ErrorMessage>}
//           </Form>
//         )}
//       </FormContainer>

//     </ClassesContainer>
//   );
// };

// export default Classes;


// UPDATED CLASSES OFF SEASON CODE 

// import React from 'react';
// import styled from 'styled-components';
// import classes1 from './images/classes1.webp'; // Import the image for the top of the page

// // Styled Components for the Classes Section
// const ClassesContainer = styled.section`
//   padding: 100px 20px;
//   background-color: #f9f9f9;
//   color: #0f4c81;
//   text-align: center;
// `;

// const ClassesHeading = styled.h2`
//   font-size: 2.8rem;
//   margin-bottom: 20px;
// `;

// const ClassesSubheading = styled.p`
//   font-size: 1.2rem;
//   margin-bottom: 40px;
//   max-width: 700px;
//   margin-left: auto;
//   margin-right: auto;
//   line-height: 1.5;
//   text-align: center;
// `;

// const ImageWrapper = styled.div`
//   width: 100%;
//   max-width: 800px;
//   margin: 0 auto 50px;
// `;

// const TopImage = styled.img`
//   width: 100%;
//   height: auto;
//   border-radius: 10px;
//   box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
// `;

// const Section = styled.div`
//   margin-bottom: 50px;
//   text-align: center;
// `;

// const SectionHeading = styled.h3`
//   font-size: 2rem;
//   margin-bottom: 20px;
//   color: #0f4c81;
// `;

// const SectionContent = styled.p`
//   font-size: 1.2rem;
//   margin-bottom: 20px;
//   line-height: 1.6;
//   color: #555;
//   max-width: 800px;
//   margin: 0 auto;
// `;

// const Disclaimer = styled.p`
//   font-size: 0.9rem;
//   color: #a94442;
//   margin-top: 20px;
//   font-style: italic;
//   max-width: 800px;
//   margin: 0 auto;
// `;

// const FormContainer = styled.div`
//   max-width: 600px;
//   margin: 0 auto;
//   margin-top: 50px;
// `;

// const Classes = () => {
//   return (
//     <ClassesContainer>
//       <ClassesHeading>Epoxy Classes</ClassesHeading>
//       <ClassesSubheading>
//         We offer comprehensive epoxy flooring classes each month, along with one-on-one business coaching designed to take you from beginner to profitable business owner.
//       </ClassesSubheading>

//       {/* Top Image Section */}
//       <ImageWrapper>
//         <TopImage src={classes1} alt="Epoxy Classes" />
//       </ImageWrapper>

//       {/* Experience Section */}
//       <Section>
//         <SectionHeading>Learn from Experienced Professionals</SectionHeading>
//         <SectionContent>
//           With years of experience in the epoxy flooring industry, our team will guide you through the entire process. From preparation to finishing, you'll learn the secrets to creating amazing epoxy floors.
//         </SectionContent>
//       </Section>

//       {/* Hands-On Work Section */}
//       <Section>
//         <SectionHeading>Hands-On Training: A-Z Process</SectionHeading>
//         <SectionContent>
//           Our classes are designed to give you real-world, hands-on experience. Over the course of two full days (Saturday and Sunday), you'll perform every step of the epoxy flooring process. We supply all the materials—you just show up ready to work!
//         </SectionContent>
//       </Section>

//       {/* Business Insights Section */}
//       <Section>
//         <SectionHeading>Business Operations & Pricing Strategies</SectionHeading>
//         <SectionContent>
//           Along with learning how to install epoxy floors, you'll also get insider knowledge on the business side. We'll teach you how to price jobs, source supplies, and efficiently manage your epoxy flooring business.
//         </SectionContent>
//       </Section>

//       {/* Certification Section */}
//       <Section>
//         <SectionHeading>Receive a Certification Upon Completion</SectionHeading>
//         <SectionContent>
//           At the end of the class, you'll receive a certificate of completion, showing that you have the skills and knowledge to successfully install epoxy floors. Use this to boost your career or start your own epoxy flooring business!
//         </SectionContent>
//       </Section>

//       {/* Private Coaching Section */}
//       <Section>
//         <SectionHeading>One-on-One Epoxy Business Coaching</SectionHeading>
//         <SectionContent>
//           Ready to turn your passion into a business? Our private coaching sessions provide a personalized, step-by-step guide to help you build a profitable epoxy business. Learn the A-Z of business strategy, client acquisition, pricing, and more with mentorship tailored specifically to your goals.
//         </SectionContent>
//       </Section>

//       {/* Class Schedule Section */}
//       <Section>
//         <SectionHeading>Monthly Classes - Weekend Format</SectionHeading>
//         <SectionContent>
//           Classes are held once a month, typically over a weekend. This two-day course is intense and covers everything you need to know about epoxy flooring.
//         </SectionContent>
//       </Section>

//       {/* Disclaimer Section */}
//       <Disclaimer>
//         Disclaimer: Epoxy is a messy process, so be sure to wear expendable shoes and clothes. A respirator is also necessary for safety. You can bring your own or purchase one before the class.
//       </Disclaimer>

//       {/* Off-Season Notice */}
//       <FormContainer>
//         <SectionHeading>Off-Season Notice</SectionHeading>
//         <SectionContent>
//           We are currently in our off-season. For more information, please call us at <strong>505-352-4674</strong>.
//         </SectionContent>
//       </FormContainer>
//     </ClassesContainer>
//   );
// };

// export default Classes;
