import React from 'react';
import Header from './Header';
import Hero from './Hero';
import EpoxyInfo from './EpoxyInfo';
import FlakeCarousel from './FlakeCarousel';
import ContactForm from './ContactForm'; // Assuming you have the contact form component
import Gallery from './Gallery'; // Import the Gallery section
import Warranty from './Warranty'
import GlobalStyle from './GlobalStyle'; // Import the global style
import Footer from './Footer';

function App() {
  return (
    <div>
          <GlobalStyle /> {/* Add the global styles here */}
      <Header /> {/* Render the Header component */}
      <Hero /> {/* Render the Hero component */}

      <EpoxyInfo /> {/* Render the Epoxy Info section */}
      <Warranty/>
      <FlakeCarousel /> {/* Render the Image Carousel */}
      <Gallery /> {/* Render the Gallery section */}
      <ContactForm /> {/* Render the Contact Us section with the form */}
      <Footer /> {/* Add Footer at the bottom */}
    </div>
  );
}

export default App;

